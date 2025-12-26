"""
Admin configuration for Companies app.
"""
from django.contrib import admin
from .models import CompanyProfile


@admin.register(CompanyProfile)
class CompanyProfileAdmin(admin.ModelAdmin):
    list_display = [
        'short_name',
        'inn',
        'owner',
        'is_crm_client',
        'created_at',
    ]
    list_filter = ['is_crm_client', 'created_at']
    search_fields = ['name', 'short_name', 'inn', 'owner__email']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Владелец', {
            'fields': ('owner', 'is_crm_client')
        }),
        ('Реквизиты', {
            'fields': ('inn', 'kpp', 'ogrn', 'name', 'short_name')
        }),
        ('Адреса', {
            'fields': ('legal_address', 'actual_address')
        }),
        ('Руководитель', {
            'fields': ('director_name', 'director_position')
        }),
        ('Банковские реквизиты', {
            'fields': ('bank_name', 'bank_bic', 'bank_account', 'bank_corr_account')
        }),
        ('Контакты', {
            'fields': ('contact_person', 'contact_phone', 'contact_email', 'website')
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at')
        }),
    )
