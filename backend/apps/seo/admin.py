from django.contrib import admin, messages
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from .models import SeoPage
from .utils.templates import SEO_TEMPLATES


@admin.register(SeoPage)
class SeoPageAdmin(admin.ModelAdmin):
    list_display = ('slug', 'meta_title', 'page_type', 'is_published', 'updated_at', 'preview_link')
    list_filter = ('is_published', 'page_type', 'template_name', 'autofill_template')
    search_fields = ('slug', 'meta_title', 'h1_title')
    prepopulated_fields = {'slug': ('h1_title',)}
    readonly_fields = ('created_at', 'updated_at', 'preview_link')
    
    fieldsets = (
        ('Основное', {
            'fields': ('slug', 'page_type', 'is_published', 'priority')
        }),
        ('Шаблоны', {
            'fields': ('template_name', 'autofill_template'),
            'description': 'template_name: layout шаблон (например create-page). autofill_template: контентный пресет для автозаполнения.'
        }),
        ('SEO Метатеги', {
            'fields': ('meta_title', 'meta_description', 'meta_keywords'),
            'classes': ('collapse',)
        }),
        ('Контент страницы', {
            'fields': ('h1_title', 'h2_title', 'h3_title', 'hero_image', 'main_description')
        }),
        ('Шаблон create-page', {
            'fields': (
                'hero_button_text',
                'hero_button_href',
                'best_offers_title',
                'application_form_title',
                'application_button_text',
            )
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
        Optimized: uses bulk_create for single INSERT query instead of N queries.
        """
        # Collect original pages and their banks for M2M handling
        originals_with_banks = []
        pages_to_create = []
        
        for page in queryset:
            # Store original banks before cloning (M2M must be handled after bulk_create)
            has_banks = page.banks.exists()
            if has_banks:
                originals_with_banks.append((page, list(page.banks.all())))
            
            # Create new SeoPage instance with copied fields
            pages_to_create.append(SeoPage(
                slug=f"{page.slug}-copy",
                meta_title=page.meta_title,
                meta_description=page.meta_description,
                meta_keywords=page.meta_keywords,
                h1_title=page.h1_title,
                h2_title=page.h2_title,
                h3_title=page.h3_title,
                hero_image=page.hero_image,
                main_description=page.main_description,
                hero_button_text=page.hero_button_text,
                hero_button_href=page.hero_button_href,
                best_offers_title=page.best_offers_title,
                application_form_title=page.application_form_title,
                application_button_text=page.application_button_text,
                autofill_template=page.autofill_template,
                faq=page.faq,
                popular_searches=page.popular_searches,
                bank_offers=page.bank_offers,
                is_published=False,  # Draft by default for safety
                page_type=page.page_type,
                template_name=page.template_name,
                priority=page.priority,
            ))
        
        # Single INSERT query for all pages
        created_pages = SeoPage.objects.bulk_create(pages_to_create)
        
        # Handle M2M banks relation (must be done after bulk_create)
        # Match by slug pattern: original.slug -> original.slug-copy
        if originals_with_banks:
            created_by_slug = {p.slug: p for p in created_pages}
            for original, banks in originals_with_banks:
                clone_slug = f"{original.slug}-copy"
                if clone_slug in created_by_slug:
                    created_by_slug[clone_slug].banks.set(banks)
        
        self.message_user(request, f'Создано копий: {len(created_pages)}', messages.SUCCESS)
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
        if obj.template_name in SEO_TEMPLATES and not obj.autofill_template:
            # Backward compatibility for legacy manual input in template_name
            obj.autofill_template = obj.template_name
            obj.template_name = ''

        should_apply_template = bool(obj.autofill_template)
        if not should_apply_template and obj.template_name in SEO_TEMPLATES:
            # Backward compatibility for legacy data where presets were saved in template_name
            should_apply_template = True

        if not change and should_apply_template:
            self._apply_template(request, obj)
        super().save_model(request, obj, form, change)
    
    def _apply_template(self, request, obj):
        """Заполнить поля на основе выбранного шаблона"""
        template_key = obj.autofill_template
        if not template_key and obj.template_name in SEO_TEMPLATES:
            template_key = obj.template_name

        template = SEO_TEMPLATES.get(template_key)
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
            f'Применён шаблон "{template_key}" к странице',
            messages.INFO
        )
