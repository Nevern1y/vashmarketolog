"""
API Views for Dictionaries (Reference Data).

Provides read-only access to:
- DocumentTypeDefinition (Appendix B)
- ApplicationStatusDefinition (Appendix A)

Endpoints:
- GET /api/v1/dictionaries/document-types/?product_type=bank_guarantee
- GET /api/v1/dictionaries/statuses/?product_type=contract_loan
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from apps.documents.models import DocumentTypeDefinition
from apps.applications.models import ApplicationStatusDefinition
from .serializers import DocumentTypeDefinitionSerializer, ApplicationStatusDefinitionSerializer


class DocumentTypeDictionaryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for document type definitions.
    
    GET /dictionaries/document-types/
    GET /dictionaries/document-types/?product_type=bank_guarantee
    GET /dictionaries/document-types/?source=agent
    """
    serializer_class = DocumentTypeDefinitionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by product_type and/or source."""
        queryset = DocumentTypeDefinition.objects.filter(is_active=True)
        
        product_type = self.request.query_params.get('product_type')
        if product_type:
            queryset = queryset.filter(product_type=product_type)
            
        source = self.request.query_params.get('source')
        if source:
            queryset = queryset.filter(source=source)
            
        return queryset.order_by('document_type_id')
    
    # Cache for 1 hour (3600 seconds) - these rarely change
    @method_decorator(cache_page(3600))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def by_product(self, request):
        """
        Get document types grouped by product.
        GET /dictionaries/document-types/by_product/
        """
        result = {}
        products = DocumentTypeDefinition.objects.filter(
            is_active=True
        ).values_list('product_type', flat=True).distinct()
        
        for product in products:
            types = DocumentTypeDefinition.objects.filter(
                product_type=product,
                is_active=True
            ).order_by('document_type_id')
            result[product] = DocumentTypeDefinitionSerializer(types, many=True).data
            
        return Response(result)


class StatusDictionaryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for application status definitions.
    
    GET /dictionaries/statuses/
    GET /dictionaries/statuses/?product_type=bank_guarantee
    GET /dictionaries/statuses/?internal_status=approved
    """
    serializer_class = ApplicationStatusDefinitionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by product_type and/or internal_status."""
        queryset = ApplicationStatusDefinition.objects.filter(is_active=True)
        
        product_type = self.request.query_params.get('product_type')
        if product_type:
            queryset = queryset.filter(product_type=product_type)
            
        internal_status = self.request.query_params.get('internal_status')
        if internal_status:
            queryset = queryset.filter(internal_status=internal_status)
            
        return queryset.order_by('order', 'status_id')
    
    # Cache for 1 hour
    @method_decorator(cache_page(3600))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def by_product(self, request):
        """
        Get statuses grouped by product.
        GET /dictionaries/statuses/by_product/
        """
        result = {}
        products = ApplicationStatusDefinition.objects.filter(
            is_active=True
        ).values_list('product_type', flat=True).distinct()
        
        for product in products:
            statuses = ApplicationStatusDefinition.objects.filter(
                product_type=product,
                is_active=True
            ).order_by('order', 'status_id')
            result[product] = ApplicationStatusDefinitionSerializer(statuses, many=True).data
            
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def funnel(self, request):
        """
        Get non-terminal statuses in order (for funnel/pipeline view).
        GET /dictionaries/statuses/funnel/?product_type=bank_guarantee
        """
        product_type = request.query_params.get('product_type', 'bank_guarantee')
        
        statuses = ApplicationStatusDefinition.objects.filter(
            product_type=product_type,
            is_active=True,
            is_terminal=False
        ).order_by('order', 'status_id')
        
        return Response(ApplicationStatusDefinitionSerializer(statuses, many=True).data)
