"""
Django signals for automatic notification creation.

Signals listen to model changes and create notifications for relevant users.
"""
import logging
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import Notification, NotificationType, LeadNotificationSettings, NotificationSettings
from apps.users.models import UserRole

UserModel = get_user_model()

logger = logging.getLogger(__name__)


def get_notification_email_category(notification_type: str) -> str | None:
    if notification_type in [
        NotificationType.NEW_APPLICATION,
        NotificationType.ADMIN_NEW_APPLICATION,
    ]:
        return 'new_applications'

    if notification_type in [
        NotificationType.STATUS_CHANGE,
        NotificationType.DECISION_APPROVED,
        NotificationType.DECISION_REJECTED,
        NotificationType.DECISION_INFO_REQUESTED,
        NotificationType.DOCUMENT_VERIFIED,
        NotificationType.DOCUMENT_REJECTED,
        NotificationType.DOCUMENT_REQUESTED,
        NotificationType.ADMIN_APPLICATION_SENT,
    ]:
        return 'status_changes'

    if notification_type == NotificationType.CHAT_MESSAGE:
        return 'chat_messages'

    return None


def should_send_notification_email(user, notification_type: str) -> bool:
    if not user or not user.email:
        return False

    category = get_notification_email_category(notification_type)
    if not category:
        return False

    settings_obj = NotificationSettings.get_settings(user)
    if not settings_obj.email_enabled:
        return False

    return bool(getattr(settings_obj, f'email_{category}', False))


def build_notification_email(notification: Notification) -> tuple[str, str]:
    data = notification.data or {}
    subject_prefix = getattr(settings, 'EMAIL_SUBJECT_PREFIX', '')
    subject = f"{subject_prefix}{notification.title}"

    lines = [notification.title, notification.message]

    application_id = data.get('application_id')
    if application_id:
        lines.append(f"Заявка №{application_id}")

    if data.get('company_name'):
        lines.append(f"Компания: {data['company_name']}")

    if data.get('product_type_display'):
        lines.append(f"Продукт: {data['product_type_display']}")

    if data.get('amount'):
        lines.append(f"Сумма: {data['amount']}")

    if data.get('status_display'):
        lines.append(f"Статус: {data['status_display']}")

    if data.get('partner_name'):
        lines.append(f"Партнёр: {data['partner_name']}")

    if data.get('offered_rate'):
        lines.append(f"Ставка: {data['offered_rate']}%")

    if data.get('offered_amount'):
        lines.append(f"Сумма предложения: {data['offered_amount']}")

    if data.get('document_name'):
        lines.append(f"Документ: {data['document_name']}")

    if data.get('document_type_name'):
        lines.append(f"Документ: {data['document_type_name']}")

    if data.get('requester_name'):
        lines.append(f"Запросил: {data['requester_name']}")

    if data.get('sender_name'):
        lines.append(f"Отправитель: {data['sender_name']}")

    if data.get('preview_text'):
        lines.append(f"Сообщение: {data['preview_text']}")

    if data.get('comment'):
        lines.append(f"Комментарий: {data['comment']}")

    created_at = timezone.localtime(notification.created_at)
    lines.append(f"Дата: {created_at.strftime('%d.%m.%Y %H:%M')}")

    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    lines.append("")
    lines.append(f"Открыть кабинет: {frontend_url}")

    return subject, "\n".join(lines)


def send_notification_email(notification: Notification) -> None:
    try:
        user = notification.user
        if not should_send_notification_email(user, notification.type):
            return

        subject, message = build_notification_email(notification)
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@lider-garant.ru'),
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Failed to send notification email: {e}")


def get_admin_users():
    """Return active admin users for admin notifications."""
    return UserModel.objects.filter(role=UserRole.ADMIN, is_active=True)


def notify_admins(notification_type, title, message, data=None, source_object=None):
    """Create the same notification for all admins."""
    admins = get_admin_users()
    for admin in admins:
        try:
            notification = Notification.create_notification(
                user=admin,
                notification_type=notification_type,
                title=title,
                message=message,
                data=data or {},
                source_object=source_object,
            )
            send_notification_email(notification)
        except Exception as e:
            logger.error(f"Failed to create admin notification: {e}")


