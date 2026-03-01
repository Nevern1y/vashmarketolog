"""
Chat models for Lider Garant.
Each application has its own chat room for communication.
"""
from django.db import models
from django.conf import settings


def chat_attachment_path(instance, filename):
    """Generate upload path for chat attachments."""
    return f'chat_attachments/{instance.application.id}/{filename}'


class ApplicationMessage(models.Model):
    """
    Chat message model.
    Each Application has its own chat room.
    All messages are persisted to the database.
    """
    application = models.ForeignKey(
        'applications.Application',
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name='Заявка'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_messages',
        verbose_name='Отправитель'
    )
    
    # Message content
    text = models.TextField('Текст сообщения')
    attachment = models.FileField(
        'Вложение',
        upload_to=chat_attachment_path,
        null=True,
        blank=True
    )
    
    # Moderation (Admin)
    is_moderated = models.BooleanField('Модерировано', default=False)
    moderated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='moderated_messages',
        verbose_name='Модератор'
    )
    moderated_at = models.DateTimeField('Дата модерации', null=True, blank=True)
    
    # Read status tracking
    is_read = models.BooleanField('Прочитано', default=False)
    
    # Timestamps
    created_at = models.DateTimeField('Дата отправки', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)

    class Meta:
        verbose_name = 'Сообщение'
        verbose_name_plural = 'Сообщения'
        ordering = ['created_at']

    def __str__(self):
        sender_email = self.sender.email if self.sender else 'удалённый пользователь'
        return f"Сообщение от {sender_email} в заявке #{self.application.id}"

    @property
    def sender_name(self):
        """Get sender display name."""
        if self.sender:
            return self.sender.get_full_name() or self.sender.email
        return None

    @property
    def sender_role(self):
        """Get sender role."""
        if self.sender:
            return self.sender.role
        return None
