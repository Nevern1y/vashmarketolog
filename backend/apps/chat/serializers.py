"""
API Serializers for Chat.
"""
from rest_framework import serializers
from .models import ApplicationMessage


class MessageSerializer(serializers.ModelSerializer):
    """
    Full serializer for chat messages.
    """
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    sender_name = serializers.CharField(read_only=True)
    sender_role = serializers.CharField(read_only=True)
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = ApplicationMessage
        fields = [
            'id',
            'application',
            'sender',
            'sender_email',
            'sender_name',
            'sender_role',
            'text',
            'attachment',
            'attachment_url',
            'is_moderated',
            'is_read',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'sender',
            'sender_email',
            'sender_name',
            'sender_role',
            'is_moderated',
            'created_at',
        ]

    def get_attachment_url(self, obj):
        """Get full URL for attachment."""
        if obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
            return obj.attachment.url
        return None


class MessageCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating chat messages.
    """
    class Meta:
        model = ApplicationMessage
        fields = [
            'application',
            'text',
            'attachment',
        ]

    def validate_application(self, value):
        """Validate user has access to this application's chat."""
        user = self.context['request'].user
        
        # Admin can access all chats
        if user.role == 'admin' or user.is_superuser:
            return value
        
        # Check if user is involved in this application
        if user.role == 'partner':
            if value.assigned_partner != user:
                raise serializers.ValidationError('Вы не назначены на эту заявку.')
        else:  # Client/Agent
            if value.created_by != user and value.company.owner != user:
                raise serializers.ValidationError('У вас нет доступа к этой заявке.')
        
        return value

    def create(self, validated_data):
        """Set sender from request user."""
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)


class MessageListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for message list.
    """
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    sender_name = serializers.CharField(read_only=True)
    sender_role = serializers.CharField(read_only=True)

    class Meta:
        model = ApplicationMessage
        fields = [
            'id',
            'sender_email',
            'sender_name',
            'sender_role',
            'text',
            'is_read',
            'created_at',
        ]
        read_only_fields = fields


class MessageModerateSerializer(serializers.Serializer):
    """
    Serializer for message moderation (Admin only).
    """
    is_moderated = serializers.BooleanField()
