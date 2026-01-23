"""
Admin configuration for Documents app.
Updated for numeric document_type_id per Appendix B.
"""
from django.contrib import admin
from .models import Document, DocumentTypeDefinition, DocumentRequest


@admin.register(DocumentTypeDefinition)
class DocumentTypeDefinitionAdmin(admin.ModelAdmin):
    """Admin for document type reference table."""
    list_display = ['document_type_id', 'product_type', 'name', 'source', 'is_active']
    list_filter = ['product_type', 'source', 'is_active']
    search_fields = ['name', 'document_type_id']
    ordering = ['product_type', 'document_type_id']


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'document_type_id',
        'product_type',
        'type_display',
        'owner',
        'company',
        'uploaded_at',
    ]
    list_filter = ['product_type', 'uploaded_at']
    search_fields = ['name', 'owner__email', 'company__name']
    readonly_fields = ['uploaded_at', 'updated_at', 'type_display']
    
    fieldsets = (
        ('Документ', {
            'fields': ('name', 'file', 'document_type_id', 'product_type')
        }),
        ('Владелец', {
            'fields': ('owner', 'company')
        }),
        ('Даты', {
            'fields': ('uploaded_at', 'updated_at')
        }),
    )


@admin.register(DocumentRequest)
class DocumentRequestAdmin(admin.ModelAdmin):
    """Admin for document requests."""
    list_display = [
        'document_type_name',
        'user',
        'requested_by',
        'status',
        'is_read',
        'created_at',
    ]
    list_filter = ['status', 'is_read', 'created_at']
    search_fields = ['document_type_name', 'user__email', 'comment']
    readonly_fields = ['created_at', 'updated_at', 'fulfilled_at']
    
    fieldsets = (
        ('Запрос', {
            'fields': ('document_type_name', 'document_type_id', 'comment')
        }),
        ('Участники', {
            'fields': ('user', 'requested_by')
        }),
        ('Статус', {
            'fields': ('status', 'is_read', 'fulfilled_document')
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at', 'fulfilled_at')
        }),
    )
