"""
URL configuration for Chat app (REST endpoints).
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import MessageViewSet

router = DefaultRouter()
router.register(r'', MessageViewSet, basename='message')

app_name = 'chat'

urlpatterns = [
    path('', include(router.urls)),
]
