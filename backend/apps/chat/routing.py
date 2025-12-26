"""
WebSocket routing for Chat app.
"""
from django.urls import re_path

from .consumers import ApplicationChatConsumer

websocket_urlpatterns = [
    re_path(
        r'ws/chat/application/(?P<application_id>\d+)/$',
        ApplicationChatConsumer.as_asgi()
    ),
]
