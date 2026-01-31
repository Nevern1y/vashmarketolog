"""
Notification serializers for API.
"""
from rest_framework import serializers
from .models import Notification, NotificationType, LeadNotificationSettings


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


class LeadNotificationSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for LeadNotificationSettings.
    
    Handles GET/PUT for lead email notification settings.
    """
    updated_by_email = serializers.EmailField(source='updated_by.email', read_only=True)
    
    class Meta:
        model = LeadNotificationSettings
        fields = [
            'email_enabled',
            'recipient_emails',
            'updated_at',
            'updated_by_email',
        ]
        read_only_fields = ['updated_at', 'updated_by_email']
    
    def validate_recipient_emails(self, value):
        """Validate that all items are valid email addresses."""
        if not value:
            return []
        
        if not isinstance(value, list):
            raise serializers.ValidationError('Должен быть список email адресов')
        
        validated_emails = []
        for email in value:
            if not email or not isinstance(email, str):
                continue
            email = email.strip()
            if email:
                # Basic email validation
                if '@' not in email or '.' not in email.split('@')[-1]:
                    raise serializers.ValidationError(f'Некорректный email: {email}')
                validated_emails.append(email)
        
        return validated_emails
