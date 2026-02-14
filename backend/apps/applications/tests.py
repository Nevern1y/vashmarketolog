from typing import Any

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from apps.applications.models import Lead
from apps.applications.serializers import ApplicationAssignSerializer
from apps.users.models import UserRole

User = get_user_model()

class ApplicationAssignSerializerTest(TestCase):
    def test_assign_inactive_partner(self):
        """
        Test that an inactive partner can be assigned to an application.
        This is an MVP requirement: allow assigning to partners who haven't accepted invite yet.
        """
        # Create an inactive partner
        partner = User.objects.create_user(
            email="inactive_partner_test@example.com",
            password="password123",
            role=UserRole.PARTNER,
            is_active=False
        )

        # Ensure partner is inactive
        self.assertFalse(partner.is_active)
        self.assertEqual(partner.role, UserRole.PARTNER)

        # Test serializer validation
        data = {'partner_id': partner.id}
        serializer = ApplicationAssignSerializer(data=data)

        # Should be valid
        self.assertTrue(serializer.is_valid(), serializer.errors)
        validated_data: Any = serializer.validated_data
        self.assertEqual(validated_data['partner_id'], partner.id)

    def test_assign_non_existent_partner(self):
        """Test that assigning a non-existent partner fails."""
        data = {'partner_id': 99999}
        serializer = ApplicationAssignSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('partner_id', serializer.errors)

    def test_assign_non_partner_role(self):
        """Test that assigning a user with non-partner role fails."""
        client = User.objects.create_user(
            email="client_test@example.com",
            password="password123",
            role=UserRole.CLIENT
        )

        data = {'partner_id': client.id}
        serializer = ApplicationAssignSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('partner_id', serializer.errors)


class PublicLeadCreateViewTest(APITestCase):
    def setUp(self):
        self.url = '/api/applications/leads/'

    def test_public_lead_create_without_authentication(self):
        response: Any = self.client.post(
            self.url,
            {
                'full_name': 'Тестовый Пользователь',
                'phone': '+7 (999) 123-45-67',
                'source': 'website_form',
                'form_name': 'test_form',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Lead._default_manager.count(), 1)

        lead = Lead._default_manager.first()
        self.assertIsNotNone(lead)
        self.assertEqual(lead.full_name, 'Тестовый Пользователь')
        self.assertEqual(lead.form_name, 'test_form')

    def test_public_lead_create_with_invalid_auth_header(self):
        response: Any = self.client.post(
            self.url,
            {
                'name': 'Иван Петров',
                'phone': '+7 (999) 987-65-43',
                'source': 'website_form',
                'form_name': 'auth_header_form',
            },
            format='json',
            HTTP_AUTHORIZATION='Bearer definitely.invalid.token',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        lead = Lead._default_manager.get(form_name='auth_header_form')
        self.assertEqual(lead.full_name, 'Иван Петров')

    def test_public_lead_create_rejects_short_phone(self):
        response: Any = self.client.post(
            self.url,
            {
                'full_name': 'Короткий Телефон',
                'phone': '12345',
                'source': 'website_form',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone', response.data)
