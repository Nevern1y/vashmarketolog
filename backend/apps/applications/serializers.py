"""
API Serializers for Applications.
"""
from functools import lru_cache
from rest_framework import serializers
from .models import Application, PartnerDecision, TicketMessage, ProductType, ApplicationStatus, ApplicationStatusDefinition, CalculationSession, Lead, LeadSource, LeadStatus


# Cache for ApplicationStatusDefinition lookup (avoids N+1 queries in serializers)
# Cache is module-level and refreshed on server restart
@lru_cache(maxsize=512)
def get_status_name_cached(status_id: int, product_type: str) -> str | None:
    """
    Get human-readable status name from ApplicationStatusDefinition.
    Cached to avoid repeated database queries in list serialization.
    """
    try:
        status_def = ApplicationStatusDefinition.objects.filter(
            status_id=status_id,
            product_type=product_type
        ).first()
        if status_def:
            return status_def.name
    except Exception:
        pass
    return None


class CalculationSessionSerializer(serializers.ModelSerializer):
    """
    Serializer for CalculationSession (root application).
    Used to return to bank selection page from application detail.
    """
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    product_type_display = serializers.CharField(source='get_product_type_display', read_only=True)
    remaining_banks_count = serializers.IntegerField(read_only=True)
    applications_count = serializers.SerializerMethodField()

    class Meta:
        model = CalculationSession
        fields = [
            'id',
            'created_by',
            'created_by_email',
            'company',
            'company_name',
            'product_type',
            'product_type_display',
            'form_data',
            'approved_banks',
            'rejected_banks',
            'submitted_banks',
            'title',
            'remaining_banks_count',
            'applications_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_by_email', 'remaining_banks_count', 'applications_count', 'created_at', 'updated_at']

    def get_applications_count(self, obj):
        return obj.applications.count()


class CalculationSessionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating CalculationSession.
    """
    class Meta:
        model = CalculationSession
        fields = [
            'id',
            'company',
            'product_type',
            'form_data',
            'approved_banks',
            'rejected_banks',
            'title',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class CompanyDataForPartnerSerializer(serializers.Serializer):
    """
    Read-only nested serializer for company data visible to Partner/Bank.
    Includes passport, founders, leadership, activities, licenses, and bank accounts info.
    
    Extended in Phase 2 to expose all fields needed for Admin/Agent interfaces.
    """
    id = serializers.IntegerField(read_only=True)
    inn = serializers.CharField(read_only=True)
    kpp = serializers.CharField(read_only=True)
    ogrn = serializers.CharField(read_only=True)
    name = serializers.CharField(read_only=True)
    short_name = serializers.CharField(read_only=True)
    legal_address = serializers.CharField(read_only=True)
    actual_address = serializers.CharField(read_only=True)
    
    # Director basic info
    director_name = serializers.CharField(read_only=True)
    director_position = serializers.CharField(read_only=True)
    
    # Extended Director info (Phase 2)
    director_birth_date = serializers.DateField(read_only=True, allow_null=True)
    director_birth_place = serializers.CharField(read_only=True, allow_null=True)
    director_email = serializers.EmailField(read_only=True, allow_null=True)
    director_phone = serializers.CharField(read_only=True, allow_null=True)
    director_registration_address = serializers.CharField(read_only=True, allow_null=True)
    
    # Director Passport fields (critical for bank decisions)
    passport_series = serializers.CharField(read_only=True, allow_null=True)
    passport_number = serializers.CharField(read_only=True, allow_null=True)
    passport_issued_by = serializers.CharField(read_only=True, allow_null=True)
    passport_date = serializers.DateField(read_only=True, allow_null=True)
    passport_code = serializers.CharField(read_only=True, allow_null=True)
    
    # Founders and bank accounts (JSONFields)
    founders_data = serializers.JSONField(read_only=True)
    bank_accounts_data = serializers.JSONField(read_only=True)
    
    # Additional JSONFields (Phase 2 - full company data exposure)
    legal_founders_data = serializers.JSONField(read_only=True, default=list)
    leadership_data = serializers.JSONField(read_only=True, default=list)
    activities_data = serializers.JSONField(read_only=True, default=list)
    licenses_data = serializers.JSONField(read_only=True, default=list)
    etp_accounts_data = serializers.JSONField(read_only=True, default=list)
    contact_persons_data = serializers.JSONField(read_only=True, default=list)
    
    # Tax and Signatory settings
    signatory_basis = serializers.CharField(read_only=True, allow_null=True)
    tax_system = serializers.CharField(read_only=True, allow_null=True)
    vat_rate = serializers.CharField(read_only=True, allow_null=True)
    
    # Registration and Capital info
    registration_date = serializers.DateField(read_only=True, allow_null=True)
    authorized_capital_declared = serializers.DecimalField(
        read_only=True, max_digits=15, decimal_places=2, allow_null=True
    )
    authorized_capital_paid = serializers.DecimalField(
        read_only=True, max_digits=15, decimal_places=2, allow_null=True
    )
    employee_count = serializers.IntegerField(read_only=True, allow_null=True)
    website = serializers.URLField(read_only=True, allow_null=True)
    
    # MCHD (Machine-Readable Power of Attorney)
    is_mchd = serializers.BooleanField(read_only=True, default=False)
    mchd_number = serializers.CharField(read_only=True, allow_null=True)
    mchd_issue_date = serializers.DateField(read_only=True, allow_null=True)
    mchd_expiry_date = serializers.DateField(read_only=True, allow_null=True)
    mchd_principal_inn = serializers.CharField(read_only=True, allow_null=True)
    mchd_file = serializers.SerializerMethodField()
    
    # Bank details
    bank_name = serializers.CharField(read_only=True)
    bank_bic = serializers.CharField(read_only=True)
    bank_account = serializers.CharField(read_only=True)
    bank_corr_account = serializers.CharField(read_only=True)
    
    # Contact
    contact_person = serializers.CharField(read_only=True)
    contact_phone = serializers.CharField(read_only=True)
    contact_email = serializers.CharField(read_only=True)
    
    def get_mchd_file(self, obj):
        """
        Return absolute URL for MCHD file if it exists.
        Handles both dict (from JSON snapshot) and CompanyProfile model instance.
        """
        if isinstance(obj, dict):
            # From snapshot - already a URL string
            return obj.get('mchd_file')
        # Model instance
        if hasattr(obj, 'mchd_file') and obj.mchd_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.mchd_file.url)
            return obj.mchd_file.url
        return None


class ApplicationDocumentSerializer(serializers.Serializer):
    """
    Nested serializer for documents within Application detail.
    """
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    file_url = serializers.SerializerMethodField()
    document_type_id = serializers.IntegerField(read_only=True)
    type_display = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)


    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class ApplicationSerializer(serializers.ModelSerializer):
    """
    Full serializer for Application.
    Includes nested company_data for Partner/Bank to see full client info.
    
    Phase 2: company_data uses full_client_data snapshot if available (immutable),
    otherwise falls back to live company profile (editable).
    """
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    created_by_role = serializers.CharField(source='created_by.role', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_inn = serializers.CharField(source='company.inn', read_only=True)
    # Nested company data - uses full_client_data snapshot or live company profile
    company_data = serializers.SerializerMethodField()
    partner_email = serializers.EmailField(source='assigned_partner.email', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    product_type_display = serializers.CharField(source='get_product_type_display', read_only=True)
    document_ids = serializers.PrimaryKeyRelatedField(
        source='documents',
        many=True,
        read_only=True
    )
    documents = ApplicationDocumentSerializer(many=True, read_only=True)
    decisions_count = serializers.SerializerMethodField()
    # Bank integration fields (Phase 7)
    status_id_display = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            'id',
            'created_by',
            'created_by_email',
            'created_by_name',
            'created_by_role',
            'company',
            'company_name',
            'company_inn',
            'company_data',  # Full company info for Partner
            'product_type',
            'product_type_display',
            'guarantee_type',     # BG subtype
            'tender_law',         # Tender law
            'amount',
            'term_months',
            'credit_sub_type',      # Credit subtype (corporate_credit)
            'financing_term_days',  # Term in days for credits
            'pledge_description',   # Collateral description
            # Phase 1: Product-specific fields (ТЗ compliance)
            'insurance_category',       # Insurance
            'insurance_product_type',   # Insurance
            'factoring_type',          # Factoring
            'contractor_inn',          # Factoring debtor
            'ved_currency',            # VED
            'ved_country',             # VED
            'tender_support_type',     # Tender Support
            'purchase_category',       # Tender Support
            'industry',                # Tender Support
            'account_type',            # RKO/SpecAccount
            'target_bank_name',  # For Admin routing
            'calculation_session',  # Link to root application (bank selection)
            'tender_number',
            'tender_platform',
            'tender_deadline',
            'goscontract_data',  # Structured tender data for Bank API
            'status',
            'status_display',
            'assigned_partner',
            'partner_email',
            'document_ids',
            'documents',  # Nested document objects for detail view
            'has_signature',
            'notes',
            'admin_notes',           # Admin-only notes (Phase 1.4)
            'rejection_reason',      # Rejection reason (Phase 1.4)
            'info_request_message',  # Info request message (Phase 1.4)
            'decisions_count',
            'external_id',     # Bank ticket ID (Phase 7)
            'bank_status',     # Bank-specific status (Phase 7)
            # Bank API integration fields
            'commission_data',  # Commission structure from bank
            'signing_url',      # URL for document signing
            'status_id',        # Numeric bank status ID (Appendix A)
            'status_id_display', # Human-readable status name from Appendix A
            'created_at',
            'updated_at',
            'submitted_at',
        ]
        read_only_fields = [
            'id',
            'created_by',
            'created_by_email',
            'created_by_name',
            'created_by_role',
            'company_data',
            'status',
            'status_display',
            'assigned_partner',
            'partner_email',
            'has_signature',
            'decisions_count',
            'calculation_session',  # Link to root application
            'external_id',
            'bank_status',
            'commission_data',
            'signing_url',
            'status_id',
            'status_id_display',
            'rejection_reason',       # Read-only (set by admin action)
            'info_request_message',   # Read-only (set by admin action)
            'created_at',
            'updated_at',
            'submitted_at',
        ]

    def get_decisions_count(self, obj):
        return obj.decisions.count()
    
    def get_created_by_name(self, obj):
        """Get creator's full name."""
        if obj.created_by:
            first = obj.created_by.first_name or ''
            last = obj.created_by.last_name or ''
            full_name = f"{first} {last}".strip()
            return full_name if full_name else obj.created_by.email
        return None
    
    def get_company_data(self, obj):
        """
        Get company data - uses full_client_data snapshot if available (immutable),
        otherwise falls back to live company profile data.
        
        This ensures that after an application is sent to bank, the company data
        shown is the data that was actually sent, not current profile data.
        """
        # If we have a saved snapshot from when the application was sent, use it
        if obj.full_client_data and isinstance(obj.full_client_data, dict) and obj.full_client_data.get('inn'):
            return obj.full_client_data
        
        # Otherwise, serialize the live company profile
        if obj.company:
            return CompanyDataForPartnerSerializer(obj.company).data
        
        return None

    def get_status_id_display(self, obj):
        """Get human-readable status name from ApplicationStatusDefinition (Appendix A)."""
        if obj.status_id is None:
            return None
        # Use cached lookup to avoid N+1 queries in list views
        return get_status_name_cached(obj.status_id, obj.product_type)


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating applications.
    """
    document_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )

    class Meta:
        model = Application
        fields = [
            'id',  # Include in response for frontend to use
            'company',
            'product_type',
            'guarantee_type',  # BG subtype (ТЗ requirement)
            'tender_law',      # Tender law (ТЗ requirement)
            'amount',
            'term_months',
            'credit_sub_type',      # Credit subtype (corporate_credit)
            'financing_term_days',  # Term in days for credits
            'pledge_description',   # Collateral description
            # Phase 1: Product-specific fields (ТЗ compliance)
            'insurance_category',       # Insurance
            'insurance_product_type',   # Insurance
            'factoring_type',          # Factoring
            'contractor_inn',          # Factoring debtor
            'ved_currency',            # VED
            'ved_country',             # VED
            'tender_support_type',     # Tender Support
            'purchase_category',       # Tender Support
            'industry',                # Tender Support
            'account_type',            # RKO/SpecAccount
            'target_bank_name',  # For Admin routing
            'calculation_session',  # Link to root application (bank selection page)
            'tender_number',
            'tender_platform',
            'tender_deadline',
            'goscontract_data',  # Structured tender data for Bank API
            'notes',
            'document_ids',
        ]
        read_only_fields = ['id']  # id is auto-generated

    def validate_company(self, value):
        """Validate user has access to this company."""
        user = self.context['request'].user
        
        # Admin can create for any company
        if user.role == 'admin' or user.is_superuser:
            return value
        
        # Client/Agent can only create for their own companies
        if value.owner != user:
            raise serializers.ValidationError('Вы не можете создавать заявки для этой компании.')
        
        return value

    def validate_document_ids(self, value):
        """Validate documents belong to user."""
        if not value:
            return value
        
        from apps.documents.models import Document
        user = self.context['request'].user
        
        existing_ids = set(
            Document.objects.filter(
                id__in=value,
                owner=user
            ).values_list('id', flat=True)
        )
        
        missing_ids = set(value) - existing_ids
        if missing_ids:
            raise serializers.ValidationError(
                f'Документы не найдены или недоступны: {list(missing_ids)}'
            )
        
        return value

    def create(self, validated_data):
        """Create application and attach documents."""
        document_ids = validated_data.pop('document_ids', [])
        validated_data['created_by'] = self.context['request'].user
        
        application = super().create(validated_data)
        
        # Attach documents
        if document_ids:
            from apps.documents.models import Document
            documents = Document.objects.filter(id__in=document_ids)
            application.documents.set(documents)
        
        return application


class ApplicationUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating draft applications.
    """
    document_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )

    class Meta:
        model = Application
        fields = [
            'product_type',
            'guarantee_type',  # BG subtype
            'tender_law',      # Tender law
            'amount',
            'term_months',
            'credit_sub_type',      # Credit subtype (corporate_credit)
            'financing_term_days',  # Term in days for credits
            'pledge_description',   # Collateral description
            # Phase 1: Product-specific fields (ТЗ compliance)
            'insurance_category',       # Insurance
            'insurance_product_type',   # Insurance
            'factoring_type',          # Factoring
            'contractor_inn',          # Factoring debtor
            'ved_currency',            # VED
            'ved_country',             # VED
            'tender_support_type',     # Tender Support
            'purchase_category',       # Tender Support
            'industry',                # Tender Support
            'account_type',            # RKO/SpecAccount
            'target_bank_name',  # For Admin routing
            'tender_number',
            'tender_platform',
            'tender_deadline',
            'goscontract_data',  # Structured tender data for Bank API
            'notes',
            'document_ids',
        ]

    def validate(self, attrs):
        """
        Only drafts can be fully updated.
        Non-drafts allow updating ONLY documents and notes.
        """
        if self.instance and not self.instance.is_editable:
            # Check if any restricted fields are being updated
            restricted_fields = [
                field for field in attrs.keys() 
                if field not in ['document_ids', 'notes']
            ]
            
            if restricted_fields:
                raise serializers.ValidationError(
                    f'Заявка отправлена. Редактирование полей {", ".join(restricted_fields)} запрещено.'
                )
                
        return attrs


    def update(self, instance, validated_data):
        """Update application and documents."""
        document_ids = validated_data.pop('document_ids', None)
        
        application = super().update(instance, validated_data)
        
        # Update documents if provided
        if document_ids is not None:
            from apps.documents.models import Document
            user = self.context['request'].user
            documents = Document.objects.filter(id__in=document_ids, owner=user)
            application.documents.set(documents)
        
        return application


class ApplicationListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing applications.
    """
    company_name = serializers.SerializerMethodField()
    company_inn = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    product_type_display = serializers.CharField(source='get_product_type_display', read_only=True)
    # Agent/creator info
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    created_by_role = serializers.CharField(source='created_by.role', read_only=True)

    class Meta:
        model = Application
        fields = [
            'id',
            'created_by',
            'company',           # Company ID for filtering
            'company_name',
            'company_inn',
            'product_type',
            'product_type_display',
            'credit_sub_type',      # Credit subtype for filtering
            'amount',
            'term_months',
            'financing_term_days',  # Term in days for credits
            'target_bank_name',
            'status',
            'status_display',
            # Agent info
            'created_by_email',
            'created_by_name',
            'created_by_role',
            # Tender info
            'tender_number',
            'tender_law',
            'goscontract_data',
            # Bank integration fields (Phase 7)
            'external_id',      # Bank ticket ID (Phase 7)
            'bank_status',      # Bank status (Phase 7)
            'created_at',
        ]
        read_only_fields = fields

    def get_company_name(self, obj):
        """Return company short_name or fallback to full name."""
        if obj.company:
            return obj.company.short_name or obj.company.name or '—'
        return '—'

    def get_company_inn(self, obj):
        """Return company INN."""
        if obj.company:
            return obj.company.inn or '—'
        return '—'

    def get_created_by_name(self, obj):
        """Get creator's full name."""
        if obj.created_by:
            first = obj.created_by.first_name or ''
            last = obj.created_by.last_name or ''
            full_name = f"{first} {last}".strip()
            return full_name if full_name else obj.created_by.email
        return None


