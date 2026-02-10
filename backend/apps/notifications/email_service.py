"""
Reliable email delivery with persistent outbox and retries.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
import logging
import smtplib
import socket

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from .models import EmailOutbox, EmailOutboxStatus

logger = logging.getLogger(__name__)


@dataclass
class EmailDispatchResult:
    sent: bool
    queued: bool
    outbox_id: int | None = None
    error_kind: str | None = None
    error_message: str | None = None


def _get_retry_delays() -> list[int]:
    raw = getattr(settings, 'EMAIL_OUTBOX_RETRY_DELAYS_SECONDS', [30, 120, 300, 900, 1800, 3600, 7200, 21600])
    if isinstance(raw, str):
        try:
            values = [int(item.strip()) for item in raw.split(',') if item.strip()]
            return values or [60, 300, 900, 3600]
        except Exception:
            return [60, 300, 900, 3600]
    if isinstance(raw, list):
        parsed: list[int] = []
        for item in raw:
            try:
                value = int(item)
            except Exception:
                continue
            if value > 0:
                parsed.append(value)
        return parsed or [60, 300, 900, 3600]
    return [60, 300, 900, 3600]


def _normalize_recipients(recipient_list: list[str] | tuple[str, ...]) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()
    for email in recipient_list:
        value = (email or '').strip().lower()
        if not value or value in seen:
            continue
        seen.add(value)
        normalized.append(value)
    return normalized


def _classify_error(exc: Exception) -> str:
    if isinstance(exc, smtplib.SMTPAuthenticationError):
        return 'permanent_auth'
    if isinstance(exc, smtplib.SMTPRecipientsRefused):
        return 'permanent_recipient'
    if isinstance(exc, smtplib.SMTPResponseException):
        code = int(getattr(exc, 'smtp_code', 0) or 0)
        # 4xx are usually temporary delivery issues.
        if 400 <= code < 500:
            return 'temporary'
        # 5xx are usually permanent failures.
        if 500 <= code < 600:
            return 'permanent_server'
    if isinstance(exc, (socket.timeout, TimeoutError, smtplib.SMTPServerDisconnected)):
        return 'temporary'
    return 'unknown'


def _schedule_next_retry(item: EmailOutbox) -> None:
    delays = _get_retry_delays()
    delay_index = max(0, min(item.attempts - 1, len(delays) - 1))
    delay_seconds = delays[delay_index]
    item.next_retry_at = timezone.now() + timedelta(seconds=delay_seconds)


def _deliver_locked(item: EmailOutbox) -> EmailDispatchResult:
    try:
        send_mail(
            subject=item.subject,
            message=item.message,
            from_email=item.from_email,
            recipient_list=item.recipient_list,
            fail_silently=False,
        )

        item.status = EmailOutboxStatus.SENT
        item.sent_at = timezone.now()
        item.last_error = ''
        item.save(update_fields=['status', 'sent_at', 'last_error', 'updated_at'])
        return EmailDispatchResult(sent=True, queued=False, outbox_id=item.id)
    except Exception as exc:
        item.attempts += 1
        item.last_error = f"{exc.__class__.__name__}: {exc}"

        error_kind = _classify_error(exc)
        retryable = error_kind in {'temporary', 'unknown'}

        if (not retryable) or item.attempts >= item.max_attempts:
            item.status = EmailOutboxStatus.FAILED
        else:
            item.status = EmailOutboxStatus.PENDING
            _schedule_next_retry(item)

        item.save(update_fields=['attempts', 'status', 'next_retry_at', 'last_error', 'updated_at'])
        logger.error(
            "Email delivery failed outbox_id=%s attempts=%s/%s kind=%s error=%s",
            item.id,
            item.attempts,
            item.max_attempts,
            error_kind,
            exc,
        )
        return EmailDispatchResult(
            sent=False,
            queued=item.status == EmailOutboxStatus.PENDING,
            outbox_id=item.id,
            error_kind=error_kind,
            error_message=str(exc),
        )


def send_reliable_email(
    *,
    subject: str,
    message: str,
    recipient_list: list[str] | tuple[str, ...],
    from_email: str | None = None,
    event_type: str = 'generic',
    metadata: dict | None = None,
    attempt_immediately: bool = False,
) -> EmailDispatchResult:
    """
    Queue email to outbox and optionally attempt immediate delivery.
    """
    recipients = _normalize_recipients(recipient_list)
    if not recipients:
        return EmailDispatchResult(sent=False, queued=False, error_kind='recipient', error_message='No recipients')

    try:
        item = EmailOutbox.objects.create(
            event_type=(event_type or 'generic')[:64],
            subject=subject,
            message=message,
            from_email=from_email or getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@lider-garant.ru'),
            recipient_list=recipients,
            status=EmailOutboxStatus.PENDING,
            max_attempts=int(getattr(settings, 'EMAIL_OUTBOX_MAX_ATTEMPTS', 30)),
            next_retry_at=timezone.now(),
            metadata=metadata or {},
        )
    except Exception as exc:
        logger.error("Failed to enqueue email event=%s: %s", event_type, exc)
        return EmailDispatchResult(
            sent=False,
            queued=False,
            error_kind='queue_error',
            error_message=str(exc),
        )

    if not attempt_immediately:
        return EmailDispatchResult(sent=False, queued=True, outbox_id=item.id)

    with transaction.atomic():
        locked = EmailOutbox.objects.select_for_update().get(pk=item.pk)
        return _deliver_locked(locked)


def process_outbox_batch(batch_size: int = 50) -> dict[str, int]:
    """
    Attempt delivery for due pending emails.
    """
    stats = {
        'processed': 0,
        'sent': 0,
        'failed': 0,
    }

    for _ in range(batch_size):
        with transaction.atomic():
            item = (
                EmailOutbox.objects
                .select_for_update(skip_locked=True)
                .filter(
                    status=EmailOutboxStatus.PENDING,
                    next_retry_at__lte=timezone.now(),
                )
                .order_by('next_retry_at', 'created_at')
                .first()
            )

            if not item:
                break

            result = _deliver_locked(item)

        stats['processed'] += 1
        if result.sent:
            stats['sent'] += 1
        else:
            stats['failed'] += 1

    return stats


def cleanup_outbox() -> dict[str, int]:
    """Delete old outbox records to prevent unbounded growth."""
    now = timezone.now()
    sent_retention = int(getattr(settings, 'EMAIL_OUTBOX_SENT_RETENTION_DAYS', 14))
    failed_retention = int(getattr(settings, 'EMAIL_OUTBOX_FAILED_RETENTION_DAYS', 90))

    sent_cutoff = now - timedelta(days=max(1, sent_retention))
    failed_cutoff = now - timedelta(days=max(1, failed_retention))

    sent_deleted, _ = EmailOutbox.objects.filter(
        status=EmailOutboxStatus.SENT,
        sent_at__lt=sent_cutoff,
    ).delete()

    failed_deleted, _ = EmailOutbox.objects.filter(
        status=EmailOutboxStatus.FAILED,
        updated_at__lt=failed_cutoff,
    ).delete()

    return {
        'sent_deleted': sent_deleted,
        'failed_deleted': failed_deleted,
    }
