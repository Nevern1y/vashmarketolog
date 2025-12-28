from django.test import TestCase
from django.contrib.auth import get_user_model
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
        self.assertEqual(serializer.validated_data['partner_id'], partner.id)

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
