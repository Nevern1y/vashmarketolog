"""
News views.
"""
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import NewsCategory, News
from .serializers import (
    NewsCategorySerializer,
    NewsListSerializer,
    NewsDetailSerializer,
    NewsCreateUpdateSerializer,
)


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Admin can do everything, others can only read.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class NewsCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for news categories.
    Admin: full CRUD
    Others: read only
    """
    queryset = NewsCategory.objects.all()
    serializer_class = NewsCategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['order', 'name', 'created_at']
    ordering = ['order', 'name']

    def get_queryset(self):
        qs = super().get_queryset()
        # Non-admins see only active categories
        if not (self.request.user.is_authenticated and self.request.user.role == 'admin'):
            qs = qs.filter(is_active=True)
        return qs


class NewsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for news articles.
    Admin: full CRUD
    Others: read only (published only)
    """
    queryset = News.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'summary', 'content']
    ordering_fields = ['published_at', 'created_at', 'views_count']
    ordering = ['-published_at', '-created_at']
    lookup_field = 'slug'

    def get_queryset(self):
        qs = super().get_queryset()
        # Non-admins see only published news
        if not (self.request.user.is_authenticated and self.request.user.role == 'admin'):
            qs = qs.filter(is_published=True)
        
        # Manual filtering (replacement for DjangoFilterBackend)
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category_id=category)
        
        is_featured = self.request.query_params.get('is_featured')
        if is_featured is not None:
            qs = qs.filter(is_featured=is_featured.lower() == 'true')
        
        return qs.select_related('category', 'author')

    def get_serializer_class(self):
        if self.action == 'list':
            return NewsListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return NewsCreateUpdateSerializer
        return NewsDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment view count
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured/recent news for homepage."""
        featured = self.get_queryset().filter(is_featured=True)[:5]
        recent = self.get_queryset().filter(is_featured=False)[:10]
        return Response({
            'featured': NewsListSerializer(featured, many=True).data,
            'recent': NewsListSerializer(recent, many=True).data,
        })

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get news grouped by category."""
        categories = NewsCategory.objects.filter(is_active=True).prefetch_related('news')
        result = []
        for cat in categories:
            news = cat.news.filter(is_published=True)[:5]
            result.append({
                'category': NewsCategorySerializer(cat).data,
                'news': NewsListSerializer(news, many=True).data,
            })
        return Response(result)
