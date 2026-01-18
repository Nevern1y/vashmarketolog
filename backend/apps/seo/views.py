from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
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
        - Read operations: AllowAny (public SEO pages for website)
        - Write operations: IsSeoManagerOrAdmin (admin or seo role required)
        """
        if self.action in ['list', 'retrieve', 'by_type', 'by_template']:
            return [permissions.AllowAny()]
        # create, update, partial_update, destroy require SEO manager or admin
        return [IsSeoManagerOrAdmin()]
    
    def get_queryset(self):
        """
        Улучшенный queryset с поддержкой приоритетов.
        
        For SEO managers and admins: show all pages (including drafts)
        For public: show only published pages
        
        Priority logic:
        1. Exact slug match first
        2. If no exact match, return highest priority page
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
            # Убираем начальный / если есть
            clean_slug = slug.lstrip('/')
            
            # Ищем точное совпадение
            exact_match = base_queryset.filter(slug=clean_slug).first()
            if exact_match:
                # Фильтруем только этот объект
                return SeoPage.objects.filter(id=exact_match.id)
            
            # Если точного совпадения нет, возвращаем страницу с наивысшим приоритетом
            priority_page = base_queryset.order_by('-priority').first()
            if priority_page:
                return SeoPage.objects.filter(id=priority_page.id)
        
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
            pages = self.queryset.filter(template_name=template_name)
            serializer = self.get_serializer(pages, many=True)
            return Response(serializer.data)
        
        return Response(
            {'error': 'Параметр template обязателен'},
            status=400
        )
    
    def retrieve(self, request, *args, **kwargs):
        """
        Override retrieve для поддержки catch-all.
        
        Если slug не существует, вернуть страницу с наивысшим приоритетом (если есть)
        """
        try:
            return super().retrieve(request, *args, **kwargs)
        except:
            # Try fallback to highest priority page
            priority_page = self.queryset.order_by('-priority').first()
            if priority_page:
                serializer = self.get_serializer(priority_page)
                return Response(serializer.data)
            
            # No pages found
            return Response(
                {'error': 'Страница не найдена'},
                status=404
            )
