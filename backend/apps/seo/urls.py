from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SeoPageViewSet

router = DefaultRouter()
router.register(r'pages', SeoPageViewSet)

admin_list_view = SeoPageViewSet.as_view({'get': 'admin_list'})

urlpatterns = [
    path('pages-admin-list/', admin_list_view, name='seo-pages-admin-list'),
    path('', include(router.urls)),
]
