"""
Admin configuration for Documents app.
"""
from django.contrib import admin
from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'document_type',
        'status',
        'owner',
        'company',
        'uploaded_at',
    ]
    list_filter = ['document_type', 'status', 'uploaded_at']
    search_fields = ['name', 'owner__email', 'company__name']
    readonly_fields = ['uploaded_at', 'updated_at', 'verified_at', 'verified_by']
    
    fieldsets = (
        ('Документ', {
            'fields': ('name', 'file', 'document_type')
        }),
        ('Владелец', {
            'fields': ('owner', 'company')
        }),
        ('Статус', {
            'fields': ('status', 'rejection_reason', 'verified_at', 'verified_by')
        }),
        ('Даты', {
            'fields': ('uploaded_at', 'updated_at')
        }),
    )
