"""
API Views for Document Library management.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import Document
from .serializers import (
    DocumentSerializer,
    DocumentUploadSerializer,
    DocumentListSerializer,
    DocumentVerifySerializer,
)
from apps.users.permissions import IsAdmin, IsOwner, IsOwnerOrAdmin


@extend_schema(tags=['Documents'])
@extend_schema_view(
    list=extend_schema(description='List user documents'),
    create=extend_schema(description='Upload new document'),
    retrieve=extend_schema(description='Get document details'),
    destroy=extend_schema(description='Delete document'),
)
class DocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Document Library CRUD operations.
    
    Role-based access:
    - CLIENT/AGENT: Own documents only
    - PARTNER: Read-only access to documents in assigned applications
    - ADMIN: Full access to all documents
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        
        # Admin sees all
        if user.role == 'admin' or user.is_superuser:
            return Document.objects.all()
        
        # Partner sees documents from assigned applications
        if user.role == 'partner':
            from apps.applications.models import Application
            assigned_apps = Application.objects.filter(assigned_partner=user)
            document_ids = set()
            for app in assigned_apps:
                document_ids.update(app.documents.values_list('id', flat=True))
            return Document.objects.filter(id__in=document_ids)
        
        # Client/Agent see their own documents
        return Document.objects.filter(owner=user)

    def get_serializer_class(self):
        if self.action == 'create':
            return DocumentUploadSerializer
        if self.action == 'list':
            return DocumentListSerializer
        return DocumentSerializer

    def perform_create(self, serializer):
        """Set owner to current user on upload."""
        serializer.save(owner=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """Only owner or admin can delete."""
        document = self.get_object()
        user = request.user
        
        if document.owner != user and not (user.role == 'admin' or user.is_superuser):
            return Response(
                {'error': 'Вы не можете удалить этот документ'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Delete file from storage
        if document.file:
            document.file.delete(save=False)
        
        return super().destroy(request, *args, **kwargs)

    @extend_schema(
        request=DocumentVerifySerializer,
        responses={200: DocumentSerializer}
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def verify(self, request, pk=None):
        """
        Verify or reject document (Admin only).
        POST /api/documents/{id}/verify/
        """
        document = self.get_object()
        serializer = DocumentVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        document.status = serializer.validated_data['status']
        document.verified_at = timezone.now()
        document.verified_by = request.user
        
        if serializer.validated_data['status'] == 'rejected':
            document.rejection_reason = serializer.validated_data.get('rejection_reason', '')
        else:
            document.rejection_reason = ''
        
        document.save()
        
        return Response(DocumentSerializer(document, context={'request': request}).data)

    @extend_schema(responses={200: DocumentListSerializer(many=True)})
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """
        Get documents grouped by type.
        GET /api/documents/by_type/?type=constituent
        """
        doc_type = request.query_params.get('type')
        queryset = self.get_queryset()
        
        if doc_type:
            queryset = queryset.filter(document_type=doc_type)
        
        serializer = DocumentListSerializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(responses={200: DocumentListSerializer(many=True)})
    @action(detail=False, methods=['get'])
    def verified(self, request):
        """
        Get only verified documents (for application attachment).
        GET /api/documents/verified/
        """
        queryset = self.get_queryset().filter(status='verified')
        serializer = DocumentListSerializer(queryset, many=True)
        return Response(serializer.data)
