"""
Views for Bank Conditions API.
"""
import logging

from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from .models import Bank, BankCondition, IndividualReviewCondition, RKOCondition, StopFactor
from .serializers import (
    BankSerializer,
    BankConditionSerializer,
    IndividualReviewConditionSerializer,
    RKOConditionSerializer,
    StopFactorSerializer,
    BankConditionsAggregatedSerializer,
    PartnerBankProfileSerializer,
    AdminBankSerializer,
    BankPartnerInviteSerializer,
    BankPartnerLinkSerializer,
)
from apps.users.permissions import IsPartner, IsAdmin
from apps.users.models import User
from apps.notifications.email_service import send_reliable_email

logger = logging.getLogger(__name__)


class BankViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Banks.
    """
    queryset = Bank.objects.filter(is_active=True)
    serializer_class = BankSerializer
    permission_classes = [IsAuthenticated]


class AdminBankViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for managing banks.
    """
    serializer_class = AdminBankSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        queryset = Bank.objects.all().select_related('partner_user')
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset

    def _build_invite_urls(self, user):
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://lider-garant.ru')
        invite_url = f"{frontend_url}/accept-invite/{user.invite_token}/"
        relative_invite_url = f"/accept-invite/{user.invite_token}/"
        return invite_url, relative_invite_url

    def _send_partner_invite_email(self, bank_name, email, invite_url):
        try:
            dispatch = send_reliable_email(
                subject=f'Приглашение в систему Лидер Гарант - {bank_name}',
                message=f'''
Здравствуйте!

Вы приглашены стать партнёром платформы Лидер Гарант.

Для активации аккаунта перейдите по ссылке:
{invite_url}

После перехода установите пароль для входа в систему.

С уважением,
Команда Лидер Гарант
                ''',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                event_type='bank_partner_invite',
                metadata={'bank_name': bank_name, 'recipient': email},
            )
            if dispatch.sent:
                return True, False, None
            if dispatch.queued:
                return False, True, 'Письмо поставлено в очередь отправки'
            return False, False, dispatch.error_message or 'Не удалось отправить письмо'
        except Exception as error:
            logger.exception(
                "Failed to send partner invite email to %s (bank=%s)",
                email,
                bank_name,
            )
            return False, False, f"{error.__class__.__name__}: {error}"

    @action(detail=True, methods=['post'])
    def invite_partner(self, request, pk=None):
        """
        Create partner invite and link it to the bank.
        POST /api/bank-conditions/admin/banks/{id}/invite_partner/
        """
        bank = self.get_object()
        if bank.partner_user:
            return Response(
                {'error': 'Банк уже связан с аккаунтом партнёра'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = BankPartnerInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Пользователь с таким email уже существует'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create(
            email=email,
            first_name=serializer.validated_data.get('first_name', ''),
            last_name=serializer.validated_data.get('last_name', ''),
            role='partner',
            is_active=False,
            invited_by=request.user,
        )
        user.generate_invite_token()

        bank.partner_user = user
        bank.save(update_fields=['partner_user'])

        invite_url, relative_invite_url = self._build_invite_urls(user)
        email_sent, email_queued, email_error = self._send_partner_invite_email(bank.name, email, invite_url)

        return Response({
            'message': (
                'Приглашение создано и отправлено на email'
                if email_sent
                else 'Приглашение создано и поставлено в очередь отправки'
                if email_queued
                else 'Приглашение создано. Email не отправлен (проверьте SMTP настройки)'
            ),
            'email_sent': email_sent,
            'email_queued': email_queued,
            'email_error': email_error,
            'partner': {
                'id': user.id,
                'email': user.email,
                'invite_token': str(user.invite_token),
            },
            'invite_url': relative_invite_url,
            'full_invite_url': invite_url,
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def partner_invite(self, request, pk=None):
        """
        Get partner invite link for a bank.
        GET /api/bank-conditions/admin/banks/{id}/partner_invite/
        """
        bank = self.get_object()
        if not bank.partner_user:
            return Response(
                {'error': 'Партнёр не назначен'},
                status=status.HTTP_400_BAD_REQUEST
            )

        partner = bank.partner_user
        if partner.is_active or partner.invite_accepted_at:
            return Response(
                {'error': 'Партнёр уже активирован'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not partner.invite_token:
            partner.generate_invite_token()

        invite_url, relative_invite_url = self._build_invite_urls(partner)

        return Response({
            'message': 'Ссылка приглашения сформирована',
            'email_sent': None,
            'email_error': None,
            'partner': {
                'id': partner.id,
                'email': partner.email,
                'invite_token': str(partner.invite_token),
            },
            'invite_url': relative_invite_url,
            'full_invite_url': invite_url,
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def resend_partner_invite(self, request, pk=None):
        """
        Resend partner invite email for a bank.
        POST /api/bank-conditions/admin/banks/{id}/resend_partner_invite/
        """
        bank = self.get_object()
        if not bank.partner_user:
            return Response(
                {'error': 'Партнёр не назначен'},
                status=status.HTTP_400_BAD_REQUEST
            )

        partner = bank.partner_user
        if partner.is_active or partner.invite_accepted_at:
            return Response(
                {'error': 'Партнёр уже активирован'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not partner.invite_token:
            partner.generate_invite_token()

        invite_url, relative_invite_url = self._build_invite_urls(partner)
        email_sent, email_error = self._send_partner_invite_email(bank.name, partner.email, invite_url)

        return Response({
            'message': 'Приглашение отправлено' + (' на email' if email_sent else '. Email не отправлен (проверьте SMTP настройки)'),
            'email_sent': email_sent,
            'email_error': email_error,
            'partner': {
                'id': partner.id,
                'email': partner.email,
                'invite_token': str(partner.invite_token),
            },
            'invite_url': relative_invite_url,
            'full_invite_url': invite_url,
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def link_partner(self, request, pk=None):
        """
        Link existing partner account to the bank.
        POST /api/bank-conditions/admin/banks/{id}/link_partner/
        """
        bank = self.get_object()
        if bank.partner_user:
            return Response(
                {'error': 'Банк уже связан с аккаунтом партнёра'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = BankPartnerLinkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        partner_user = None
        partner_user_id = serializer.validated_data.get('partner_user_id')
        partner_email = serializer.validated_data.get('email')

        if partner_user_id:
            partner_user = User.objects.filter(id=partner_user_id, role='partner').first()
        elif partner_email:
            partner_user = User.objects.filter(email=partner_email, role='partner').first()

        if not partner_user:
            return Response(
                {'error': 'Партнёр не найден'},
                status=status.HTTP_404_NOT_FOUND
            )

        if hasattr(partner_user, 'partner_bank') and partner_user.partner_bank and partner_user.partner_bank.id != bank.id:
            return Response(
                {'error': 'Этот партнёр уже связан с другим банком'},
                status=status.HTTP_400_BAD_REQUEST
            )

        bank.partner_user = partner_user
        bank.save(update_fields=['partner_user'])

        return Response(AdminBankSerializer(bank).data)

    @action(detail=True, methods=['post'])
    def unlink_partner(self, request, pk=None):
        """
        Unlink partner account from bank.
        POST /api/bank-conditions/admin/banks/{id}/unlink_partner/
        """
        bank = self.get_object()
        bank.partner_user = None
        bank.save(update_fields=['partner_user'])
        return Response(AdminBankSerializer(bank).data)


class BankConditionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Bank Conditions (Table 1).
    """
    queryset = BankCondition.objects.filter(is_active=True).select_related('bank')
    serializer_class = BankConditionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by bank
        bank_id = self.request.query_params.get('bank')
        if bank_id:
            queryset = queryset.filter(bank_id=bank_id)
        
        # Filter by product type
        product = self.request.query_params.get('product')
        if product:
            queryset = queryset.filter(product__icontains=product)
        
        # Sort options
        sort_by = self.request.query_params.get('sort_by', 'bank')
        if sort_by == 'rate':
            queryset = queryset.order_by('rate_min')
        elif sort_by == 'sum':
            queryset = queryset.order_by('-sum_max')
        elif sort_by == 'term':
            queryset = queryset.order_by('-term_months')
        
        return queryset


class AdminBankConditionViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for Bank Conditions (Table 1).
    """
    queryset = BankCondition.objects.select_related('bank')
    serializer_class = BankConditionSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        queryset = super().get_queryset()
        bank_id = self.request.query_params.get('bank')
        if bank_id:
            queryset = queryset.filter(bank_id=bank_id)
        return queryset


class IndividualReviewConditionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Individual Review Conditions (Table 2).
    """
    queryset = IndividualReviewCondition.objects.filter(is_active=True).select_related('bank')
    serializer_class = IndividualReviewConditionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        bank_id = self.request.query_params.get('bank')
        if bank_id:
            queryset = queryset.filter(bank_id=bank_id)
        
        fz_type = self.request.query_params.get('fz_type')
        if fz_type:
            queryset = queryset.filter(fz_type__icontains=fz_type)
        
        return queryset


class AdminIndividualReviewConditionViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for Individual Review Conditions (Table 2).
    """
    queryset = IndividualReviewCondition.objects.select_related('bank')
    serializer_class = IndividualReviewConditionSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        queryset = super().get_queryset()
        bank_id = self.request.query_params.get('bank')
        if bank_id:
            queryset = queryset.filter(bank_id=bank_id)
        return queryset


class RKOConditionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for RKO Conditions.
    """
    queryset = RKOCondition.objects.filter(is_active=True).select_related('bank')
    serializer_class = RKOConditionSerializer
    permission_classes = [IsAuthenticated]


class AdminRKOConditionViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for RKO Conditions.
    """
    queryset = RKOCondition.objects.select_related('bank')
    serializer_class = RKOConditionSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


class StopFactorViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Stop Factors.
    """
    queryset = StopFactor.objects.filter(is_active=True)
    serializer_class = StopFactorSerializer
    permission_classes = [IsAuthenticated]


class AdminStopFactorViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for Stop Factors.
    """
    queryset = StopFactor.objects.all()
    serializer_class = StopFactorSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


class BankConditionsAggregatedViewSet(viewsets.ViewSet):
    """
    Single endpoint that returns all bank conditions data aggregated.
    """
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """Return all bank conditions data in a single response."""
        data = {
            'banks': Bank.objects.filter(is_active=True),
            'conditions': BankCondition.objects.filter(is_active=True).select_related('bank'),
            'individual_reviews': IndividualReviewCondition.objects.filter(is_active=True).select_related('bank'),
            'rko_conditions': RKOCondition.objects.filter(is_active=True).select_related('bank'),
            'stop_factors': StopFactor.objects.filter(is_active=True),
        }
        
        serializer = BankConditionsAggregatedSerializer(data)
        return Response(serializer.data)


@extend_schema(tags=['Partner Bank Profile'])
class PartnerBankProfileView(APIView):
    """
    Partner's bank profile management.
    GET /api/bank-conditions/partner/profile/ - Get partner's bank profile
    PATCH /api/bank-conditions/partner/profile/ - Update partner's bank profile
    """
    permission_classes = [IsAuthenticated, IsPartner]
    
    def get(self, request):
        """Get the current partner's bank profile."""
        try:
            bank = Bank.objects.get(partner_user=request.user)
            serializer = PartnerBankProfileSerializer(bank)
            return Response(serializer.data)
        except Bank.DoesNotExist:
            return Response(
                {'error': 'Профиль банка не найден. Обратитесь к администратору.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def patch(self, request):
        """Update the current partner's bank profile."""
        try:
            bank = Bank.objects.get(partner_user=request.user)
        except Bank.DoesNotExist:
            return Response(
                {'error': 'Профиль банка не найден. Обратитесь к администратору.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = PartnerBankProfileSerializer(bank, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
