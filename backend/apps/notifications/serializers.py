"""
Notification serializers for API.
"""
from rest_framework import serializers
from .models import Notification, NotificationType


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for Notification model.
    Returns all notification data for frontend consumption.
    """
    type_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'type',
            'type_display',
            'title',
            'message',
            'data',
            'is_read',
            'created_at',
        ]
        read_only_fields = fields

    def get_type_display(self, obj):
        """Get human-readable type name."""
        return obj.get_type_display()


class NotificationListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for notification lists.
    Optimized for dropdown display.
    """
    type_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'type',
            'type_display',
            'title',
            'message',
            'data',
            'is_read',
            'created_at',
        ]
        read_only_fields = fields

    def get_type_display(self, obj):
        return obj.get_type_display()


class UnreadCountSerializer(serializers.Serializer):
    """Serializer for unread count response."""
    unread_count = serializers.IntegerField()


class MarkReadSerializer(serializers.Serializer):
    """Serializer for mark as read response."""
    success = serializers.BooleanField()
    notification = NotificationSerializer(read_only=True)


class MarkAllReadSerializer(serializers.Serializer):
    """Serializer for mark all as read response."""
    success = serializers.BooleanField()
    count = serializers.IntegerField(help_text='Number of notifications marked as read')
