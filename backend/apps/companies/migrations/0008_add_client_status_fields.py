# Generated migration for client_status fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('companies', '0007_phase1_tz_compliance'),
    ]

    operations = [
        migrations.AddField(
            model_name='companyprofile',
            name='client_status',
            field=models.CharField(
                choices=[('pending', 'На рассмотрении'), ('confirmed', 'Закреплен')],
                default='pending',
                help_text='pending = добавлен агентом, confirmed = зарегистрирован и аккредитован',
                max_length=20,
                verbose_name='Статус клиента'
            ),
        ),
        migrations.AddField(
            model_name='companyprofile',
            name='invitation_email',
            field=models.EmailField(
                blank=True,
                default='',
                help_text='Email на который отправлено приглашение',
                max_length=254,
                verbose_name='Email для приглашения'
            ),
        ),
        migrations.AddField(
            model_name='companyprofile',
            name='invitation_token',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Уникальный токен для связывания регистрации клиента',
                max_length=64,
                verbose_name='Токен приглашения'
            ),
        ),
    ]
