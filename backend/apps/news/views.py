"""
News views.
"""
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import F
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
        # Atomic increment of view count (avoids race conditions)
        # Uses F() expression for atomic update without fetching the value
        News.objects.filter(pk=instance.pk).update(views_count=F('views_count') + 1)
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
        """
        Get news grouped by category.
        Optimized: uses annotate and Prefetch to avoid N+1 queries.
        """
        from django.db.models import Count, Q, Prefetch
        
        # Annotate categories with published news count (avoids N+1 in serializer)
        # Prefetch latest published news for each category
        categories = NewsCategory.objects.filter(is_active=True).annotate(
            published_news_count=Count('news', filter=Q(news__is_published=True))
        ).prefetch_related(
            Prefetch(
                'news',
                queryset=News.objects.filter(is_published=True).select_related('category', 'author').order_by('-published_at')[:5],
                to_attr='recent_published_news'
            )
        )
        
        result = []
        for cat in categories:
            # Build category data with annotated count (no extra query)
            cat_data = {
                'id': cat.id,
                'name': cat.name,
                'slug': cat.slug,
                'order': cat.order,
                'is_active': cat.is_active,
                'news_count': cat.published_news_count,
                'created_at': cat.created_at.isoformat() if cat.created_at else None,
            }
            result.append({
                'category': cat_data,
                'news': NewsListSerializer(cat.recent_published_news, many=True).data,
            })
        return Response(result)
