"""
Admin configuration for Chat app.
"""
from django.contrib import admin
from .models import ApplicationMessage


@admin.register(ApplicationMessage)
class ApplicationMessageAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'application',
        'sender',
        'text_preview',
        'is_moderated',
        'is_read',
        'created_at',
    ]
    list_filter = ['is_moderated', 'is_read', 'created_at']
    search_fields = ['text', 'sender__email', 'application__id']
    readonly_fields = ['created_at', 'updated_at']
    
    def text_preview(self, obj):
        """Show first 50 characters of message."""
        return obj.text[:50] + '...' if len(obj.text) > 50 else obj.text
    text_preview.short_description = 'Текст'
    
    fieldsets = (
        ('Сообщение', {
            'fields': ('application', 'sender', 'text', 'attachment')
        }),
        ('Модерация', {
            'fields': ('is_moderated', 'moderated_by', 'moderated_at')
        }),
        ('Статус', {
            'fields': ('is_read',)
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at')
        }),
    )
