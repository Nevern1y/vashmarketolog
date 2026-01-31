# Generated migration for LeadNotificationSettings

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('notifications', '0003_update_notification_type_choices'),
    ]

    operations = [
        migrations.CreateModel(
            name='LeadNotificationSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email_enabled', models.BooleanField(
                    default=True,
                    help_text='Включить/выключить отправку email при получении нового лида',
                    verbose_name='Email-уведомления включены'
                )),
                ('recipient_emails', models.JSONField(
                    blank=True,
                    default=list,
                    help_text='Список email адресов для уведомлений о новых лидах. Если пусто - отправляется всем админам.',
                    verbose_name='Email-адреса получателей'
                )),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Дата обновления')),
                ('updated_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='lead_notification_settings_updates',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Обновлено пользователем'
                )),
            ],
            options={
                'verbose_name': 'Настройки уведомлений о лидах',
                'verbose_name_plural': 'Настройки уведомлений о лидах',
            },
        ),
    ]
