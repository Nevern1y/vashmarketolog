"""
API Serializers for Document Library.

BREAKING CHANGE: Updated to use numeric document_type_id per Appendix B.
"""
from rest_framework import serializers
from .models import Document, DocumentTypeDefinition, DocumentSource, DocumentRequest, DocumentRequestStatus


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
    owner_id = serializers.IntegerField(source='owner.id', read_only=True)
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
            'owner_id',
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
            'uploaded_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 
            'owner', 
            'owner_id',
            'owner_email', 
            'status', 
            'status_display',
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
    document_type_id = serializers.IntegerField(required=False, default=0)
    product_type = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = Document
        fields = [
            'id',
            'name',
            'file',
            'document_type_id',  # NEW: Numeric ID (17, 21, 68, etc.)
            'product_type',      # NEW: Product context (bank_guarantee, contract_loan)
            'company',
            'status',
        ]
        read_only_fields = ['id', 'status']

    def validate_file(self, value):
        """Validate file size and type."""
        # Max 10MB
        max_size = 10 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError('Размер файла не должен превышать 10 МБ.')
        
        # Allowed extensions
        allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'rar', 'sig', 'txt']
        ext = value.name.split('.')[-1].lower()
        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                f'Недопустимый формат файла. Разрешены: {", ".join(allowed_extensions)}'
            )
        
        return value
    
    def validate(self, attrs):
        """
        No validation against reference table for now.
        """
        return attrs


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
    owner_id = serializers.IntegerField(source='owner.id', read_only=True)

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
            'owner_id',
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


# =============================================================================
# DOCUMENT REQUEST SERIALIZERS (Admin -> Agent/Client document requests)
# =============================================================================

class DocumentRequestSerializer(serializers.ModelSerializer):
    """Full serializer for DocumentRequest."""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    requested_by_email = serializers.EmailField(source='requested_by.email', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = DocumentRequest
        fields = [
            'id',
            'user',
            'user_email',
            'user_name',
            'requested_by',
            'requested_by_email',
            'document_type_name',
            'document_type_id',
            'comment',
            'status',
            'status_display',
            'fulfilled_document',
            'created_at',
            'updated_at',
            'fulfilled_at',
            'is_read',
        ]
        read_only_fields = [
            'id', 'user_email', 'user_name', 'requested_by', 'requested_by_email',
            'status_display', 'created_at', 'updated_at', 'fulfilled_at',
        ]
    
    def get_user_name(self, obj):
        """Get user full name or email."""
        if obj.user.first_name or obj.user.last_name:
            return f"{obj.user.last_name} {obj.user.first_name}".strip()
        return obj.user.email.split('@')[0]


class DocumentRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating document requests (Admin only)."""
    
    class Meta:
        model = DocumentRequest
        fields = [
            'user',
            'document_type_name',
            'document_type_id',
            'comment',
        ]
    
    def create(self, validated_data):
        """Set requested_by from current user."""
        validated_data['requested_by'] = self.context['request'].user
        return super().create(validated_data)


class DocumentRequestFulfillSerializer(serializers.Serializer):
    """Serializer for fulfilling a document request."""
    document_id = serializers.IntegerField()
    
    def validate_document_id(self, value):
        """Validate document exists and belongs to the request user."""
        request = self.context.get('request')
        doc_request = self.context.get('document_request')
        
        try:
            document = Document.objects.get(id=value, owner=doc_request.user)
        except Document.DoesNotExist:
            raise serializers.ValidationError('Документ не найден или не принадлежит пользователю.')
        
        return value
