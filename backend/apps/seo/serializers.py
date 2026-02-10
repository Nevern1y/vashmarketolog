from urllib.parse import urlparse

from rest_framework import serializers

from .models import SeoPage
from .utils.templates import SEO_TEMPLATES, get_template
from apps.bank_conditions.serializers import BankSerializer


class SeoPageSerializer(serializers.ModelSerializer):
    """
    Serializer for SEO pages with full CRUD support.
    
    Handles:
    - Basic fields (slug, meta tags, content)
    - JSON fields (faq, popular_searches, bank_offers)
    - Banks ManyToMany (read-only display)
    """
    banks = BankSerializer(many=True, read_only=True)
    hero_image = serializers.CharField(allow_blank=True, allow_null=True, required=False)

    class Meta:
        model = SeoPage
        fields = [
            'id', 'slug', 'meta_title', 'meta_description', 'meta_keywords',
            'h1_title', 'h2_title', 'h3_title', 'hero_image', 'main_description',
            'hero_button_text', 'hero_button_href', 'best_offers_title',
            'application_form_title', 'application_button_text',
            'faq', 'popular_searches', 'bank_offers', 'banks', 'is_published',
            'page_type', 'template_name', 'autofill_template', 'priority', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'banks']

    @staticmethod
    def _is_valid_popular_search_href(href: str) -> bool:
        """
        Allowed href formats:
        - hash links (#application)
        - local links (/kredity-dlya-biznesa)
        - absolute http/https links
        """
        if href.startswith('#'):
            return True
        if href.startswith('/'):
            return True

        parsed = urlparse(href)
        return parsed.scheme in ('http', 'https') and bool(parsed.netloc)

    @staticmethod
    def _normalize_popular_search_href(href: str) -> str:
        clean = (href or '').strip()
        if not clean:
            return '#application'

        lower_clean = clean.lower()
        if clean.startswith('#') or clean.startswith('/') or lower_clean.startswith('http://') or lower_clean.startswith('https://'):
            return clean

        # UX fallback: treat bare slug as local path
        return f"/{clean.lstrip('/')}"

    @staticmethod
    def _is_link_like_value(value: str) -> bool:
        normalized = value.lower()
        return normalized.startswith('#') or normalized.startswith('/') or normalized.startswith('http://') or normalized.startswith('https://')

    @staticmethod
    def _link_to_default_text(value: str) -> str:
        clean = value.strip()

        if clean.startswith('http://') or clean.startswith('https://'):
            parsed = urlparse(clean)
            clean = parsed.path or parsed.netloc

        clean = clean.lstrip('/').lstrip('#').replace('-', ' ').replace('_', ' ').strip()
        if not clean:
            return 'По ссылке'

        return clean[0].upper() + clean[1:]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.hero_image:
            try:
                data['hero_image'] = instance.hero_image.url
            except Exception:
                data['hero_image'] = str(instance.hero_image)
        return data
    
    def validate_faq(self, value):
        """Ensure FAQ is a list of {question, answer} objects."""
        if value is None:
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError("FAQ must be a list")
        for item in value:
            if not isinstance(item, dict):
                raise serializers.ValidationError("Each FAQ item must be an object")
            if 'question' not in item or 'answer' not in item:
                raise serializers.ValidationError("Each FAQ item must have 'question' and 'answer'")
        return value
    
    def validate_popular_searches(self, value):
        """
        Ensure popular_searches is a list of {text, href} objects or strings.
        Supports smart normalization for link-like values pasted into text.
        """
        if value is None:
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError("Popular searches must be a list")
        
        result = []
        for item in value:
            if isinstance(item, str):
                text = item.strip()
                if not text:
                    continue

                if self._is_link_like_value(text):
                    result.append({'text': self._link_to_default_text(text), 'href': text})
                    continue

                # Normalize string to object format
                result.append({'text': text, 'href': '#application'})
            elif isinstance(item, dict):
                if 'text' not in item and 'href' not in item:
                    raise serializers.ValidationError("Each popular search object must have 'text'")

                text = str(item.get('text', '')).strip()
                href = self._normalize_popular_search_href(str(item.get('href') or '#application'))

                if text and self._is_link_like_value(text) and (href == '#application' or href == text):
                    href = href or text
                    text = self._link_to_default_text(text)

                if not text:
                    text = self._link_to_default_text(href)

                if not self._is_valid_popular_search_href(href):
                    raise serializers.ValidationError(
                        "popular_searches.href must be a hash (#...), local path (/...), or http/https URL"
                    )

                result.append({'text': text, 'href': href})
            else:
                raise serializers.ValidationError("Each popular search must be a string or {text, href} object")
        return result
    
    def validate_bank_offers(self, value):
        """
        Ensure bank_offers is a list of offer configurations.
        Normalizes different input formats:
        - {bank_id, custom_rate, custom_text} (model format)
        - {bank_name, rate, custom_text} (UI format)
        """
        if value is None:
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError("Bank offers must be a list")
        if len(value) > 9:
            raise serializers.ValidationError("Maximum 9 bank offers allowed")
        
        result = []
        for item in value:
            if not isinstance(item, dict):
                raise serializers.ValidationError("Each bank offer must be an object")
            
            # Normalize UI format to model format
            normalized = {}
            
            # bank_id or bank_name
            if 'bank_id' in item:
                normalized['bank_id'] = item['bank_id']
            elif 'bank_name' in item:
                # Store bank_name for lookup later
                normalized['bank_name'] = item['bank_name']
            
            # custom_rate or rate
            if 'custom_rate' in item:
                normalized['custom_rate'] = item['custom_rate']
            elif 'rate' in item:
                normalized['custom_rate'] = str(item['rate'])
            
            # custom_text
            if 'custom_text' in item:
                normalized['custom_text'] = item['custom_text']
            
            result.append(normalized)
        
        return result

    @staticmethod
    def _is_empty_value(value):
        if value is None:
            return True
        if isinstance(value, str):
            return value.strip() == ''
        if isinstance(value, (list, tuple, dict, set)):
            return len(value) == 0
        return False

    def _apply_autofill_template(self, attrs, instance, template_key):
        template = get_template(template_key)
        if not template:
            return

        text_fields_mapping = {
            'meta_title': 'meta_title',
            'meta_description': 'meta_description',
            'meta_keywords': 'meta_keywords',
            'h1_title': 'h1_title',
            'main_description': 'main_description',
        }

        for field_name, template_field_name in text_fields_mapping.items():
            current_value = attrs.get(field_name, getattr(instance, field_name, '') if instance else '')
            if self._is_empty_value(current_value):
                attrs[field_name] = template.get(template_field_name, '')

        current_faq = attrs.get('faq', getattr(instance, 'faq', []) if instance else [])
        if self._is_empty_value(current_faq):
            attrs['faq'] = self.validate_faq(template.get('faqs', []))

        current_popular_searches = attrs.get(
            'popular_searches',
            getattr(instance, 'popular_searches', []) if instance else [],
        )
        if self._is_empty_value(current_popular_searches):
            attrs['popular_searches'] = self.validate_popular_searches(
                template.get('popular_searches', []),
            )

    def validate(self, attrs):
        """
        Auto-enable create-page layout when template-only blocks are filled.

        This prevents accidental "empty" rendering when a manager fills
        template content but forgets to select Layout: create-page.
        """
        instance = getattr(self, 'instance', None)

        template_name = str(
            attrs.get('template_name', getattr(instance, 'template_name', '')) or ''
        ).strip()
        current_autofill_template = str(
            getattr(instance, 'autofill_template', '') if instance else '',
        ).strip()
        autofill_template = str(
            attrs.get('autofill_template', current_autofill_template) or '',
        ).strip()

        # Backward compatibility for legacy payloads where preset was sent in template_name.
        if template_name in SEO_TEMPLATES and not autofill_template:
            autofill_template = template_name
            attrs['autofill_template'] = template_name
            attrs['template_name'] = ''
            template_name = ''

        should_apply_autofill_template = bool(autofill_template) and (
            instance is None or (
                'autofill_template' in attrs and autofill_template != current_autofill_template
            )
        )

        if should_apply_autofill_template:
            self._apply_autofill_template(attrs, instance, autofill_template)

        hero_button_text = str(
            attrs.get('hero_button_text', getattr(instance, 'hero_button_text', '')) or ''
        ).strip()
        best_offers_title = str(
            attrs.get('best_offers_title', getattr(instance, 'best_offers_title', '')) or ''
        ).strip()
        application_form_title = str(
            attrs.get('application_form_title', getattr(instance, 'application_form_title', '')) or ''
        ).strip()
        application_button_text = str(
            attrs.get('application_button_text', getattr(instance, 'application_button_text', '')) or ''
        ).strip()

        has_template_content = any([
            hero_button_text,
            best_offers_title,
            application_form_title,
            application_button_text,
        ])

        if not template_name and (has_template_content or autofill_template):
            attrs['template_name'] = 'create-page'

        return attrs
