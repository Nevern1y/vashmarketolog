"""
Serializers for Bank Conditions API.
"""
import re
from rest_framework import serializers
from .models import Bank, BankCondition, IndividualReviewCondition, RKOCondition, StopFactor


def normalize_russian_phone(value: str) -> str:
    raw = (value or '').strip()
    if not raw:
        return ''

    digits = re.sub(r'\D', '', raw)
    if not digits:
        return ''

    if len(digits) == 11 and digits[0] in ('7', '8'):
        digits = digits[1:]
    elif len(digits) == 10:
        pass
    else:
        return raw

    return f"+7({digits[:3]}){digits[3:6]}-{digits[6:8]}-{digits[8:10]}"


class ContactPhoneValidationMixin:
    def validate_contact_phone(self, value):
        normalized = normalize_russian_phone(value)
        if normalized and len(normalized) > 20:
            raise serializers.ValidationError('Телефон должен содержать не более 20 символов')
        return normalized


class BankSerializer(serializers.ModelSerializer):
    """Bank serializer."""
    
    class Meta:
        model = Bank
        fields = ['id', 'name', 'short_name', 'logo_url', 'is_active', 'order', 
                  'partner_user', 'contact_email', 'contact_phone', 'description']
        read_only_fields = ['partner_user']


class AdminBankSerializer(ContactPhoneValidationMixin, serializers.ModelSerializer):
    """Admin serializer for bank management with partner info."""
    partner_user_id = serializers.IntegerField(source='partner_user.id', read_only=True)
    partner_email = serializers.EmailField(source='partner_user.email', read_only=True)
    partner_is_active = serializers.BooleanField(source='partner_user.is_active', read_only=True)
    partner_name = serializers.SerializerMethodField()

    class Meta:
        model = Bank
        fields = [
            'id', 'name', 'short_name', 'logo_url', 'is_active', 'order',
            'contact_email', 'contact_phone', 'description',
            'partner_user_id', 'partner_email', 'partner_is_active', 'partner_name',
            'created_at', 'updated_at'
        ]

    def get_partner_name(self, obj):
        if not obj.partner_user:
            return None
        return f"{obj.partner_user.first_name} {obj.partner_user.last_name}".strip() or obj.partner_user.email


class BankPartnerInviteSerializer(serializers.Serializer):
    """Serializer for inviting a partner for a specific bank (Admin only)."""
    email = serializers.EmailField()
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)


class BankPartnerLinkSerializer(serializers.Serializer):
    """Serializer for linking an existing partner account to a bank."""
    partner_user_id = serializers.IntegerField(required=False)
    email = serializers.EmailField(required=False)

    def validate(self, attrs):
        if not attrs.get('partner_user_id') and not attrs.get('email'):
            raise serializers.ValidationError('Укажите partner_user_id или email')
        return attrs


class PartnerBankProfileSerializer(ContactPhoneValidationMixin, serializers.ModelSerializer):
    """Serializer for partner to view/edit their bank profile."""
    
    class Meta:
        model = Bank
        fields = ['id', 'name', 'short_name', 'logo_url', 'contact_email', 
                  'contact_phone', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'name', 'is_active', 'created_at', 'updated_at']


class BankConditionSerializer(serializers.ModelSerializer):
    """Bank condition serializer."""
    bank_name = serializers.CharField(source='bank.name', read_only=True)
    
    class Meta:
        model = BankCondition
        fields = [
            'id', 'bank', 'bank_name', 'product',
            'sum_min', 'sum_max', 'term_months', 'term_days',
            'rate_min', 'rate_type', 'service_commission',
            'service_commission_max', 'additional_conditions',
            'is_active', 'updated_at'
        ]


class IndividualReviewConditionSerializer(serializers.ModelSerializer):
    """Individual review condition serializer."""
    bank_name = serializers.CharField(source='bank.name', read_only=True)
    
    class Meta:
        model = IndividualReviewCondition
        fields = [
            'id', 'bank', 'bank_name', 'fz_type', 'guarantee_type',
            'client_limit', 'fz_application_limit', 'commercial_application_limit',
            'corporate_dept_limit', 'term', 'bank_rate', 'service_commission',
            'is_active', 'updated_at'
        ]


class RKOConditionSerializer(serializers.ModelSerializer):
    """RKO condition serializer."""
    bank_name = serializers.CharField(source='bank.name', read_only=True)
    
    class Meta:
        model = RKOCondition
        fields = ['id', 'bank', 'bank_name', 'description', 'is_active', 'order']


class StopFactorSerializer(serializers.ModelSerializer):
    """Stop factor serializer."""
    
    class Meta:
        model = StopFactor
        fields = ['id', 'description', 'is_active', 'order']


class BankConditionsAggregatedSerializer(serializers.Serializer):
    """
    Aggregated response with all bank conditions data.
    """
    banks = BankSerializer(many=True)
    conditions = BankConditionSerializer(many=True)
    individual_reviews = IndividualReviewConditionSerializer(many=True)
    rko_conditions = RKOConditionSerializer(many=True)
    stop_factors = StopFactorSerializer(many=True)
