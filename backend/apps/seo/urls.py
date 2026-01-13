from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SeoPageViewSet

router = DefaultRouter()
router.register(r'pages', SeoPageViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
