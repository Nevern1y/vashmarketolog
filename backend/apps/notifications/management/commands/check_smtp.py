"""
Check SMTP connectivity/auth and optionally send a test message.
"""

from __future__ import annotations

import smtplib

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.notifications.email_service import send_reliable_email


class Command(BaseCommand):
    help = 'Validate SMTP auth and optionally enqueue test email.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--to',
            nargs='*',
            default=[],
            help='Recipient list for test email.',
        )
        parser.add_argument(
            '--send-test',
            action='store_true',
            help='Send test message through reliable outbox.',
        )

    def handle(self, *args, **options):
        host = getattr(settings, 'EMAIL_HOST', '')
        port = int(getattr(settings, 'EMAIL_PORT', 465))
        raw_ssl = getattr(settings, 'EMAIL_USE_SSL', True)
        raw_tls = getattr(settings, 'EMAIL_USE_TLS', False)
        use_ssl = raw_ssl.lower() == 'true' if isinstance(raw_ssl, str) else bool(raw_ssl)
        use_tls = raw_tls.lower() == 'true' if isinstance(raw_tls, str) else bool(raw_tls)
        user = getattr(settings, 'EMAIL_HOST_USER', '')
        password = getattr(settings, 'EMAIL_HOST_PASSWORD', '')

        if not host or not user or not password:
            raise CommandError('SMTP не настроен: проверьте EMAIL_HOST/EMAIL_HOST_USER/EMAIL_HOST_PASSWORD')

        self.stdout.write(
            f"SMTP host={host} port={port} ssl={use_ssl} tls={use_tls} user={user}"
        )

        try:
            if use_ssl:
                server = smtplib.SMTP_SSL(host, port, timeout=20)
            else:
                server = smtplib.SMTP(host, port, timeout=20)
                server.ehlo()
                if use_tls:
                    server.starttls()
                    server.ehlo()

            code, _ = server.login(user, password)
            server.quit()
        except Exception as exc:
            raise CommandError(f"SMTP check failed: {exc.__class__.__name__}: {exc}")

        self.stdout.write(self.style.SUCCESS(f"SMTP auth OK (code={code})"))

        if options['send_test']:
            recipients = options['to'] or [settings.EMAIL_HOST_USER]
            result = send_reliable_email(
                subject='SMTP healthcheck',
                message='Проверка канала SMTP и outbox.',
                recipient_list=recipients,
                event_type='smtp_healthcheck',
                metadata={'command': 'check_smtp'},
                attempt_immediately=True,
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"Test email status sent={result.sent} queued={result.queued} outbox_id={result.outbox_id}"
                )
            )
