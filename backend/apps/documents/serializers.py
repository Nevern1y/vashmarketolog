"""
API Serializers for Document Library.
"""
from rest_framework import serializers
from .models import Document, DocumentType, DocumentStatus


class DocumentSerializer(serializers.ModelSerializer):
    """
    Full serializer for Document.
    """
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_document_type_display', read_only=True)
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
            'document_type',
            'type_display',
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
        ]

    def get_file_url(self, obj):
        """Get full URL for file."""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class DocumentUploadSerializer(serializers.ModelSerializer):
    """
    Serializer for uploading new documents.
    """
    class Meta:
        model = Document
        fields = [
            'id',  # Include in response for frontend to track uploaded document
            'name',
            'file',
            'document_type',
            'company',
        ]
        read_only_fields = ['id']  # id is auto-generated

    def validate_file(self, value):
        """Validate file size and type."""
        # Max 10MB
        max_size = 10 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError('Размер файла не должен превышать 10 МБ.')
        
        # Allowed extensions
        allowed_extensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'sig']
        ext = value.name.split('.')[-1].lower()
        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                f'Недопустимый формат файла. Разрешены: {", ".join(allowed_extensions)}'
            )
        
        return value

    def create(self, validated_data):
        """Set owner from request user."""
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class DocumentListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing documents.
    Includes file and file_url for download functionality.
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id',
            'name',
            'file',
            'file_url',
            'document_type',
            'type_display',
            'status',
            'status_display',
            'uploaded_at',
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


class DocumentVerifySerializer(serializers.Serializer):
    """
    Serializer for document verification (Admin only).
    """
    status = serializers.ChoiceField(
        choices=[
            ('verified', 'Проверен'),
            ('rejected', 'Отклонён'),
        ]
    )
    rejection_reason = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000
    )

    def validate(self, attrs):
        """Require rejection reason if status is rejected."""
        if attrs['status'] == 'rejected' and not attrs.get('rejection_reason'):
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
