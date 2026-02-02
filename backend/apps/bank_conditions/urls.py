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
)

router = DefaultRouter()
router.register(r'banks', BankViewSet, basename='bank')
router.register(r'conditions', BankConditionViewSet, basename='condition')
router.register(r'individual-reviews', IndividualReviewConditionViewSet, basename='individual-review')
router.register(r'rko', RKOConditionViewSet, basename='rko')
router.register(r'stop-factors', StopFactorViewSet, basename='stop-factor')
router.register(r'all', BankConditionsAggregatedViewSet, basename='all')

urlpatterns = [
    path('', include(router.urls)),
    path('partner/profile/', PartnerBankProfileView.as_view(), name='partner-bank-profile'),
]
