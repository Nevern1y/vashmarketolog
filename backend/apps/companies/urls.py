"""
URL configuration for Companies app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CompanyProfileViewSet, MyCompanyView, CRMClientViewSet, AdminCRMClientViewSet, AdminDirectClientsViewSet

router = DefaultRouter()
router.register(r'', CompanyProfileViewSet, basename='company')

crm_router = DefaultRouter()
crm_router.register(r'', CRMClientViewSet, basename='crm-client')

# Admin router for CRM clients management
admin_crm_router = DefaultRouter()
admin_crm_router.register(r'', AdminCRMClientViewSet, basename='admin-crm-client')

# Admin router for Direct clients (registered without agent)
admin_direct_router = DefaultRouter()
admin_direct_router.register(r'', AdminDirectClientsViewSet, basename='admin-direct-client')

app_name = 'companies'

urlpatterns = [
    # Current user's own company
    path('me/', MyCompanyView.as_view(), name='my-company'),
    
    # Agent CRM clients
    path('crm/', include(crm_router.urls)),
    
    # Admin CRM clients management
    path('admin/crm/', include(admin_crm_router.urls)),
    
    # Admin Direct clients (registered without agent) - read-only
    path('admin/direct/', include(admin_direct_router.urls)),
    
    # Standard CRUD
    path('', include(router.urls)),
]
