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

from .models import Application, PartnerDecision, ApplicationStatus
from .serializers import (
    ApplicationSerializer,
    ApplicationCreateSerializer,
    ApplicationUpdateSerializer,
    ApplicationListSerializer,
    ApplicationAssignSerializer,
    PartnerDecisionSerializer,
    PartnerDecisionCreateSerializer,
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

    def perform_create(self, serializer):
        """Set creator to current user."""
        serializer.save(created_by=self.request.user)

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
