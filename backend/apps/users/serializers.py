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
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'phone',
            'role',
            'first_name',
            'last_name',
            'full_name',
            'avatar',
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
    
    def get_full_name(self, obj):
        """Combine first_name and last_name into full_name."""
        parts = [obj.first_name, obj.last_name]
        return ' '.join(part for part in parts if part).strip() or None


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile.
    Accepts full_name field and parses it into first_name/last_name.
    """
    full_name = serializers.CharField(required=False, allow_blank=True, write_only=True)
    
    class Meta:
        model = User
        fields = [
            'email',
            'phone',
            'first_name',
            'last_name',
            'full_name',
            'avatar',
        ]
        extra_kwargs = {
            'email': {'required': False},
            'phone': {'required': False},
            'first_name': {'required': False},
            'last_name': {'required': False},
        }
    
    def update(self, instance, validated_data):
        # Handle full_name by splitting into first_name and last_name
        full_name = validated_data.pop('full_name', None)
        if full_name:
            parts = full_name.strip().split(' ', 1)
            validated_data['first_name'] = parts[0]
            validated_data['last_name'] = parts[1] if len(parts) > 1 else ''
        
        return super().update(instance, validated_data)


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
    Shows agents pending review with their FULL company info.
    Includes comprehensive company data for thorough accreditation review (ТЗ Аккредитация).
    
    IMPORTANT: Agent accreditation requires thorough verification to prevent fraud.
    All company registration data, director passport, and documents must be verified.
    """
    # Basic company info
    company_name = serializers.SerializerMethodField()
    company_short_name = serializers.SerializerMethodField()
    company_inn = serializers.SerializerMethodField()
    company_ogrn = serializers.SerializerMethodField()
    company_kpp = serializers.SerializerMethodField()
    company_legal_form = serializers.SerializerMethodField()
    is_resident = serializers.SerializerMethodField()
    
    # Addresses
    legal_address = serializers.SerializerMethodField()
    legal_address_postal_code = serializers.SerializerMethodField()
    actual_address = serializers.SerializerMethodField()
    actual_address_postal_code = serializers.SerializerMethodField()
    
    # State registration data (Государственная регистрация)
    okato = serializers.SerializerMethodField()
    oktmo = serializers.SerializerMethodField()
    okpo = serializers.SerializerMethodField()
    okfs = serializers.SerializerMethodField()
    okved = serializers.SerializerMethodField()
    registration_date = serializers.SerializerMethodField()
    registration_authority = serializers.SerializerMethodField()
    authorized_capital_declared = serializers.SerializerMethodField()
    authorized_capital_paid = serializers.SerializerMethodField()
    
    # Contacts
    company_website = serializers.SerializerMethodField()
    company_email = serializers.SerializerMethodField()
    company_phone = serializers.SerializerMethodField()
    
    # Director info
    director_name = serializers.SerializerMethodField()
    director_position = serializers.SerializerMethodField()
    director_birth_date = serializers.SerializerMethodField()
    director_birth_place = serializers.SerializerMethodField()
    director_email = serializers.SerializerMethodField()
    director_phone = serializers.SerializerMethodField()
    
    # Director passport data (CRITICAL for fraud detection)
    passport_series = serializers.SerializerMethodField()
    passport_number = serializers.SerializerMethodField()
    passport_issued_by = serializers.SerializerMethodField()
    passport_date = serializers.SerializerMethodField()
    passport_code = serializers.SerializerMethodField()
    
    # Tax and signatory
    signatory_basis = serializers.SerializerMethodField()
    tax_system = serializers.SerializerMethodField()
    vat_rate = serializers.SerializerMethodField()
    
    # Bank details
    bank_bik = serializers.SerializerMethodField()
    bank_name = serializers.SerializerMethodField()
    bank_account = serializers.SerializerMethodField()
    bank_corr_account = serializers.SerializerMethodField()
    
    # Founders data (JSON)
    founders_data = serializers.SerializerMethodField()
    
    # Documents uploaded by agent
    documents = serializers.SerializerMethodField()
    
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
            'date_joined',
            # Company basic info
            'company_name',
            'company_short_name',
            'company_inn',
            'company_ogrn',
            'company_kpp',
            'company_legal_form',
            'is_resident',
            # Addresses
            'legal_address',
            'legal_address_postal_code',
            'actual_address',
            'actual_address_postal_code',
            # State registration
            'okato',
            'oktmo',
            'okpo',
            'okfs',
            'okved',
            'registration_date',
            'registration_authority',
            'authorized_capital_declared',
            'authorized_capital_paid',
            # Contacts
            'company_website',
            'company_email',
            'company_phone',
            # Director
            'director_name',
            'director_position',
            'director_birth_date',
            'director_birth_place',
            'director_email',
            'director_phone',
            # Passport
            'passport_series',
            'passport_number',
            'passport_issued_by',
            'passport_date',
            'passport_code',
            # Tax and signatory
            'signatory_basis',
            'tax_system',
            'vat_rate',
            # Bank
            'bank_bik',
            'bank_name',
            'bank_account',
            'bank_corr_account',
            # Founders
            'founders_data',
            # Documents
            'documents',
        ]
        read_only_fields = fields
    
    def _get_company(self, obj):
        """Get the agent's own company (not CRM clients)."""
        from apps.companies.models import CompanyProfile
        return CompanyProfile.objects.filter(owner=obj, is_crm_client=False).first()
    
    # Basic company info
    def get_company_name(self, obj):
        company = self._get_company(obj)
        return company.name if company else None
    
    def get_company_short_name(self, obj):
        company = self._get_company(obj)
        return company.short_name if company else None
    
    def get_company_inn(self, obj):
        company = self._get_company(obj)
        return company.inn if company else None
    
    def get_company_ogrn(self, obj):
        company = self._get_company(obj)
        return company.ogrn if company else None
    
    def get_company_kpp(self, obj):
        company = self._get_company(obj)
        return company.kpp if company else None
    
    def get_company_legal_form(self, obj):
        company = self._get_company(obj)
        return company.legal_form if company else None
    
    def get_is_resident(self, obj):
        company = self._get_company(obj)
        return company.is_resident if company else True
    
    # Addresses
    def get_legal_address(self, obj):
        company = self._get_company(obj)
        return company.legal_address if company else None
    
    def get_legal_address_postal_code(self, obj):
        company = self._get_company(obj)
        return company.legal_address_postal_code if company else None
    
    def get_actual_address(self, obj):
        company = self._get_company(obj)
        return company.actual_address if company else None
    
    def get_actual_address_postal_code(self, obj):
        company = self._get_company(obj)
        return company.actual_address_postal_code if company else None
    
    # State registration
    def get_okato(self, obj):
        company = self._get_company(obj)
        return company.okato if company else None
    
    def get_oktmo(self, obj):
        company = self._get_company(obj)
        return company.oktmo if company else None
    
    def get_okpo(self, obj):
        company = self._get_company(obj)
        return company.okpo if company else None
    
    def get_okfs(self, obj):
        company = self._get_company(obj)
        return company.okfs if company else None
    
    def get_okved(self, obj):
        company = self._get_company(obj)
        return company.okved if company else None
    
    def get_registration_date(self, obj):
        company = self._get_company(obj)
        return company.registration_date if company else None
    
    def get_registration_authority(self, obj):
        company = self._get_company(obj)
        return company.registration_authority if company else None
    
    def get_authorized_capital_declared(self, obj):
        company = self._get_company(obj)
        return str(company.authorized_capital_declared) if company and company.authorized_capital_declared else None
    
    def get_authorized_capital_paid(self, obj):
        company = self._get_company(obj)
        return str(company.authorized_capital_paid) if company and company.authorized_capital_paid else None
    
    # Contacts
    def get_company_website(self, obj):
        company = self._get_company(obj)
        return company.website if company else None
    
    def get_company_email(self, obj):
        company = self._get_company(obj)
        return company.contact_email if company else None
    
    def get_company_phone(self, obj):
        company = self._get_company(obj)
        return company.contact_phone if company else None
    
    # Director info
    def get_director_name(self, obj):
        company = self._get_company(obj)
        return company.director_name if company else None
    
    def get_director_position(self, obj):
        company = self._get_company(obj)
        return company.director_position if company else None
    
    def get_director_birth_date(self, obj):
        company = self._get_company(obj)
        return company.director_birth_date if company else None
    
    def get_director_birth_place(self, obj):
        company = self._get_company(obj)
        return company.director_birth_place if company else None
    
    def get_director_email(self, obj):
        company = self._get_company(obj)
        return company.director_email if company else None
    
    def get_director_phone(self, obj):
        company = self._get_company(obj)
        return company.director_phone if company else None
    
    # Passport data
    def get_passport_series(self, obj):
        company = self._get_company(obj)
        return company.passport_series if company else None
    
    def get_passport_number(self, obj):
        company = self._get_company(obj)
        return company.passport_number if company else None
    
    def get_passport_issued_by(self, obj):
        company = self._get_company(obj)
        return company.passport_issued_by if company else None
    
    def get_passport_date(self, obj):
        company = self._get_company(obj)
        return company.passport_date if company else None
    
    def get_passport_code(self, obj):
        company = self._get_company(obj)
        return company.passport_code if company else None
    
    # Tax and signatory
    def get_signatory_basis(self, obj):
        company = self._get_company(obj)
        return company.signatory_basis if company else 'charter'
    
    def get_tax_system(self, obj):
        company = self._get_company(obj)
        return company.tax_system if company else None
    
    def get_vat_rate(self, obj):
        company = self._get_company(obj)
        return company.vat_rate if company else None
    
    # Bank details
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
    
    # Founders
    def get_founders_data(self, obj):
        company = self._get_company(obj)
        return company.founders_data if company else []
    
    # Documents
    def get_documents(self, obj):
        """Get all documents uploaded by the agent for accreditation."""
        from apps.documents.models import Document
        docs = Document.objects.filter(owner=obj).order_by('-uploaded_at')
        return [
            {
                'id': doc.id,
                'name': doc.name,
                'document_type_id': doc.document_type_id,
                'status': doc.status,
                'uploaded_at': doc.uploaded_at.isoformat() if doc.uploaded_at else None,
                'file_url': doc.file.url if doc.file else None,
            }
            for doc in docs
        ]

