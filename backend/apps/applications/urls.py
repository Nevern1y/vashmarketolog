"""
URL configuration for Applications app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers as nested_routers

from .views import ApplicationViewSet, PartnerDecisionViewSet, ClientStatsView, TicketMessageViewSet, CalculationSessionViewSet

# Main applications router
router = DefaultRouter()
router.register(r'', ApplicationViewSet, basename='application')

# Calculation sessions router (separate endpoint)
calc_sessions_router = DefaultRouter()
calc_sessions_router.register(r'', CalculationSessionViewSet, basename='calculation-session')

# Nested router for messages under applications
# Creates: /applications/{application_pk}/messages/
messages_router = nested_routers.NestedDefaultRouter(router, r'', lookup='application')
messages_router.register(r'messages', TicketMessageViewSet, basename='application-messages')

# Decisions router (separate endpoint)
decisions_router = DefaultRouter()
decisions_router.register(r'', PartnerDecisionViewSet, basename='decision')

app_name = 'applications'

urlpatterns = [
    # Client stats endpoint
    path('stats/client/', ClientStatsView.as_view(), name='client-stats'),
    
    # Calculation sessions (root applications for bank selection)
    path('calculation-sessions/', include(calc_sessions_router.urls)),
    
    # Partner decisions (separate endpoint for viewing all)
    path('decisions/', include(decisions_router.urls)),
    
    # Standard CRUD + custom actions (MUST BE BEFORE nested routes to allow POST)
    path('', include(router.urls)),
    
    # Nested messages routes (won't conflict - matches /id/messages/)
    path('', include(messages_router.urls)),
]
