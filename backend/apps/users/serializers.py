"""
API Serializers for User model and Authentication.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    Only allows CLIENT and AGENT roles during self-registration.
    Supports referral_id for partner->agent invitation tracking.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    role = serializers.ChoiceField(
        choices=[('client', 'Клиент'), ('agent', 'Агент')],
        required=True
    )
    # Optional referral ID - links new user to a partner who invited them
    referral_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text='ID партнёра, пригласившего этого пользователя'
    )

    class Meta:
        model = User
        fields = [
            'email',
            'phone',
            'password',
            'password_confirm',
            'role',
            'first_name',
            'last_name',
            'referral_id',
        ]
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
        }

    def validate(self, attrs):
        """Validate that passwords match."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Пароли не совпадают.'
            })
        return attrs

    def validate_referral_id(self, value):
        """Validate that referral_id points to a valid partner user."""
        if value:
            try:
                partner = User.objects.get(id=value)
                # Must be a partner user
                if partner.role != 'partner':
                    raise serializers.ValidationError('Недействительный реферальный код.')
            except User.DoesNotExist:
                raise serializers.ValidationError('Недействительный реферальный код.')
        return value

    def create(self, validated_data):
        """Create a new user with encrypted password and optional referral link."""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        referral_id = validated_data.pop('referral_id', None)
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        
        # Link to the partner who invited this user
        if referral_id:
            try:
                partner = User.objects.get(id=referral_id, role='partner')
                user.invited_by = partner
                user.save(update_fields=['invited_by'])
            except User.DoesNotExist:
                pass  # Silently ignore invalid referral
        
        return user


class UserLoginSerializer(TokenObtainPairSerializer):
    """
    Custom token serializer that includes user data in response.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims to token
        token['email'] = user.email
        token['role'] = user.role
        
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add user info to response
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'phone': self.user.phone,
            'role': self.user.role,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'is_active': self.user.is_active,
            # Phase 4: Include accreditation status
            'accreditation_status': self.user.accreditation_status,
        }
        
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile (read/update).
    """
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'phone',
            'role',
            'first_name',
            'last_name',
            'is_active',
            'date_joined',
            'updated_at',
            # Phase 4: Accreditation fields
            'accreditation_status',
            'accreditation_submitted_at',
            'accreditation_comment',
        ]
        read_only_fields = ['id', 'email', 'role', 'is_active', 'date_joined', 'updated_at',
                           'accreditation_status', 'accreditation_submitted_at', 'accreditation_comment']


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile.
    """
    class Meta:
        model = User
        fields = [
            'phone',
            'first_name',
            'last_name',
        ]


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for password change.
    """
    old_password = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )

    def validate_old_password(self, value):
        """Check that old password is correct."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Текущий пароль указан неверно.')
        return value

    def validate(self, attrs):
        """Check that new passwords match."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Новые пароли не совпадают.'
            })
        return attrs


class PartnerInviteSerializer(serializers.ModelSerializer):
    """
    Serializer for creating partner invites (Admin only).
    """
    company_name = serializers.CharField(
        max_length=255,
        required=True,
        help_text='Название банка/компании партнёра'
    )

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'company_name']

    def create(self, validated_data):
        """Create a partner user with invite token."""
        company_name = validated_data.pop('company_name', '')
        user = User.objects.create(
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=f"{validated_data.get('last_name', '')} ({company_name})",  # Store bank name in last_name
            role='partner',
            is_active=False,  # Inactive until invite is accepted
        )
        user.generate_invite_token()
        return user


class PartnerAcceptInviteSerializer(serializers.Serializer):
    """
    Serializer for accepting partner invite.
    """
    password = serializers.CharField(
        required=True,
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        """Check that passwords match."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Пароли не совпадают.'
            })
        return attrs


class UserListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing users (Admin only).
    """
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'phone',
            'role',
            'first_name',
            'last_name',
            'is_active',
            'date_joined',
            # Phase 4: Accreditation fields
            'accreditation_status',
            'accreditation_submitted_at',
            'accreditation_reviewed_at',
            'accreditation_comment',
        ]
        read_only_fields = fields


class AgentAccreditationSerializer(serializers.ModelSerializer):
    """
    Serializer for agent accreditation list (Admin only).
    Shows agents pending review with their company info.
    Includes full company data for accreditation review (ТЗ Аккредитация).
    """
    company_name = serializers.SerializerMethodField()
    # Full company data for accreditation review
    company_inn = serializers.SerializerMethodField()
    company_address = serializers.SerializerMethodField()
    company_website = serializers.SerializerMethodField()
    company_email = serializers.SerializerMethodField()
    company_phone = serializers.SerializerMethodField()
    director_name = serializers.SerializerMethodField()
    director_position = serializers.SerializerMethodField()
    signatory_basis = serializers.SerializerMethodField()
    tax_system = serializers.SerializerMethodField()
    vat_rate = serializers.SerializerMethodField()
    bank_bik = serializers.SerializerMethodField()
    bank_name = serializers.SerializerMethodField()
    bank_account = serializers.SerializerMethodField()
    bank_corr_account = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'phone',
            'first_name',
            'last_name',
            'accreditation_status',
            'accreditation_submitted_at',
            'accreditation_comment',
            'company_name',
            'date_joined',
            # Full company data for accreditation
            'company_inn',
            'company_address',
            'company_website',
            'company_email',
            'company_phone',
            'director_name',
            'director_position',
            'signatory_basis',
            'tax_system',
            'vat_rate',
            'bank_bik',
            'bank_name',
            'bank_account',
            'bank_corr_account',
        ]
        read_only_fields = fields
    
    def _get_company(self, obj):
        """Get the agent's own company (not CRM clients)."""
        from apps.companies.models import CompanyProfile
        return CompanyProfile.objects.filter(owner=obj, is_crm_client=False).first()
    
    def get_company_name(self, obj):
        """Get company name from related CompanyProfile if exists."""
        company = self._get_company(obj)
        return company.short_name or company.name if company else None
    
    def get_company_inn(self, obj):
        company = self._get_company(obj)
        return company.inn if company else None
    
    def get_company_address(self, obj):
        company = self._get_company(obj)
        return company.legal_address if company else None
    
    def get_company_website(self, obj):
        company = self._get_company(obj)
        return company.website if company else None
    
    def get_company_email(self, obj):
        company = self._get_company(obj)
        return company.contact_email if company else None
    
    def get_company_phone(self, obj):
        company = self._get_company(obj)
        return company.contact_phone if company else None
    
    def get_director_name(self, obj):
        company = self._get_company(obj)
        return company.director_name if company else None
    
    def get_director_position(self, obj):
        company = self._get_company(obj)
        return company.director_position if company else None
    
    def get_signatory_basis(self, obj):
        """Return signatory basis from company profile."""
        company = self._get_company(obj)
        return company.signatory_basis if company else 'charter'
    
    def get_tax_system(self, obj):
        """Return tax system from company profile."""
        company = self._get_company(obj)
        return company.tax_system if company else None
    
    def get_vat_rate(self, obj):
        """Return VAT rate from company profile."""
        company = self._get_company(obj)
        return company.vat_rate if company else None
    
    def get_bank_bik(self, obj):
        company = self._get_company(obj)
        return company.bank_bic if company else None
    
    def get_bank_name(self, obj):
        company = self._get_company(obj)
        return company.bank_name if company else None
    
    def get_bank_account(self, obj):
        company = self._get_company(obj)
        return company.bank_account if company else None
    
    def get_bank_corr_account(self, obj):
        company = self._get_company(obj)
        return company.bank_corr_account if company else None

