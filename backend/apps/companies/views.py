"""
API Views for Company Profile management.
"""
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import CompanyProfile
from .serializers import (
    CompanyProfileSerializer,
    CompanyProfileCreateSerializer,
    CompanyProfileListSerializer,
    CRMClientSerializer,
)
from apps.users.permissions import IsAdmin, IsAgent, IsClientOrAgent, IsOwnerOrAdmin


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
        
        # Admin sees all
        if user.role == 'admin' or user.is_superuser:
            return CompanyProfile.objects.all()
        
        # Partner sees companies from assigned applications
        if user.role == 'partner':
            from apps.applications.models import Application
            assigned_company_ids = Application.objects.filter(
                assigned_partner=user
            ).values_list('company_id', flat=True)
            return CompanyProfile.objects.filter(id__in=assigned_company_ids)
        
        # Client/Agent see their own companies
        return CompanyProfile.objects.filter(owner=user)

    def get_serializer_class(self):
        if self.action == 'create':
            return CompanyProfileCreateSerializer
        if self.action == 'list':
            return CompanyProfileListSerializer
        return CompanyProfileSerializer

    def perform_create(self, serializer):
        """Set owner to current user on create."""
        serializer.save(owner=self.request.user)


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
    permission_classes = [IsAuthenticated, IsAgent]

    def get_queryset(self):
        """Return only current agent's CRM clients."""
        return CompanyProfile.objects.filter(
            owner=self.request.user,
            is_crm_client=True
        )

    def perform_create(self, serializer):
        """Set owner, is_crm_client, generate invitation token, and save email."""
        import secrets
        import logging
        
        logger = logging.getLogger(__name__)
        
        # Generate unique invitation token
        invitation_token = secrets.token_urlsafe(32)
        
        # Get email from contact_email field
        invitation_email = serializer.validated_data.get('contact_email', '')
        
        instance = serializer.save(
            owner=self.request.user,
            is_crm_client=True,
            client_status='pending',  # Статус "На рассмотрении" при создании
            invitation_token=invitation_token,
            invitation_email=invitation_email,
        )
        
        # Send invitation email to client
        if instance.invitation_email:
            try:
                from django.core.mail import send_mail
                from django.conf import settings
                
                # Get frontend URL from settings or use default
                frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
                registration_url = f"{frontend_url}/register/invited?token={invitation_token}"
                
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
                
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@lidergarant.ru'),
                    recipient_list=[instance.invitation_email],
                    fail_silently=False,
                )
                
                logger.info(f"Invitation email sent to {instance.invitation_email} for company {instance.inn}")
                
            except Exception as e:
                # Log error but don't fail the request
                logger.error(f"Failed to send invitation email to {instance.invitation_email}: {e}")

