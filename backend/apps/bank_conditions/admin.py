"""
Admin configuration for Bank Conditions.
"""
from django.contrib import admin
from .models import Bank, BankCondition, IndividualReviewCondition, RKOCondition, StopFactor


@admin.register(Bank)
class BankAdmin(admin.ModelAdmin):
    list_display = ['name', 'short_name', 'is_active', 'order']
    list_filter = ['is_active']
    search_fields = ['name', 'short_name']
    ordering = ['order', 'name']


@admin.register(BankCondition)
class BankConditionAdmin(admin.ModelAdmin):
    list_display = ['bank', 'product', 'sum_min', 'sum_max', 'rate_min', 'service_commission', 'is_active']
    list_filter = ['bank', 'is_active', 'rate_type']
    search_fields = ['product', 'bank__name']
    ordering = ['bank__order', 'bank__name']


@admin.register(IndividualReviewCondition)
class IndividualReviewConditionAdmin(admin.ModelAdmin):
    list_display = ['bank', 'fz_type', 'guarantee_type', 'client_limit', 'bank_rate', 'service_commission', 'is_active']
    list_filter = ['bank', 'fz_type', 'guarantee_type', 'is_active']
    search_fields = ['bank__name']


@admin.register(RKOCondition)
class RKOConditionAdmin(admin.ModelAdmin):
    list_display = ['bank', 'description', 'is_active', 'order']
    list_filter = ['bank', 'is_active']
    search_fields = ['bank__name', 'description']


@admin.register(StopFactor)
class StopFactorAdmin(admin.ModelAdmin):
    list_display = ['description', 'is_active', 'order']
    list_filter = ['is_active']
    search_fields = ['description']
    ordering = ['order']
