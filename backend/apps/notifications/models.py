"""
Notification models for Lider Garant.
Unified notification system for all event types.
"""
from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone


class NotificationType(models.TextChoices):
    """Types of notifications in the system."""
    # Partner decisions
    DECISION_APPROVED = 'decision_approved', 'Заявка одобрена'
    DECISION_REJECTED = 'decision_rejected', 'Заявка отклонена'
    DECISION_INFO_REQUESTED = 'decision_info_requested', 'Возвращение на доработку'
    
    # Application events
    STATUS_CHANGE = 'status_change', 'Изменение статуса заявки'
    NEW_APPLICATION = 'new_application', 'Новая заявка'
    
    # Document events
    DOCUMENT_VERIFIED = 'document_verified', 'Документ проверен'
    DOCUMENT_REJECTED = 'document_rejected', 'Документ отклонён'
    DOCUMENT_REQUESTED = 'document_requested', 'Запрос документа'
    
    # Chat events
    CHAT_MESSAGE = 'chat_message', 'Новое сообщение'

    # Admin-specific events
    ADMIN_NEW_APPLICATION = 'admin_new_application', 'Новая заявка (админ)'
    ADMIN_NEW_LEAD = 'admin_new_lead', 'Новый лид'
    ADMIN_NEW_AGENT = 'admin_new_agent', 'Новый агент'
    ADMIN_NEW_CLIENT = 'admin_new_client', 'Новый клиент'
    ADMIN_NEW_PARTNER = 'admin_new_partner', 'Новый партнёр'
    ADMIN_APPLICATION_SENT = 'admin_application_sent', 'Заявка отправлена в банк'


class Notification(models.Model):
    """
    Unified notification model.
    
    Stores all types of notifications for users.
    Created automatically via Django signals when relevant events occur.
    
    Role-based visibility:
    - Client/Agent: decisions, status changes, documents, chat
    - Partner: new_application (when assigned), chat
    - Admin: all notifications
    """
    
    # Target user
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Получатель'
    )
    
    # Notification type
    type = models.CharField(
        'Тип',
        max_length=30,
        choices=NotificationType.choices,
        db_index=True
    )
    
    # Display content
    title = models.CharField('Заголовок', max_length=255)
    message = models.TextField('Сообщение')
    
    # Additional data (JSON)
    # Structure depends on type:
    # - decision_*: {application_id, company_name, product_type, amount, offered_rate, partner_name, comment}
    # - status_change: {application_id, old_status, new_status, status_display}
    # - document_*: {document_id, document_name, application_id}
    # - document_requested: {request_id, document_type_name, requester_name}
    # - chat_message: {application_id, sender_name, preview_text}
    # - new_application: {application_id, company_name, product_type, amount}
    data = models.JSONField(
        'Дополнительные данные',
        default=dict,
        blank=True,
        help_text='Структурированные данные уведомления (application_id, document_id и т.д.)'
    )
    
    # Read status
    is_read = models.BooleanField('Прочитано', default=False, db_index=True)
    
    # Timestamps
    created_at = models.DateTimeField('Дата создания', auto_now_add=True, db_index=True)
    
    # Generic relation to source object (optional, for tracing)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name='Тип источника'
    )
    object_id = models.PositiveIntegerField(
        'ID источника',
        null=True,
        blank=True
    )
    source_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        verbose_name = 'Уведомление'
        verbose_name_plural = 'Уведомления'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read', '-created_at']),
        ]

    def __str__(self):
        read_status = '✓' if self.is_read else '○'
        return f"{read_status} {self.title} → {self.user.email}"

    @classmethod
    def create_notification(
        cls,
        user,
        notification_type: str,
        title: str,
        message: str,
        data: dict = None,
        source_object=None
    ):
        """
        Helper method to create notifications.
        
        Args:
            user: Target user
            notification_type: NotificationType value
            title: Notification title
            message: Notification message
            data: Additional JSON data
            source_object: Source model instance (optional)
        
        Returns:
            Created Notification instance
        """
        kwargs = {
            'user': user,
            'type': notification_type,
            'title': title,
            'message': message,
            'data': data or {},
        }
        
        if source_object:
            kwargs['content_type'] = ContentType.objects.get_for_model(source_object)
            kwargs['object_id'] = source_object.pk
        
        return cls.objects.create(**kwargs)

    @classmethod
    def get_unread_count(cls, user):
        """Get count of unread notifications for user."""
        return cls.objects.filter(user=user, is_read=False).count()

    def mark_as_read(self):
        """Mark this notification as read."""
        if not self.is_read:
            self.is_read = True
            self.save(update_fields=['is_read'])


