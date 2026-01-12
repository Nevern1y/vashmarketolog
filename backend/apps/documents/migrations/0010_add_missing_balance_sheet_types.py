"""
Data Migration: Add missing document types for balance sheets 2023 and 2025.

Requested document types:
- Бухбаланс Ф1 и ФР Ф2 на 30.09.2025
- Бухбаланс Ф1 и ФР Ф2 на 31.12.2023 с квитанцией ИФНС
- Бухбаланс Ф1 и ФР Ф2 на 31.12.2025 с квитанцией ИФНС
"""
from django.db import migrations


def add_missing_document_types(apps, schema_editor):
    """Add missing balance sheet document types for 2023 and 2025."""
    DocumentTypeDefinition = apps.get_model('documents', 'DocumentTypeDefinition')
    
    # New document types to add (using high IDs to avoid conflicts)
    new_types = [
        # Bank Guarantee (БГ)
        {'document_type_id': 200, 'product_type': 'bank_guarantee', 'name': 'Бухбаланс Ф1 и ФР Ф2 на 30.09.2025', 'source': 'agent'},
        {'document_type_id': 201, 'product_type': 'bank_guarantee', 'name': 'Бухбаланс Ф1 и ФР Ф2 на 31.12.2023 с квитанцией ИФНС', 'source': 'agent'},
        {'document_type_id': 202, 'product_type': 'bank_guarantee', 'name': 'Бухбаланс Ф1 и ФР Ф2 на 31.12.2025 с квитанцией ИФНС', 'source': 'agent'},
        
        # Contract Loan (КИК)
        {'document_type_id': 200, 'product_type': 'contract_loan', 'name': 'Бухбаланс Ф1 и ФР Ф2 на 30.09.2025', 'source': 'agent'},
        {'document_type_id': 201, 'product_type': 'contract_loan', 'name': 'Бухбаланс Ф1 и ФР Ф2 на 31.12.2023 с квитанцией ИФНС', 'source': 'agent'},
        {'document_type_id': 202, 'product_type': 'contract_loan', 'name': 'Бухбаланс Ф1 и ФР Ф2 на 31.12.2025 с квитанцией ИФНС', 'source': 'agent'},
        
        # Tender Loan (same as contract_loan)
        {'document_type_id': 200, 'product_type': 'tender_loan', 'name': 'Бухбаланс Ф1 и ФР Ф2 на 30.09.2025', 'source': 'agent'},
        {'document_type_id': 201, 'product_type': 'tender_loan', 'name': 'Бухбаланс Ф1 и ФР Ф2 на 31.12.2023 с квитанцией ИФНС', 'source': 'agent'},
        {'document_type_id': 202, 'product_type': 'tender_loan', 'name': 'Бухбаланс Ф1 и ФР Ф2 на 31.12.2025 с квитанцией ИФНС', 'source': 'agent'},
        
        # Also for corporate_credit
        {'document_type_id': 200, 'product_type': 'corporate_credit', 'name': 'Бухбаланс Ф1 и ФР Ф2 на 30.09.2025', 'source': 'agent'},
        {'document_type_id': 201, 'product_type': 'corporate_credit', 'name': 'Бухбаланс Ф1 и ФР Ф2 на 31.12.2023 с квитанцией ИФНС', 'source': 'agent'},
        {'document_type_id': 202, 'product_type': 'corporate_credit', 'name': 'Бухбаланс Ф1 и ФР Ф2 на 31.12.2025 с квитанцией ИФНС', 'source': 'agent'},
    ]
    
    for doc_type in new_types:
        # Check if already exists to avoid duplicates
        exists = DocumentTypeDefinition.objects.filter(
            document_type_id=doc_type['document_type_id'],
            product_type=doc_type['product_type']
        ).exists()
        
        if not exists:
            DocumentTypeDefinition.objects.create(
                document_type_id=doc_type['document_type_id'],
                product_type=doc_type['product_type'],
                name=doc_type['name'],
                source=doc_type['source'],
                is_active=True
            )


def reverse_migration(apps, schema_editor):
    """Remove the added document types."""
    DocumentTypeDefinition = apps.get_model('documents', 'DocumentTypeDefinition')
    DocumentTypeDefinition.objects.filter(document_type_id__in=[200, 201, 202]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0009_add_document_request'),
    ]

    operations = [
        migrations.RunPython(add_missing_document_types, reverse_migration),
    ]
