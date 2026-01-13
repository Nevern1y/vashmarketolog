import os
import django
from django.conf import settings

# Setup Django environment
if not settings.configured:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
    django.setup()

from django.contrib.auth import get_user_model, authenticate

User = get_user_model()
email = 'agent@lidergarantpanel.com'
password = 'Admin123!'

print(f"Verifying authentication for {email}...")

try:
    user = User.objects.get(email=email)
    print(f"User found: {user.email} (Active: {user.is_active})")
    print(f"Password Check: {user.check_password(password)}")
    
    auth_user = authenticate(email=email, password=password)
    if auth_user:
        print("Authentication Successful via authenticate()")
    else:
        print("Authentication FAILED via authenticate()")
        
except User.DoesNotExist:
    print("User NOT found")
