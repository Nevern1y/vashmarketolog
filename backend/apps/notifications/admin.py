"""
Admin configuration for notifications.
"""
from django.contrib import admin
from django.utils import timezone
from .models import Notification, EmailOutbox


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin for Notification model."""
    
    list_display = [
        'id',
        'user',
        'type',
        'title',
        'is_read',
        'created_at',
    ]
    list_filter = [
        'type',
        'is_read',
        'created_at',
    ]
    search_fields = [
        'user__email',
        'title',
        'message',
    ]
    readonly_fields = [
        'content_type',
        'object_id',
        'created_at',
    ]
    list_per_page = 50
    date_hierarchy = 'created_at'
    
    ordering = ['-created_at']
    
    fieldsets = (
        ('Получатель', {
            'fields': ('user',)
        }),
        ('Содержимое', {
            'fields': ('type', 'title', 'message', 'data')
        }),
        ('Статус', {
            'fields': ('is_read', 'created_at')
        }),
        ('Источник', {
            'fields': ('content_type', 'object_id'),
            'classes': ('collapse',)
        }),
    )


@admin.register(EmailOutbox)
class EmailOutboxAdmin(admin.ModelAdmin):
    """Admin for SMTP outbox monitoring and replay visibility."""

    list_display = [
        'id',
        'event_type',
        'status',
        'attempts',
        'max_attempts',
        'next_retry_at',
        'sent_at',
        'created_at',
    ]
    list_filter = ['status', 'event_type', 'created_at']
    search_fields = ['subject', 'from_email', 'recipient_list', 'last_error']
    readonly_fields = [
        'event_type',
        'subject',
        'message',
        'from_email',
        'recipient_list',
        'status',
        'attempts',
        'max_attempts',
        'next_retry_at',
        'last_error',
        'sent_at',
        'metadata',
        'created_at',
        'updated_at',
    ]
    list_per_page = 50
    date_hierarchy = 'created_at'
    ordering = ['next_retry_at', 'created_at']
    actions = ['requeue_failed']

    @admin.action(description='Повторить отправку для failed')
    def requeue_failed(self, request, queryset):
        updated = queryset.filter(status='failed').update(
            status='pending',
            attempts=0,
            next_retry_at=timezone.now(),
            last_error='',
        )
        self.message_user(request, f'Поставлено в повторную очередь: {updated}')
