"""
Notification API views.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, extend_schema_view

from apps.users.permissions import IsAdmin
from .models import Notification, LeadNotificationSettings, NotificationSettings
from .serializers import (
    NotificationSerializer,
    NotificationListSerializer,
    UnreadCountSerializer,
    MarkReadSerializer,
    MarkAllReadSerializer,
    NotificationSettingsSerializer,
    LeadNotificationSettingsSerializer,
)


class NotificationPagination(PageNumberPagination):
    """Pagination for notifications."""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


@extend_schema(tags=['Notifications'])
@extend_schema_view(
    list=extend_schema(description='List notifications for current user'),
    retrieve=extend_schema(description='Get notification details'),
)
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for user notifications.
    
    Provides:
    - GET /notifications/ - List all notifications for current user
    - GET /notifications/{id}/ - Get specific notification
    - POST /notifications/{id}/read/ - Mark as read
    - POST /notifications/read_all/ - Mark all as read
    - GET /notifications/unread_count/ - Get unread count
    """
    permission_classes = [IsAuthenticated]
    pagination_class = NotificationPagination

    def get_queryset(self):
        """Return notifications for current user only."""
        return Notification.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'list':
            return NotificationListSerializer
        return NotificationSerializer

    @extend_schema(
        responses={200: MarkReadSerializer},
        description='Mark a specific notification as read'
    )
    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        """
        Mark notification as read.
        POST /notifications/{id}/read/
        """
        notification = self.get_object()
        notification.mark_as_read()
        
        return Response({
            'success': True,
            'notification': NotificationSerializer(notification).data
        })

    @extend_schema(
        responses={200: MarkAllReadSerializer},
        description='Mark all notifications as read for current user'
    )
    @action(detail=False, methods=['post'])
    def read_all(self, request):
        """
        Mark all notifications as read.
        POST /notifications/read_all/
        """
        queryset = self.get_queryset().filter(is_read=False)
        count = queryset.count()
        queryset.update(is_read=True)
        
        return Response({
            'success': True,
            'count': count
        })

    @extend_schema(
        responses={200: UnreadCountSerializer},
        description='Get count of unread notifications'
    )
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """
        Get unread notification count.
        GET /notifications/unread_count/
        """
        count = Notification.get_unread_count(request.user)
        return Response({'unread_count': count})


@extend_schema(tags=['Notifications'])
class NotificationSettingsView(APIView):
    """
    API view for user notification settings (email only).

    GET /api/notifications/settings/
    PUT /api/notifications/settings/
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: NotificationSettingsSerializer},
        description='Get current notification settings for user'
    )
    def get(self, request):
        settings_obj = NotificationSettings.get_settings(request.user)
        serializer = NotificationSettingsSerializer(settings_obj)
        return Response(serializer.data)

    @extend_schema(
        request=NotificationSettingsSerializer,
        responses={200: NotificationSettingsSerializer},
        description='Update notification settings for user'
    )
    def put(self, request):
        settings_obj = NotificationSettings.get_settings(request.user)
        serializer = NotificationSettingsSerializer(
            settings_obj,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['Admin Settings'])
class LeadNotificationSettingsView(APIView):
    """
    API view for lead notification settings.
    
    Admin-only endpoint to get and update lead email notification settings.
    
    GET /api/admin/settings/lead-notifications/
    PUT /api/admin/settings/lead-notifications/
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    
    @extend_schema(
        responses={200: LeadNotificationSettingsSerializer},
        description='Get current lead notification settings'
    )
    def get(self, request):
        """Get current settings."""
        settings_obj = LeadNotificationSettings.get_settings()
        serializer = LeadNotificationSettingsSerializer(settings_obj)
        return Response(serializer.data)
    
    @extend_schema(
        request=LeadNotificationSettingsSerializer,
        responses={200: LeadNotificationSettingsSerializer},
        description='Update lead notification settings'
    )
    def put(self, request):
        """Update settings."""
        settings_obj = LeadNotificationSettings.get_settings()
        serializer = LeadNotificationSettingsSerializer(
            settings_obj, 
            data=request.data, 
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save(updated_by=request.user)
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