class NotificationSettings(models.Model):
    """
    Per-user notification settings (email only for now).
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_settings',
        verbose_name='Пользователь'
    )

    email_enabled = models.BooleanField(
        'Email-уведомления включены',
        default=True
    )
    email_new_applications = models.BooleanField(
        'Email для новых заявок',
        default=True
    )
    email_status_changes = models.BooleanField(
        'Email для изменений статуса',
        default=True
    )
    email_chat_messages = models.BooleanField(
        'Email для сообщений в чате',
        default=True
    )
    email_marketing = models.BooleanField(
        'Email для маркетинговых рассылок',
        default=False
    )

    updated_at = models.DateTimeField('Дата обновления', auto_now=True)

    class Meta:
        verbose_name = 'Настройки уведомлений'
        verbose_name_plural = 'Настройки уведомлений'

    def __str__(self):
        status = 'вкл.' if self.email_enabled else 'выкл.'
        return f"Email-уведомления: {status} ({self.user.email})"

    @classmethod
    def get_settings(cls, user):
        settings_obj, _ = cls.objects.get_or_create(user=user)
        return settings_obj


class LeadNotificationSettings(models.Model):
    """
    Settings for lead email notifications.
    
    Singleton pattern - only one record exists.
    Stores list of emails and enabled/disabled flag for lead notifications.
    """
    
    # Whether email notifications are enabled
    email_enabled = models.BooleanField(
        'Email-уведомления включены',
        default=True,
        help_text='Включить/выключить отправку email при получении нового лида'
    )
    
    # List of email recipients (stored as JSON array)
    recipient_emails = models.JSONField(
        'Email-адреса получателей',
        default=list,
        blank=True,
        help_text='Список email адресов для уведомлений о новых лидах. Если пусто - отправляется всем админам.'
    )
    
    # Timestamps
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lead_notification_settings_updates',
        verbose_name='Обновлено пользователем'
    )
    
    class Meta:
        verbose_name = 'Настройки уведомлений о лидах'
        verbose_name_plural = 'Настройки уведомлений о лидах'
    
    def __str__(self):
        status = 'вкл.' if self.email_enabled else 'выкл.'
        count = len(self.recipient_emails) if self.recipient_emails else 0
        return f"Email-уведомления о лидах: {status}, получателей: {count}"
    
    @classmethod
    def get_settings(cls):
        """Get or create the singleton settings instance."""
        settings_obj, _ = cls.objects.get_or_create(pk=1)
        return settings_obj
    
    @classmethod
    def is_email_enabled(cls):
        """Check if email notifications are enabled."""
        return cls.get_settings().email_enabled
    
    @classmethod
    def get_recipient_emails(cls):
        """
        Get list of recipient emails.
        
        If no custom emails configured, returns None to indicate
        that caller should fall back to all admin emails.
        """
        settings_obj = cls.get_settings()
        emails = settings_obj.recipient_emails
        if emails and isinstance(emails, list):
            return [email.strip() for email in emails if email and email.strip()]
        return None


class EmailOutboxStatus(models.TextChoices):
    """Delivery state for reliable email outbox."""

    PENDING = 'pending', 'Ожидает отправки'
    SENT = 'sent', 'Отправлено'
    FAILED = 'failed', 'Не отправлено'


class EmailOutbox(models.Model):
    """Persistent outbox for reliable SMTP delivery with retries."""

    event_type = models.CharField(
        'Тип события',
        max_length=64,
        blank=True,
        default='generic',
        db_index=True,
    )
    subject = models.CharField('Тема', max_length=255)
    message = models.TextField('Текст письма')
    from_email = models.EmailField('Отправитель')
    recipient_list = models.JSONField('Получатели', default=list)

    status = models.CharField(
        'Статус',
        max_length=16,
        choices=EmailOutboxStatus.choices,
        default=EmailOutboxStatus.PENDING,
        db_index=True,
    )
    attempts = models.PositiveIntegerField('Попытки', default=0)
    max_attempts = models.PositiveIntegerField('Макс. попыток', default=30)
    next_retry_at = models.DateTimeField('Следующая попытка', default=timezone.now, db_index=True)
    last_error = models.TextField('Последняя ошибка', blank=True, default='')
    sent_at = models.DateTimeField('Отправлено', null=True, blank=True)

    metadata = models.JSONField('Метаданные', default=dict, blank=True)

    created_at = models.DateTimeField('Создано', auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField('Обновлено', auto_now=True)

    class Meta:
        verbose_name = 'Письмо в outbox'
        verbose_name_plural = 'Outbox SMTP'
        ordering = ['next_retry_at', 'created_at']
        indexes = [
            models.Index(fields=['status', 'next_retry_at']),
            models.Index(fields=['event_type', '-created_at']),
        ]

    def __str__(self):
        recipients = ', '.join((self.recipient_list or [])[:2])
        suffix = '' if len(self.recipient_list or []) <= 2 else '...'
        return f"[{self.get_status_display()}] {self.subject} -> {recipients}{suffix}"
