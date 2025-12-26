"""
API Views for Chat (REST endpoints for message history).
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django.db.models import Q
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import ApplicationMessage
from .serializers import (
    MessageSerializer,
    MessageCreateSerializer,
    MessageListSerializer,
    MessageModerateSerializer,
)
from apps.users.permissions import IsAdmin


@extend_schema(tags=['Chat'])
@extend_schema_view(
    list=extend_schema(description='List messages for an application'),
    create=extend_schema(description='Send a new message'),
    retrieve=extend_schema(description='Get message details'),
)
class MessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Chat Messages.
    
    Provides REST API for:
    - Loading message history before connecting to WebSocket
    - Sending messages via REST (alternative to WebSocket)
    - Message moderation (Admin)
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    http_method_names = ['get', 'post']  # No update/delete

    def get_queryset(self):
        user = self.request.user
        
        # Filter by application if provided
        application_id = self.request.query_params.get('application_id')
        queryset = ApplicationMessage.objects.all()
        
        if application_id:
            queryset = queryset.filter(application_id=application_id)
        
        # Admin sees all
        if user.role == 'admin' or user.is_superuser:
            return queryset
        
        # Partner sees messages from assigned applications
        if user.role == 'partner':
            return queryset.filter(application__assigned_partner=user)
        
        # Client/Agent see messages from their applications
        return queryset.filter(
            Q(application__created_by=user) | Q(application__company__owner=user)
        )

    def get_serializer_class(self):
        if self.action == 'create':
            return MessageCreateSerializer
        if self.action == 'list':
            return MessageListSerializer
        return MessageSerializer

    def perform_create(self, serializer):
        """Set sender to current user."""
        serializer.save(sender=self.request.user)

    @extend_schema(
        request=MessageModerateSerializer,
        responses={200: MessageSerializer}
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def moderate(self, request, pk=None):
        """
        Moderate a message (Admin only).
        POST /api/chat/{id}/moderate/
        """
        message = self.get_object()
        serializer = MessageModerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        message.is_moderated = serializer.validated_data['is_moderated']
        message.moderated_by = request.user
        message.moderated_at = timezone.now()
        message.save()
        
        return Response(MessageSerializer(message, context={'request': request}).data)

    @extend_schema(responses={200: MessageListSerializer(many=True)})
    @action(detail=False, methods=['get'])
    def by_application(self, request):
        """
        Get messages for a specific application.
        GET /api/chat/by_application/?application_id={id}
        
        Use this to load chat history before connecting to WebSocket.
        """
        application_id = request.query_params.get('application_id')
        
        if not application_id:
            return Response(
                {'error': 'application_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(application_id=application_id)
        serializer = MessageListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        """
        Mark messages as read.
        POST /api/chat/mark_read/
        Body: {"message_ids": [1, 2, 3]}
        """
        message_ids = request.data.get('message_ids', [])
        
        if not message_ids:
            return Response(
                {'error': 'message_ids is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mark as read only messages not sent by current user
        updated = ApplicationMessage.objects.filter(
            id__in=message_ids
        ).exclude(sender=request.user).update(is_read=True)
        
        return Response({'updated': updated})
