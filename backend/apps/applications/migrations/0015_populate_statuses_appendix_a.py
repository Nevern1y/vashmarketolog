"""
Data Migration: Populate ApplicationStatusDefinition with Appendix A data.

This migration loads all status definitions for:
- Bank Guarantees (28 statuses)
- Contract Loans (27 statuses)
- General statuses for other products
"""
from django.db import migrations


def populate_statuses(apps, schema_editor):
    """Populate ApplicationStatusDefinition with data from Appendix A."""
    ApplicationStatusDefinition = apps.get_model('applications', 'ApplicationStatusDefinition')
    
    # Clear existing data
    ApplicationStatusDefinition.objects.all().delete()
    
    # =========================================================================
    # А.1 БАНКОВСКИЕ ГАРАНТИИ - Status Model
    # =========================================================================
    bg_statuses = [
        # (status_id, name, internal_status, order, is_terminal)
        (101, 'Анкета', 'draft', 1, False),
        (102, 'Предзаявка', 'draft', 2, False),
        (110, 'Прескоринг', 'pending', 3, False),
        (120, 'Дозаполнение заявки', 'info_requested', 4, False),
        (210, 'Проверка документов', 'in_review', 5, False),
        
        # Review stages
        (140, 'Проверка (этап 1)', 'in_review', 6, False),
        (310, 'Проверка (этап 1) - вариант', 'in_review', 6, False),
        (150, 'Проверка (этап 2)', 'in_review', 7, False),
        (160, 'Проверка (этап 2) - вариант 2', 'in_review', 7, False),
        (170, 'Проверка (этап 2) - вариант 3', 'in_review', 7, False),
        (610, 'Проверка (этап 2) - вариант 4', 'in_review', 7, False),
        (630, 'Проверка (этап 2) - вариант 5', 'in_review', 7, False),
        (650, 'Проверка (этап 2) - вариант 6', 'in_review', 7, False),
        (690, 'Проверка (этап 2) - вариант 7', 'in_review', 7, False),
        
        # Decision stages
        (640, 'Одобрено с замечаниями', 'approved', 8, False),
        (707, 'Решение принято', 'approved', 9, False),
        (708, 'Решение принято (вариант)', 'approved', 9, False),
        (710, 'Одобрено, ожидается согласование БГ', 'approved', 10, False),
        
        # EDS/Signing
        (715, 'Ожидается формирование ЭЦП', 'approved', 11, False),
        (720, 'Одобрено, ожидаются документы ЭЦП', 'approved', 12, False),
        (750, 'Проверка ЭЦП', 'approved', 13, False),
        
        # Payment & Issuance
        (810, 'Ожидается оплата', 'approved', 14, False),
        (850, 'Ожидается выпуск', 'approved', 15, False),
        (910, 'Гарантия выпущена', 'won', 16, False),
        (1010, 'Гарантия в реестре', 'won', 17, False),
        (1090, 'Гарантия закрыта', 'won', 18, True),
        
        # Rejection flow
        (520, 'Не актуальна', 'rejected', 100, True),
        (530, 'Отклонена', 'rejected', 101, False),
        (533, 'Формирование заявления на отказ', 'rejected', 102, False),
        (534, 'Подтверждение отказа клиента', 'rejected', 103, False),
        (535, 'Отказ клиента', 'lost', 104, True),
    ]
    
    for status_id, name, internal_status, order, is_terminal in bg_statuses:
        ApplicationStatusDefinition.objects.create(
            status_id=status_id,
            product_type='bank_guarantee',
            name=name,
            internal_status=internal_status,
            order=order,
            is_terminal=is_terminal,
            is_active=True
        )
    
    # =========================================================================
    # А.2 КРЕДИТЫ НА ИСПОЛНЕНИЕ КОНТРАКТОВ - Status Model
    # =========================================================================
    kik_statuses = [
        (2101, 'Анкета', 'draft', 1, False),
        (2102, 'Предзаявка', 'draft', 2, False),
        (2110, 'Прескоринг', 'pending', 3, False),
        (2120, 'Дозаполнение заявки', 'info_requested', 4, False),
        (2210, 'Проверка документов', 'in_review', 5, False),
        
        # Review stages
        (2140, 'Проверка (этап 1)', 'in_review', 6, False),
        (2310, 'Проверка (этап 1) - вариант', 'in_review', 6, False),
        (2150, 'Проверка (этап 2)', 'in_review', 7, False),
        (2170, 'Проверка (этап 2) - вариант 2', 'in_review', 7, False),
        (2510, 'Проверка (этап 2) - вариант 3', 'in_review', 7, False),
        (2630, 'Проверка (этап 2) - вариант 4', 'in_review', 7, False),
        (2050, 'Проверка (этап 2) - вариант 5', 'in_review', 7, False),
        
        # Decision stages
        (2540, 'Одобрено с замечаниями', 'approved', 8, False),
        (2707, 'Решение принято', 'approved', 9, False),
        (2708, 'Решение принято (вариант)', 'approved', 9, False),
        (2712, 'Одобрено, ожидается согласование условий', 'approved', 10, False),
        
        # EDS/Signing
        (2715, 'Ожидается формирование ЭЦП', 'approved', 11, False),
        (2720, 'Одобрено, ожидаются документы ЭЦП', 'approved', 12, False),
        (2750, 'Проверка ЭЦП', 'approved', 13, False),
        
        # Payment & Issuance
        (2810, 'Ожидается оплата', 'approved', 14, False),
        (2860, 'Выдача кредита', 'approved', 15, False),
        (2910, 'Кредит выдан', 'won', 16, False),
        (2990, 'Кредит погашен', 'won', 17, True),
        
        # Rejection flow
        (2520, 'Не актуальна', 'rejected', 100, True),
        (2530, 'Отклонена', 'rejected', 101, False),
        (2533, 'Формирование заявления на отказ', 'rejected', 102, False),
        (2534, 'Подтверждение отказа клиента', 'rejected', 103, False),
        (2535, 'Отказ клиента', 'lost', 104, True),
    ]
    
    for status_id, name, internal_status, order, is_terminal in kik_statuses:
        ApplicationStatusDefinition.objects.create(
            status_id=status_id,
            product_type='contract_loan',
            name=name,
            internal_status=internal_status,
            order=order,
            is_terminal=is_terminal,
            is_active=True
        )
    
    # Also create for tender_loan (same structure)
    for status_id, name, internal_status, order, is_terminal in kik_statuses:
        ApplicationStatusDefinition.objects.create(
            status_id=status_id,
            product_type='tender_loan',
            name=name,
            internal_status=internal_status,
            order=order,
            is_terminal=is_terminal,
            is_active=True
        )
    
    # =========================================================================
    # GENERAL STATUSES (for other products)
    # =========================================================================
    general_statuses = [
        (1, 'Черновик', 'draft', 1, False),
        (2, 'На рассмотрении', 'pending', 2, False),
        (3, 'В работе', 'in_review', 3, False),
        (4, 'Запрошена информация', 'info_requested', 4, False),
        (5, 'Одобрено', 'approved', 5, False),
        (6, 'Выигран', 'won', 6, True),
        (7, 'Отклонено', 'rejected', 100, True),
        (8, 'Проигран', 'lost', 101, True),
    ]
    
    other_products = ['factoring', 'leasing', 'ved', 'insurance', 'rko', 'special_account', 'corporate_credit', 'tender_support']
    
    for product in other_products:
        for status_id, name, internal_status, order, is_terminal in general_statuses:
            ApplicationStatusDefinition.objects.create(
                status_id=status_id,
                product_type=product,
                name=name,
                internal_status=internal_status,
                order=order,
                is_terminal=is_terminal,
                is_active=True
            )


def reverse_populate(apps, schema_editor):
    """Reverse migration - clear all data."""
    ApplicationStatusDefinition = apps.get_model('applications', 'ApplicationStatusDefinition')
    ApplicationStatusDefinition.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0014_application_status_appendix_a'),
    ]

    operations = [
        migrations.RunPython(populate_statuses, reverse_populate),
    ]
