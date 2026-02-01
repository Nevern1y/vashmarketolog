"""
WebSocket routing for Chat app.
"""
from django.urls import re_path

from .consumers import ApplicationChatConsumer, AdminChatListConsumer

websocket_urlpatterns = [
    re_path(
        r'ws/chat/application/(?P<application_id>\d+)/$',
        ApplicationChatConsumer.as_asgi()
    ),
    re_path(
        r'ws/admin/chat-threads/$',
        AdminChatListConsumer.as_asgi()
    ),
]
