"""
News models for Lider Garant.
Categories and News articles for the platform.
"""
from django.db import models
from django.conf import settings


class NewsCategory(models.Model):
    """
    News category model.
    Categories are created and managed by admin.
    """
    name = models.CharField(
        'Название',
        max_length=100,
    )
    slug = models.SlugField(
        'Slug',
        max_length=100,
        unique=True,
    )
    order = models.PositiveIntegerField(
        'Порядок сортировки',
        default=0,
    )
    is_active = models.BooleanField(
        'Активна',
        default=True,
    )
    created_at = models.DateTimeField(
        'Дата создания',
        auto_now_add=True,
    )

    class Meta:
        verbose_name = 'Категория новостей'
        verbose_name_plural = 'Категории новостей'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class News(models.Model):
    """
    News article model.
    """
    title = models.CharField(
        'Заголовок',
        max_length=255,
    )
    slug = models.SlugField(
        'Slug',
        max_length=255,
        unique=True,
        blank=True,
    )
    summary = models.TextField(
        'Краткое описание',
        max_length=500,
        blank=True,
    )
    content = models.TextField(
        'Содержание',
    )
    category = models.ForeignKey(
        NewsCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='news',
        verbose_name='Категория',
    )
    image = models.ImageField(
        'Изображение',
        upload_to='news/images/',
        blank=True,
        null=True,
        help_text='Изображение для новости',
    )
    is_featured = models.BooleanField(
        'Главная новость',
        default=False,
        help_text='Отображать в блоке главных новостей',
    )
    is_published = models.BooleanField(
        'Опубликована',
        default=True,
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='authored_news',
        verbose_name='Автор',
    )
    views_count = models.PositiveIntegerField(
        'Количество просмотров',
        default=0,
    )
    published_at = models.DateTimeField(
        'Дата публикации',
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(
        'Дата создания',
        auto_now_add=True,
    )
    updated_at = models.DateTimeField(
        'Дата обновления',
        auto_now=True,
    )

    class Meta:
        verbose_name = 'Новость'
        verbose_name_plural = 'Новости'
        ordering = ['-published_at', '-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Auto-generate slug from title if not provided
        if not self.slug:
            from django.utils.text import slugify
            import re
            import unicodedata
            
            # Simple transliteration for Cyrillic
            translit_map = {
                'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
                'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
                'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
                'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
                'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
            }
            
            slug_base = self.title.lower()
            for cyr, lat in translit_map.items():
                slug_base = slug_base.replace(cyr, lat)
            
            self.slug = slugify(slug_base)[:250] or f"news-{self.pk or 'new'}"
            
            # Ensure uniqueness
            original_slug = self.slug
            counter = 1
            while News.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{original_slug[:240]}-{counter}"
                counter += 1
        super().save(*args, **kwargs)

