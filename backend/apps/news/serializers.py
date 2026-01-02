"""
News serializers.
"""
from rest_framework import serializers
from .models import NewsCategory, News


class NewsCategorySerializer(serializers.ModelSerializer):
    """Serializer for news categories."""
    news_count = serializers.SerializerMethodField()

    class Meta:
        model = NewsCategory
        fields = ['id', 'name', 'slug', 'order', 'is_active', 'news_count', 'created_at']
        read_only_fields = ['id', 'created_at', 'news_count']

    def get_news_count(self, obj):
        return obj.news.filter(is_published=True).count()


class NewsListSerializer(serializers.ModelSerializer):
    """Serializer for news list (short version)."""
    category = NewsCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=NewsCategory.objects.all(),
        source='category',
        write_only=True,
        required=False,
        allow_null=True,
    )
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = News
        fields = [
            'id', 'title', 'slug', 'summary', 'category', 'category_id',
            'image', 'is_featured', 'is_published', 'author_name',
            'views_count', 'published_at', 'created_at',
        ]
        read_only_fields = ['id', 'slug', 'views_count', 'created_at', 'author_name']

    def get_author_name(self, obj):
        if obj.author:
            return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.email
        return None


class NewsDetailSerializer(NewsListSerializer):
    """Serializer for news detail (full content)."""

    class Meta(NewsListSerializer.Meta):
        fields = NewsListSerializer.Meta.fields + ['content', 'updated_at']


class NewsCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating news (admin only)."""
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=NewsCategory.objects.all(),
        source='category',
        required=False,
        allow_null=True,
    )

    class Meta:
        model = News
        fields = [
            'id', 'title', 'slug', 'summary', 'content', 'category_id',
            'image', 'is_featured', 'is_published', 'published_at',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        # Set author to current user
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)
