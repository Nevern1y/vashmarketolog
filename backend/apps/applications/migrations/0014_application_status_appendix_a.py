"""
Migration: Add ApplicationStatusDefinition reference table and status_id field.

This implements Appendix A (Приложение А) - Status Model:
- Status IDs are product-specific (e.g., ID 101 for BG, ID 2101 for KIK)
- Full status workflow from Анкета to Гарантия закрыта/Кредит погашен
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0013_phase1_tz_compliance'),
    ]

    operations = [
        # 1. Create ApplicationStatusDefinition reference table
        migrations.CreateModel(
            name='ApplicationStatusDefinition',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status_id', models.IntegerField(help_text='Числовой ID из Приложения А (101, 102, 2101, ...)', verbose_name='ID статуса')),
                ('product_type', models.CharField(db_index=True, help_text='bank_guarantee, contract_loan, etc.', max_length=30, verbose_name='Тип продукта')),
                ('name', models.CharField(help_text='Название статуса из Приложения А', max_length=200, verbose_name='Наименование')),
                ('internal_status', models.CharField(
                    blank=True,
                    choices=[
                        ('draft', 'Черновик'),
                        ('pending', 'На рассмотрении'),
                        ('in_review', 'В работе'),
                        ('info_requested', 'Запрошена информация'),
                        ('approved', 'Одобрено'),
                        ('rejected', 'Отклонено'),
                        ('won', 'Выигран'),
                        ('lost', 'Проигран'),
                    ],
                    default='',
                    help_text='Маппинг на внутренний статус (draft, pending, approved, etc.)',
                    max_length=20,
                    verbose_name='Внутренний статус'
                )),
                ('order', models.IntegerField(default=0, help_text='Порядок отображения в воронке статусов', verbose_name='Порядок')),
                ('is_terminal', models.BooleanField(default=False, help_text='Является ли статус финальным (закрыта, выдан, погашен)', verbose_name='Конечный статус')),
                ('is_active', models.BooleanField(default=True, help_text='Используется ли этот статус', verbose_name='Активен')),
            ],
            options={
                'verbose_name': 'Статус заявки (справочник)',
                'verbose_name_plural': 'Статусы заявок (справочник)',
                'ordering': ['product_type', 'order', 'status_id'],
            },
        ),
        migrations.AddIndex(
            model_name='applicationstatusdefinition',
            index=models.Index(fields=['product_type', 'status_id'], name='apps_status_prod_idx'),
        ),
        migrations.AddConstraint(
            model_name='applicationstatusdefinition',
            constraint=models.UniqueConstraint(fields=('status_id', 'product_type'), name='unique_status_per_product'),
        ),
        
        # 2. Add status_id field to Application model
        migrations.AddField(
            model_name='application',
            name='status_id',
            field=models.IntegerField(
                blank=True,
                db_index=True,
                help_text='Числовой ID статуса из Приложения А для интеграции с банком',
                null=True,
                verbose_name='ID статуса (банк)'
            ),
        ),
    ]