def get_lead_notification_emails():
    """
    Get list of emails for lead notifications.
    
    Priority:
    1. Custom emails from LeadNotificationSettings in DB
    2. Fallback to settings.LEAD_NOTIFICATION_EMAILS 
    3. Fallback to all admin emails
    """
    # Try to get from database settings first
    try:
        db_emails = LeadNotificationSettings.get_recipient_emails()
        if db_emails:
            return db_emails
    except Exception as e:
        logger.warning(f"Failed to get lead notification emails from DB: {e}")
    
    # Fallback to settings.py
    emails = getattr(settings, 'LEAD_NOTIFICATION_EMAILS', [])
    if emails:
        return [email for email in emails if email]
    
    # Fallback to all admin emails
    return list(
        get_admin_users()
        .exclude(email='')
        .values_list('email', flat=True)
    )


def is_lead_email_enabled():
    """
    Check if lead email notifications are enabled.
    
    Priority:
    1. LeadNotificationSettings in DB
    2. Fallback to settings.LEAD_NOTIFICATION_EMAIL_ENABLED
    """
    try:
        return LeadNotificationSettings.is_email_enabled()
    except Exception as e:
        logger.warning(f"Failed to check lead email enabled from DB: {e}")
    
    return getattr(settings, 'LEAD_NOTIFICATION_EMAIL_ENABLED', True)


def get_partner_display_name(partner):
    """Get display name for partner user."""
    if partner.first_name and partner.last_name:
        return f"{partner.first_name} {partner.last_name}"
    if partner.first_name:
        return partner.first_name
    return partner.email


def get_application_data(application):
    """Extract common application data for notifications."""
    return {
        'application_id': application.id,
        'company_name': application.company.short_name or application.company.name if application.company else 'Не указана',
        'product_type': application.product_type,
        'product_type_display': application.get_product_type_display(),
        'amount': str(application.amount) if application.amount else None,
    }


# ==========================================
# Partner Decision Signals
# ==========================================

@receiver(post_save, sender='applications.PartnerDecision')
def create_decision_notification(sender, instance, created, **kwargs):
    """
    Create notification when partner makes a decision on application.
    
    Notifies: Application owner (created_by)
    """
    if not created:
        return
    
    decision = instance
    application = decision.application
    
    # Determine notification type
    decision_type_map = {
        'approved': NotificationType.DECISION_APPROVED,
        'rejected': NotificationType.DECISION_REJECTED,
        'info_requested': NotificationType.DECISION_INFO_REQUESTED,
    }
    notification_type = decision_type_map.get(decision.decision)
    if not notification_type:
        logger.warning(f"Unknown decision type: {decision.decision}")
        return
    
    # Build title and message
    partner_name = get_partner_display_name(decision.partner)
    
    title_map = {
        NotificationType.DECISION_APPROVED: 'Заявка одобрена',
        NotificationType.DECISION_REJECTED: 'Заявка отклонена',
        NotificationType.DECISION_INFO_REQUESTED: 'Возвращение на доработку',
    }
    
    title = title_map.get(notification_type, 'Решение по заявке')
    
    if notification_type == NotificationType.DECISION_APPROVED:
        message = f"Ставка: {decision.offered_rate}%" if decision.offered_rate else "Без указания ставки"
    elif notification_type == NotificationType.DECISION_REJECTED:
        message = decision.comment or "Причина не указана"
    else:  # info_requested
        message = decision.comment or "Заявка возвращена на доработку"
    
    # Build data payload
    data = get_application_data(application)
    data.update({
        'partner_name': partner_name,
        'comment': decision.comment or None,
        'offered_rate': str(decision.offered_rate) if decision.offered_rate else None,
        'offered_amount': str(decision.offered_amount) if decision.offered_amount else None,
        'decision_id': decision.id,
    })
    
    # Create notification for application owner
    if application.created_by:
        try:
            notification = Notification.create_notification(
                user=application.created_by,
                notification_type=notification_type,
                title=title,
                message=message,
                data=data,
                source_object=decision
            )
            send_notification_email(notification)
            logger.info(f"Created decision notification for user {application.created_by.id}")
        except Exception as e:
            logger.error(f"Failed to create decision notification: {e}")


