"""
Views for Bank Conditions API.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from .models import Bank, BankCondition, IndividualReviewCondition, RKOCondition, StopFactor
from .serializers import (
    BankSerializer,
    BankConditionSerializer,
    IndividualReviewConditionSerializer,
    RKOConditionSerializer,
    StopFactorSerializer,
    BankConditionsAggregatedSerializer,
    PartnerBankProfileSerializer,
)
from apps.users.permissions import IsPartner


class BankViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Banks.
    """
    queryset = Bank.objects.filter(is_active=True)
    serializer_class = BankSerializer
    permission_classes = [IsAuthenticated]


class BankConditionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Bank Conditions (Table 1).
    """
    queryset = BankCondition.objects.filter(is_active=True).select_related('bank')
    serializer_class = BankConditionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by bank
        bank_id = self.request.query_params.get('bank')
        if bank_id:
            queryset = queryset.filter(bank_id=bank_id)
        
        # Filter by product type
        product = self.request.query_params.get('product')
        if product:
            queryset = queryset.filter(product__icontains=product)
        
        # Sort options
        sort_by = self.request.query_params.get('sort_by', 'bank')
        if sort_by == 'rate':
            queryset = queryset.order_by('rate_min')
        elif sort_by == 'sum':
            queryset = queryset.order_by('-sum_max')
        elif sort_by == 'term':
            queryset = queryset.order_by('-term_months')
        
        return queryset


class IndividualReviewConditionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Individual Review Conditions (Table 2).
    """
    queryset = IndividualReviewCondition.objects.filter(is_active=True).select_related('bank')
    serializer_class = IndividualReviewConditionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        bank_id = self.request.query_params.get('bank')
        if bank_id:
            queryset = queryset.filter(bank_id=bank_id)
        
        fz_type = self.request.query_params.get('fz_type')
        if fz_type:
            queryset = queryset.filter(fz_type__icontains=fz_type)
        
        return queryset


class RKOConditionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for RKO Conditions.
    """
    queryset = RKOCondition.objects.filter(is_active=True).select_related('bank')
    serializer_class = RKOConditionSerializer
    permission_classes = [IsAuthenticated]


class StopFactorViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Stop Factors.
    """
    queryset = StopFactor.objects.filter(is_active=True)
    serializer_class = StopFactorSerializer
    permission_classes = [IsAuthenticated]


class BankConditionsAggregatedViewSet(viewsets.ViewSet):
    """
    Single endpoint that returns all bank conditions data aggregated.
    """
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """Return all bank conditions data in a single response."""
        data = {
            'banks': Bank.objects.filter(is_active=True),
            'conditions': BankCondition.objects.filter(is_active=True).select_related('bank'),
            'individual_reviews': IndividualReviewCondition.objects.filter(is_active=True).select_related('bank'),
            'rko_conditions': RKOCondition.objects.filter(is_active=True).select_related('bank'),
            'stop_factors': StopFactor.objects.filter(is_active=True),
        }
        
        serializer = BankConditionsAggregatedSerializer(data)
        return Response(serializer.data)


@extend_schema(tags=['Partner Bank Profile'])
class PartnerBankProfileView(APIView):
    """
    Partner's bank profile management.
    GET /api/bank-conditions/partner/profile/ - Get partner's bank profile
    PATCH /api/bank-conditions/partner/profile/ - Update partner's bank profile
    """
    permission_classes = [IsAuthenticated, IsPartner]
    
    def get(self, request):
        """Get the current partner's bank profile."""
        try:
            bank = Bank.objects.get(partner_user=request.user)
            serializer = PartnerBankProfileSerializer(bank)
            return Response(serializer.data)
        except Bank.DoesNotExist:
            return Response(
                {'error': 'Профиль банка не найден. Обратитесь к администратору.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def patch(self, request):
        """Update the current partner's bank profile."""
        try:
            bank = Bank.objects.get(partner_user=request.user)
        except Bank.DoesNotExist:
            return Response(
                {'error': 'Профиль банка не найден. Обратитесь к администратору.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = PartnerBankProfileSerializer(bank, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
