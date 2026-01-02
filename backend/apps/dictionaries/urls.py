"""
URL configuration for Dictionaries API.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentTypeDictionaryViewSet, StatusDictionaryViewSet

router = DefaultRouter()
router.register(r'document-types', DocumentTypeDictionaryViewSet, basename='document-types')
router.register(r'statuses', StatusDictionaryViewSet, basename='statuses')

urlpatterns = [
    path('', include(router.urls)),
]
