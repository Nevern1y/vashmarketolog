# Generated manually to fix admin email address

from django.db import migrations

def fix_admin_email(apps, schema_editor):
    """
    Update administrator email from 'administrator-lider-garant.com' 
    to 'administrator-lider-garant@admin.com'
    """
    User = apps.get_model('users', 'User')
    
    old_email = 'administrator-lider-garant.com'
    new_email = 'administrator-lider-garant@admin.com'
    
    if User.objects.filter(email=old_email).exists():
        user = User.objects.get(email=old_email)
        user.email = new_email
        user.save()
        print(f'Successfully updated admin email to {new_email}')
    elif User.objects.filter(email=new_email).exists():
        print(f'Admin user already has correct email: {new_email}')
    else:
        print(f'Admin user not found with email {old_email}')

def revert_admin_email(apps, schema_editor):
    """
    Revert email change
    """
    User = apps.get_model('users', 'User')
    
    old_email = 'administrator-lider-garant.com'
    new_email = 'administrator-lider-garant@admin.com'
    
    if User.objects.filter(email=new_email).exists():
        user = User.objects.get(email=new_email)
        user.email = old_email
        user.save()

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_add_seo_role_and_users'),
    ]

    operations = [
        migrations.RunPython(fix_admin_email, revert_admin_email),
    ]
