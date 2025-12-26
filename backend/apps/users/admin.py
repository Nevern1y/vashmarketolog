"""
Admin configuration for Users app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User admin configuration."""
    
    list_display = [
        'email', 
        'role', 
        'first_name', 
        'last_name', 
        'is_active', 
        'is_staff',
        'date_joined',
    ]
    list_filter = ['role', 'is_active', 'is_staff', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'phone')}),
        (_('Role'), {'fields': ('role',)}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Partner Invite'), {
            'fields': ('invite_token', 'invite_accepted_at', 'invited_by'),
            'classes': ('collapse',),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'role'),
        }),
    )
    
    readonly_fields = ['date_joined', 'last_login', 'invite_accepted_at']
