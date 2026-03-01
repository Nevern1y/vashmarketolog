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
            # Optimized: fetch all related objects in one query to avoid N+1
            application = Application.objects.select_related(
                'company', 'company__owner', 'assigned_partner', 'created_by'
            ).get(id=self.application_id)
        except Application.DoesNotExist:
            return False
        
        # Admin has access to all
        if self.user.role == 'admin' or self.user.is_superuser:
            return True
        
        # Partner must be assigned
        if self.user.role == 'partner':
            return application.assigned_partner_id == self.user.id
        
        # Client/Agent must own the application
        return (
            application.created_by_id == self.user.id or 
            (application.company and application.company.owner_id == self.user.id)
        )

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


class AdminChatListConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for admin chat list page.
    
    Broadcasts updates when:
    - New message arrives (not from admin)
    - Message is marked as read
    - Admin replies to a thread
    
    Connection URL: ws://host/ws/admin/chat-threads/?token={jwt_token}
    
    Outbound messages:
    - {\"type\": \"threads_update\", \"threads\": [...]}
    - {\"type\": \"new_message\", \"application_id\": ..., \"preview\": ...}
    """
    
    GROUP_NAME = 'admin_chat_threads'
    
    async def connect(self):
        """Handle WebSocket connection."""
        # Authenticate user via JWT token in query string
        self.user = await self.get_user_from_token()
        
        if not self.user:
            await self.close()
            return
        
        # Check user is admin
        is_admin = await self.check_is_admin()
        if not is_admin:
            await self.close()
            return
        
        # Join admin chat threads group
        await self.channel_layer.group_add(
            self.GROUP_NAME,
            self.channel_name
        )
        
        await self.accept()
        
        # Send initial threads data
        threads = await self.get_chat_threads()
        await self.send(text_data=json.dumps({
            'type': 'threads_update',
            'threads': threads,
        }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnect."""
        await self.channel_layer.group_discard(
            self.GROUP_NAME,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Handle incoming WebSocket message (refresh request)."""
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return
        
        if data.get('type') == 'refresh':
            threads = await self.get_chat_threads()
            await self.send(text_data=json.dumps({
                'type': 'threads_update',
                'threads': threads,
            }))
    
    async def threads_update(self, event):
        """Send threads update to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'threads_update',
            'threads': event['threads'],
        }))
    
    async def new_message_notification(self, event):
        """Send new message notification to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'application_id': event['application_id'],
            'company_name': event.get('company_name', ''),
            'sender_name': event.get('sender_name', ''),
            'preview': event.get('preview', ''),
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
    def check_is_admin(self):
        """Check if user is admin."""
        return self.user.role == 'admin' or self.user.is_superuser or self.user.is_staff
    
    @database_sync_to_async
    def get_chat_threads(self):
        """Get list of chat threads for admin."""
        from apps.applications.models import Application, TicketMessage
        from django.db.models import Count, Q, Max, OuterRef, Subquery, CharField
        
        # Subquery to get the role of the last message sender for each application
        last_message_sender_role = Subquery(
            TicketMessage.objects.filter(
                application_id=OuterRef('application_id')
            ).order_by('-created_at').values('sender__role')[:1],
            output_field=CharField()
        )
        
        # Get applications with chat activity that need attention
        threads_data = list(
            TicketMessage.objects
            .values('application_id')
            .annotate(
                unread_count=Count(
                    'id', 
                    filter=Q(is_read=False) & ~Q(sender__role='admin')
                ),
                last_message_at=Max('created_at'),
                last_sender_role=last_message_sender_role,
            )
            .filter(
                Q(unread_count__gt=0) |  # Has unread messages from non-admins
                ~Q(last_sender_role='admin')  # Last message is not from admin
            )
            .order_by('-last_message_at')
        )
        
        result = []
        application_ids = [t['application_id'] for t in threads_data]
        
        if not application_ids:
            return result
        
        # Prefetch applications
        applications = {
            app.id: app 
            for app in Application.objects.filter(id__in=application_ids).select_related('company')
        }
        
        # Get last non-admin message for each application (for preview)
        last_messages = {}
        for app_id in application_ids:
            last_msg = (
                TicketMessage.objects
                .filter(application_id=app_id)
                .exclude(sender__role='admin')
                .select_related('sender')
                .order_by('-created_at')
                .first()
            )
            if last_msg:
                last_messages[app_id] = last_msg
        
        for thread in threads_data:
            app_id = thread['application_id']
            app = applications.get(app_id)
            last_msg = last_messages.get(app_id)
            
            if not app or not last_msg:
                continue
            
            # Get sender name
            sender_name = ''
            sender_email = None
            if last_msg.sender:
                if last_msg.sender.first_name or last_msg.sender.last_name:
                    sender_name = f"{last_msg.sender.first_name or ''} {last_msg.sender.last_name or ''}" .strip()
                if not sender_name:
                    sender_name = last_msg.sender.email
                sender_email = last_msg.sender.email
            else:
                sender_name = 'Удалённый пользователь'
            
            # Check if admin replied (last message is from admin)
            admin_replied = thread['last_sender_role'] == 'admin'
            
            # Skip if all read AND admin replied
            if thread['unread_count'] == 0 and admin_replied:
                continue
            
            result.append({
                'application_id': app_id,
                'company_name': app.company.name if app.company else f'Заявка #{app_id}',
                'last_sender_email': sender_email,
                'last_sender_name': sender_name,
                'last_message_preview': last_msg.content[:100] if last_msg.content else '[Файл]',
                'unread_count': thread['unread_count'],
                'admin_replied': admin_replied,
                'last_message_at': thread['last_message_at'].isoformat() if thread['last_message_at'] else None,
            })
        
        return result
