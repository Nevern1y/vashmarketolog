"""
Serializers for Dictionaries API.
"""
from rest_framework import serializers
from apps.documents.models import DocumentTypeDefinition
from apps.applications.models import ApplicationStatusDefinition


class DocumentTypeDefinitionSerializer(serializers.ModelSerializer):
    """
    Serializer for DocumentTypeDefinition reference data.
    Returns data needed by frontend to render document type selectors.
    """
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
        ]
        read_only_fields = fields


class ApplicationStatusDefinitionSerializer(serializers.ModelSerializer):
    """
    Serializer for ApplicationStatusDefinition reference data.
    Returns data needed by frontend to render status badges and funnels.
    """
    internal_status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = ApplicationStatusDefinition
        fields = [
            'id',
            'status_id',
            'product_type',
            'name',
            'internal_status',
            'internal_status_display',
            'order',
            'is_terminal',
        ]
        read_only_fields = fields
    
    def get_internal_status_display(self, obj):
        """Get display name for internal status."""
        status_labels = {
            'draft': 'Черновик',
            'pending': 'На рассмотрении',
            'in_review': 'В работе',
            'info_requested': 'Запрошена информация',
            'approved': 'Одобрено',
            'rejected': 'Отклонено',
            'won': 'Выигран',
            'lost': 'Проигран',
        }
        return status_labels.get(obj.internal_status, obj.internal_status)
