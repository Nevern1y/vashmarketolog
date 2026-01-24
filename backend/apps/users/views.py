"""
API Views for User Authentication and Profile management.
"""
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
    PasswordChangeSerializer,
    PartnerInviteSerializer,
    PartnerAcceptInviteSerializer,
    UserListSerializer,
)
from .permissions import IsAdmin

User = get_user_model()


@extend_schema(tags=['Authentication'])
class RegisterView(generics.CreateAPIView):
    """
    User registration endpoint.
    POST /api/auth/register/
    
    Only allows CLIENT and AGENT roles.
    Partners are created via invite by Admin.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens for immediate login
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Регистрация успешна',
            'user': {
                'id': user.id,
                'email': user.email,
                'phone': user.phone,
                'role': user.role,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_active': user.is_active,
            },
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Authentication'])
class LoginView(TokenObtainPairView):
    """
    User login endpoint.
    POST /api/auth/login/
    
    Returns JWT access/refresh tokens and user info.
    """
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]


@extend_schema(tags=['Authentication'])
class RefreshTokenView(TokenRefreshView):
    """
    Token refresh endpoint.
    POST /api/auth/refresh/
    
    Exchanges refresh token for new access token.
    """
    permission_classes = [AllowAny]


@extend_schema(tags=['Authentication'])
class LogoutView(APIView):
    """
    User logout endpoint.
    POST /api/auth/logout/
    
    Blacklists the refresh token.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token обязателен'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response(
                {'message': 'Выход выполнен успешно'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': 'Недействительный токен'},
                status=status.HTTP_400_BAD_REQUEST
            )


@extend_schema(tags=['User Profile'])
class MeView(generics.RetrieveUpdateAPIView):
    """
    Current user profile endpoint.
    GET /api/auth/me/ - Get current user profile
    PATCH /api/auth/me/ - Update current user profile
    """
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PATCH', 'PUT']:
            return UserProfileUpdateSerializer
        return UserProfileSerializer