# ==========================================
# Application Status Change Signals
# ==========================================

# Store old status before save
@receiver(pre_save, sender='applications.Application')
def store_old_application_status(sender, instance, **kwargs):
    """Store old status before application is saved."""
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
            instance._old_assigned_partner = old_instance.assigned_partner_id
        except sender.DoesNotExist:
            instance._old_status = None
            instance._old_assigned_partner = None
    else:
        instance._old_status = None
        instance._old_assigned_partner = None


@receiver(post_save, sender='applications.Application')
def create_application_notifications(sender, instance, created, **kwargs):
    """
    Create notifications for application events:
    1. Status change -> notify owner
    2. Partner assigned -> notify partner (new_application)
    """
    application = instance
    
    # Skip draft applications for status notifications
    old_status = getattr(instance, '_old_status', None)
    new_status = application.status
    
    # Handle status change
    if old_status and old_status != new_status and new_status != 'draft':
        if application.created_by:
            data = get_application_data(application)
            data.update({
                'old_status': old_status,
                'new_status': new_status,
                'status_display': application.get_status_display(),
            })
            
            try:
                notification = Notification.create_notification(
                    user=application.created_by,
                    notification_type=NotificationType.STATUS_CHANGE,
                    title='Изменение статуса заявки',
                    message=f"Статус изменён на: {application.get_status_display()}",
                    data=data,
                    source_object=application
                )
                send_notification_email(notification)
                logger.info(f"Created status change notification for user {application.created_by.id}")
            except Exception as e:
                logger.error(f"Failed to create status change notification: {e}")

    # Notify admins when application moves from draft to active status
    if (old_status == 'draft' and new_status != 'draft') or (created and new_status != 'draft'):
        data = get_application_data(application)
        try:
            notify_admins(
                notification_type=NotificationType.ADMIN_NEW_APPLICATION,
                title='Новая заявка',
                message=f"Поступила новая заявка от {data.get('company_name', 'компании')}",
                data=data,
                source_object=application,
            )
            logger.info("Created admin notification for new application")
        except Exception as e:
            logger.error(f"Failed to create admin notification for application: {e}")
    
    # Handle partner assignment
    old_partner_id = getattr(instance, '_old_assigned_partner', None)
    new_partner = application.assigned_partner
    
    if new_partner and (not old_partner_id or old_partner_id != new_partner.id):
        data = get_application_data(application)
        
        try:
            notification = Notification.create_notification(
                user=new_partner,
                notification_type=NotificationType.NEW_APPLICATION,
                title='Новая заявка',
                message=f"Вам назначена заявка от {data.get('company_name', 'Компании')}",
                data=data,
                source_object=application
            )
            send_notification_email(notification)
            logger.info(f"Created new_application notification for partner {new_partner.id}")
        except Exception as e:
            logger.error(f"Failed to create new_application notification: {e}")


# ==========================================
# Document Request Signals
# ==========================================

@receiver(post_save, sender='documents.DocumentRequest')
def create_document_request_notification(sender, instance, created, **kwargs):
    """
    Create notification when admin requests a document from user.
    
    Notifies: Target user
    """
    if not created:
        return
    
    request = instance
    
    # Get requester name
    requester_name = "Администратор"
    if request.requested_by:
        if request.requested_by.first_name:
            requester_name = f"{request.requested_by.first_name} {request.requested_by.last_name or ''}".strip()
        else:
            requester_name = request.requested_by.email
    
    data = {
        'request_id': request.id,
        'document_type_name': request.document_type_name,
        'document_type_id': request.document_type_id,
        'requester_name': requester_name,
        'comment': request.comment or None,
    }
    
    try:
        notification = Notification.create_notification(
            user=request.user,
            notification_type=NotificationType.DOCUMENT_REQUESTED,
            title='Запрос документа',
            message=f"Запрошен документ: {request.document_type_name}",
            data=data,
            source_object=request
        )
        send_notification_email(notification)
        logger.info(f"Created document_request notification for user {request.user.id}")
    except Exception as e:
        logger.error(f"Failed to create document_request notification: {e}")


# ==========================================
# Admin Notifications
# ==========================================

