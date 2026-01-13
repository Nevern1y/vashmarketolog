from rest_framework import serializers
from .models import SeoPage

class SeoPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeoPage
        fields = '__all__'
