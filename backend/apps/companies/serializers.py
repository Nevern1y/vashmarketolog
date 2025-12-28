"""
API Serializers for Company Profile.
"""
from rest_framework import serializers
from .models import CompanyProfile


class CompanyProfileSerializer(serializers.ModelSerializer):
    """
    Full serializer for Company Profile.
    """
    owner_email = serializers.EmailField(source='owner.email', read_only=True)

    class Meta:
        model = CompanyProfile
        fields = [
            'id',
            'owner',
            'owner_email',
            'is_crm_client',
            'inn',
            'kpp',
            'ogrn',
            'name',
            'short_name',
            'legal_address',
            'actual_address',
            'region',
            'director_name',
            'director_position',
            # Passport fields (API-Ready for Realist Bank)
            'passport_series',
            'passport_number',
            'passport_issued_by',
            'passport_date',
            'passport_code',
            # JSONField data (founders & bank accounts)
            'founders_data',
            'bank_accounts_data',
            # Bank details
            'bank_name',
            'bank_bic',
            'bank_account',
            'bank_corr_account',
            'contact_person',
            'contact_phone',
            'contact_email',
            'website',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'owner_email', 'created_at', 'updated_at']


class CompanyProfileCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating Company Profile.
    Owner is set automatically from request.user.
    """
    class Meta:
        model = CompanyProfile
        fields = [
            'is_crm_client',
            'inn',
            'kpp',
            'ogrn',
            'name',
            'short_name',
            'legal_address',
            'actual_address',
            'region',
            'director_name',
            'director_position',
            # Passport fields (API-Ready)
            'passport_series',
            'passport_number',
            'passport_issued_by',
            'passport_date',
            'passport_code',
            # JSONField data
            'founders_data',
            'bank_accounts_data',
            # Bank details
            'bank_name',
            'bank_bic',
            'bank_account',
            'bank_corr_account',
            'contact_person',
            'contact_phone',
            'contact_email',
            'website',
        ]

    def create(self, validated_data):
        """Set owner from request user."""
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class CompanyProfileListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing companies.
    """
    class Meta:
        model = CompanyProfile
        fields = [
            'id',
            'inn',
            'name',
            'short_name',
            'region',
            'contact_person',
            'is_crm_client',
            'created_at',
        ]
        read_only_fields = fields


class CRMClientSerializer(serializers.ModelSerializer):
    """
    Serializer for Agent's CRM clients.
    Always sets is_crm_client=True.
    """
    class Meta:
        model = CompanyProfile
        fields = [
            'id',
            'inn',
            'kpp',
            'ogrn',
            'name',
            'short_name',
            'legal_address',
            'actual_address',
            'region',
            'director_name',
            'director_position',
            # Passport fields (API-Ready)
            'passport_series',
            'passport_number',
            'passport_issued_by',
            'passport_date',
            'passport_code',
            # JSONField data
            'founders_data',
            'bank_accounts_data',
            # Bank details
            'bank_name',
            'bank_bic',
            'bank_account',
            'bank_corr_account',
            'contact_person',
            'contact_phone',
            'contact_email',
            'website',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        """Set owner and is_crm_client for CRM clients."""
        validated_data['owner'] = self.context['request'].user
        validated_data['is_crm_client'] = True
        return super().create(validated_data)
