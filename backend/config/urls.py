"""
URL configuration for Lider Garant project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API v1 endpoints
    path('api/auth/', include('apps.users.urls')),
    path('api/companies/', include('apps.companies.urls')),
    path('api/documents/', include('apps.documents.urls')),
    path('api/applications/', include('apps.applications.urls')),
    path('api/chat/', include('apps.chat.urls')),
    path('api/dictionaries/', include('apps.dictionaries.urls')),
    path('api/news/', include('apps.news.urls')),
]


# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
