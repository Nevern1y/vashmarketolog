"""
Serializers for Bank Conditions API.
"""
from rest_framework import serializers
from .models import Bank, BankCondition, IndividualReviewCondition, RKOCondition, StopFactor


class BankSerializer(serializers.ModelSerializer):
    """Bank serializer."""
    
    class Meta:
        model = Bank
        fields = ['id', 'name', 'short_name', 'logo_url', 'is_active', 'order']


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
