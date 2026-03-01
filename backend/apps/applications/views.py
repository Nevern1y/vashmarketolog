"""
API Views for Applications management.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django.db.models import Q, Count, Case, When, IntegerField
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import Application, PartnerDecision, TicketMessage, ApplicationStatus, CalculationSession
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
    CalculationSessionSerializer,
    CalculationSessionCreateSerializer,
    ChatThreadSerializer,
)
from rest_framework.views import APIView
from apps.users.permissions import (
    IsAdmin, 
    IsClientOrAgent,
    IsAgentOrAdmin,
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
        
        # Build base query for applications
        app_query = Q(created_by=user)
        
        # If client, include applications for CRM companies with matching INN
        if user.role == 'client':
            client_company = CompanyProfile.objects.filter(
                owner=user,
                is_crm_client=False
            ).first()
            
            if client_company and client_company.inn:
                crm_companies_with_same_inn = CompanyProfile.objects.filter(
                    is_crm_client=True,
                    inn=client_company.inn
                ).values_list('id', flat=True)
                
                if crm_companies_with_same_inn:
                    app_query = app_query | Q(company_id__in=crm_companies_with_same_inn)
        
        # Count active and won applications in single query using conditional aggregation
        active_statuses = [
            ApplicationStatus.DRAFT,
            ApplicationStatus.PENDING,
            ApplicationStatus.IN_REVIEW,
            ApplicationStatus.INFO_REQUESTED,
        ]
        won_statuses = [ApplicationStatus.APPROVED, ApplicationStatus.WON]
        
        # Single query with conditional counts (avoids 2 separate queries)
        stats = Application.objects.filter(app_query).distinct().aggregate(
            active_count=Count(
                Case(When(status__in=active_statuses, then=1), output_field=IntegerField())
            ),
            won_count=Count(
                Case(When(status__in=won_statuses, then=1), output_field=IntegerField())
            )
        )
        active_applications_count = stats['active_count'] or 0
        won_applications_count = stats['won_count'] or 0
        
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
                
                # Check for any uploaded documents (verification disabled)
                has_documents = Document.objects.filter(owner=user).exists()

                if has_basic_info and has_director and has_bank and has_documents:
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
        
        # Base select_related for optimized queries (avoid N+1)
        base_select = ['company', 'created_by', 'assigned_partner']
        
        # Admin sees all
        if user.role == 'admin' or user.is_superuser:
            queryset = Application.objects.select_related(*base_select).prefetch_related('documents').all()
        # Partner sees only assigned
        elif user.role == 'partner':
            queryset = Application.objects.select_related(*base_select).prefetch_related('documents').filter(assigned_partner=user)
        else:
            # Client/Agent base query: their own applications
            base_query = Q(created_by=user) | Q(company__owner=user)

            # Special case: Client should see applications from their inviting agent
            if user.role == 'client':
                # Option 1: If client was invited by an agent, show agent's applications for them
                if user.invited_by and user.invited_by.role == 'agent':
                    # Show applications created by the agent for companies with matching INN
                    client_company = CompanyProfile.objects.filter(
                        owner=user,
                        is_crm_client=False
                    ).first()

                    if client_company and client_company.inn:
                        # Applications created by inviting agent for companies with this INN
                        base_query = base_query | Q(
                            created_by=user.invited_by,
                            company__inn=client_company.inn
                        )

                # Option 2: Also check for any CRM companies with matching INN
                client_company = CompanyProfile.objects.filter(
                    owner=user,
                    is_crm_client=False
                ).first()

                if client_company and client_company.inn:
                    crm_companies_with_same_inn = CompanyProfile.objects.filter(
                        is_crm_client=True,
                        inn=client_company.inn
                    ).values_list('id', flat=True)

                    if crm_companies_with_same_inn:
                        base_query = base_query | Q(company_id__in=crm_companies_with_same_inn)

            queryset = Application.objects.filter(base_query).select_related(*base_select).prefetch_related('documents').distinct()

        created_by_param = self.request.query_params.get('created_by') or self.request.query_params.get('agent_id')
        if created_by_param:
            try:
                created_by_id = int(created_by_param)
                queryset = queryset.filter(created_by_id=created_by_id)
            except (TypeError, ValueError):
                pass

        calculation_session_param = self.request.query_params.get('calculation_session')
        if calculation_session_param:
            try:
                session_id = int(calculation_session_param)
                queryset = queryset.filter(calculation_session_id=session_id)
            except (TypeError, ValueError):
                pass

        return queryset

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
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            logger.error(f"[Application Create] Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            self.perform_create(serializer)
            logger.info(f"[Application Create] Success. ID: {serializer.instance.id}")
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

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        updated = serializer.instance

        return Response(ApplicationSerializer(updated, context={'request': request}).data)

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
        
        # Determine target status based on current status
        if application.status == ApplicationStatus.INFO_REQUESTED:
            # Resubmission after revision - skip scoring, go directly to review
            application.status = ApplicationStatus.IN_REVIEW
            # Clear the info request message since revision is complete
            application.info_request_message = ''
        else:
            # Initial submission from draft - go to scoring
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
        request={'application/json': {'type': 'object', 'properties': {'message': {'type': 'string'}}}},
        responses={200: ApplicationSerializer}
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def request_info(self, request, pk=None):
        """
        Return application for revision (Admin only).
        POST /api/applications/{id}/request_info/
        
        Body: {"message": "Please provide additional documents..."}
        
        Sets status to INFO_REQUESTED, allowing the agent to provide more information.
        """
        application = self.get_object()
        
        # Can only request info for pending/in_review applications
        if application.status not in [ApplicationStatus.PENDING, ApplicationStatus.IN_REVIEW]:
            return Response(
                {'error': 'Вернуть на доработку можно только для заявок на рассмотрении'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Save message if provided
        message = request.data.get('message', '')
        if message:
            application.info_request_message = message
        
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
        
        Sets status to APPROVED.
        """
        application = self.get_object()
        
        if application.status == ApplicationStatus.APPROVED:
            return Response(
                {'error': 'Заявка уже одобрена'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        application.status = ApplicationStatus.APPROVED
        application.save()
        
        return Response(ApplicationSerializer(application, context={'request': request}).data)

    @extend_schema(
        request=None,
        responses={200: ApplicationSerializer}
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def mark_issued(self, request, pk=None):
        """
        Mark application as issued (Admin only).
        POST /api/applications/{id}/mark_issued/
        
        Sets status to WON ("Выдан").
        """
        application = self.get_object()

        if application.status != ApplicationStatus.APPROVED:
            return Response(
                {'error': 'Отметить как выданную можно только после статуса «Одобрен»'},
                status=status.HTTP_400_BAD_REQUEST
            )

        application.status = ApplicationStatus.WON
        application.save()

        return Response(ApplicationSerializer(application, context={'request': request}).data)

    @extend_schema(
        request=None,
        responses={200: ApplicationSerializer}
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def mark_not_issued(self, request, pk=None):
        """
        Mark application as not issued (Admin only).
        POST /api/applications/{id}/mark_not_issued/
        
        Sets status to LOST ("Не выдан").
        """
        application = self.get_object()

        if application.status != ApplicationStatus.APPROVED:
            return Response(
                {'error': 'Отметить как не выданную можно только после статуса «Одобрен»'},
                status=status.HTTP_400_BAD_REQUEST
            )

        application.status = ApplicationStatus.LOST
        application.save()

        return Response(ApplicationSerializer(application, context={'request': request}).data)

    @extend_schema(
        request={'application/json': {'type': 'object', 'properties': {'reason': {'type': 'string'}}}},
        responses={200: ApplicationSerializer}
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def reject(self, request, pk=None):
        """
        Reject application (Admin only).
        POST /api/applications/{id}/reject/
        
        Body: {"reason": "Application rejected due to..."}
        
        Sets status to REJECTED.
        """
        application = self.get_object()
        
        if application.status == ApplicationStatus.REJECTED:
            return Response(
                {'error': 'Заявка уже отклонена'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Save rejection reason if provided
        reason = request.data.get('reason', '')
        if reason:
            application.rejection_reason = reason
        
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
        request=None,
        responses={200: ApplicationSerializer}
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def send_to_review(self, request, pk=None):
        """
        Send application to bank review (Admin only).
        POST /api/applications/{id}/send_to_review/
        
        Changes status from PENDING to IN_REVIEW when admin sends application to bank.
        """
        application = self.get_object()
        
        if application.status == ApplicationStatus.IN_REVIEW:
            return Response(
                {'error': 'Заявка уже на рассмотрении в банке'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if application.status not in [ApplicationStatus.PENDING, ApplicationStatus.INFO_REQUESTED]:
            return Response(
                {'error': f'Невозможно отправить на рассмотрение заявку со статусом {application.get_status_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        application.status = ApplicationStatus.IN_REVIEW
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

    @extend_schema(
        request=None,
        responses={200: ApplicationSerializer}
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAgentOrAdmin])
    def send_to_bank(self, request, pk=None):
        """
        Send application to Realist Bank API.
        POST /api/applications/{id}/send_to_bank/
        
        Phase 7: Sends the application payload to the bank's add_ticket endpoint.
        On success, saves the returned ticket_id to application.external_id.
        
        SECURITY: Only for Agent/Admin roles - clients cannot submit directly to bank.
        """
        import logging
        logger = logging.getLogger(__name__)
        
        application = self.get_object()
        
        # Validate application can be sent to bank
        # Allow re-submission for applications returned for revision (INFO_REQUESTED status)
        if application.external_id and application.status != ApplicationStatus.INFO_REQUESTED:
            return Response(
                {'error': f'Заявка уже отправлена в банк (ID: {application.external_id})'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate application has required data
        if not application.company:
            return Response(
                {'error': 'Заявка не привязана к компании'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from apps.integrations.services import BankIntegrationService
            
            service = BankIntegrationService()
            result = service.send_application(pk)
            
            # Refresh application from db
            application.refresh_from_db()

            if not application.submitted_at:
                application.submitted_at = timezone.now()
                application.save(update_fields=['submitted_at'])

            try:
                from apps.notifications.signals import notify_admins
                from apps.notifications.models import NotificationType

                data = {
                    'application_id': application.id,
                    'company_name': application.company.short_name or application.company.name if application.company else 'Не указана',
                    'product_type': application.product_type,
                    'product_type_display': application.get_product_type_display(),
                    'amount': str(application.amount) if application.amount else None,
                }

                notify_admins(
                    notification_type=NotificationType.ADMIN_APPLICATION_SENT,
                    title='Заявка отправлена в банк',
                    message=f"Заявка #{application.id} отправлена в банк",
                    data=data,
                    source_object=application,
                )
            except Exception as e:
                logger.error(f"Failed to notify admins about bank submission: {e}")
            
            logger.info(f"Application {pk} sent to bank successfully. Ticket ID: {result['ticket_id']}")
            
            return Response({
                'message': result['message'],
                'ticket_id': result['ticket_id'],
                'bank_status': result['bank_status'],
                'application': ApplicationSerializer(application, context={'request': request}).data
            })
            
        except ValueError as e:
            logger.warning(f"Failed to send application {pk} to bank: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.exception(f"Unexpected error sending application {pk} to bank")
            return Response(
                {'error': f'Ошибка при отправке в банк: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        request=None,
        responses={200: ApplicationSerializer}
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAgentOrAdmin])
    def sync_status(self, request, pk=None):
        """
        Sync application status from Realist Bank API.
        POST /api/applications/{id}/sync_status/
        
        Phase 7.2: Polls the bank to get current ticket status
        and updates the local bank_status field.
        
        SECURITY: Only for Agent/Admin roles - clients cannot poll bank directly.
        """
        import logging
        logger = logging.getLogger(__name__)
        
        application = self.get_object()
        
        # Validate application has been sent to bank
        if not application.external_id:
            return Response(
                {'error': 'Заявка ещё не отправлена в банк'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from apps.integrations.services import BankIntegrationService
            
            service = BankIntegrationService()
            result = service.sync_application_status(pk)
            
            # Refresh application from db
            application.refresh_from_db()
            
            logger.info(f"Synced status for application {pk}: {result['bank_status']}")
            
            return Response({
                'message': result['message'],
                'bank_status': result['bank_status'],
                'bank_status_id': result['bank_status_id'],
                'manager_name': result.get('manager_name', ''),
                'payment_status': result.get('payment_status', ''),
                'changed': result['changed'],
                'application': ApplicationSerializer(application, context={'request': request}).data
            })
            
        except ValueError as e:
            logger.warning(f"Failed to sync status for application {pk}: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.exception(f"Unexpected error syncing status for application {pk}")
            return Response(
                {'error': 'Не удалось получить статус от банка'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@extend_schema(tags=['Partner Decisions'])
class PartnerDecisionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing partner decisions.
    """
    serializer_class = PartnerDecisionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Base queryset with select_related to avoid N+1 queries
        base_select = ['partner', 'application', 'application__company']
        
        # Admin sees all
        if user.role == 'admin' or user.is_superuser:
            return PartnerDecision.objects.select_related(*base_select).all()
        
        # Partner sees own decisions
        if user.role == 'partner':
            return PartnerDecision.objects.select_related(*base_select).filter(partner=user)
        
        # Client/Agent see decisions on their applications
        return PartnerDecision.objects.select_related(*base_select).filter(
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
        # Add select_related to avoid N+1 queries when serializing sender
        base_qs = TicketMessage.objects.select_related('sender', 'application').all()
        
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
        
        # Broadcast to admin_chat_threads WebSocket group for real-time updates
        # Only notify if sender is NOT admin (admins don't need to see their own messages)
        if request.user.role != 'admin':
            try:
                from asgiref.sync import async_to_sync
                from channels.layers import get_channel_layer
                
                channel_layer = get_channel_layer()
                if channel_layer:
                    company_name = application.company.name if application.company else f'Заявка #{application.id}'
                    sender_name = request.user.first_name or request.user.email
                    
                    async_to_sync(channel_layer.group_send)(
                        'admin_chat_threads',
                        {
                            'type': 'new_message_notification',
                            'application_id': application.id,
                            'company_name': company_name,
                            'sender_name': sender_name,
                            'preview': message.content[:100] if message.content else '[Файл]',
                        }
                    )
            except Exception as e:
                # Don't fail the request if WebSocket broadcast fails
                import logging
                logging.getLogger(__name__).warning(f'Failed to broadcast to admin_chat_threads: {e}')
        
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

    @extend_schema(
        description='Mark all unread messages in this application as read (excluding own messages)',
        responses={200: {'type': 'object', 'properties': {'marked_count': {'type': 'integer'}}}},
    )
    @action(detail=False, methods=['post'], url_path='mark_read')
    def mark_read(self, request, application_pk=None):
        """
        Mark all unread messages in this application as read.
        Only marks messages from other users (not own messages).
        """
        from django.utils import timezone
        
        if not application_pk:
            return Response(
                {'error': 'Не указана заявка'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check user has access to this application
        try:
            self._get_accessible_application(application_pk)
        except Application.DoesNotExist:
            return Response(
                {'error': 'Заявка не найдена или недоступна'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Mark messages as read (exclude own messages)
        now = timezone.now()
        updated = TicketMessage.objects.filter(
            application_id=application_pk,
            is_read=False
        ).exclude(
            sender=request.user
        ).update(
            is_read=True,
            read_by=request.user,
            read_at=now
        )
        
        # Broadcast to admin_chat_threads to update the list (if messages were marked)
        if updated > 0:
            try:
                from asgiref.sync import async_to_sync
                from channels.layers import get_channel_layer
                
                channel_layer = get_channel_layer()
                if channel_layer:
                    # Send signal to refresh admin chat list
                    async_to_sync(channel_layer.group_send)(
                        'admin_chat_threads',
                        {
                            'type': 'new_message_notification',
                            'application_id': int(application_pk),
                            'company_name': '',
                            'sender_name': '',
                            'preview': '',
                        }
                    )
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f'Failed to broadcast mark_read to admin_chat_threads: {e}')
        
        return Response({'marked_count': updated}, status=status.HTTP_200_OK)


@extend_schema(tags=['Calculation Sessions'])
@extend_schema_view(
    list=extend_schema(description='List calculation sessions (root applications)'),
    create=extend_schema(description='Create calculation session after bank calculation'),
    retrieve=extend_schema(description='Get calculation session with bank offers'),
)
class CalculationSessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CalculationSession (root applications).
    
    This is the "Результат отбора" page - stores bank calculation results
    and allows returning to select more banks.
    
    Role-based access:
    - CLIENT: Own calculation sessions
    - AGENT: Own calculation sessions
    - ADMIN: All sessions
    """
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']  # No delete

    def get_queryset(self):
        user = self.request.user
        
        # Admin sees all
        if user.role == 'admin' or user.is_superuser:
            return CalculationSession.objects.all()
        
        # Client/Agent see own sessions
        return CalculationSession.objects.filter(created_by=user)

    def get_serializer_class(self):
        if self.action == 'create':
            return CalculationSessionCreateSerializer
        return CalculationSessionSerializer

    @extend_schema(
        request={'application/json': {'type': 'object', 'properties': {'bank_names': {'type': 'array', 'items': {'type': 'string'}}}}},
        responses={200: CalculationSessionSerializer}
    )
    @action(detail=True, methods=['post'])
    def update_submitted(self, request, pk=None):
        """
        Update submitted_banks list after creating applications.
        POST /api/calculation-sessions/{id}/update_submitted/
        
        Body: {"bank_names": ["Сбербанк", "ВТБ"]}
        """
        session = self.get_object()
        bank_names = request.data.get('bank_names', [])
        
        if not isinstance(bank_names, list):
            return Response(
                {'error': 'bank_names должен быть списком'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add new banks to submitted list (avoid duplicates)
        existing = set(session.submitted_banks)
        new_banks = existing.union(set(bank_names))
        session.submitted_banks = list(new_banks)
        session.save()
        
        return Response(CalculationSessionSerializer(session, context={'request': request}).data)

    @extend_schema(
        request={'application/json': {'type': 'object', 'properties': {'banks': {'type': 'array', 'items': {'type': 'object'}}}}},
        responses={200: CalculationSessionSerializer}
    )
    @action(detail=True, methods=['post'])
    def add_banks(self, request, pk=None):
        """
        Add banks to approved_banks list.
        POST /api/calculation-sessions/{id}/add_banks/
        
        Body: {"banks": [{"name": "Сбербанк", "bgRate": 2.5, "creditRate": 15, "speed": "Высокая", "individual": false}]}
        """
        session = self.get_object()
        banks = request.data.get('banks', [])
        
        if not isinstance(banks, list):
            return Response(
                {'error': 'banks должен быть списком'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate each bank has required fields
        required_fields = ['name', 'bgRate', 'creditRate', 'speed']
        for bank in banks:
            missing = [f for f in required_fields if f not in bank]
            if missing:
                return Response(
                    {'error': f'Отсутствуют обязательные поля: {missing}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Get existing bank names to avoid duplicates
        existing_names = {b['name'] for b in session.approved_banks}
        
        # Add new banks (avoid duplicates)
        new_banks = [b for b in banks if b['name'] not in existing_names]
        if new_banks:
            session.approved_banks = session.approved_banks + new_banks
            session.save()
        
        return Response(CalculationSessionSerializer(session, context={'request': request}).data)


# =============================================================================
# PUBLIC LEAD API (No authentication required)
# =============================================================================

from rest_framework.permissions import AllowAny
from .models import Lead
from .serializers import LeadSerializer, LeadCreateSerializer


@extend_schema(tags=['Public Leads'])
class PublicLeadCreateView(APIView):
    """
    Public API for creating leads from website.
    POST /api/leads/
    
    No authentication required - accepts form submissions from public site.
    Creates Lead record for admin follow-up.
    
    Used by:
    - GuaranteeCalculator on public website
    - TopApplicationForm on public website
    - Landing pages
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    
    @extend_schema(
        request=LeadCreateSerializer,
        responses={201: LeadSerializer, 400: {'type': 'object'}}
    )
    def post(self, request):
        """Create a new lead from public website form."""
        serializer = LeadCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            lead = serializer.save()
            
            # Return created lead data
            return Response(
                LeadSerializer(lead).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


@extend_schema(tags=['Admin Leads'])
class LeadViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing leads (Admin only).
    
    Endpoints:
    - GET /api/admin/leads/ - list all leads
    - GET /api/admin/leads/{id}/ - get lead details
    - PATCH /api/admin/leads/{id}/ - update lead (status, notes, assignment)
    - DELETE /api/admin/leads/{id}/ - delete lead
    - POST /api/admin/leads/{id}/convert/ - convert lead to application
    """
    queryset = Lead.objects.select_related('assigned_to').all()
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = None  # Frontend expects full list without pagination
    
    def get_serializer_class(self):
        return LeadSerializer

    def perform_update(self, serializer):
        lead = self.get_object()
        new_status = serializer.validated_data.get('status')

        if new_status and new_status != lead.status:
            from .models import LeadStatus

            if new_status != LeadStatus.NEW and not lead.contacted_at:
                serializer.save(contacted_at=timezone.now())
                return

        serializer.save()
    
    @extend_schema(
        request={'type': 'object', 'properties': {
            'amount': {'type': 'string', 'description': 'Amount to override lead value'},
            'term_months': {'type': 'integer', 'description': 'Term in months to override'},
            'product_type': {'type': 'string', 'description': 'Product type to override'},
            'guarantee_type': {'type': 'string', 'description': 'Guarantee type to override'},
        }},
        responses={200: LeadSerializer, 400: {'type': 'object'}}
    )
    @action(detail=True, methods=['post'])
    def convert(self, request, pk=None):
        """
        Convert lead to application.
        POST /api/admin/leads/{id}/convert/
        
        Creates Application from Lead data and links them.
        The admin user becomes the creator of the application.
        
        Supports "smart conversion" - accepts optional fields to override/supplement lead data:
        - amount: Override lead amount (required if lead has no amount)
        - term_months: Override lead term (required if lead has no term)
        - product_type: Override product type
        - guarantee_type: Override guarantee type
        
        This allows converting leads with incomplete data by providing missing fields.
        """
        from .models import LeadStatus, ApplicationStatus
        from decimal import Decimal, InvalidOperation
        
        lead = self.get_object()
        
        if lead.converted_application:
            return Response(
                {'error': 'Лид уже конвертирован в заявку'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get values from request body OR fallback to lead data
        # This allows "smart conversion" with data supplementation
        request_amount = request.data.get('amount')
        request_term = request.data.get('term_months')
        request_product = request.data.get('product_type')
        request_guarantee = request.data.get('guarantee_type')
        
        # Determine final values (request overrides lead)
        final_amount = None
        if request_amount is not None:
            try:
                final_amount = Decimal(str(request_amount))
            except (InvalidOperation, ValueError):
                return Response(
                    {'error': 'Некорректная сумма'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif lead.amount is not None:
            final_amount = lead.amount
        
        final_term = None
        if request_term is not None:
            try:
                final_term = int(request_term)
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Некорректный срок'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif lead.term_months is not None:
            final_term = lead.term_months
        
        final_product = request_product or lead.product_type
        final_guarantee = request_guarantee if request_guarantee is not None else (lead.guarantee_type or '')
        
        # Validate required fields
        validation_errors = []
        if final_amount is None:
            validation_errors.append('Не указана сумма')
        if final_term is None:
            validation_errors.append('Не указан срок')
        
        if validation_errors:
            return Response(
                {
                    'error': 'Невозможно конвертировать лид: отсутствуют обязательные данные',
                    'details': validation_errors,
                    'missing_fields': {
                        'amount': final_amount is None,
                        'term_months': final_term is None,
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create Application from Lead data (with overrides applied)
        # Admin is set as creator - client can be linked later when they register
        application = Application.objects.create(
            created_by=request.user,
            company=None,  # Will be filled when client completes profile
            product_type=final_product,
            guarantee_type=final_guarantee,
            amount=final_amount,
            term_months=final_term,
            status=ApplicationStatus.DRAFT,
            notes=f"Создано из лида #{lead.id}\n"
                  f"Контакт: {lead.full_name}\n"
                  f"Телефон: {lead.phone}\n"
                  f"Email: {lead.email or 'не указан'}",
        )
        
        # Link lead to created application
        lead.converted_application = application
        lead.status = LeadStatus.CONVERTED
        lead.save()
        
        return Response({
            'status': 'ok',
            'message': f'Лид конвертирован в заявку #{application.id}',
            'application_id': application.id,
            'lead': LeadSerializer(lead).data,
        })

    @extend_schema(
        request=None,
        responses={200: {'type': 'string', 'format': 'binary'}},
        description='Export leads to CSV file'
    )
    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """
        Export all leads to CSV.
        GET /api/admin/leads/export_csv/
        
        Returns CSV file with all leads data.
        """
        import csv
        from django.http import HttpResponse
        
        leads = self.get_queryset().order_by('-created_at')
        
        # Create response with CSV content type
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="leads_export.csv"'
        
        # Add BOM for Excel UTF-8 support
        response.write('\ufeff')
        
        writer = csv.writer(response)
        
        # Write header
        writer.writerow([
            'ID',
            'ФИО',
            'Телефон',
            'Email',
            'ИНН',
            'Продукт',
            'Тип гарантии',
            'Сумма',
            'Срок (мес)',
            'Статус',
            'Источник',
            'Форма',
            'Страница',
            'UTM Source',
            'UTM Medium',
            'UTM Campaign',
            'Сообщение',
            'Менеджер',
            'Заметки',
            'Конвертирован в заявку',
            'Дата создания',
            'Дата контакта',
        ])
        
        # Write data rows
        for lead in leads:
            writer.writerow([
                lead.id,
                lead.full_name,
                lead.phone,
                lead.email or '',
                lead.inn or '',
                lead.get_product_type_display(),
                lead.get_guarantee_type_display() if lead.guarantee_type else '',
                str(lead.amount) if lead.amount else '',
                lead.term_months or '',
                lead.get_status_display(),
                lead.get_source_display(),
                lead.form_name or '',
                lead.page_url or '',
                lead.utm_source or '',
                lead.utm_medium or '',
                lead.utm_campaign or '',
                lead.message or '',
                lead.assigned_to.email if lead.assigned_to else '',
                lead.notes or '',
                lead.converted_application_id or '',
                lead.created_at.strftime('%d.%m.%Y %H:%M'),
                lead.contacted_at.strftime('%d.%m.%Y %H:%M') if lead.contacted_at else '',
            ])
        
        return response


@extend_schema(tags=['Lead Comments'])
class LeadCommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing lead comments (Admin only).
    
    Endpoints:
    - GET /api/admin/leads/{lead_id}/comments/ - list comments for a lead
    - POST /api/admin/leads/{lead_id}/comments/ - add comment to a lead
    - DELETE /api/admin/leads/{lead_id}/comments/{id}/ - delete comment
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = None  # Comments per lead are few, no pagination needed
    
    def get_queryset(self):
        from .models import LeadComment
        lead_id = self.kwargs.get('lead_pk')
        return LeadComment.objects.filter(lead_id=lead_id).select_related('author')
    
    def get_serializer_class(self):
        from .serializers import LeadCommentSerializer, LeadCommentCreateSerializer
        if self.action == 'create':
            return LeadCommentCreateSerializer
        return LeadCommentSerializer
    
    def perform_create(self, serializer):
        lead_id = self.kwargs.get('lead_pk')
        serializer.save(author=self.request.user, lead_id=lead_id)


@extend_schema(tags=['Chat Threads'])
class ChatThreadViewSet(viewsets.ViewSet):
    """
    ViewSet for admin chat threads list.
    
    Returns applications with unread messages or messages awaiting admin reply.
    Uses aggregation to return one row per application.
    
    Logic:
    - Show applications with unread messages from non-admin users
    - OR applications where last message is NOT from admin (needs reply)
    - Exclude applications where admin is the last sender AND all messages are read
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    
    @extend_schema(
        description='Get list of applications with unread messages or awaiting reply',
        responses={200: ChatThreadSerializer(many=True)},
    )
    def list(self, request):
        """
        Returns list of chat threads for admin.
        
        Each thread represents an application with:
        - Unread message count (from non-admin users)
        - Last message preview and sender info
        - admin_replied: True if admin was the last to send a message
        """
        from django.db.models import Count, Q, Max, OuterRef, Subquery, CharField
        
        # Subquery to get the role of the last message sender for each application
        last_message_sender_role = Subquery(
            TicketMessage.objects.filter(
                application_id=OuterRef('application_id')
            ).order_by('-created_at').values('sender__role')[:1],
            output_field=CharField()
        )
        
        # Get applications with chat activity that need attention
        # Either: has unread messages from non-admins OR last message is not from admin
        threads_data = list(
            TicketMessage.objects
            .values('application_id')
            .annotate(
                unread_count=Count(
                    'id', 
                    filter=Q(is_read=False) & ~Q(sender__role='admin')
                ),
                last_message_at=Max('created_at'),
                last_sender_role=last_message_sender_role,
            )
            .filter(
                Q(unread_count__gt=0) |  # Has unread messages from non-admins
                ~Q(last_sender_role='admin')  # Last message is not from admin
            )
            .order_by('-last_message_at')
        )
        
        # Build response data
        result = []
        application_ids = [t['application_id'] for t in threads_data]
        
        if not application_ids:
            return Response([])
        
        # Prefetch applications
        applications = {
            app.id: app
            for app in Application.objects.filter(id__in=application_ids).select_related(
                'company',
                'created_by',
                'created_by__invited_by'
            )
        }
        
        # Get last non-admin message for each application (for preview)
        last_messages = {}
        for app_id in application_ids:
            last_msg = (
                TicketMessage.objects
                .filter(application_id=app_id)
                .exclude(sender__role='admin')
                .select_related('sender')
                .order_by('-created_at')
                .first()
            )
            if last_msg:
                last_messages[app_id] = last_msg
        
        for thread in threads_data:
            app_id = thread['application_id']
            app = applications.get(app_id)
            last_msg = last_messages.get(app_id)
            
            if not app or not last_msg:
                continue
            
            # Get sender name
            sender_name = ''
            if last_msg.sender.first_name or last_msg.sender.last_name:
                sender_name = f"{last_msg.sender.first_name or ''} {last_msg.sender.last_name or ''}".strip()
            if not sender_name:
                sender_name = last_msg.sender.email
            
            # Check if admin replied (last message is from admin)
            admin_replied = thread['last_sender_role'] == 'admin'
            
            # Skip if all read AND admin replied
            if thread['unread_count'] == 0 and admin_replied:
                continue
            
            agent_user = None
            if app.created_by and app.created_by.role == 'agent':
                agent_user = app.created_by
            elif app.created_by and app.created_by.role == 'client':
                invited_by = getattr(app.created_by, 'invited_by', None)
                if invited_by and invited_by.role == 'agent':
                    agent_user = invited_by

            agent_name = None
            agent_email = None
            agent_phone = None
            if agent_user:
                agent_email = agent_user.email
                agent_phone = agent_user.phone
                first = agent_user.first_name or ''
                last = agent_user.last_name or ''
                full_name = f"{first} {last}".strip()
                agent_name = full_name or agent_user.email

            result.append({
                'application_id': app_id,
                'company_name': app.company.name if app.company else f'Заявка #{app_id}',
                'last_sender_email': last_msg.sender.email,
                'last_sender_name': sender_name,
                'last_message_preview': last_msg.content[:100] if last_msg.content else '[Файл]',
                'unread_count': thread['unread_count'],
                'admin_replied': admin_replied,
                'last_message_at': thread['last_message_at'],
                'agent_name': agent_name,
                'agent_email': agent_email,
                'agent_phone': agent_phone,
            })
        
        serializer = ChatThreadSerializer(result, many=True)
        return Response(serializer.data)

