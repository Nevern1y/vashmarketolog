"""
API Serializers for Applications.
"""
from rest_framework import serializers
from .models import Application, PartnerDecision, ProductType, ApplicationStatus


class CompanyDataForPartnerSerializer(serializers.Serializer):
    """
    Read-only nested serializer for company data visible to Partner/Bank.
    Includes passport, founders, and bank accounts info.
    """
    id = serializers.IntegerField(read_only=True)
    inn = serializers.CharField(read_only=True)
    kpp = serializers.CharField(read_only=True)
    ogrn = serializers.CharField(read_only=True)
    name = serializers.CharField(read_only=True)
    short_name = serializers.CharField(read_only=True)
    legal_address = serializers.CharField(read_only=True)
    actual_address = serializers.CharField(read_only=True)
    director_name = serializers.CharField(read_only=True)
    director_position = serializers.CharField(read_only=True)
    # Passport fields (critical for bank decisions)
    passport_series = serializers.CharField(read_only=True, allow_null=True)
    passport_number = serializers.CharField(read_only=True, allow_null=True)
    passport_issued_by = serializers.CharField(read_only=True, allow_null=True)
    passport_date = serializers.DateField(read_only=True, allow_null=True)
    passport_code = serializers.CharField(read_only=True, allow_null=True)
    # Founders and bank accounts (JSONFields)
    founders_data = serializers.JSONField(read_only=True)
    bank_accounts_data = serializers.JSONField(read_only=True)
    # Bank details
    bank_name = serializers.CharField(read_only=True)
    bank_bic = serializers.CharField(read_only=True)
    bank_account = serializers.CharField(read_only=True)
    bank_corr_account = serializers.CharField(read_only=True)
    # Contact
    contact_person = serializers.CharField(read_only=True)
    contact_phone = serializers.CharField(read_only=True)
    contact_email = serializers.CharField(read_only=True)


class ApplicationSerializer(serializers.ModelSerializer):
    """
    Full serializer for Application.
    Includes nested company_data for Partner/Bank to see full client info.
    """
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_inn = serializers.CharField(source='company.inn', read_only=True)
    # Nested company data for Partner/Bank view
    company_data = CompanyDataForPartnerSerializer(source='company', read_only=True)
    partner_email = serializers.EmailField(source='assigned_partner.email', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    product_type_display = serializers.CharField(source='get_product_type_display', read_only=True)
    document_ids = serializers.PrimaryKeyRelatedField(
        source='documents',
        many=True,
        read_only=True
    )
    decisions_count = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            'id',
            'created_by',
            'created_by_email',
            'created_by_name',
            'company',
            'company_name',
            'company_inn',
            'company_data',  # Full company info for Partner
            'product_type',
            'product_type_display',
            'amount',
            'term_months',
            'target_bank_name',  # For Admin routing
            'tender_number',
            'tender_platform',
            'tender_deadline',
            'status',
            'status_display',
            'assigned_partner',
            'partner_email',
            'document_ids',
            'has_signature',
            'notes',
            'decisions_count',
            'created_at',
            'updated_at',
            'submitted_at',
        ]
        read_only_fields = [
            'id',
            'created_by',
            'created_by_email',
            'created_by_name',
            'company_data',
            'status',
            'status_display',
            'assigned_partner',
            'partner_email',
            'has_signature',
            'decisions_count',
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
            'company',
            'product_type',
            'amount',
            'term_months',
            'target_bank_name',  # For Admin routing
            'tender_number',
            'tender_platform',
            'tender_deadline',
            'notes',
            'document_ids',
        ]

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
            'amount',
            'term_months',
            'target_bank_name',  # For Admin routing
            'tender_number',
            'tender_platform',
            'tender_deadline',
            'notes',
            'document_ids',
        ]

    def validate(self, attrs):
        """Only drafts can be updated."""
        if self.instance and not self.instance.is_editable:
            raise serializers.ValidationError(
                'Можно редактировать только черновики.'
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
    company_name = serializers.CharField(source='company.short_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    product_type_display = serializers.CharField(source='get_product_type_display', read_only=True)

    class Meta:
        model = Application
        fields = [
            'id',
            'company_name',
            'product_type',
            'product_type_display',
            'amount',
            'term_months',
            'target_bank_name',  # For Admin routing visibility
            'status',
            'status_display',
            'created_at',
        ]
        read_only_fields = fields


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
            partner = User.objects.get(id=value, role='partner', is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError('Партнёр не найден или неактивен.')
        
        return value


class PartnerDecisionSerializer(serializers.ModelSerializer):
    """
    Serializer for partner decisions.
    """
    partner_email = serializers.EmailField(source='partner.email', read_only=True)
    decision_display = serializers.CharField(source='get_decision_display', read_only=True)

    class Meta:
        model = PartnerDecision
        fields = [
            'id',
            'application',
            'partner',
            'partner_email',
            'decision',
            'decision_display',
            'comment',
            'offered_rate',
            'offered_amount',
            'created_at',
        ]
        read_only_fields = ['id', 'application', 'partner', 'partner_email', 'created_at']


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
