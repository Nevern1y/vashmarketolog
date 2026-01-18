"""
Django Signals for Companies app.

Automatically creates CompanyProfile for new Client/Agent users.
This ensures that email and phone from registration are transferred
to company contact fields.
"""
import re
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings

from .models import CompanyProfile


def format_russian_phone(phone: str) -> str:
    """
    Format a Russian phone number to +7 (XXX) XXX-XX-XX format.
    
    Handles various input formats:
    - 79001234567
    - 89001234567
    - +79001234567
    - 9001234567
    
    Returns formatted string or original if can't parse.
    """
    if not phone:
        return ''
    
    # Extract only digits
    digits = re.sub(r'\D', '', phone)
    
    # Handle different lengths
    if len(digits) == 11:
        # 79001234567 or 89001234567
        if digits.startswith('7') or digits.startswith('8'):
            digits = digits[1:]  # Remove leading 7 or 8
    elif len(digits) == 10:
        # 9001234567 - already without country code
        pass
    else:
        # Unknown format, return as-is
        return phone
    
    if len(digits) != 10:
        return phone
    
    # Format as +7 (XXX) XXX-XX-XX
    return f"+7 ({digits[:3]}) {digits[3:6]}-{digits[6:8]}-{digits[8:10]}"


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_company_profile_for_user(sender, instance, created, **kwargs):
    """
    Create a CompanyProfile for new Client or Agent users.
    
    This signal fires after User.save() and creates an empty company profile
    with contact info pre-filled from the user's registration data.
    
    Rules:
    - Only for newly created users (created=True)
    - Only for 'client' or 'agent' roles
    - Skip if user already has a non-CRM company profile (prevents duplicates)
    - Partners and Admins don't get auto-created profiles
    """
    if not created:
        return
    
    # Only create profiles for clients and agents
    if instance.role not in ('client', 'agent'):
        return
    
    # Check if user already has a personal company profile (non-CRM)
    # This prevents duplicates when InvitedClientRegisterView creates the profile manually
    existing_profile = CompanyProfile.objects.filter(
        owner=instance,
        is_crm_client=False
    ).exists()
    
    if existing_profile:
        return
    
    # Build contact_person from first_name and last_name
    contact_person = f"{instance.first_name} {instance.last_name}".strip()
    
    # Format phone number to Russian standard +7 (XXX) XXX-XX-XX
    formatted_phone = format_russian_phone(instance.phone or '')
    
    # Create empty company profile with contact info from registration
    CompanyProfile.objects.create(
        owner=instance,
        is_crm_client=False,
        inn='',  # Will be filled later by user
        name='',  # Will be filled later by user
        contact_email=instance.email,
        contact_phone=formatted_phone,
        contact_person=contact_person,
    )
