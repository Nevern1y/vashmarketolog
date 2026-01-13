from rest_framework import viewsets, permissions
from .models import SeoPage
from .serializers import SeoPageSerializer

class SeoPageViewSet(viewsets.ModelViewSet):
    queryset = SeoPage.objects.all()
    serializer_class = SeoPageSerializer
    lookup_field = 'slug'
    lookup_value_regex = '.*'
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
