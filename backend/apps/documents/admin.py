"""
Admin configuration for Documents app.
Updated for numeric document_type_id per Appendix B.
"""
from django.contrib import admin
from .models import Document, DocumentTypeDefinition


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
        'status',
        'owner',
        'company',
        'uploaded_at',
    ]
    list_filter = ['product_type', 'status', 'uploaded_at']
    search_fields = ['name', 'owner__email', 'company__name']
    readonly_fields = ['uploaded_at', 'updated_at', 'verified_at', 'verified_by', 'type_display']
    
    fieldsets = (
        ('Документ', {
            'fields': ('name', 'file', 'document_type_id', 'product_type')
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
