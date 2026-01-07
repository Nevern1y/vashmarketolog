"""
Data Migration: Add Agent Accreditation Document Types

This migration adds document types for agent accreditation:
- ID 8: Заявление о присоединении к регламенту (.sig)
- ID 9: Согласие на обработку персональных данных (.sig)
- ID 10: Лист записи/Скан свидетельства ОГРНИП (.pdf)
- ID 11: Агентский договор (.sig)
"""
from django.db import migrations


def add_agent_document_types(apps, schema_editor):
    """Add document types for agent accreditation."""
    DocumentTypeDefinition = apps.get_model('documents', 'DocumentTypeDefinition')
    
    agent_types = [
        (8, 'Заявление о присоединении к регламенту', 'agent'),
        (9, 'Согласие на обработку персональных данных', 'agent'),
        (10, 'Лист записи/Скан свидетельства ОГРНИП', 'agent'),
        (11, 'Агентский договор', 'agent'),
    ]
    
    for doc_id, name, source in agent_types:
        DocumentTypeDefinition.objects.create(
            document_type_id=doc_id,
            product_type='agent',
            name=name,
            source=source,
            is_active=True
        )


def reverse_add_agent_types(apps, schema_editor):
    """Reverse migration - remove agent document types."""
    DocumentTypeDefinition = apps.get_model('documents', 'DocumentTypeDefinition')
    DocumentTypeDefinition.objects.filter(product_type='agent').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0007_remove_documenttypedefinition_unique_doc_type_per_product_and_more'),
    ]

    operations = [
        migrations.RunPython(add_agent_document_types, reverse_add_agent_types),
    ]