class AdminNotesSerializer(serializers.ModelSerializer):
    """
    Serializer for admin to update notes field only.
    Bypasses the draft-only restriction.
    """
    class Meta:
        model = Application
        fields = ['notes']


class ApplicationAssignSerializer(serializers.Serializer):
    """
    Serializer for assigning applications to partners (Admin only).
    """
    partner_id = serializers.IntegerField()

    def validate_partner_id(self, value):
        """Validate partner exists and is a partner role."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            # MVP: Allow assigning to any partner (even inactive ones awaiting invite acceptance)
            partner = User.objects.get(id=value, role='partner')
        except User.DoesNotExist:
            raise serializers.ValidationError('Партнёр не найден.')
        
        return value


class PartnerDecisionSerializer(serializers.ModelSerializer):
    """
    Serializer for partner decisions.
    Includes nested application data for notifications.
    """
    partner_email = serializers.EmailField(source='partner.email', read_only=True)
    partner_name = serializers.SerializerMethodField()
    decision_display = serializers.CharField(source='get_decision_display', read_only=True)
    # Nested application data for notifications
    application_id = serializers.IntegerField(source='application.id', read_only=True)
    application_company_name = serializers.SerializerMethodField()
    application_company_inn = serializers.SerializerMethodField()
    application_product_type = serializers.CharField(source='application.product_type', read_only=True)
    application_product_type_display = serializers.CharField(source='application.get_product_type_display', read_only=True)
    application_amount = serializers.DecimalField(source='application.amount', max_digits=15, decimal_places=2, read_only=True)
    application_term_months = serializers.IntegerField(source='application.term_months', read_only=True)
    application_status = serializers.CharField(source='application.status', read_only=True)
    application_status_display = serializers.CharField(source='application.get_status_display', read_only=True)

    class Meta:
        model = PartnerDecision
        fields = [
            'id',
            'application',
            'application_id',
            'application_company_name',
            'application_company_inn',
            'application_product_type',
            'application_product_type_display',
            'application_amount',
            'application_term_months',
            'application_status',
            'application_status_display',
            'partner',
            'partner_email',
            'partner_name',
            'decision',
            'decision_display',
            'comment',
            'offered_rate',
            'offered_amount',
            'created_at',
        ]
        read_only_fields = ['id', 'application', 'partner', 'partner_email', 'created_at']

    def get_partner_name(self, obj):
        """Get partner's display name."""
        if obj.partner:
            first = obj.partner.first_name or ''
            last = obj.partner.last_name or ''
            full_name = f"{first} {last}".strip()
            return full_name if full_name else obj.partner.email
        return None

    def get_application_company_name(self, obj):
        """Get company name from application."""
        if obj.application and obj.application.company:
            return obj.application.company.short_name or obj.application.company.name or '—'
        return '—'

    def get_application_company_inn(self, obj):
        """Get company INN from application."""
        if obj.application and obj.application.company:
            return obj.application.company.inn or '—'
        return '—'


class PartnerDecisionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating partner decisions.
    """
    class Meta:
        model = PartnerDecision
        fields = [
            'decision',
            'comment',
            'offered_rate',
            'offered_amount',
        ]

    def validate(self, attrs):
        """Validate decision data."""
        decision = attrs.get('decision')
        
        # If approved, require offer details
        if decision == 'approved':
            if not attrs.get('offered_rate') and not attrs.get('offered_amount'):
                raise serializers.ValidationError({
                    'offered_rate': 'При одобрении укажите предложенную ставку.',
                })
        
        # If rejected, require comment
        if decision == 'rejected' and not attrs.get('comment'):
            raise serializers.ValidationError({
                'comment': 'При отклонении укажите причину.',
            })
        
        return attrs


class TicketMessageSerializer(serializers.ModelSerializer):
    """
    Serializer for chat messages within applications.
    Supports file attachments via multipart/form-data.
    """
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    sender_name = serializers.SerializerMethodField()
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = TicketMessage
        fields = [
            'id',
            'application',
            'sender',
            'sender_id',
            'sender_email',
            'sender_name',
            'sender_role',
            'content',
            'file',
            'file_url',
            'is_read',
            'created_at',
        ]
        read_only_fields = ['id', 'application', 'sender', 'sender_id', 'sender_email', 'sender_name', 'sender_role', 'file_url', 'is_read', 'created_at']

    def get_sender_name(self, obj):
        """Get sender's full name."""
        if obj.sender:
            first = obj.sender.first_name or ''
            last = obj.sender.last_name or ''
            full_name = f"{first} {last}".strip()
            return full_name if full_name else obj.sender.email
        return None

    def get_file_url(self, obj):
        """Return absolute file URL."""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class TicketMessageCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating chat messages.
    Accepts multipart/form-data for file uploads.
    """
    content = serializers.CharField(required=False, allow_blank=True, default='')
    
    class Meta:
        model = TicketMessage
        fields = ['content', 'file']

    def validate(self, attrs):
        """Ensure at least content or file is provided."""
        content = attrs.get('content', '').strip()
        file = attrs.get('file')
        
        if not content and not file:
            raise serializers.ValidationError({
                'content': 'Сообщение не может быть пустым без вложения.'
            })
        
        # Validate file if present
        if file:
            allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'rar']
            ext = file.name.split('.')[-1].lower()
            if ext not in allowed_extensions:
                raise serializers.ValidationError(
                    f'Недопустимый формат файла. Разрешены: {", ".join(allowed_extensions)}'
                )

        # Normalize content
        attrs['content'] = content
        return attrs


# =============================================================================
# LEAD SERIALIZERS (Public API - no authentication required)
# =============================================================================

class LeadSerializer(serializers.ModelSerializer):
    """
    Serializer for Lead model.
    Used by admin to view and manage leads.
    """
    product_type_display = serializers.CharField(source='get_product_type_display', read_only=True)
    guarantee_type_display = serializers.CharField(source='get_guarantee_type_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    assigned_to_email = serializers.EmailField(source='assigned_to.email', read_only=True)
    
    class Meta:
        model = Lead
        fields = [
            'id',
            'full_name',
            'phone',
            'email',
            'inn',
            'product_type',
            'product_type_display',
            'guarantee_type',
            'guarantee_type_display',
            'amount',
            'term_months',
            'source',
            'source_display',
            'utm_source',
            'utm_medium',
            'utm_campaign',
            'utm_term',
            'utm_content',
            # Page tracking
            'page_url',
            'referrer',
            'form_name',
            # Message and comments
            'message',
            'notes',
            # Status and assignment
            'status',
            'status_display',
            'assigned_to',
            'assigned_to_email',
            'converted_application',
            'created_at',
            'updated_at',
            'contacted_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LeadCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating leads from public website.
    No authentication required - used by GuaranteeCalculator.
    
    Minimal validation to accept as many leads as possible.
    """
    # Accept 'name' as alias for 'full_name' (frontend compatibility)
    name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Lead
        fields = [
            'full_name',
            'name',  # alias for full_name
            'phone',
            'email',
            'inn',
            'product_type',
            'guarantee_type',
            'amount',
            'term_months',
            'source',
            'utm_source',
            'utm_medium',
            'utm_campaign',
            'utm_term',
            'utm_content',
            # Page tracking
            'page_url',
            'referrer',
            'form_name',
            # Message
            'message',
        ]
        extra_kwargs = {
            'full_name': {'required': False},
        }
    
    def validate_phone(self, value):
        """Basic phone validation - strip spaces and check length."""
        cleaned = ''.join(c for c in value if c.isdigit() or c == '+')
        if len(cleaned) < 10:
            raise serializers.ValidationError('Некорректный номер телефона')
        return cleaned
    
    def validate_full_name(self, value):
        """Ensure name is not empty."""
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError('Укажите ФИО')
        return value.strip()

    def validate_inn(self, value):
        """Basic INN validation - keep digits and allow empty."""
        if not value:
            return ''
        cleaned = ''.join(c for c in value if c.isdigit())
        if cleaned and len(cleaned) not in (10, 12):
            raise serializers.ValidationError('ИНН должен содержать 10 или 12 цифр')
        return cleaned

    def validate(self, attrs):
        """Handle 'name' -> 'full_name' mapping."""
        name = attrs.pop('name', None)
        if name and not attrs.get('full_name'):
            attrs['full_name'] = name.strip()
        
        # Ensure full_name is present
        if not attrs.get('full_name'):
            raise serializers.ValidationError({'full_name': 'Укажите ФИО'})
        
        return attrs


