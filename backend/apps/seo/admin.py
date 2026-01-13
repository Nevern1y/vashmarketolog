from django.contrib import admin
from .models import SeoPage

@admin.register(SeoPage)
class SeoPageAdmin(admin.ModelAdmin):
    list_display = ('slug', 'meta_title', 'updated_at')
    search_fields = ('slug', 'meta_title', 'h1_title')
