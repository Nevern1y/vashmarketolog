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
            # Phase 1: New company info fields (ТЗ Клиенты)
            'foreign_name',
            'legal_form',
            'is_resident',
            # Addresses with postal codes
            'legal_address',
            'legal_address_postal_code',
            'actual_address',
            'actual_address_postal_code',
            'post_address',
            'post_address_postal_code',
            'region',
            # State registration (ТЗ Клиенты - Гос. регистрация)
            'okato',
            'oktmo',
            'okpo',
            'okfs',
            'okogu',
            'okved',
            'registration_date',
            'registration_authority',
            'authorized_capital_declared',
            'authorized_capital_paid',
            'authorized_capital_paid_date',
            # Employee and contract counts
            'employee_count',
            'contracts_count',
            'contracts_44fz_count',
            'contracts_223fz_count',
            # Official contacts
            'company_website',
            'company_email',
            'office_phone',
            # Director info
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
            # New Phase 1 JSONFields (ТЗ Клиенты)
            'leadership_data',
            'activities_data',
            'licenses_data',
            'etp_accounts_data',
            'contact_persons_data',
            # Tax and signatory settings (ТЗ Настройки → Реквизиты)
            'signatory_basis',
            'tax_system',
            'vat_rate',
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
            # Tax and signatory settings
            'signatory_basis',
            'tax_system',
            'vat_rate',
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
            'client_status',
            'invitation_email',
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
            # Client status (ТЗ: Скриншот 3, 6)
            'client_status',
            'invitation_email',
            # Passport fields (API-Ready)
            'passport_series',
            'passport_number',
            'passport_issued_by',
            'passport_date',
            'passport_code',
            # JSONField data
            'founders_data',
            'bank_accounts_data',
            # Tax and signatory settings
            'signatory_basis',
            'tax_system',
            'vat_rate',
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
        read_only_fields = ['id', 'client_status', 'created_at', 'updated_at']

    def create(self, validated_data):
        """Set owner and is_crm_client for CRM clients."""
        validated_data['owner'] = self.context['request'].user
        validated_data['is_crm_client'] = True
        return super().create(validated_data)
