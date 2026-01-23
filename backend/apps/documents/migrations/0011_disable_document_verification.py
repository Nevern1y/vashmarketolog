"""
Disable document verification: auto-verify on upload and remove verification fields.
"""
from django.db import migrations, models


def set_documents_verified(apps, schema_editor):
    """Set all existing documents to verified status."""
    Document = apps.get_model('documents', 'Document')
    Document.objects.all().update(status='verified')


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0010_add_missing_balance_sheet_types'),
    ]

    operations = [
        migrations.RunPython(set_documents_verified, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name='document',
            name='rejection_reason',
        ),
        migrations.RemoveField(
            model_name='document',
            name='verified_at',
        ),
        migrations.RemoveField(
            model_name='document',
            name='verified_by',
        ),
        migrations.AlterField(
            model_name='document',
            name='status',
            field=models.CharField(choices=[('pending', 'На проверке'), ('verified', 'Проверен'), ('rejected', 'Отклонён'), ('not_allowed', 'Не допущен')], default='verified', max_length=20, verbose_name='Статус'),
        ),
    ]
