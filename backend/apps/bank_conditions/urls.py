"""
URL configuration for Bank Conditions API.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BankViewSet,
    BankConditionViewSet,
    IndividualReviewConditionViewSet,
    RKOConditionViewSet,
    StopFactorViewSet,
    BankConditionsAggregatedViewSet,
    PartnerBankProfileView,
    AdminBankViewSet,
    AdminBankConditionViewSet,
    AdminIndividualReviewConditionViewSet,
    AdminRKOConditionViewSet,
    AdminStopFactorViewSet,
)

router = DefaultRouter()
router.register(r'banks', BankViewSet, basename='bank')
router.register(r'conditions', BankConditionViewSet, basename='condition')
router.register(r'individual-reviews', IndividualReviewConditionViewSet, basename='individual-review')
router.register(r'rko', RKOConditionViewSet, basename='rko')
router.register(r'stop-factors', StopFactorViewSet, basename='stop-factor')
router.register(r'all', BankConditionsAggregatedViewSet, basename='all')

admin_router = DefaultRouter()
admin_router.register(r'banks', AdminBankViewSet, basename='admin-bank')
admin_router.register(r'conditions', AdminBankConditionViewSet, basename='admin-condition')
admin_router.register(r'individual-reviews', AdminIndividualReviewConditionViewSet, basename='admin-individual-review')
admin_router.register(r'rko', AdminRKOConditionViewSet, basename='admin-rko')
admin_router.register(r'stop-factors', AdminStopFactorViewSet, basename='admin-stop-factor')

urlpatterns = [
    path('', include(router.urls)),
    path('partner/profile/', PartnerBankProfileView.as_view(), name='partner-bank-profile'),
    path('admin/', include(admin_router.urls)),
]
