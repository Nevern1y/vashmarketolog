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
    main_description = models.TextField(_("Main Description"), blank=True, help_text=_("Text content for the main block"))
    
    # Structured Data
    faq = models.JSONField(_("FAQ"), default=list, blank=True, help_text=_("List of {question, answer} objects"))
    popular_searches = models.JSONField(_("Popular Searches"), default=list, blank=True, help_text=_("List of {text, href} objects"))
    
    # Dynamic Data
    # Storing offers configuration as JSON for flexibility:
    # [{"bank_id": 1, "custom_rate": "5%"}, ...]
    bank_offers = models.JSONField(_("Bank Offers Configuration"), default=list, blank=True, help_text=_("Configuration for the 9 offers block"))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("SEO Page")
        verbose_name_plural = _("SEO Pages")

    def __str__(self):
        return self.slug
