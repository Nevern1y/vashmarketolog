"""
API Views for Company Profile management.
"""
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.db.models import Q
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter

from .models import CompanyProfile
from .serializers import (
    CompanyProfileSerializer,
    CompanyProfileCreateSerializer,
    CompanyProfileListSerializer,
    CRMClientSerializer,
    AdminDirectClientSerializer,
)
from apps.users.permissions import IsAdmin, IsAgent, IsClientOrAgent, IsOwnerOrAdmin, IsAgentOrAdmin


@extend_schema(tags=['Companies'])
@extend_schema_view(
    list=extend_schema(description='List companies based on user role'),
    create=extend_schema(description='Create a new company profile'),
    retrieve=extend_schema(description='Get company details'),
    update=extend_schema(description='Update company profile'),
    partial_update=extend_schema(description='Partially update company profile'),
    destroy=extend_schema(description='Delete company profile'),
)
class CompanyProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Company Profile CRUD operations.
    
    Role-based access:
    - CLIENT: Own company only (is_crm_client=False)
    - AGENT: Own company + CRM clients
    - PARTNER: Read-only access to companies in assigned applications
    - ADMIN: Full access to all companies
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Admin sees all (including inactive)
        if user.role == 'admin' or user.is_superuser:
            return CompanyProfile.objects.all()

        # Partner sees companies from assigned applications
        if user.role == 'partner':
            from apps.applications.models import Application
            assigned_company_ids = Application.objects.filter(
                assigned_partner=user
            ).values_list('company_id', flat=True)
            return CompanyProfile.objects.filter(id__in=assigned_company_ids)

        # Client/Agent see their own active companies only
        return CompanyProfile.objects.filter(owner=user, is_active=True)

    def get_serializer_class(self):
        if self.action == 'create':
            return CompanyProfileCreateSerializer
        if self.action == 'list':
            return CompanyProfileListSerializer
        return CompanyProfileSerializer

    def perform_create(self, serializer):
        """Set owner to current user on create."""
        serializer.save(owner=self.request.user)

    @extend_schema(
        description='Get list of CRM clients for an agent (for admin viewing agent\'s clients)',
        responses={200: CompanyProfileListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def agent_clients(self, request):
        """
        Get CRM clients belonging to an agent.
        
        GET /api/companies/agent_clients/
        GET /api/companies/agent_clients/?agent_id=123 (admin only)
        
        For agents: returns their own CRM clients
        For admins: can specify agent_id to view a specific agent's clients
        """
        user = request.user
        agent_id = request.query_params.get('agent_id')
        
        # If admin and agent_id provided - view that agent's clients
        if (user.role == 'admin' or user.is_superuser) and agent_id:
            queryset = CompanyProfile.objects.filter(
                owner_id=agent_id,
                is_crm_client=True
            )
        elif user.role in ['agent', 'admin'] or user.is_superuser:
            # Agent views their own clients
            queryset = CompanyProfile.objects.filter(
                owner=user,
                is_crm_client=True
            )
        else:
            return Response(
                {'error': 'Доступ запрещён'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = CompanyProfileListSerializer(queryset, many=True)
        return Response(serializer.data)


@extend_schema(tags=['Companies'])
class MyCompanyView(generics.RetrieveUpdateAPIView):
    """
    Get or update current user's own company profile.
    GET /api/companies/me/
    PATCH /api/companies/me/
    
    For CLIENT: Returns their company (is_crm_client=False)
    For AGENT: Returns their own company (not CRM clients)
    """
    permission_classes = [IsAuthenticated, IsClientOrAgent]
    serializer_class = CompanyProfileSerializer

    def get_object(self):
        """Get or create user's own company profile.
        
        Uses filter().first() to handle edge case of duplicate records,
        then creates if none exist.
        """
        user = self.request.user
        
        # First try to get existing company
        company = CompanyProfile.objects.filter(
            owner=user,
            is_crm_client=False
        ).first()
        
        # If no company exists, create one
        if company is None:
            company = CompanyProfile.objects.create(
                owner=user,
                is_crm_client=False,
                inn='',
                name='',
            )
        
        return company


@extend_schema(tags=['CRM - Agent Clients'])
@extend_schema_view(
    list=extend_schema(description='List agent CRM clients'),
    create=extend_schema(description='Add new CRM client'),
    retrieve=extend_schema(description='Get CRM client details'),
    update=extend_schema(description='Update CRM client'),
    partial_update=extend_schema(description='Partially update CRM client'),
    destroy=extend_schema(description='Remove CRM client'),
)
class CRMClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Agent's CRM clients management.
    
    Only available for AGENT role.
    All created companies will have is_crm_client=True.
    """
    serializer_class = CRMClientSerializer
    permission_classes = [IsAuthenticated, IsAgentOrAdmin]

    def get_queryset(self):
        """Return CRM clients for agent or all for admin."""
        user = self.request.user
        if user.role == 'admin' or user.is_superuser:
            return CompanyProfile.objects.filter(is_crm_client=True)
        return CompanyProfile.objects.filter(
            owner=user,
            is_crm_client=True,
            is_active=True,
        )

    def perform_create(self, serializer):
        """Set owner, is_crm_client, generate invitation token, and save email.
        
        TEST MODE: If 'password' is provided in request data AND DEBUG=True,
        create a User directly instead of sending invitation email.
        This is ONLY available in development environment for testing.
        
        SECURITY: In production (DEBUG=False), the password parameter is ignored.
        """
        import secrets
        import logging
        from django.contrib.auth import get_user_model
        from django.conf import settings
        
        User = get_user_model()
        logger = logging.getLogger(__name__)
        
        # Generate unique invitation token
        invitation_token = secrets.token_urlsafe(32)
        
        # Get email from contact_email field
        invitation_email = serializer.validated_data.get('contact_email', '')
        
        # Check if password is provided (TEST MODE - only in DEBUG)
        # SECURITY: Only allow test-mode user creation in development
        password = None
        if settings.DEBUG:
            password = self.request.data.get('password', None)
        elif self.request.data.get('password'):
            logger.warning(f"[SECURITY] Test-mode password provided in production for {invitation_email} - IGNORED")
        
        instance = serializer.save(
            owner=self.request.user,
            is_crm_client=True,
            client_status='pending',  # Статус "На рассмотрении" при создании
            invitation_token=invitation_token,
            invitation_email=invitation_email,
        )
        
        # TEST MODE: Create user directly with password
        if password and invitation_email:
            try:
                # Check if user already exists
                if not User.objects.filter(email=invitation_email).exists():
                    # Create new user with provided password
                    new_user = User.objects.create_user(
                        email=invitation_email,
                        password=password,
                        role='client',
                        first_name=serializer.validated_data.get('contact_person', '').split()[0] if serializer.validated_data.get('contact_person') else '',
                        last_name=' '.join(serializer.validated_data.get('contact_person', '').split()[1:]) if serializer.validated_data.get('contact_person') else '',
                        is_active=True,
                    )
                    
                    # DO NOT change owner! Agent must remain as owner for CRM visibility
                    # Status remains "pending" - admin will set to "confirmed" after verification
                    # instance.client_status = 'confirmed'  # REMOVED: Admin sets this
                    
                    logger.info(f"[TEST MODE] Created user {invitation_email} with password for company {instance.inn}")
                else:
                    logger.warning(f"[TEST MODE] User {invitation_email} already exists, skipping user creation")
                    
            except Exception as e:
                logger.error(f"[TEST MODE] Failed to create user {invitation_email}: {e}")
                # Don't fail the request, company is still created
                
            return  # Skip email sending in test mode
        
        # Normal mode: Send invitation email to client
        if instance.invitation_email:
            try:
                from django.conf import settings
                from apps.notifications.email_service import send_reliable_email
                
                # Get frontend URL from settings or use default
                frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
                registration_url = f"{frontend_url}/register/invited/{invitation_token}"
                
                # Get agent name for personalized message
                agent_name = self.request.user.first_name or self.request.user.email
                company_name = instance.name or instance.short_name or 'Новая компания'
                
                subject = 'Приглашение в систему Лидер Гарант'
                message = f'''Здравствуйте!

Агент {agent_name} приглашает вас в систему Лидер Гарант.

Компания: {company_name}
ИНН: {instance.inn}

Для завершения регистрации перейдите по ссылке:
{registration_url}

После регистрации и прохождения аккредитации вы сможете подавать заявки на финансовые продукты.

С уважением,
Команда Лидер Гарант
'''

                dispatch = send_reliable_email(
                    subject=subject,
                    message=message,
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@lider-garant.ru'),
                    recipient_list=[instance.invitation_email],
                    event_type='crm_client_invite',
                    metadata={
                        'company_id': instance.id,
                        'company_inn': instance.inn,
                        'agent_id': self.request.user.id,
                    },
                )

                logger.info(
                    "CRM invite email dispatch status sent=%s queued=%s outbox_id=%s recipient=%s",
                    dispatch.sent,
                    dispatch.queued,
                    dispatch.outbox_id,
                    instance.invitation_email,
                )
                
            except Exception as e:
                # Log error but don't fail the request
                logger.error(f"Failed to send invitation email to {instance.invitation_email}: {e}")


@extend_schema(tags=['Admin - CRM Clients'])
@extend_schema_view(
    list=extend_schema(description='List all CRM clients from all agents (Admin only)'),
    retrieve=extend_schema(description='Get CRM client details'),
)
class AdminCRMClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Admin to manage all CRM clients from all agents.
    
    Admin can:
    - View all CRM clients with their status and agent info
    - Confirm or reject clients
    - Check for INN duplicates
    """
    serializer_class = CRMClientSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = None  # Frontend expects full list without pagination

    def get_queryset(self):
        """Return all CRM clients from all agents (including inactive)."""
        return CompanyProfile.objects.filter(is_crm_client=True).select_related('owner')

    def get_serializer_class(self):
        from .serializers import AdminCRMClientSerializer
        if self.action in ['update', 'partial_update']:
            return CompanyProfileSerializer
        return AdminCRMClientSerializer

    def perform_update(self, serializer):
        serializer.save(is_crm_client=True)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_active:
            return Response(
                {'error': 'Сначала заблокируйте клиента'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if instance.applications.exists():
            return Response(
                {'error': 'Нельзя удалить клиента с существующими заявками'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def block(self, request, pk=None):
        company = self.get_object()
        company.is_active = False
        company.save(update_fields=['is_active'])
        from .serializers import AdminCRMClientSerializer
        return Response(AdminCRMClientSerializer(company).data)

    @action(detail=True, methods=['post'])
    def unblock(self, request, pk=None):
        company = self.get_object()
        company.is_active = True
        company.save(update_fields=['is_active'])
        from .serializers import AdminCRMClientSerializer
        return Response(AdminCRMClientSerializer(company).data)

    @extend_schema(
        request=None,
        responses={200: CRMClientSerializer}
    )
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """
        Confirm CRM client (set status to 'confirmed').
        POST /api/admin/crm-clients/{id}/confirm/
        
        Admin verifies that:\n        1. Company is not already assigned to another agent
        2. Client data is valid
        """
        company = self.get_object()
        
        if company.client_status == 'confirmed':
            return Response(
                {'error': 'Клиент уже закреплён'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Re-fetch with row lock inside transaction
            company = CompanyProfile.objects.select_for_update().get(pk=company.pk)
            
            if company.client_status == 'confirmed':
                return Response(
                    {'error': 'Клиент уже закреплён'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check for INN duplicates with other agents
            if company.inn:
                duplicates = CompanyProfile.objects.filter(
                    inn=company.inn,
                    is_crm_client=True,
                    client_status='confirmed'
                ).exclude(id=company.id)
                
                if duplicates.exists():
                    other_agents = ', '.join([d.owner.email for d in duplicates])
                    return Response(
                        {'error': f'Компания с таким ИНН уже закреплена за агентом: {other_agents}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            company.client_status = 'confirmed'
            company.save()
        
        from .serializers import AdminCRMClientSerializer
        return Response(AdminCRMClientSerializer(company).data)

    @extend_schema(
        request=None,
        responses={200: CRMClientSerializer}
    )
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Reject CRM client (set status back to 'pending' or delete).
        POST /api/admin/crm-clients/{id}/reject/
        """
        company = self.get_object()
        
        company.client_status = 'pending'
        company.save()
        
        from .serializers import AdminCRMClientSerializer
        return Response(AdminCRMClientSerializer(company).data)

    @extend_schema(
        responses={200: {'type': 'object', 'properties': {
            'has_duplicates': {'type': 'boolean'},
            'duplicates': {'type': 'array', 'items': {'type': 'object'}}
        }}}
    )
    @action(detail=True, methods=['get'])
    def check_duplicates(self, request, pk=None):
        """
        Check if company INN is already assigned to another agent.
        GET /api/admin/crm-clients/{id}/check_duplicates/
        """
        company = self.get_object()
        
        if not company.inn:
            return Response({
                'has_duplicates': False,
                'duplicates': [],
                'message': 'ИНН не указан'
            })
        
        duplicates = CompanyProfile.objects.filter(
            inn=company.inn,
            is_crm_client=True
        ).exclude(id=company.id).select_related('owner')
        
        from .serializers import AdminCRMClientSerializer
        return Response({
            'has_duplicates': duplicates.exists(),
            'duplicates': AdminCRMClientSerializer(duplicates, many=True).data
        })


@extend_schema(tags=['Admin - Direct Clients'])
@extend_schema_view(
    list=extend_schema(description='List all direct clients (registered without agent)'),
    retrieve=extend_schema(description='Get direct client details'),
)
class AdminDirectClientsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Admin to view all direct clients (is_crm_client=False).
    
    These are clients who registered directly, not through an agent.
    Admin can only view these clients (read-only).
    """
    serializer_class = AdminDirectClientSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = None  # Frontend expects full list without pagination

    def get_queryset(self):
        """Return all direct clients (not CRM clients), including inactive."""
        return CompanyProfile.objects.filter(is_crm_client=False).select_related('owner')

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return CompanyProfileSerializer
        return AdminDirectClientSerializer

    def perform_update(self, serializer):
        serializer.save(is_crm_client=False)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_active:
            return Response(
                {'error': 'Сначала заблокируйте клиента'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if instance.applications.exists():
            return Response(
                {'error': 'Нельзя удалить клиента с существующими заявками'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if instance.owner and instance.owner.is_active:
            return Response(
                {'error': 'Сначала заблокируйте аккаунт клиента'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def block(self, request, pk=None):
        company = self.get_object()
        with transaction.atomic():
            company = CompanyProfile.objects.select_for_update().get(pk=company.pk)
            company.is_active = False
            company.save(update_fields=['is_active'])
            if company.owner:
                company.owner.is_active = False
                company.owner.save(update_fields=['is_active'])
        return Response(AdminDirectClientSerializer(company).data)

    @action(detail=True, methods=['post'])
    def unblock(self, request, pk=None):
        company = self.get_object()
        with transaction.atomic():
            company = CompanyProfile.objects.select_for_update().get(pk=company.pk)
            company.is_active = True
            company.save(update_fields=['is_active'])
            if company.owner:
                company.owner.is_active = True
                company.owner.save(update_fields=['is_active'])
        return Response(AdminDirectClientSerializer(company).data)
