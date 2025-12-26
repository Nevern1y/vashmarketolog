"""
WebSocket consumers for real-time chat.
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

User = get_user_model()


class ApplicationChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for per-application chat rooms.
    
    Connection URL: ws://host/ws/chat/application/{application_id}/?token={jwt_token}
    
    Messages are JSON with format:
    - Inbound: {"type": "message", "text": "...", "attachment_url": "..."}
    - Outbound: {"type": "message", "id": ..., "sender": {...}, "text": "...", ...}
    """

    async def connect(self):
        """Handle WebSocket connection."""
        self.application_id = self.scope['url_route']['kwargs']['application_id']
        self.room_group_name = f'chat_{self.application_id}'
        
        # Authenticate user via JWT token in query string
        self.user = await self.get_user_from_token()
        
        if not self.user:
            await self.close()
            return
        
        # Check user has access to this application
        has_access = await self.check_application_access()
        if not has_access:
            await self.close()
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'application_id': self.application_id,
            'user_email': self.user.email,
        }))

    async def disconnect(self, close_code):
        """Handle WebSocket disconnect."""
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """Handle incoming WebSocket message."""
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
            return
        
        message_type = data.get('type')
        
        if message_type == 'message':
            await self.handle_chat_message(data)
        elif message_type == 'typing':
            await self.handle_typing(data)
        elif message_type == 'read':
            await self.handle_read(data)
        else:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Unknown message type: {message_type}'
            }))

    async def handle_chat_message(self, data):
        """Handle incoming chat message."""
        text = data.get('text', '').strip()
        
        if not text:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Message text is required'
            }))
            return
        
        # Save message to database
        message = await self.save_message(text)
        
        # Broadcast to room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message_id': message.id,
                'sender_id': self.user.id,
                'sender_email': self.user.email,
                'sender_name': self.user.get_full_name() or self.user.email,
                'sender_role': self.user.role,
                'text': text,
                'created_at': message.created_at.isoformat(),
            }
        )

    async def handle_typing(self, data):
        """Handle typing indicator."""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator',
                'user_email': self.user.email,
                'is_typing': data.get('is_typing', True),
            }
        )

    async def handle_read(self, data):
        """Handle message read acknowledgment."""
        message_id = data.get('message_id')
        if message_id:
            await self.mark_message_read(message_id)

    async def chat_message(self, event):
        """Send chat message to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'message',
            'id': event['message_id'],
            'sender': {
                'id': event['sender_id'],
                'email': event['sender_email'],
                'name': event['sender_name'],
                'role': event['sender_role'],
            },
            'text': event['text'],
            'created_at': event['created_at'],
        }))

    async def typing_indicator(self, event):
        """Send typing indicator to WebSocket."""
        # Don't send to the user who is typing
        if event['user_email'] != self.user.email:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'user_email': event['user_email'],
                'is_typing': event['is_typing'],
            }))

    @database_sync_to_async
    def get_user_from_token(self):
        """Extract and validate JWT token from query string."""
        query_string = self.scope.get('query_string', b'').decode()
        params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
        token_str = params.get('token')
        
        if not token_str:
            return None
        
        try:
            token = AccessToken(token_str)
            user_id = token.get('user_id')
            return User.objects.get(id=user_id, is_active=True)
        except (InvalidToken, TokenError, User.DoesNotExist):
            return None

    @database_sync_to_async
    def check_application_access(self):
        """Check if user has access to this application."""
        from apps.applications.models import Application
        
        try:
            application = Application.objects.get(id=self.application_id)
        except Application.DoesNotExist:
            return False
        
        # Admin has access to all
        if self.user.role == 'admin' or self.user.is_superuser:
            return True
        
        # Partner must be assigned
        if self.user.role == 'partner':
            return application.assigned_partner == self.user
        
        # Client/Agent must own the application
        return application.created_by == self.user or application.company.owner == self.user

    @database_sync_to_async
    def save_message(self, text):
        """Save message to database."""
        from apps.applications.models import Application
        from .models import ApplicationMessage
        
        application = Application.objects.get(id=self.application_id)
        message = ApplicationMessage.objects.create(
            application=application,
            sender=self.user,
            text=text
        )
        return message

    @database_sync_to_async
    def mark_message_read(self, message_id):
        """Mark a message as read."""
        from .models import ApplicationMessage
        
        ApplicationMessage.objects.filter(
            id=message_id,
            application_id=self.application_id
        ).exclude(sender=self.user).update(is_read=True)
