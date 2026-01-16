"""
Notification API views.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import Notification
from .serializers import (
    NotificationSerializer,
    NotificationListSerializer,
    UnreadCountSerializer,
    MarkReadSerializer,
    MarkAllReadSerializer,
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
