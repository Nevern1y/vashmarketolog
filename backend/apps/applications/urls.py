"""
URL configuration for Applications app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ApplicationViewSet, PartnerDecisionViewSet, ClientStatsView

router = DefaultRouter()
router.register(r'', ApplicationViewSet, basename='application')

decisions_router = DefaultRouter()
decisions_router.register(r'', PartnerDecisionViewSet, basename='decision')

app_name = 'applications'

urlpatterns = [
    # Client stats endpoint
    path('stats/client/', ClientStatsView.as_view(), name='client-stats'),
    
    # Partner decisions (separate endpoint for viewing all)
    path('decisions/', include(decisions_router.urls)),
    
    # Standard CRUD + custom actions
    path('', include(router.urls)),
]
