"""
Admin configuration for Applications app.
"""
from django.contrib import admin
from .models import Application, PartnerDecision, TicketMessage


class PartnerDecisionInline(admin.TabularInline):
    model = PartnerDecision
    extra = 0
    readonly_fields = ['partner', 'decision', 'comment', 'offered_rate', 'offered_amount', 'created_at']
    can_delete = False


class TicketMessageInline(admin.TabularInline):
    model = TicketMessage
    extra = 0
    readonly_fields = ['sender', 'content', 'file', 'created_at']
    can_delete = False


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'product_type',
        'amount',
        'status',
        'company',
        'created_by',
        'assigned_partner',
        'created_at',
    ]
    list_filter = ['product_type', 'status', 'created_at']
    search_fields = ['company__name', 'company__inn', 'created_by__email']
    readonly_fields = ['created_at', 'updated_at', 'submitted_at']
    filter_horizontal = ['documents']
    inlines = [PartnerDecisionInline, TicketMessageInline]
    
    fieldsets = (
        ('Заявка', {
            'fields': ('product_type', 'amount', 'term_months', 'status')
        }),
        ('Компания', {
            'fields': ('company', 'created_by')
        }),
        ('Тендер', {
            'fields': ('tender_number', 'tender_platform', 'tender_deadline'),
            'classes': ('collapse',)
        }),
        ('Партнёр', {
            'fields': ('assigned_partner',)
        }),
        ('Документы', {
            'fields': ('documents',)
        }),
        ('ЭЦП', {
            'fields': ('has_signature', 'signature_file'),
            'classes': ('collapse',)
        }),
        ('Примечания', {
            'fields': ('notes',)
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at', 'submitted_at')
        }),
    )


@admin.register(PartnerDecision)
class PartnerDecisionAdmin(admin.ModelAdmin):
    list_display = [
        'application',
        'partner',
        'decision',
        'offered_rate',
        'created_at',
    ]
    list_filter = ['decision', 'created_at']
    search_fields = ['application__company__name', 'partner__email']
    readonly_fields = ['created_at']


@admin.register(TicketMessage)
class TicketMessageAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'application',
        'sender',
        'content_preview',
        'has_file',
        'created_at',
    ]
    list_filter = ['created_at']
    search_fields = ['application__company__name', 'sender__email', 'content']
    readonly_fields = ['created_at']
    
    def content_preview(self, obj):
        """Show truncated content."""
        if len(obj.content) > 50:
            return obj.content[:50] + '...'
        return obj.content
    content_preview.short_description = 'Сообщение'
    
    def has_file(self, obj):
        """Show if message has file."""
        return bool(obj.file)
    has_file.boolean = True
    has_file.short_description = 'Файл'
