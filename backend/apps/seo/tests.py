from django.test import TestCase, override_settings

from .models import SeoPage
from .serializers import SeoPageSerializer


@override_settings(MEDIA_URL='/media/')
class SeoPageSerializerTest(TestCase):
    def test_representation_keeps_public_path_verbatim(self):
        page = SeoPage.objects.create(slug='test-page', hero_image='/images/hero.jpg')

        serializer = SeoPageSerializer(page)

        self.assertEqual(serializer.data['hero_image'], '/images/hero.jpg')

    def test_representation_uses_media_url_for_storage_relative_path(self):
        page = SeoPage.objects.create(slug='test-page-2', hero_image='seo/hero/test.jpg')

        serializer = SeoPageSerializer(page)

        self.assertEqual(serializer.data['hero_image'], '/media/seo/hero/test.jpg')

    def test_validate_hero_image_strips_media_prefix_from_relative_url(self):
        serializer = SeoPageSerializer(data={'slug': 'test-page', 'hero_image': '/media/seo/hero/test.jpg'})

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['hero_image'], 'seo/hero/test.jpg')

    def test_validate_hero_image_strips_media_prefix_from_absolute_url(self):
        serializer = SeoPageSerializer(data={'slug': 'test-page', 'hero_image': 'https://lider-garant.test/media/seo/hero/test.jpg'})

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['hero_image'], 'seo/hero/test.jpg')
