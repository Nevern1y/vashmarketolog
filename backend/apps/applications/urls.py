"""
URL configuration for Applications app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers as nested_routers

from .views import ApplicationViewSet, PartnerDecisionViewSet, ClientStatsView, TicketMessageViewSet

# Main applications router
router = DefaultRouter()
router.register(r'', ApplicationViewSet, basename='application')

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
    
    # Partner decisions (separate endpoint for viewing all)
    path('decisions/', include(decisions_router.urls)),
    
    # Standard CRUD + custom actions (MUST BE BEFORE nested routes to allow POST)
    path('', include(router.urls)),
    
    # Nested messages routes (won't conflict - matches /id/messages/)
    path('', include(messages_router.urls)),
]
