"""
API Serializers for Document Library.

BREAKING CHANGE: Updated to use numeric document_type_id per Appendix B.
"""
from rest_framework import serializers
from .models import Document, DocumentStatus, DocumentTypeDefinition, DocumentSource


class DocumentTypeDefinitionSerializer(serializers.ModelSerializer):
    """Serializer for DocumentTypeDefinition reference table."""
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    
    class Meta:
        model = DocumentTypeDefinition
        fields = [
            'id',
            'document_type_id',
            'product_type',
            'name',
            'source',
            'source_display',
            'is_active',
        ]
        read_only_fields = fields


class DocumentSerializer(serializers.ModelSerializer):
    """
    Full serializer for Document.
    Now uses numeric document_type_id per Appendix B.
    """
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.SerializerMethodField()
    source_display = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id',
            'owner',
            'owner_email',
            'company',
            'company_name',
            'name',
            'file',
            'file_url',
            'document_type_id',  # NEW: Numeric ID
            'product_type',      # NEW: Product context
            'type_display',
            'source_display',    # NEW: Who uploads
            'status',
            'status_display',
            'rejection_reason',
            'verified_at',
            'verified_by',
            'uploaded_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 
            'owner', 
            'owner_email', 
            'status', 
            'status_display',
            'rejection_reason',
            'verified_at', 
            'verified_by',
            'uploaded_at', 
            'updated_at',
            'type_display',
            'source_display',
        ]

    def get_file_url(self, obj):
        """Get full URL for file."""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def get_type_display(self, obj):
        """Get document type name from reference table."""
        return obj.type_display
    
    def get_source_display(self, obj):
        """Get source information from reference table."""
        return obj.source_display


class DocumentUploadSerializer(serializers.ModelSerializer):
    """
    Serializer for uploading new documents.
    Now accepts numeric document_type_id per Appendix B.
    """
    class Meta:
        model = Document
        fields = [
            'id',
            'name',
            'file',
            'document_type_id',  # NEW: Numeric ID (17, 21, 68, etc.)
            'product_type',      # NEW: Product context (bank_guarantee, contract_loan)
            'company',
        ]
        read_only_fields = ['id']

    def validate_file(self, value):
        """Validate file size and type."""
        # Max 10MB
        max_size = 10 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError('Размер файла не должен превышать 10 МБ.')
        
        # Allowed extensions
        allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'rar', 'sig']
        ext = value.name.split('.')[-1].lower()
        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                f'Недопустимый формат файла. Разрешены: {", ".join(allowed_extensions)}'
            )
        
        return value
    
    def validate_document_type_id(self, value):
        """Validate that document_type_id is a valid integer."""
        if value is None:
            return 0  # Default to "Дополнительный документ"
        if not isinstance(value, int) or value < 0:
            raise serializers.ValidationError('ID типа документа должен быть неотрицательным целым числом.')
        return value
    
    def validate(self, attrs):
        """
        Validate that document_type_id exists in reference table for given product_type.
        If product_type is not specified, skip this validation (allow any ID).
        """
        document_type_id = attrs.get('document_type_id', 0)
        product_type = attrs.get('product_type', '')
        
        # If both specified, verify the combination exists in reference table
        if product_type and document_type_id != 0:
            exists = DocumentTypeDefinition.objects.filter(
                document_type_id=document_type_id,
                product_type=product_type,
                is_active=True
            ).exists()
            
            if not exists:
                # Warning but don't block - might be uploading before reference data populated
                # In production, you might want to raise an error here
                pass
        
        return attrs

    def create(self, validated_data):
        """Set owner from request user."""
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class DocumentListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing documents.
    Includes file and file_url for download functionality.
    Includes owner_email for admin document verification view.
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    owner_email = serializers.EmailField(source='owner.email', read_only=True)

    class Meta:
        model = Document
        fields = [
            'id',
            'name',
            'file',
            'file_url',
            'document_type_id',  # NEW: Numeric ID
            'product_type',      # NEW: Product context
            'type_display',
            'status',
            'status_display',
            'uploaded_at',
            'owner_email',
        ]
        read_only_fields = fields

    def get_file_url(self, obj):
        """Get full URL for file download."""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def get_type_display(self, obj):
        """Get document type name from reference table."""
        return obj.type_display


class DocumentVerifySerializer(serializers.Serializer):
    """
    Serializer for document verification (Admin only).
    """
    status = serializers.ChoiceField(
        choices=[
            ('verified', 'Проверен'),
            ('rejected', 'Отклонён'),
            ('not_allowed', 'Не допущен'),  # NEW status per ТЗ
        ]
    )
    rejection_reason = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000
    )

    def validate(self, attrs):
        """Require rejection reason if status is rejected or not_allowed."""
        if attrs['status'] in ('rejected', 'not_allowed') and not attrs.get('rejection_reason'):
            raise serializers.ValidationError({
                'rejection_reason': 'Укажите причину отклонения.'
            })
        return attrs


class DocumentSelectSerializer(serializers.Serializer):
    """
    Serializer for selecting documents for applications.
    Used when attaching existing documents to applications (checkbox selection).
    """
    document_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=True
    )

    def validate_document_ids(self, value):
        """Validate that all documents exist and belong to user."""
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
