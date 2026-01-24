"""
API Views for Document Library management.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter

from .models import Document, DocumentRequest, DocumentRequestStatus
from .serializers import (
    DocumentSerializer,
    DocumentUploadSerializer,
    DocumentListSerializer,
    DocumentRequestSerializer,
    DocumentRequestCreateSerializer,
    DocumentRequestFulfillSerializer,
)
from apps.users.permissions import IsAdmin


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
    parser_classes = [MultiPartParser, FormParser, JSONParser]


    def get_queryset(self):
        user = self.request.user
        
        # Admin sees all (with optional user_id filter)
        if user.role == 'admin' or user.is_superuser:
            qs = Document.objects.all()
            # Filter by user_id if provided
            user_id = self.request.query_params.get('user_id')
            if user_id:
                qs = qs.filter(owner_id=user_id)
        elif user.role == 'partner':
            # Partner sees documents from assigned applications
            from apps.applications.models import Application
            assigned_apps = Application.objects.filter(assigned_partner=user)
            document_ids = set()
            for app in assigned_apps:
                document_ids.update(app.documents.values_list('id', flat=True))
            qs = Document.objects.filter(id__in=document_ids)
        else:
            # Client/Agent see their own documents
            qs = Document.objects.filter(owner=user)
        
        # Apply filters from query params
        document_type_id = self.request.query_params.get('document_type_id')
        if document_type_id:
            qs = qs.filter(document_type_id=document_type_id)
        
        product_type = self.request.query_params.get('product_type')
        if product_type:
            qs = qs.filter(product_type=product_type)
        
        doc_status = self.request.query_params.get('status')
        if doc_status:
            qs = qs.filter(status=doc_status)
        
        company_id = self.request.query_params.get('company')
        if company_id:
            qs = qs.filter(company_id=company_id)
        
        # include_unassigned: show documents not attached to any application
        include_unassigned = self.request.query_params.get('includeUnassigned')
        if include_unassigned == 'true':
            qs = qs.filter(applications__isnull=True)
        
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return DocumentUploadSerializer
        if self.action in ['list', 'by_type', 'verified', 'by_user']:
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

    @extend_schema(responses={200: DocumentListSerializer(many=True)})
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """
        Get documents grouped by type.
        GET /api/documents/by_type/?document_type_id=1
        """
        doc_type_id = request.query_params.get('document_type_id') or request.query_params.get('type')
        queryset = self.get_queryset()
        
        if doc_type_id:
            queryset = queryset.filter(document_type_id=doc_type_id)
        
        serializer = DocumentListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    @extend_schema(responses={200: DocumentListSerializer(many=True)})
    @action(detail=False, methods=['get'])
    def verified(self, request):
        """
        Get documents for application attachment.
        Verification is disabled, so return all documents.
        GET /api/documents/verified/
        """
        queryset = self.get_queryset()
        serializer = DocumentListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    @extend_schema(
        parameters=[
            OpenApiParameter(name='user_id', type=int, description='Filter documents by user ID (admin only)')
        ],
        responses={200: DocumentListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsAdmin])
    def by_user(self, request):
        """
        Get documents for a specific user (Admin only).
        GET /api/documents/by_user/?user_id=123
        """
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        queryset = Document.objects.filter(owner_id=user_id)
        serializer = DocumentListSerializer(queryset, many=True, context={'request': request})
        
        # Calculate stats by status
        total = queryset.count()
        pending = queryset.filter(status='pending').count()
        verified = queryset.filter(status='verified').count()
        rejected = queryset.filter(status='rejected').count()
        
        return Response({
            'documents': serializer.data,
            'stats': {
                'total': total,
                'pending': pending,
                'verified': verified,
                'rejected': rejected,
            }
        })

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='agent_id',
                type=int,
                description='Agent user ID (for admin to view specific agent\'s clients)',
                required=False
            ),
            OpenApiParameter(
                name='client_id',
                type=int,
                description='Filter by specific CRM client company ID',
                required=False
            ),
        ],
        responses={200: DocumentListSerializer(many=True)},
        description='Get documents from agent\'s CRM clients'
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def by_clients(self, request):
        """
        Get documents from agent's CRM clients.
        
        GET /api/documents/by_clients/
        GET /api/documents/by_clients/?agent_id=123 (admin only)
        GET /api/documents/by_clients/?client_id=456
        
        For agents: returns documents from their CRM clients (is_crm_client=True, owner=agent)
        For admins: can specify agent_id to view documents of a specific agent's clients
        """
        from apps.companies.models import CompanyProfile
        
        user = request.user
        agent_id = request.query_params.get('agent_id')
        
        # If admin and agent_id provided - view that agent's clients
        if (user.role == 'admin' or user.is_superuser) and agent_id:
            crm_companies = CompanyProfile.objects.filter(
                owner_id=agent_id,
                is_crm_client=True
            )
        else:
            # Otherwise - current user's CRM clients
            crm_companies = CompanyProfile.objects.filter(
                owner=user,
                is_crm_client=True
            )
        
        # Optional filter by specific client
        client_id = request.query_params.get('client_id')
        if client_id:
            crm_companies = crm_companies.filter(id=client_id)
        
        # Get documents linked to these companies
        queryset = Document.objects.filter(
            company__in=crm_companies
        ).select_related('owner', 'company').order_by('-uploaded_at')
        
        serializer = DocumentListSerializer(
            queryset,
            many=True,
            context={'request': request}
        )
        
        return Response(serializer.data)



@extend_schema(tags=['Document Requests'])
@extend_schema_view(
    list=extend_schema(description='List document requests'),
    create=extend_schema(description='Create document request (Admin only)'),
    retrieve=extend_schema(description='Get document request details'),
)
class DocumentRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Document Requests (Admin -> Agent/Client).
    
    Admins can request specific documents from agents/clients.
    Users see requests addressed to them as notifications.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin sees all requests
        if user.role == 'admin' or user.is_superuser:
            qs = DocumentRequest.objects.all()
            # Filter by user_id if provided
            user_id = self.request.query_params.get('user_id')
            if user_id:
                qs = qs.filter(user_id=user_id)
            return qs
        
        # Regular users see only requests addressed to them
        return DocumentRequest.objects.filter(user=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DocumentRequestCreateSerializer
        return DocumentRequestSerializer
    
    def create(self, request, *args, **kwargs):
        """Only admins can create document requests."""
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response(
                {'error': 'Только администратор может запрашивать документы'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    @extend_schema(responses={200: DocumentRequestSerializer})
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """
        Mark document request as read.
        POST /api/document-requests/{id}/mark_read/
        """
        doc_request = self.get_object()
        doc_request.is_read = True
        doc_request.save()
        return Response(DocumentRequestSerializer(doc_request, context={'request': request}).data)
    
    @extend_schema(
        request=DocumentRequestFulfillSerializer,
        responses={200: DocumentRequestSerializer}
    )
    @action(detail=True, methods=['post'])
    def fulfill(self, request, pk=None):
        """
        Fulfill document request by providing a document.
        POST /api/document-requests/{id}/fulfill/
        """
        doc_request = self.get_object()
        
        # Check permission
        if doc_request.user != request.user and not (request.user.role == 'admin' or request.user.is_superuser):
            return Response(
                {'error': 'Вы не можете выполнить этот запрос'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = DocumentRequestFulfillSerializer(
            data=request.data,
            context={'request': request, 'document_request': doc_request}
        )
        serializer.is_valid(raise_exception=True)
        
        # Update request
        doc_request.fulfilled_document_id = serializer.validated_data['document_id']
        doc_request.status = DocumentRequestStatus.FULFILLED
        doc_request.fulfilled_at = timezone.now()
        doc_request.save()
        
        return Response(DocumentRequestSerializer(doc_request, context={'request': request}).data)
    
    @extend_schema(responses={200: DocumentRequestSerializer})
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def cancel(self, request, pk=None):
        """
        Cancel document request (Admin only).
        POST /api/document-requests/{id}/cancel/
        """
        doc_request = self.get_object()
        doc_request.status = DocumentRequestStatus.CANCELLED
        doc_request.save()
        return Response(DocumentRequestSerializer(doc_request, context={'request': request}).data)
    
    @extend_schema(responses={200: dict})
    @action(detail=False, methods=['get'])
    def pending_count(self, request):
        """
        Get count of pending document requests for current user.
        GET /api/document-requests/pending_count/
        """
        user = request.user
        
        if user.role == 'admin' or user.is_superuser:
            # Admin sees all pending requests
            count = DocumentRequest.objects.filter(status=DocumentRequestStatus.PENDING).count()
        else:
            # User sees only their pending requests
            count = DocumentRequest.objects.filter(
                user=user,
                status=DocumentRequestStatus.PENDING,
                is_read=False
            ).count()
        
        return Response({'pending_count': count})
