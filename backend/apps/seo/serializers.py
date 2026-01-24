from rest_framework import serializers
from .models import SeoPage
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

    class Meta:
        model = SeoPage
        fields = [
            'id', 'slug', 'meta_title', 'meta_description', 'meta_keywords',
            'h1_title', 'h2_title', 'h3_title', 'hero_image', 'main_description',
            'faq', 'popular_searches', 'bank_offers', 'banks', 'is_published',
            'page_type', 'template_name', 'priority', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'banks']
    
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
        Normalizes strings to {text: string, href: "#"}.
        """
        if value is None:
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError("Popular searches must be a list")
        
        result = []
        for item in value:
            if isinstance(item, str):
                # Normalize string to object format
                result.append({'text': item, 'href': '#'})
            elif isinstance(item, dict):
                if 'text' not in item:
                    raise serializers.ValidationError("Each popular search object must have 'text'")
                # Ensure href exists
                if 'href' not in item:
                    item['href'] = '#'
                result.append(item)
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

