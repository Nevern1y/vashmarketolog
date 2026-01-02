"""
Migration: Add DocumentTypeDefinition reference table and update Document model.

BREAKING CHANGE: 
- Removes old string-based document_type field
- Adds numeric document_type_id field (per Appendix B)
- Adds product_type field for product-specific document handling
- Creates DocumentTypeDefinition reference table
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0004_alter_document_document_type'),
    ]

    operations = [
        # 1. Create DocumentTypeDefinition reference table
        migrations.CreateModel(
            name='DocumentTypeDefinition',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('document_type_id', models.IntegerField(help_text='Числовой ID из Приложения Б (17, 18, 21, 68, ...)', verbose_name='ID типа документа')),
                ('product_type', models.CharField(db_index=True, help_text='bank_guarantee, contract_loan, etc.', max_length=30, verbose_name='Тип продукта')),
                ('name', models.CharField(help_text='Название документа из Приложения Б', max_length=500, verbose_name='Наименование')),
                ('source', models.CharField(
                    choices=[
                        ('auto', 'Формируется автоматически'),
                        ('agent', 'Загружается Агентом'),
                        ('bank', 'Загружается Банком'),
                        ('agent_bank', 'Загружается Агентом/Банком'),
                    ],
                    default='agent',
                    help_text='Кто загружает: Автоматически / Агент / Банк',
                    max_length=20,
                    verbose_name='Источник'
                )),
                ('is_active', models.BooleanField(default=True, help_text='Используется ли этот тип документа', verbose_name='Активен')),
            ],
            options={
                'verbose_name': 'Тип документа (справочник)',
                'verbose_name_plural': 'Типы документов (справочник)',
                'ordering': ['product_type', 'document_type_id'],
            },
        ),
        migrations.AddIndex(
            model_name='documenttypedefinition',
            index=models.Index(fields=['product_type', 'document_type_id'], name='documents_d_product_abc123_idx'),
        ),
        migrations.AddConstraint(
            model_name='documenttypedefinition',
            constraint=models.UniqueConstraint(fields=('document_type_id', 'product_type'), name='unique_doc_type_per_product'),
        ),
        
        # 2. Add new fields to Document model
        migrations.AddField(
            model_name='document',
            name='document_type_id',
            field=models.IntegerField(db_index=True, default=0, help_text='Числовой ID типа документа из Приложения Б', verbose_name='ID типа документа'),
        ),
        migrations.AddField(
            model_name='document',
            name='product_type',
            field=models.CharField(blank=True, db_index=True, default='', help_text='Контекст продукта (bank_guarantee, contract_loan, etc.)', max_length=30, verbose_name='Тип продукта'),
        ),
        migrations.AddIndex(
            model_name='document',
            index=models.Index(fields=['document_type_id', 'product_type'], name='documents_d_doc_type_prod_idx'),
        ),
        
        # 3. Update status choices to include 'not_allowed'
        migrations.AlterField(
            model_name='document',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'На проверке'),
                    ('verified', 'Проверен'),
                    ('rejected', 'Отклонён'),
                    ('not_allowed', 'Не допущен'),
                ],
                default='pending',
                max_length=20,
                verbose_name='Статус'
            ),
        ),
        
        # 4. Remove old document_type field (BREAKING CHANGE)
        # NOTE: This will lose data! Only run after confirming no production data.
        migrations.RemoveField(
            model_name='document',
            name='document_type',
        ),
    ]
