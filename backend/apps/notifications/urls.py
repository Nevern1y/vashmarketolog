"""
URL configuration for notifications app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, LeadNotificationSettingsView

router = DefaultRouter()
router.register('', NotificationViewSet, basename='notification')

urlpatterns = [
    # Admin settings endpoint
    path('admin/settings/lead-notifications/', 
         LeadNotificationSettingsView.as_view(), 
         name='lead-notification-settings'),
    
    # Regular notification endpoints
    path('', include(router.urls)),
]
