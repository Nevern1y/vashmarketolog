"""
Notification models for Lider Garant.
Unified notification system for all event types.
"""
from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class NotificationType(models.TextChoices):
    """Types of notifications in the system."""
    # Partner decisions
    DECISION_APPROVED = 'decision_approved', 'Заявка одобрена'
    DECISION_REJECTED = 'decision_rejected', 'Заявка отклонена'
    DECISION_INFO_REQUESTED = 'decision_info_requested', 'Запрошена информация'
    
    # Application events
    STATUS_CHANGE = 'status_change', 'Изменение статуса заявки'
    NEW_APPLICATION = 'new_application', 'Новая заявка'
    
    # Document events
    DOCUMENT_VERIFIED = 'document_verified', 'Документ проверен'
    DOCUMENT_REJECTED = 'document_rejected', 'Документ отклонён'
    DOCUMENT_REQUESTED = 'document_requested', 'Запрос документа'
    
    # Chat events
    CHAT_MESSAGE = 'chat_message', 'Новое сообщение'


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
