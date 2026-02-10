from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import SeoPage
from .serializers import SeoPageSerializer
from apps.users.permissions import IsSeoManagerOrAdmin


class SeoPageViewSet(viewsets.ModelViewSet):
    """
    ViewSet для SEO страниц с поддержкой:
    - Получение по slug
    - Catch-all routing для несуществующих страниц
    - Фильтрация по типу страницы
    
    Permissions:
    - GET (list, retrieve, by_type, by_template): AllowAny (публичные SEO страницы)
    - POST, PUT, PATCH, DELETE: IsSeoManagerOrAdmin (только admin или seo роли)
    """
    
    queryset = SeoPage.objects.filter(is_published=True)
    serializer_class = SeoPageSerializer
    lookup_field = 'slug'
    lookup_value_regex = '.*'
    pagination_class = None  # Disable pagination for admin dashboard simplicity
    
    def get_permissions(self):
        """
        Dynamic permissions based on action:
        - Public read operations: AllowAny (public SEO pages for website)
        - Admin list: IsSeoManagerOrAdmin (returns drafts + published)
        - Write operations: IsSeoManagerOrAdmin (admin or seo role required)
        """
        if self.action in ['list', 'retrieve', 'by_type', 'by_template']:
            return [permissions.AllowAny()]
        if self.action in ['admin_list']:
            return [IsSeoManagerOrAdmin()]
        # create, update, partial_update, destroy require SEO manager or admin
        return [IsSeoManagerOrAdmin()]
    
    def get_queryset(self):
        """
        Improved queryset with proper 404 handling.
        
        For SEO managers and admins: show all pages (including drafts)
        For public: show only published pages
        
        FIXED: Returns empty queryset for unknown slugs instead of fallback,
        allowing proper 404 responses from retrieve().
        """
        # Check if user is authenticated and has SEO/admin access
        user = self.request.user
        if user.is_authenticated and (user.role in ['admin', 'seo'] or user.is_superuser):
            # SEO managers and admins see all pages including drafts
            base_queryset = SeoPage.objects.all()
        else:
            # Public users see only published pages
            base_queryset = SeoPage.objects.filter(is_published=True)
        
        slug = self.kwargs.get('slug')
        
        if slug:
            # Remove leading / if present
            clean_slug = slug.lstrip('/')
            
            # Look for exact match only - no fallback to priority page
            # This ensures proper 404 for unknown slugs
            exact_match = base_queryset.filter(slug=clean_slug).first()
            if exact_match:
                return SeoPage.objects.filter(id=exact_match.id)
            
            # SECURITY FIX: Return empty queryset for unknown slugs
            # This allows retrieve() to return proper 404 response
            # instead of serving wrong content for incorrect URLs
            return SeoPage.objects.none()
        
        return base_queryset.order_by('-priority', 'slug')
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """
        Получить страницы по типу (page_type).
        
        Query params:
        - type: тип страницы (product, landing, custom)
        """
        page_type = request.query_params.get('type')
        if page_type:
            pages = self.queryset.filter(page_type=page_type)
            serializer = self.get_serializer(pages, many=True)
            return Response(serializer.data)
        
        return Response(
            {'error': 'Параметр type обязателен'},
            status=400
        )
    
    @action(detail=False, methods=['get'])
    def by_template(self, request):
        """
        Получить страницы по имени шаблона.
        
        Query params:
        - template: имя шаблона (factoring, rko, leasing, ...)
        """
        template_name = request.query_params.get('template')
        if template_name:
            pages = self.get_queryset().filter(
                Q(template_name=template_name) | Q(autofill_template=template_name)
            )
            serializer = self.get_serializer(pages, many=True)
            return Response(serializer.data)
        
        return Response(
            {'error': 'Параметр template обязателен'},
            status=400
        )

    @action(detail=False, methods=['get'], url_path='admin-list')
    def admin_list(self, request):
        """
        Returns all SEO pages for admin/SEO manager dashboard.

        Unlike public list(), this endpoint includes drafts and unpublished pages.
        """
        pages = SeoPage.objects.all().order_by('-priority', 'slug')
        serializer = self.get_serializer(pages, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        """
        Override retrieve for proper 404 handling.
        
        FIXED: Returns 404 for unknown slugs instead of fallback to priority page.
        This prevents serving wrong content for incorrect URLs and ensures
        proper SEO (search engines won't index wrong URLs).
        """
        try:
            return super().retrieve(request, *args, **kwargs)
        except Exception:
            # Return proper 404 - no fallback to priority page
            return Response(
                {'error': 'Страница не найдена', 'detail': 'Page not found'},
                status=404
            )
