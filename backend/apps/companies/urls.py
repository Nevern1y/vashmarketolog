"""
URL configuration for Companies app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CompanyProfileViewSet, MyCompanyView, CRMClientViewSet

router = DefaultRouter()
router.register(r'', CompanyProfileViewSet, basename='company')

crm_router = DefaultRouter()
crm_router.register(r'', CRMClientViewSet, basename='crm-client')

app_name = 'companies'

urlpatterns = [
    # Current user's own company
    path('me/', MyCompanyView.as_view(), name='my-company'),
    
    # Agent CRM clients
    path('crm/', include(crm_router.urls)),
    
    # Standard CRUD
    path('', include(router.urls)),
]