@extend_schema(tags=['User Profile'])
class PasswordChangeView(APIView):
    """
    Password change endpoint.
    POST /api/auth/password/change/
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=PasswordChangeSerializer,
        responses={200: OpenApiResponse(description='Password changed successfully')}
    )
    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response(
            {'message': 'Пароль успешно изменён'},
            status=status.HTTP_200_OK
        )


@extend_schema(tags=['Admin - Partner Management'])
class PartnerInviteView(generics.CreateAPIView):
    """
    Create partner invite (Admin only).
    POST /api/auth/admin/invite-partner/
    
    Creates a partner user with invite token.
    Sends invite email automatically.
    Also returns invite link for manual sharing.
    """
    serializer_class = PartnerInviteSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def create(self, request, *args, **kwargs):
        from django.core.mail import send_mail
        from django.conf import settings
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check if user already exists
        email = serializer.validated_data['email']
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Пользователь с таким email уже существует'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = serializer.save()
        user.invited_by = request.user
        user.save()
        
        # Generate invite URL
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://lider-garant.ru')
        invite_url = f"{frontend_url}/accept-invite/{user.invite_token}/"
        relative_invite_url = f"/accept-invite/{user.invite_token}/"
        
        # Send invite email automatically
        bank_name = serializer.validated_data.get('bank_name', 'Ваш банк')
        email_sent = False
        
        try:
            send_mail(
                subject=f'Приглашение в систему Лидер Гарант - {bank_name}',
                message=f'''
Здравствуйте!

Вы приглашены стать партнёром платформы Лидер Гарант.

Для активации аккаунта перейдите по ссылке:
{invite_url}

После перехода установите пароль для входа в систему.

Если у вас возникнут вопросы, свяжитесь с нами.

С уважением,
Команда Лидер Гарант
                ''',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            email_sent = True
        except Exception as e:
            # Log error but don't fail the invite creation
            print(f"Failed to send partner invite email: {e}")
        
        return Response({
            'message': 'Приглашение создано' + (' и отправлено на email' if email_sent else '. Email не отправлен (проверьте SMTP настройки)'),
            'email_sent': email_sent,
            'partner': {
                'id': user.id,
                'email': user.email,
                'invite_token': str(user.invite_token),
            },
            'invite_url': relative_invite_url,
            'full_invite_url': invite_url,
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Authentication'])
class PartnerAcceptInviteView(APIView):
    """
    Accept partner invite endpoint.
    POST /api/auth/accept-invite/<token>/
    
    Sets password and activates partner account.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        request=PartnerAcceptInviteSerializer,
        responses={200: OpenApiResponse(description='Invite accepted successfully')}
    )
    def post(self, request, token):
        # Find user by invite token
        user = get_object_or_404(User, invite_token=token, role='partner')
        
        if user.invite_accepted_at:
            return Response(
                {'error': 'Приглашение уже использовано'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = PartnerAcceptInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Accept invite and set password
        user.accept_invite(serializer.validated_data['password'])
        
        # Generate tokens for immediate login
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Приглашение принято',
            'user': {
                'id': user.id,
                'email': user.email,
                'role': user.role,
            },
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_200_OK)


@extend_schema(tags=['Admin - User Management'])
class UserListView(generics.ListAPIView):
    """
    List all users (Admin only).
    GET /api/auth/admin/users/
    """
    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        queryset = User.objects.all()
        
        # Filter by role if provided
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset


@extend_schema(tags=['Admin - Accreditation'])
class AccreditationListView(generics.ListAPIView):
    """
    List agents pending accreditation review (Admin only).
    GET /api/auth/admin/accreditation/
    
    Optional query params:
    - status: filter by accreditation_status ('none', 'pending', 'approved', 'rejected')
    """
    from .serializers import AgentAccreditationSerializer
    serializer_class = AgentAccreditationSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        from django.db.models import Prefetch
        from apps.companies.models import CompanyProfile
        from apps.documents.models import Document
        
        queryset = User.objects.filter(role='agent')
        
        # Filter by accreditation status (default: pending)
        status_filter = self.request.query_params.get('status', 'pending')
        if status_filter and status_filter != 'all':
            queryset = queryset.filter(accreditation_status=status_filter)
        
        # Prefetch companies and documents to avoid N+1 queries
        # AgentAccreditationSerializer calls _get_company() ~40 times per agent
        queryset = queryset.prefetch_related(
            Prefetch(
                'owned_companies',
                queryset=CompanyProfile.objects.filter(is_crm_client=False),
                to_attr='_prefetched_own_company'
            ),
            Prefetch(
                'documents',
                queryset=Document.objects.select_related('company').order_by('-uploaded_at'),
                to_attr='_prefetched_documents'
            )
        )
        
        return queryset.order_by('-accreditation_submitted_at')


@extend_schema(tags=['Admin - Accreditation'])
class AccreditationDecisionView(APIView):
    """
    Approve or reject agent accreditation (Admin only).
    POST /api/auth/admin/accreditation/<user_id>/
    
    Body:
    - action: 'approve' | 'reject'
    - comment: string (optional, used for rejection reason)
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        from django.utils import timezone
        
        try:
            agent = User.objects.get(pk=pk, role='agent')
        except User.DoesNotExist:
            return Response(
                {'error': 'Агент не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        action = request.data.get('action')
        comment = request.data.get('comment', '')
        
        if action not in ['approve', 'reject']:
            return Response(
                {'error': 'Неверное действие. Допустимо: approve, reject'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if action == 'approve':
            agent.accreditation_status = 'approved'
        else:
            agent.accreditation_status = 'rejected'
        
        agent.accreditation_comment = comment
        agent.accreditation_reviewed_by = request.user
        agent.accreditation_reviewed_at = timezone.now()
        agent.save()
        
        return Response({
            'status': 'ok',
            'message': 'Аккредитация одобрена' if action == 'approve' else 'Аккредитация отклонена',
            'new_status': agent.accreditation_status,
        })


@extend_schema(tags=['Agent Accreditation'])
class SubmitAccreditationView(APIView):
    """
    Submit accreditation request (Agent only).
    POST /api/auth/accreditation/submit/
    
    Agents call this after completing the accreditation form.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.utils import timezone
        
        user = request.user
        if user.role != 'agent':
            return Response(
                {'error': 'Только агенты могут подать заявку на аккредитацию'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if user.accreditation_status == 'approved':
            return Response(
                {'error': 'Вы уже аккредитованы'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if user.accreditation_status == 'pending':
            return Response(
                {'error': 'Ваша заявка уже на рассмотрении'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.accreditation_status = 'pending'
        user.accreditation_submitted_at = timezone.now()
        user.save()
        
        return Response({
            'status': 'ok',
            'message': 'Заявка на аккредитацию отправлена',
            'accreditation_status': user.accreditation_status,
            'submitted_at': user.accreditation_submitted_at,
        })


@extend_schema(tags=['Partner - Agent Management'])
class MyAgentsView(generics.ListAPIView):
    """
    List agents invited by the current partner.
    GET /api/auth/my-agents/
    
    Returns agents who registered via this partner's referral link.
    """
    from .serializers import AgentAccreditationSerializer
    serializer_class = AgentAccreditationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Prefetch
        from apps.companies.models import CompanyProfile
        from apps.documents.models import Document
        
        user = self.request.user
        
        # Return agents invited by this user (via referral link)
        # Prefetch companies and documents to avoid N+1 queries
        # (AgentAccreditationSerializer calls _get_company() ~40 times per agent)
        return User.objects.filter(
            role='agent',
            invited_by=user
        ).prefetch_related(
            Prefetch(
                'owned_companies',
                queryset=CompanyProfile.objects.filter(is_crm_client=False),
                to_attr='_prefetched_own_company'
            ),
            Prefetch(
                'documents',
                queryset=Document.objects.select_related('company').order_by('-uploaded_at'),
                to_attr='_prefetched_documents'
            )
        ).order_by('-date_joined')


@extend_schema(tags=['Authentication'])
class InvitedClientRegisterView(APIView):
    """
    Register as client via agent invitation token.
    POST /api/auth/register/invited/<token>/
    
    Creates new client user and links them to the company created by agent.
    After client passes accreditation, company status changes to 'confirmed'.
    
    Body:
    - email: string (must match invitation_email or any valid email)
    - password: string
    - password_confirm: string
    - first_name: string (optional)
    - last_name: string (optional)
    - phone: string (optional)
    """
    permission_classes = [AllowAny]

    def post(self, request, token):
        from apps.companies.models import CompanyProfile
        from rest_framework_simplejwt.tokens import RefreshToken
        
        # Find company by invitation token
        try:
            company = CompanyProfile.objects.get(
                invitation_token=token,
                is_crm_client=True
            )
        except CompanyProfile.DoesNotExist:
            return Response(
                {'error': 'Недействительный токен приглашения'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if already registered
        if company.client_status == 'confirmed':
            return Response(
                {'error': 'Компания уже зарегистрирована'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate request data
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')
        password_confirm = request.data.get('password_confirm', '')
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        phone = request.data.get('phone', '').strip()
        
        if not email:
            return Response(
                {'error': 'Email обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not password:
            return Response(
                {'error': 'Пароль обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if password != password_confirm:
            return Response(
                {'error': 'Пароли не совпадают'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(password) < 8:
            return Response(
                {'error': 'Пароль должен быть не менее 8 символов'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Пользователь с таким email уже существует'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create new client user
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role='client',
            is_active=True,
        )
        
        # Link client to the agent who invited them
        user.invited_by = company.owner
        user.save(update_fields=['invited_by'])
        
        # Link company to new user (keep original owner as agent)
        # Create a new company for this client instead of changing ownership
        new_company = CompanyProfile.objects.create(
            owner=user,
            is_crm_client=False,  # This is client's own company
            inn=company.inn,
            name=company.name,
            short_name=company.short_name,
            contact_email=email,
            contact_phone=phone,
            contact_person=f"{first_name} {last_name}".strip() or company.contact_person,
        )
        
        # Update original CRM client company status to 'confirmed'
        company.client_status = 'confirmed'
        company.save()
        
        # Generate tokens for immediate login
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Регистрация успешна',
            'user': {
                'id': user.id,
                'email': user.email,
                'phone': user.phone,
                'role': user.role,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_active': user.is_active,
            },
            'company_id': new_company.id,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


# ============================================
# EMAIL VERIFICATION
# ============================================

@extend_schema(tags=['Authentication'])
class SendVerificationEmailView(APIView):
    """
    Send email verification link.
    POST /api/auth/email/send-verification/
    
    Sends verification email to current user.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        import secrets
        from django.core.mail import send_mail
        from django.conf import settings
        
        user = request.user
        
        if user.email_verified:
            return Response(
                {'error': 'Email уже подтверждён'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate token
        token = secrets.token_urlsafe(32)
        user.email_verification_token = token
        user.email_verification_sent_at = timezone.now()
        user.save(update_fields=['email_verification_token', 'email_verification_sent_at'])
        
        # Send email
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://lider-garant.ru')
        verification_url = f"{frontend_url}/verify-email/{token}"
        
        try:
            send_mail(
                subject='Подтвердите email - Лидер Гарант',
                message=f'''
Здравствуйте!

Для подтверждения вашего email перейдите по ссылке:
{verification_url}

Если вы не регистрировались на нашем сайте, проигнорируйте это письмо.

С уважением,
Команда Лидер Гарант
                ''',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            return Response(
                {'error': f'Ошибка отправки письма: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            'message': 'Письмо для подтверждения отправлено',
        })


@extend_schema(tags=['Authentication'])
class VerifyEmailView(APIView):
    """
    Verify email with token.
    POST /api/auth/email/verify/<token>/
    """
    permission_classes = [AllowAny]

    def post(self, request, token):
        try:
            user = User.objects.get(email_verification_token=token)
        except User.DoesNotExist:
            return Response(
                {'error': 'Неверный или устаревший токен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check token expiration (24 hours)
        from datetime import timedelta
        if user.email_verification_sent_at:
            if timezone.now() - user.email_verification_sent_at > timedelta(hours=24):
                return Response(
                    {'error': 'Токен истёк. Запросите новое письмо'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        user.email_verified = True
        user.email_verification_token = None
        user.save(update_fields=['email_verified', 'email_verification_token'])
        
        return Response({
            'message': 'Email успешно подтверждён',
        })


# ============================================
# PASSWORD RESET
# ============================================

@extend_schema(tags=['Authentication'])
class PasswordResetRequestView(APIView):
    """
    Request password reset link.
    POST /api/auth/password/reset/
    
    Sends password reset email if user exists.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        import secrets
        from django.core.mail import send_mail
        from django.conf import settings
        
        email = request.data.get('email', '').strip().lower()
        
        if not email:
            return Response(
                {'error': 'Email обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Always return success to prevent email enumeration
        try:
            user = User.objects.get(email=email)
            
            # Generate token
            token = secrets.token_urlsafe(32)
            user.password_reset_token = token
            user.password_reset_sent_at = timezone.now()
            user.save(update_fields=['password_reset_token', 'password_reset_sent_at'])
            
            # Send email
            frontend_url = getattr(settings, 'FRONTEND_URL', 'https://lider-garant.ru')
            reset_url = f"{frontend_url}/reset-password/{token}"
            
            send_mail(
                subject='Сброс пароля - Лидер Гарант',
                message=f'''
Здравствуйте!

Вы запросили сброс пароля для вашего аккаунта.
Для установки нового пароля перейдите по ссылке:
{reset_url}

Ссылка действительна 24 часа.

Если вы не запрашивали сброс пароля, проигнорируйте это письмо.

С уважением,
Команда Лидер Гарант
                ''',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except User.DoesNotExist:
            pass  # Don't reveal if email exists
        
        return Response({
            'message': 'Если email существует в системе, письмо будет отправлено',
        })


@extend_schema(tags=['Authentication'])
class PasswordResetConfirmView(APIView):
    """
    Confirm password reset with token.
    POST /api/auth/password/reset/confirm/<token>/
    
    Body:
    - password: string
    - password_confirm: string
    """
    permission_classes = [AllowAny]

    def post(self, request, token):
        from datetime import timedelta
        
        password = request.data.get('password', '')
        password_confirm = request.data.get('password_confirm', '')
        
        if not password:
            return Response(
                {'error': 'Пароль обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if password != password_confirm:
            return Response(
                {'error': 'Пароли не совпадают'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(password) < 8:
            return Response(
                {'error': 'Пароль должен быть не менее 8 символов'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(password_reset_token=token)
        except User.DoesNotExist:
            return Response(
                {'error': 'Неверный или устаревший токен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check token expiration (24 hours)
        if user.password_reset_sent_at:
            if timezone.now() - user.password_reset_sent_at > timedelta(hours=24):
                return Response(
                    {'error': 'Токен истёк. Запросите новую ссылку'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        user.set_password(password)
        user.password_reset_token = None
        user.save(update_fields=['password', 'password_reset_token'])
        
        return Response({
            'message': 'Пароль успешно изменён',
        })

