# Generated migration for NotificationSettings

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('notifications', '0004_leadnotificationsettings'),
    ]

    operations = [
        migrations.CreateModel(
            name='NotificationSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email_enabled', models.BooleanField(default=True, verbose_name='Email-уведомления включены')),
                ('email_new_applications', models.BooleanField(default=True, verbose_name='Email для новых заявок')),
                ('email_status_changes', models.BooleanField(default=True, verbose_name='Email для изменений статуса')),
                ('email_chat_messages', models.BooleanField(default=True, verbose_name='Email для сообщений в чате')),
                ('email_marketing', models.BooleanField(default=False, verbose_name='Email для маркетинговых рассылок')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Дата обновления')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='notification_settings', to=settings.AUTH_USER_MODEL, verbose_name='Пользователь')),
            ],
            options={
                'verbose_name': 'Настройки уведомлений',
                'verbose_name_plural': 'Настройки уведомлений',
            },
        ),
    ]
