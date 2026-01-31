from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0023_alter_application_credit_sub_type_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='lead',
            name='inn',
            field=models.CharField(blank=True, default='', max_length=12, verbose_name='ИНН'),
        ),
    ]
