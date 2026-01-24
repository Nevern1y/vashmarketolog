from django.contrib import admin, messages
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from .models import SeoPage
from .utils.templates import SEO_TEMPLATES


@admin.register(SeoPage)
class SeoPageAdmin(admin.ModelAdmin):
    list_display = ('slug', 'meta_title', 'page_type', 'is_published', 'updated_at', 'preview_link')
    list_filter = ('is_published', 'page_type', 'template_name')
    search_fields = ('slug', 'meta_title', 'h1_title')
    prepopulated_fields = {'slug': ('h1_title',)}
    readonly_fields = ('created_at', 'updated_at', 'preview_link')
    
    fieldsets = (
        ('Основное', {
            'fields': ('slug', 'page_type', 'template_name', 'is_published', 'priority')
        }),
        ('SEO Метатеги', {
            'fields': ('meta_title', 'meta_description', 'meta_keywords'),
            'classes': ('collapse',)
        }),
        ('Контент страницы', {
            'fields': ('h1_title', 'h2_title', 'h3_title', 'hero_image', 'main_description')
        }),
        ('Структурированные данные', {
            'fields': ('banks', 'faq', 'popular_searches', 'bank_offers'),
            'classes': ('collapse',),
            'description': 'JSON поля для структурированных данных. Формат: [{"ключ": "значение"}]'
        }),
        ('Системная информация', {
            'fields': ('created_at', 'updated_at', 'preview_link'),
            'classes': ('collapse',)
        }),
    )
    
    filter_horizontal = ('banks',)
    
    actions = ['duplicate_page', 'publish_pages', 'unpublish_pages']
    
    def preview_link(self, obj):
        if obj.slug:
            return format_html(
                '<a href="/{}" target="_blank">👁️ Предпросмотр</a>',
                obj.slug.lstrip('/')
            )
        return '-'
    preview_link.short_description = 'Предпросмотр'
    preview_link.allow_tags = True
    
    def duplicate_page(self, request, queryset):
        """
        Дублировать выбранные страницы.
        Optimized: no extra .get() query - use queryset objects directly.
        """
        count = 0
        for page in queryset:
            # Clone the page by setting pk/id to None and saving
            # This creates a new instance without an extra query
            page.pk = None
            page.id = None
            page.slug = f"{page.slug}-copy"
            page.is_published = False  # Draft by default for safety
            page.save()
            count += 1
        self.message_user(request, f'Создано копий: {count}', messages.SUCCESS)
    duplicate_page.short_description = '📋 Дублировать страницы'
    
    def publish_pages(self, request, queryset):
        """Опубликовать выбранные страницы"""
        updated = queryset.update(is_published=True)
        self.message_user(request, f'Опубликовано страниц: {updated}', messages.SUCCESS)
    publish_pages.short_description = '✅ Опубликовать'
    
    def unpublish_pages(self, request, queryset):
        """Снять с публикации выбранные страницы"""
        updated = queryset.update(is_published=False)
        self.message_user(request, f'Снято с публикации: {updated}', messages.WARNING)
    unpublish_pages.short_description = '🚫 Снять с публикации'
    
    def save_model(self, request, obj, form, change):
        """Применить шаблон при создании новой страницы"""
        if not change and obj.template_name:
            self._apply_template(request, obj)
        super().save_model(request, obj, form, change)
    
    def _apply_template(self, request, obj):
        """Заполнить поля на основе выбранного шаблона"""
        template = SEO_TEMPLATES.get(obj.template_name)
        if not template:
            return
        
        # Применяем только если поля пустые
        if not obj.meta_title:
            obj.meta_title = template.get('meta_title', '')
        if not obj.meta_description:
            obj.meta_description = template.get('meta_description', '')
        if not obj.meta_keywords:
            obj.meta_keywords = template.get('meta_keywords', '')
        if not obj.h1_title:
            obj.h1_title = template.get('h1_title', '')
        if not obj.main_description:
            obj.main_description = template.get('main_description', '')
        if not obj.faq:
            obj.faq = template.get('faqs', [])
        if not obj.popular_searches:
            obj.popular_searches = template.get('popular_searches', [])
        
        self.message_user(
            request,
            f'Применён шаблон "{obj.template_name}" к странице',
            messages.INFO
        )
