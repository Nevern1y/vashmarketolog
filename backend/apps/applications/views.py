"""
API Views for Applications management.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django.db.models import Q
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import Application, PartnerDecision, TicketMessage, ApplicationStatus
from .serializers import (
    ApplicationSerializer,
    ApplicationCreateSerializer,
    ApplicationUpdateSerializer,
    ApplicationListSerializer,
    ApplicationAssignSerializer,
    AdminNotesSerializer,
    PartnerDecisionSerializer,
    PartnerDecisionCreateSerializer,
    TicketMessageSerializer,
    TicketMessageCreateSerializer,
)
from rest_framework.views import APIView
from apps.users.permissions import (
    IsAdmin, 
    IsClientOrAgent, 
    IsPartner,
    CanMakeDecision,
)
from apps.companies.models import CompanyProfile
from apps.documents.models import Document

User = get_user_model()


@extend_schema(tags=['Client Stats'])
class ClientStatsView(APIView):
    """
    GET /api/applications/stats/client/
    
    Returns dashboard statistics for the current client user.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Count active applications (non-terminal statuses)
        active_statuses = [
            ApplicationStatus.DRAFT,
            ApplicationStatus.PENDING,
            ApplicationStatus.IN_REVIEW,
            ApplicationStatus.INFO_REQUESTED,
        ]
        active_applications_count = Application.objects.filter(
            created_by=user,
            status__in=active_statuses
        ).count()
        
        # Count won applications (approved or won)
        won_statuses = [ApplicationStatus.APPROVED, ApplicationStatus.WON]
        won_applications_count = Application.objects.filter(
            created_by=user,
            status__in=won_statuses
        ).count()
        
        # Count user's documents
        documents_count = Document.objects.filter(owner=user).count()
        
        # Determine accreditation status based on company profile
        accreditation_status = 'not_accredited'
        try:
            company = CompanyProfile.objects.filter(owner=user, is_crm_client=False).first()
            if company:
                # Check if essential fields are filled (not empty strings)
                has_basic_info = bool(company.inn and company.inn.strip() and 
                                     company.name and company.name.strip())
                has_director = bool(company.director_name and company.director_name.strip())
                has_bank = bool(company.bank_account and company.bank_account.strip() and 
                               company.bank_bic and company.bank_bic.strip())
                
                # Check for verified documents
                has_verified_docs = Document.objects.filter(
                    owner=user, 
                    status='verified'
                ).exists()
                
                if has_basic_info and has_director and has_bank and has_verified_docs:
                    accreditation_status = 'active'
                elif has_basic_info:
                    accreditation_status = 'pending'
        except Exception:
            pass
        
        return Response({
            'active_applications_count': active_applications_count,
            'won_applications_count': won_applications_count,
            'documents_count': documents_count,
            'accreditation_status': accreditation_status,
        })


