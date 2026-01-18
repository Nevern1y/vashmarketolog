# Generated manually for SEO role and admin users
# This migration:
# 1. Updates the role field choices to include 'seo'
# 2. Creates admin and SEO manager users

from django.db import migrations, models
from django.contrib.auth.hashers import make_password


def create_admin_users(apps, schema_editor):
    """
    Create admin and SEO manager users for production.
    
    Users created:
    1. administrator-lider-garant.com (admin) - Full access to SEO + Dashboard
    2. SEOadmin-lider-garant.com (seo) - Access only to SEO admin panel
    """
    User = apps.get_model('users', 'User')
    
    # Admin user - full access everywhere
    old_admin_email = 'administrator-lider-garant.com'
    new_admin_email = 'administrator-lider-garant@admin.com'
    
    # Check for new email first
    if User.objects.filter(email=new_admin_email).exists():
        print(f'Admin user already exists: {new_admin_email}')
    # Check for old email and update if found
    elif User.objects.filter(email=old_admin_email).exists():
        user = User.objects.get(email=old_admin_email)
        user.email = new_admin_email
        user.save()
        print(f'Updated admin email from {old_admin_email} to {new_admin_email}')
    else:
        # Create new if neither exists
        User.objects.create(
            email=new_admin_email,
            password=make_password('administrator$lider$garant'),
            role='admin',
            is_active=True,
            is_staff=True,  # Can access Django admin
            is_superuser=True,  # Full permissions
            first_name='Administrator',
            last_name='Lider Garant',
        )
        print(f'Created admin user: {new_admin_email}')
    
    # SEO Manager user - only SEO admin access
    seo_email = 'SEOadmin-lider-garant.com'
    if not User.objects.filter(email=seo_email).exists():
        User.objects.create(
            email=seo_email,
            password=make_password('SEOadmin$lider$garant'),
            role='seo',  # New SEO role
            is_active=True,
            is_staff=False,  # Cannot access Django admin
            is_superuser=False,  # No superuser permissions
            first_name='SEO',
            last_name='Manager',
        )
        print(f'Created SEO manager user: {seo_email}')
    else:
        print(f'SEO manager user already exists: {seo_email}')


def remove_admin_users(apps, schema_editor):
    """
    Reverse migration: remove created users.
    """
    User = apps.get_model('users', 'User')
    
    User.objects.filter(email='administrator-lider-garant.com').delete()
    User.objects.filter(email='administrator-lider-garant@admin.com').delete()
    User.objects.filter(email='SEOadmin-lider-garant.com').delete()
    print('Removed admin and SEO manager users')


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_user_avatar'),
    ]

    operations = [
        # 1. Update role field to include 'seo' choice
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('client', 'Клиент'),
                    ('agent', 'Агент'),
                    ('partner', 'Партнёр (Банк)'),
                    ('admin', 'Администратор'),
                    ('seo', 'SEO-менеджер'),
                ],
                default='client',
                max_length=20,
                verbose_name='Роль',
            ),
        ),
        
        # 2. Create admin users
        migrations.RunPython(create_admin_users, remove_admin_users),
    ]
