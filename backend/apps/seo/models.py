from django.db import models
from django.utils.translation import gettext_lazy as _

class SeoPage(models.Model):
    slug = models.CharField(_("URL Path"), max_length=255, unique=True, help_text=_("e.g. /credit-for-business. Do not include domain."))
    
    # Meta Tags
    meta_title = models.CharField(_("Meta Title"), max_length=255, blank=True)
    meta_description = models.TextField(_("Meta Description"), blank=True)
    meta_keywords = models.TextField(_("Meta Keywords"), blank=True)
    
    # Page Content
    h1_title = models.CharField(_("H1 Title"), max_length=255, blank=True)
    h2_title = models.CharField(_("H2 Title"), max_length=255, blank=True, help_text=_("Secondary heading"))
    h3_title = models.CharField(_("H3 Title"), max_length=255, blank=True, help_text=_("Tertiary heading"))
    hero_image = models.ImageField(_("Hero Image"), upload_to='seo/hero/', blank=True, null=True, help_text=_("Main block image"))
    main_description = models.TextField(_("Main Description"), blank=True, help_text=_("Text content for the main block"))
    
    # Structured Data
    faq = models.JSONField(_("FAQ"), default=list, blank=True, help_text=_("List of {question, answer} objects"))
    popular_searches = models.JSONField(_("Popular Searches"), default=list, blank=True, help_text=_("List of {text, href} objects"))
    
    # Dynamic Data
    # Storing offers configuration as JSON for flexibility:
    # [{"bank_id": 1, "custom_rate": "5%"}, ...]
    bank_offers = models.JSONField(_("Bank Offers Configuration"), default=list, blank=True, help_text=_("Configuration for 9 offers block"))
    
    # Publication Control
    is_published = models.BooleanField(_("Is Published"), default=True)
    
    # Page Type
    page_type = models.CharField(
        _("Page Type"),
        max_length=50,
        choices=[
            ('landing', 'Landing Page'),
            ('product', 'Product Page'),
            ('custom', 'Custom Page'),
        ],
        default='product'
    )
    
    # Template System
    template_name = models.CharField(_("Template Name"), max_length=100, blank=True, help_text="Template to apply on creation (e.g., factoring, rko, leasing)")
    
    # Priority for catch-all routing
    priority = models.IntegerField(_("Priority"), default=0, help_text="Higher priority shown first in catch-all routes")
    
    # Bank Relationships
    banks = models.ManyToManyField(
        'bank_conditions.Bank',
        blank=True,
        related_name='seo_pages',
        verbose_name=_("Banks to Display")
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("SEO Page")
        verbose_name_plural = _("SEO Pages")
        ordering = ['-priority', 'slug']

    def __str__(self):
        return self.slug