@extend_schema(tags=['Applications'])
@extend_schema_view(
    list=extend_schema(description='List applications based on user role'),
    create=extend_schema(description='Create new application'),
    retrieve=extend_schema(description='Get application details'),
    update=extend_schema(description='Update draft application'),
    partial_update=extend_schema(description='Partially update draft application'),
    destroy=extend_schema(description='Delete draft application'),
)
class ApplicationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Application CRUD operations.
    
    Role-based access:
    - CLIENT: Own applications (via created_by or company.owner)
    - AGENT: Applications for owned + CRM client companies
    - PARTNER: Only assigned applications (read-only except decision)
    - ADMIN: All applications + assignment capability
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Admin sees all
        if user.role == 'admin' or user.is_superuser:
            return Application.objects.all()
        
        # Partner sees only assigned
        if user.role == 'partner':
            return Application.objects.filter(assigned_partner=user)
        
        # Client/Agent see their own applications
        return Application.objects.filter(
            Q(created_by=user) | Q(company__owner=user)
        ).distinct()

    def get_serializer_class(self):
        if self.action == 'create':
            return ApplicationCreateSerializer
        if self.action in ['update', 'partial_update']:
            return ApplicationUpdateSerializer
        if self.action == 'list':
            return ApplicationListSerializer
        return ApplicationSerializer

    def create(self, request, *args, **kwargs):
        """Override create to add better error logging."""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"[Application Create] User: {request.user.email}, Role: {request.user.role}")
        logger.info(f"[Application Create] Payload: {request.data}")
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            logger.error(f"[Application Create] Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            self.perform_create(serializer)
        except Exception as e:
            logger.error(f"[Application Create] Exception: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        """Set creator to current user."""
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        """Only allow deleting drafts."""
        application = self.get_object()
        
        if not application.is_editable:
            return Response(
                {'error': 'Можно удалять только черновики'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().destroy(request, *args, **kwargs)

    @extend_schema(
        request=None,
        responses={200: ApplicationSerializer}
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsClientOrAgent])
    def submit(self, request, pk=None):
        """
        Submit application for review.
        POST /api/applications/{id}/submit/
        """
        application = self.get_object()
        
        if not application.can_submit:
            return Response(
                {'error': 'Заявку нельзя подать на рассмотрение'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate has required documents
        if not application.documents.exists():
            return Response(
                {'error': 'Необходимо прикрепить документы'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        application.status = ApplicationStatus.PENDING
        application.submitted_at = timezone.now()
        application.save()
        
        return Response(ApplicationSerializer(application, context={'request': request}).data)

    @extend_schema(
        request=ApplicationAssignSerializer,
        responses={200: ApplicationSerializer}
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def assign(self, request, pk=None):
        """
        Assign application to a partner (Admin only).
        POST /api/applications/{id}/assign/
        """
        application = self.get_object()
        serializer = ApplicationAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        partner_id = serializer.validated_data['partner_id']
        partner = User.objects.get(id=partner_id)
        
        application.assigned_partner = partner
        application.status = ApplicationStatus.IN_REVIEW
        application.save()
        
        return Response(ApplicationSerializer(application, context={'request': request}).data)

    @extend_schema(
        request=PartnerDecisionCreateSerializer,
        responses={200: ApplicationSerializer}
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsPartner])
    def decision(self, request, pk=None):
        """
        Submit partner decision on application.
        POST /api/applications/{id}/decision/
        
        Only the assigned partner can make decisions.
        """
        application = self.get_object()
        
        # Check if user is the assigned partner
        if application.assigned_partner != request.user:
            return Response(
                {'error': 'Вы не назначены на эту заявку'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = PartnerDecisionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create decision
        decision = PartnerDecision.objects.create(
            application=application,
            partner=request.user,
            **serializer.validated_data
        )
        
        # Update application status based on decision
        decision_type = serializer.validated_data['decision']
        if decision_type == 'approved':
            application.status = ApplicationStatus.APPROVED
        elif decision_type == 'rejected':
            application.status = ApplicationStatus.REJECTED
        elif decision_type == 'info_requested':
            application.status = ApplicationStatus.INFO_REQUESTED
        
        application.save()
        
        return Response(ApplicationSerializer(application, context={'request': request}).data)

    @extend_schema(responses={200: PartnerDecisionSerializer(many=True)})
    @action(detail=True, methods=['get'])
    def decisions(self, request, pk=None):
        """
        Get all decisions for an application.
        GET /api/applications/{id}/decisions/
        """
        application = self.get_object()
        decisions = application.decisions.all()
        serializer = PartnerDecisionSerializer(decisions, many=True)
        return Response(serializer.data)

    @extend_schema(
        request=None,
        responses={200: ApplicationSerializer}
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def request_info(self, request, pk=None):
        """
        Return application for revision (Admin only).
        POST /api/applications/{id}/request_info/
        
        Sets status to INFO_REQUESTED, allowing the agent to provide more information.
        """
        application = self.get_object()
        
        # Can only request info for pending/in_review applications
        if application.status not in [ApplicationStatus.PENDING, ApplicationStatus.IN_REVIEW]:
            return Response(
                {'error': 'Запросить информацию можно только для заявок на рассмотрении'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        application.status = ApplicationStatus.INFO_REQUESTED
        application.save()
        
        return Response(ApplicationSerializer(application, context={'request': request}).data)

    @extend_schema(
        request=None,
        responses={200: ApplicationSerializer}
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def approve(self, request, pk=None):
        """
        Approve application (Admin only).
        POST /api/applications/{id}/approve/
        
        Sets status to IN_REVIEW (ready for partner processing).
        """
        application = self.get_object()
        
        if application.status in [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED]:
            return Response(
                {'error': 'Заявка уже обработана'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        application.status = ApplicationStatus.IN_REVIEW
        application.save()
        
        return Response(ApplicationSerializer(application, context={'request': request}).data)

    @extend_schema(
        request=None,
        responses={200: ApplicationSerializer}
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def reject(self, request, pk=None):
        """
        Reject application (Admin only).
        POST /api/applications/{id}/reject/
        
        Sets status to REJECTED.
        """
        application = self.get_object()
        
        if application.status == ApplicationStatus.REJECTED:
            return Response(
                {'error': 'Заявка уже отклонена'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        application.status = ApplicationStatus.REJECTED
        application.save()
        
        return Response(ApplicationSerializer(application, context={'request': request}).data)

    @extend_schema(
        request=None,
        responses={200: ApplicationSerializer}
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def restore(self, request, pk=None):
        """
        Restore application to pending status (Admin only).
        POST /api/applications/{id}/restore/
        
        Allows to bring back rejected or info_requested applications to pending.
        """
        application = self.get_object()
        
        if application.status == ApplicationStatus.PENDING:
            return Response(
                {'error': 'Заявка уже на рассмотрении'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        application.status = ApplicationStatus.PENDING
        application.save()
        
        return Response(ApplicationSerializer(application, context={'request': request}).data)

    @extend_schema(
        request=AdminNotesSerializer,
        responses={200: ApplicationSerializer}
    )
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsAdmin])
    def save_notes(self, request, pk=None):
        """
        Save admin notes for application (Admin only).
        PATCH /api/applications/{id}/save_notes/
        
        Allows updating notes on any application regardless of status.
        """
        application = self.get_object()
        
        serializer = AdminNotesSerializer(application, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(ApplicationSerializer(application, context={'request': request}).data)


    @extend_schema(request={'multipart/form-data': {'type': 'object', 'properties': {'file': {'type': 'string', 'format': 'binary'}}}})
    @action(
        detail=True, 
        methods=['post'], 
        parser_classes=[MultiPartParser, FormParser],
        permission_classes=[IsAuthenticated, IsClientOrAgent]
    )
    def upload_signature(self, request, pk=None):
        """
        Upload digital signature file (EDS stub).
        POST /api/applications/{id}/upload_signature/
        
        This is a stub - just stores the file without crypto validation.
        """
        application = self.get_object()
        
        if 'file' not in request.FILES:
            return Response(
                {'error': 'Файл подписи не предоставлен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        file = request.FILES['file']
        
        # Validate file extension
        if not file.name.endswith('.sig'):
            return Response(
                {'error': 'Файл должен иметь расширение .sig'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Save signature file
        application.signature_file = file
        application.has_signature = True
        application.save()
        
        return Response({
            'message': 'ЭЦП успешно загружена',
            'has_signature': True
        })


@extend_schema(tags=['Partner Decisions'])
class PartnerDecisionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing partner decisions.
    """
    serializer_class = PartnerDecisionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Admin sees all
        if user.role == 'admin' or user.is_superuser:
            return PartnerDecision.objects.all()
        
        # Partner sees own decisions
        if user.role == 'partner':
            return PartnerDecision.objects.filter(partner=user)
        
        # Client/Agent see decisions on their applications
        return PartnerDecision.objects.filter(
            Q(application__created_by=user) | Q(application__company__owner=user)
        ).distinct()


@extend_schema(tags=['Chat Messages'])
class TicketMessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for chat messages within applications.
    
    Uses REST API + Polling for MVP (WebSocket deferred to Phase 2).
    Supports file uploads via multipart/form-data.
    
    Role-based access:
    - ADMIN: All messages in all applications
    - AGENT/CLIENT: Messages in own applications (created_by or company.owner)
    - PARTNER: Messages only in assigned applications
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    http_method_names = ['get', 'post', 'head', 'options']  # No delete/update

    def get_queryset(self):
        user = self.request.user
        
        # First filter by application_id from URL if nested
        application_id = self.kwargs.get('application_pk') or self.request.query_params.get('application_id')
        base_qs = TicketMessage.objects.all()
        
        if application_id:
            base_qs = base_qs.filter(application_id=application_id)
        
        # Apply role-based filtering
        if user.role == 'admin' or user.is_superuser or user.is_staff:
            return base_qs
        
        if user.role == 'partner':
            # Partner only sees messages in applications assigned to them
            return base_qs.filter(application__assigned_partner=user)
        
        # Client/Agent see messages in their own applications
        return base_qs.filter(
            Q(application__created_by=user) | Q(application__company__owner=user)
        ).distinct()

    def get_serializer_class(self):
        if self.action == 'create':
            return TicketMessageCreateSerializer
        return TicketMessageSerializer

    def create(self, request, *args, **kwargs):
        """Create a new message in the application."""
        application_id = self.kwargs.get('application_pk')
        
        if not application_id:
            return Response(
                {'error': 'Не указана заявка'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check user has access to this application
        try:
            application = self._get_accessible_application(application_id)
        except Application.DoesNotExist:
            return Response(
                {'error': 'Заявка не найдена или недоступна'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create message with sender and application
        message = TicketMessage.objects.create(
            application=application,
            sender=request.user,
            content=serializer.validated_data.get('content', ''),
            file=serializer.validated_data.get('file'),
        )
        
        return Response(
            TicketMessageSerializer(message, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    def _get_accessible_application(self, application_id):
        """Get application if user has access."""
        user = self.request.user
        
        if user.role == 'admin' or user.is_superuser or user.is_staff:
            return Application.objects.get(id=application_id)
        
        if user.role == 'partner':
            return Application.objects.get(
                id=application_id,
                assigned_partner=user
            )
        
        # Client/Agent
        return Application.objects.get(
            Q(id=application_id) & (
                Q(created_by=user) | Q(company__owner=user)
            )
        )
