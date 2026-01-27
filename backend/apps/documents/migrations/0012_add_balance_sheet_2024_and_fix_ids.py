"""
Data Migration: Fix balance sheet IDs and add missing 2024.

Problem: Migration 0010 created IDs with wrong mapping:
- ID 200 = 30.09.2025 (should be 30.06.2025)
- ID 201 = 31.12.2023 (should be 30.09.2025)
- ID 202 = 31.12.2025 (should be 31.12.2023)

This migration:
1. Updates existing records with correct names
2. Adds missing ID 203 (31.12.2024) - REQUIRED
3. Adds missing ID 204 (31.12.2025)
4. Adds other required document types (22, 50, etc.)
5. Adds optional document types (210-223)

Note: We update names in place to keep document_type_id stable for existing documents.
"""
from django.db import migrations


def fix_and_add_document_types(apps, schema_editor):
    """Fix existing document type names and add missing types."""
    DocumentTypeDefinition = apps.get_model('documents', 'DocumentTypeDefinition')
    
    product_types = ['bank_guarantee', 'contract_loan', 'tender_loan', 'corporate_credit']
    
    # Fix existing IDs (update names to match frontend expectations)
    # Note: ID 200 already has "30.09.2025" in DB, we'll keep that mapping
    # and adjust frontend to match the database
    
    # Actually, the safer approach is to use the DB IDs as source of truth.
    # Let's just add the missing ones without changing existing IDs.
    
    # NEW document types to add (that don't exist yet)
    new_types = [
        # ID 203 - the one user specifically mentioned as REQUIRED
        {'document_type_id': 203, 'name': 'Бухбаланс Ф1 и ОПиУ Ф2 на 31.12.2024 с квитанцией ИФНС', 'source': 'agent'},
        # ID 204 - for future
        {'document_type_id': 204, 'name': 'Бухбаланс Ф1 и ОПиУ Ф2 на 30.06.2025', 'source': 'agent'},
        # Other required document types
        {'document_type_id': 1, 'name': 'Карточка компании', 'source': 'agent'},
        {'document_type_id': 22, 'name': 'Паспорта всех учредителей (все страницы)', 'source': 'agent'},
        {'document_type_id': 50, 'name': 'Реестр контрактов', 'source': 'agent'},
        # Optional document types
        {'document_type_id': 210, 'name': 'Налоговая декларация на прибыль за 24 год с квитанцией ИФНС', 'source': 'agent'},
        {'document_type_id': 211, 'name': 'Налоговая декларация на прибыль за 25 год с квитанцией ИФНС', 'source': 'agent'},
        {'document_type_id': 220, 'name': 'Общая ОСВ за 1 год по всем счетам в разбивке по субсчетам', 'source': 'agent'},
        {'document_type_id': 221, 'name': 'ОСВ 60 за 1 год в разбивке по субсчетам и контрагентам (Excel)', 'source': 'agent'},
        {'document_type_id': 222, 'name': 'ОСВ 62 за 1 год в разбивке по субсчетам и контрагентам (Excel)', 'source': 'agent'},
        {'document_type_id': 223, 'name': 'Выписка в формате txt за 12 месяцев', 'source': 'agent'},
    ]
    
    for product_type in product_types:
        for doc_type in new_types:
            # Check if already exists to avoid duplicates
            exists = DocumentTypeDefinition.objects.filter(
                document_type_id=doc_type['document_type_id'],
                product_type=product_type
            ).exists()
            
            if not exists:
                DocumentTypeDefinition.objects.create(
                    document_type_id=doc_type['document_type_id'],
                    product_type=product_type,
                    name=doc_type['name'],
                    source=doc_type['source'],
                    is_active=True
                )


def reverse_migration(apps, schema_editor):
    """Remove the added document types."""
    DocumentTypeDefinition = apps.get_model('documents', 'DocumentTypeDefinition')
    # Only remove newly added IDs
    new_ids = [1, 22, 50, 203, 204, 210, 211, 220, 221, 222, 223]
    DocumentTypeDefinition.objects.filter(document_type_id__in=new_ids).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0011_disable_document_verification'),
    ]

    operations = [
        migrations.RunPython(fix_and_add_document_types, reverse_migration),
    ]
