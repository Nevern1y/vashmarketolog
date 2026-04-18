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

    def test_create_page_defaults_are_applied_from_h1_when_template_fields_empty(self):
        serializer = SeoPageSerializer(data={
            'slug': 'create-page-defaults',
            'h1_title': 'Кредиты для бизнеса',
            'template_name': 'create-page',
            'hero_button_text': '',
            'best_offers_title': '',
            'application_form_title': '',
            'application_button_text': '',
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['hero_button_text'], 'Оставить заявку')
        self.assertEqual(serializer.validated_data['best_offers_title'], 'Лучшие предложения — Кредиты для бизнеса')
        self.assertEqual(serializer.validated_data['application_form_title'], 'Оставьте заявку — Кредиты для бизнеса')
        self.assertEqual(serializer.validated_data['application_button_text'], 'Оставить заявку')

    def test_partial_update_applies_create_page_defaults_when_fields_are_empty(self):
        page = SeoPage.objects.create(
            slug='create-page-partial',
            h1_title='Старый H1',
            template_name='create-page',
            hero_button_text='',
            best_offers_title='',
            application_form_title='',
            application_button_text='',
        )

        serializer = SeoPageSerializer(instance=page, data={'h1_title': 'Новый H1'}, partial=True)

        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated = serializer.save()
        self.assertEqual(updated.hero_button_text, 'Оставить заявку')
        self.assertEqual(updated.best_offers_title, 'Лучшие предложения — Новый H1')
        self.assertEqual(updated.application_form_title, 'Оставьте заявку — Новый H1')
        self.assertEqual(updated.application_button_text, 'Оставить заявку')
