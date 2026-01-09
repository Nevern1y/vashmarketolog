"""
URL configuration for Documents app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import DocumentViewSet, DocumentRequestViewSet

router = DefaultRouter()
router.register(r'requests', DocumentRequestViewSet, basename='document-request')
router.register(r'', DocumentViewSet, basename='document')

app_name = 'documents'

urlpatterns = [
    path('', include(router.urls)),
]