@receiver(post_save, sender='applications.Lead')
def create_admin_lead_notification(sender, instance, created, **kwargs):
    """Notify admins about new leads."""
    if not created:
        return

    lead = instance
    data = {
        'lead_id': lead.id,
        'lead_name': lead.full_name,
        'lead_phone': lead.phone,
        'lead_email': lead.email or None,
        'lead_source': lead.source,
        'lead_source_display': lead.get_source_display(),
        'product_type': lead.product_type,
        'product_type_display': lead.get_product_type_display(),
        'amount': str(lead.amount) if lead.amount else None,
        'page_url': lead.page_url or None,
        'referrer': lead.referrer or None,
        'form_name': lead.form_name or None,
        'utm_source': lead.utm_source or None,
        'utm_medium': lead.utm_medium or None,
        'utm_campaign': lead.utm_campaign or None,
        'utm_term': lead.utm_term or None,
        'utm_content': lead.utm_content or None,
        'message': lead.message or None,
    }

    notify_admins(
        notification_type=NotificationType.ADMIN_NEW_LEAD,
        title='Новый лид',
        message=f"{lead.full_name} • {lead.phone}",
        data=data,
        source_object=lead,
    )

    if not is_lead_email_enabled():
        return

    recipients = get_lead_notification_emails()
    if not recipients:
        return

    subject_prefix = getattr(settings, 'EMAIL_SUBJECT_PREFIX', '')
    subject = f"{subject_prefix}Новый лид"
    lines = [
        'Новый лид с сайта',
        f"Имя: {lead.full_name}",
        f"Телефон: {lead.phone}",
        f"Email: {lead.email or 'не указан'}",
        f"Источник: {lead.get_source_display()}",
    ]

    if lead.product_type:
        lines.append(f"Продукт: {lead.get_product_type_display()}")
    if lead.guarantee_type:
        lines.append(f"Тип гарантии: {lead.get_guarantee_type_display()}")
    if lead.amount:
        lines.append(f"Сумма: {lead.amount}")
    if lead.term_months:
        lines.append(f"Срок: {lead.term_months} мес.")
    if lead.form_name:
        lines.append(f"Форма: {lead.form_name}")
    if lead.page_url:
        lines.append(f"Страница: {lead.page_url}")
    if lead.referrer:
        lines.append(f"Реферер: {lead.referrer}")
    if lead.utm_source or lead.utm_medium or lead.utm_campaign:
        lines.append(
            "UTM: "
            f"{lead.utm_source or '-'} / {lead.utm_medium or '-'} / {lead.utm_campaign or '-'}"
        )
    if lead.utm_term:
        lines.append(f"UTM term: {lead.utm_term}")
    if lead.utm_content:
        lines.append(f"UTM content: {lead.utm_content}")
    if lead.message:
        lines.append(f"Сообщение: {lead.message}")

    try:
        send_mail(
            subject=subject,
            message="\n".join(lines),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Failed to send lead email notification: {e}")


@receiver(post_save, sender=UserModel)
def create_admin_user_notification(sender, instance, created, **kwargs):
    """Notify admins about new agents or partners."""
    if not created:
        return

    user = instance
    if user.role not in [UserRole.AGENT, UserRole.PARTNER]:
        return

    notification_type = (
        NotificationType.ADMIN_NEW_AGENT
        if user.role == UserRole.AGENT
        else NotificationType.ADMIN_NEW_PARTNER
    )

    full_name = " ".join([name for name in [user.first_name, user.last_name] if name]).strip()
    display_name = full_name or user.email

    data = {
        'user_id': user.id,
        'user_email': user.email,
        'user_phone': user.phone,
        'user_full_name': full_name or None,
        'user_role': user.role,
    }

    notify_admins(
        notification_type=notification_type,
        title='Новый агент' if user.role == UserRole.AGENT else 'Новый партнёр',
        message=display_name,
        data=data,
        source_object=user,
    )


# ==========================================
# Chat Message Signals
# ==========================================

@receiver(post_save, sender='chat.ApplicationMessage')
def create_chat_message_notification(sender, instance, created, **kwargs):
    """
    Create notification when new chat message is sent.
    
    Notifies: All participants except sender
    """
    if not created:
        return
    
    message = instance
    application = message.application
    sender_user = message.sender
    
    # Get sender display name
    sender_name = sender_user.first_name or sender_user.email
    if sender_user.first_name and sender_user.last_name:
        sender_name = f"{sender_user.first_name} {sender_user.last_name}"
    
    # Preview text (first 100 chars)
    preview = message.text[:100] + "..." if len(message.text) > 100 else message.text
    
    data = {
        'application_id': application.id,
        'message_id': message.id,
        'sender_name': sender_name,
        'sender_role': sender_user.role,
        'preview_text': preview,
    }
    
    # Collect all participants
    participants = set()
    
    # Application owner
    if application.created_by:
        participants.add(application.created_by)
    
    # Company owner
    if application.company and application.company.owner:
        participants.add(application.company.owner)
    
    # Assigned partner
    if application.assigned_partner:
        participants.add(application.assigned_partner)
    
    # Remove sender from recipients
    participants.discard(sender_user)
    
    # Create notifications for all participants
    for user in participants:
        try:
            notification = Notification.create_notification(
                user=user,
                notification_type=NotificationType.CHAT_MESSAGE,
                title='Новое сообщение',
                message=f"{sender_name}: {preview}",
                data=data,
                source_object=message
            )
            send_notification_email(notification)
            logger.info(f"Created chat notification for user {user.id}")
        except Exception as e:
            logger.error(f"Failed to create chat notification for user {user.id}: {e}")

    # Notify all admins (even if not participants)
    admin_users = get_admin_users()
    for admin in admin_users:
        if admin in participants:
            continue
        try:
            notification = Notification.create_notification(
                user=admin,
                notification_type=NotificationType.CHAT_MESSAGE,
                title='Новое сообщение',
                message=f"{sender_name}: {preview}",
                data=data,
                source_object=message
            )
            send_notification_email(notification)
            logger.info(f"Created admin chat notification for user {admin.id}")
        except Exception as e:
            logger.error(f"Failed to create admin chat notification for user {admin.id}: {e}")


# Also handle TicketMessage from applications app
@receiver(post_save, sender='applications.TicketMessage')
def create_ticket_message_notification(sender, instance, created, **kwargs):
    """
    Create notification when new ticket message is sent.
    Uses same logic as ApplicationMessage.
    """
    if not created:
        return
    
    message = instance
    application = message.application
    sender_user = message.sender
    
    # Get sender display name
    sender_name = sender_user.first_name or sender_user.email
    if sender_user.first_name and sender_user.last_name:
        sender_name = f"{sender_user.first_name} {sender_user.last_name}"
    
    # Preview text
    preview = message.content[:100] + "..." if len(message.content) > 100 else message.content
    
    data = {
        'application_id': application.id,
        'message_id': message.id,
        'sender_name': sender_name,
        'sender_role': sender_user.role,
        'preview_text': preview,
        'is_bank_message': message.is_bank_message,
    }
    
    # Collect participants
    participants = set()
    
    if application.created_by:
        participants.add(application.created_by)
    
    if application.company and application.company.owner:
        participants.add(application.company.owner)
    
    if application.assigned_partner:
        participants.add(application.assigned_partner)
    
    participants.discard(sender_user)
    
    for user in participants:
        try:
            notification = Notification.create_notification(
                user=user,
                notification_type=NotificationType.CHAT_MESSAGE,
                title='Новое сообщение',
                message=f"{sender_name}: {preview}",
                data=data,
                source_object=message
            )
            send_notification_email(notification)
            logger.info(f"Created ticket notification for user {user.id}")
        except Exception as e:
            logger.error(f"Failed to create ticket notification for user {user.id}: {e}")

    admin_users = get_admin_users()
    for admin in admin_users:
        if admin in participants:
            continue
        try:
            notification = Notification.create_notification(
                user=admin,
                notification_type=NotificationType.CHAT_MESSAGE,
                title='Новое сообщение',
                message=f"{sender_name}: {preview}",
                data=data,
                source_object=message
            )
            send_notification_email(notification)
            logger.info(f"Created admin ticket notification for user {admin.id}")
        except Exception as e:
            logger.error(f"Failed to create admin ticket notification for user {admin.id}: {e}")
