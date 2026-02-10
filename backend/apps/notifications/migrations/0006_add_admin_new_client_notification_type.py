from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0005_notificationsettings'),
    ]

    operations = [
        migrations.AlterField(
            model_name='notification',
            name='type',
            field=models.CharField(
                choices=[
                    ('decision_approved', 'Заявка одобрена'),
                    ('decision_rejected', 'Заявка отклонена'),
                    ('decision_info_requested', 'Возвращение на доработку'),
                    ('status_change', 'Изменение статуса заявки'),
                    ('new_application', 'Новая заявка'),
                    ('document_verified', 'Документ проверен'),
                    ('document_rejected', 'Документ отклонён'),
                    ('document_requested', 'Запрос документа'),
                    ('chat_message', 'Новое сообщение'),
                    ('admin_new_application', 'Новая заявка (админ)'),
                    ('admin_new_lead', 'Новый лид'),
                    ('admin_new_agent', 'Новый агент'),
                    ('admin_new_client', 'Новый клиент'),
                    ('admin_new_partner', 'Новый партнёр'),
                    ('admin_application_sent', 'Заявка отправлена в банк'),
                ],
                db_index=True,
                max_length=30,
                verbose_name='Тип',
            ),
        ),
    ]
