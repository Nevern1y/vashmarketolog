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
    Returns invite link for the partner.
    """
    serializer_class = PartnerInviteSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def create(self, request, *args, **kwargs):
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
        
        # Generate invite URL (frontend will handle this)
        invite_url = f"/accept-invite/{user.invite_token}/"
        
        return Response({
            'message': 'Приглашение создано',
            'partner': {
                'id': user.id,
                'email': user.email,
                'invite_token': str(user.invite_token),
            },
            'invite_url': invite_url,
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
