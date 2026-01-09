"""
Initial migration for bank_conditions app.
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Bank',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, verbose_name='Наименование банка')),
                ('short_name', models.CharField(blank=True, max_length=100, verbose_name='Краткое название')),
                ('logo_url', models.URLField(blank=True, verbose_name='URL логотипа')),
                ('is_active', models.BooleanField(default=True, verbose_name='Активен')),
                ('order', models.IntegerField(default=0, verbose_name='Порядок сортировки')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Банк-партнёр',
                'verbose_name_plural': 'Банки-партнёры',
                'ordering': ['order', 'name'],
            },
        ),
        migrations.CreateModel(
            name='StopFactor',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('description', models.TextField(verbose_name='Описание')),
                ('is_active', models.BooleanField(default=True, verbose_name='Активен')),
                ('order', models.IntegerField(default=0, verbose_name='Порядок')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Стоп-фактор',
                'verbose_name_plural': 'Стоп-факторы',
                'ordering': ['order'],
            },
        ),
        migrations.CreateModel(
            name='RKOCondition',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('description', models.TextField(verbose_name='Описание условий')),
                ('is_active', models.BooleanField(default=True, verbose_name='Активен')),
                ('order', models.IntegerField(default=0, verbose_name='Порядок')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('bank', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='rko_conditions', to='bank_conditions.bank', verbose_name='Банк')),
            ],
            options={
                'verbose_name': 'Условия РКО',
                'verbose_name_plural': 'Условия РКО',
                'ordering': ['order', 'bank__name'],
            },
        ),
        migrations.CreateModel(
            name='IndividualReviewCondition',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fz_type', models.CharField(max_length=50, verbose_name='ФЗ')),
                ('guarantee_type', models.CharField(choices=[('all', 'Все виды'), ('execution', 'Исполнение'), ('application', 'Заявка'), ('execution_application', 'Исполнение, Заявка')], default='all', max_length=50, verbose_name='Вид БГ')),
                ('client_limit', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True, verbose_name='Лимит на клиента (млн)')),
                ('fz_application_limit', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True, verbose_name='Лимит по заявке ФЗ (млн)')),
                ('commercial_application_limit', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True, verbose_name='Лимит по заявке коммерции (млн)')),
                ('corporate_dept_limit', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True, verbose_name='Корп. Отдел (млн)')),
                ('term', models.CharField(blank=True, max_length=50, verbose_name='Срок')),
                ('bank_rate', models.CharField(blank=True, max_length=50, verbose_name='Ставка банка')),
                ('service_commission', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, verbose_name='Комиссия Лидер-Гарант (%)')),
                ('is_active', models.BooleanField(default=True, verbose_name='Активен')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('bank', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='individual_conditions', to='bank_conditions.bank', verbose_name='Банк')),
            ],
            options={
                'verbose_name': 'Индивидуальное рассмотрение',
                'verbose_name_plural': 'Индивидуальные рассмотрения',
                'ordering': ['bank__order', 'bank__name'],
            },
        ),
        migrations.CreateModel(
            name='BankCondition',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('product', models.CharField(max_length=255, verbose_name='Продукт')),
                ('sum_min', models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True, verbose_name='Сумма минимальная')),
                ('sum_max', models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True, verbose_name='Сумма максимальная')),
                ('term_months', models.IntegerField(blank=True, null=True, verbose_name='Срок (мес)')),
                ('term_days', models.IntegerField(blank=True, null=True, verbose_name='Срок (дней)')),
                ('rate_min', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, verbose_name='Ставка минимальная (%)')),
                ('rate_type', models.CharField(choices=[('annual', 'Годовая'), ('individual', 'Индивидуальная')], default='annual', max_length=50, verbose_name='Тип ставки')),
                ('service_commission', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, verbose_name='Комиссия сервиса (%)')),
                ('service_commission_max', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, verbose_name='Комиссия максимальная (%)')),
                ('additional_conditions', models.TextField(blank=True, verbose_name='Дополнительные условия / Стоп-факторы')),
                ('is_active', models.BooleanField(default=True, verbose_name='Активен')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('bank', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='conditions', to='bank_conditions.bank', verbose_name='Банк')),
            ],
            options={
                'verbose_name': 'Условие банка',
                'verbose_name_plural': 'Условия банков',
                'ordering': ['bank__order', 'bank__name'],
            },
        ),
    ]
