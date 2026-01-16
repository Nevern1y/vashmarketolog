"""
Admin configuration for notifications.
"""
from django.contrib import admin
from .models import Notification


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