class LeadCommentSerializer(serializers.ModelSerializer):
    """Serializer for lead comments."""
    author_email = serializers.EmailField(source='author.email', read_only=True)
    author_name = serializers.SerializerMethodField()
    
    class Meta:
        from .models import LeadComment
        model = LeadComment
        fields = [
            'id',
            'lead',
            'author',
            'author_email',
            'author_name',
            'text',
            'created_at',
        ]
        read_only_fields = ['id', 'author', 'created_at', 'author_email', 'author_name']
    
    def get_author_name(self, obj):
        """Get display name for author."""
        if obj.author.first_name and obj.author.last_name:
            return f"{obj.author.first_name} {obj.author.last_name}"
        if obj.author.first_name:
            return obj.author.first_name
        return obj.author.email


class LeadCommentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating lead comments."""
    
    class Meta:
        from .models import LeadComment
        model = LeadComment
        fields = ['text']
    
    def validate_text(self, value):
        """Ensure text is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError('Введите текст комментария')
        return value.strip()


# =============================================================================
# CHAT THREAD SERIALIZERS (Admin chat list)
# =============================================================================

class ChatThreadSerializer(serializers.Serializer):
    """
    Serializer for admin chat threads list.
    Returns aggregated data per application with unread messages.
    """
    application_id = serializers.IntegerField()
    company_name = serializers.CharField()
    last_sender_email = serializers.EmailField()
    last_sender_name = serializers.CharField()
    last_message_preview = serializers.CharField()
    unread_count = serializers.IntegerField()
    admin_replied = serializers.BooleanField()
    last_message_at = serializers.DateTimeField()
