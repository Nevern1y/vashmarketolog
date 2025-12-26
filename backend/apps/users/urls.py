"""
URL configuration for Users app.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenVerifyView

from .views import (
    RegisterView,
    LoginView,
    RefreshTokenView,
    LogoutView,
    MeView,
    PasswordChangeView,
    PartnerInviteView,
    PartnerAcceptInviteView,
    UserListView,
)

app_name = 'users'

urlpatterns = [
    # Public authentication endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', RefreshTokenView.as_view(), name='token_refresh'),
    path('verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('logout/', LogoutView.as_view(), name='logout'),
    
    # User profile endpoints
    path('me/', MeView.as_view(), name='me'),
    path('password/change/', PasswordChangeView.as_view(), name='password_change'),
    
    # Partner invite endpoints
    path('accept-invite/<uuid:token>/', PartnerAcceptInviteView.as_view(), name='accept_invite'),
    
    # Admin endpoints
    path('admin/invite-partner/', PartnerInviteView.as_view(), name='invite_partner'),
    path('admin/users/', UserListView.as_view(), name='user_list'),
]
