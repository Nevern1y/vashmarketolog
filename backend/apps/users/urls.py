"""
URL configuration for Users app.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenVerifyView

from .views import (
    RegisterView,
    SendRegistrationCodeView,
    LoginView,
    RefreshTokenView,
    LogoutView,
    MeView,
    PasswordChangeView,
    PartnerInviteView,
    PartnerAcceptInviteView,
    UserListView,
    # Phase 4: Accreditation views
    AccreditationListView,
    AccreditationDecisionView,
    SubmitAccreditationView,
    # Partner: My Agents
    MyAgentsView,
    # Client invitation registration
    InvitedClientRegisterView,
    # Email verification
    SendVerificationEmailView,
    VerifyEmailView,
    # Password reset
    PasswordResetRequestView,
    PasswordResetConfirmView,
)

app_name = 'users'

urlpatterns = [
    # Public authentication endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('register/send-code/', SendRegistrationCodeView.as_view(), name='register_send_code'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', RefreshTokenView.as_view(), name='token_refresh'),
    path('verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('logout/', LogoutView.as_view(), name='logout'),
    
    # User profile endpoints
    path('me/', MeView.as_view(), name='me'),
    path('password/change/', PasswordChangeView.as_view(), name='password_change'),
    
    # Email verification
    path('email/send-verification/', SendVerificationEmailView.as_view(), name='send_verification_email'),
    path('email/verify/<str:token>/', VerifyEmailView.as_view(), name='verify_email'),
    
    # Password reset
    path('password/reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password/reset/confirm/<str:token>/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # Partner invite endpoints
    path('accept-invite/<uuid:token>/', PartnerAcceptInviteView.as_view(), name='accept_invite'),
    
    # Client invitation registration (by agent)
    path('register/invited/<str:token>/', InvitedClientRegisterView.as_view(), name='register_invited'),
    
    # Agent accreditation endpoint
    path('accreditation/submit/', SubmitAccreditationView.as_view(), name='submit_accreditation'),
    
    # Partner endpoints
    path('my-agents/', MyAgentsView.as_view(), name='my_agents'),
    
    # Admin endpoints
    path('admin/invite-partner/', PartnerInviteView.as_view(), name='invite_partner'),
    path('admin/users/', UserListView.as_view(), name='user_list'),
    path('admin/accreditation/', AccreditationListView.as_view(), name='accreditation_list'),
    path('admin/accreditation/<int:pk>/', AccreditationDecisionView.as_view(), name='accreditation_decision'),
]

