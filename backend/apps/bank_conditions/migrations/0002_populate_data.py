"""
Data migration to populate initial bank conditions data.
"""
from django.db import migrations


def populate_bank_data(apps, schema_editor):
    """Populate initial bank data from user-provided tables."""
    Bank = apps.get_model('bank_conditions', 'Bank')
    BankCondition = apps.get_model('bank_conditions', 'BankCondition')
    IndividualReviewCondition = apps.get_model('bank_conditions', 'IndividualReviewCondition')
    RKOCondition = apps.get_model('bank_conditions', 'RKOCondition')
    StopFactor = apps.get_model('bank_conditions', 'StopFactor')

    # Create banks
    banks_data = [
        {'name': 'Сбербанк', 'short_name': 'Сбербанк', 'order': 1},
        {'name': 'ВТБ', 'short_name': 'ВТБ', 'order': 2},
        {'name': 'Альфа-Банк', 'short_name': 'Альфа', 'order': 3},
        {'name': 'Промсвязьбанк', 'short_name': 'ПСБ', 'order': 4},
        {'name': 'Совкомбанк', 'short_name': 'Совком', 'order': 5},
        {'name': 'МТС Банк', 'short_name': 'МТС', 'order': 6},
        {'name': 'Абсолют Банк', 'short_name': 'Абсолют', 'order': 7},
        {'name': 'Киви Банк (Rowi)', 'short_name': 'Rowi', 'order': 8},
        {'name': 'МСП Банк', 'short_name': 'МСП', 'order': 9},
        {'name': 'Металлинвест', 'short_name': 'Металл', 'order': 10},
        {'name': 'Банк ДОМ.РФ', 'short_name': 'ДОМ.РФ', 'order': 11},
        {'name': 'Тинькофф', 'short_name': 'Тинькофф', 'order': 12},
        {'name': 'Точка', 'short_name': 'Точка', 'order': 13},
        {'name': 'Газпромбанк', 'short_name': 'ГПБ', 'order': 14},
    ]
    
    banks = {}
    for data in banks_data:
        bank = Bank.objects.create(**data)
        banks[bank.short_name] = bank

    # Table 1: Условия банков (Общий список)
    conditions_data = [
        {'bank': 'Сбербанк', 'product': 'БГ 44-ФЗ, 223-ФЗ', 'sum_min': 10000, 'sum_max': 50000000, 'term_months': 36, 'rate_min': 2.5, 'service_commission': 20, 'additional_conditions': 'Наличие р/с не обязательно. Отсутствие блокировок по счетам.'},
        {'bank': 'ВТБ', 'product': 'БГ 44-ФЗ', 'sum_min': 50000, 'sum_max': 100000000, 'term_months': 60, 'rate_min': 2.2, 'service_commission': 15, 'service_commission_max': 25, 'additional_conditions': 'Опыт исполнения контрактов. Положительная кредитная история.'},
        {'bank': 'Альфа', 'product': 'БГ Экспресс', 'sum_min': 10000, 'sum_max': 30000000, 'term_months': 24, 'rate_type': 'individual', 'service_commission': 25, 'additional_conditions': 'Без залога и поручительства. Быстрое рассмотрение (от 1 часа).'},
        {'bank': 'ПСБ', 'product': 'БГ', 'sum_min': 100000, 'sum_max': 150000000, 'term_months': 36, 'rate_min': 3, 'service_commission': 20, 'additional_conditions': 'Требуется открытие спецсчета для крупных сумм.'},
        {'bank': 'Совком', 'product': 'БГ, Кредит', 'sum_min': 50000, 'sum_max': 200000000, 'term_months': 60, 'rate_min': 12, 'service_commission': 20, 'additional_conditions': 'Возможно дистанционное открытие счета.'},
        {'bank': 'МТС', 'product': 'Экспресс Гарантии', 'sum_min': 10000, 'sum_max': 50000000, 'term_months': 36, 'rate_min': 2.8, 'service_commission': 30, 'additional_conditions': 'Только для субъектов МСП.'},
        {'bank': 'Абсолют', 'product': 'БГ', 'sum_min': 0, 'sum_max': 200000000, 'term_days': 1200, 'rate_min': 2, 'service_commission': 20, 'service_commission_max': 30, 'additional_conditions': 'Минимальный пакет документов.'},
        {'bank': 'Rowi', 'product': 'БГ', 'sum_min': 10000, 'sum_max': 100000000, 'term_months': 36, 'rate_min': 3, 'service_commission': 25, 'additional_conditions': 'Полностью онлайн. Без открытия счета.'},
        {'bank': 'МСП', 'product': 'Кредит на исполнение', 'sum_min': 1000000, 'sum_max': 50000000, 'term_months': 12, 'rate_min': 10, 'service_commission': 10, 'additional_conditions': 'Требуется залог или поручительство Корпорации МСП.'},
        {'bank': 'Металл', 'product': 'БГ', 'sum_min': 100000, 'sum_max': 40000000, 'term_months': 24, 'rate_min': 3.5, 'service_commission': 20, 'additional_conditions': 'Региональные ограничения могут применяться.'},
        {'bank': 'ДОМ.РФ', 'product': 'БГ', 'sum_min': 100000, 'sum_max': 100000000, 'term_months': 36, 'rate_type': 'individual', 'service_commission': 20, 'additional_conditions': 'Для застройщиков и участников госзакупок.'},
    ]
    
    for data in conditions_data:
        bank_short = data.pop('bank')
        bank = banks.get(bank_short)
        if bank:
            BankCondition.objects.create(bank=bank, **data)

    # Table 2: Индивидуальное рассмотрение
    individual_data = [
        {'bank': 'Сбербанк', 'fz_type': '44/223', 'guarantee_type': 'all', 'client_limit': 500, 'fz_application_limit': 200, 'commercial_application_limit': 100, 'corporate_dept_limit': 200, 'term': 'до 5 лет', 'bank_rate': 'от 2%', 'service_commission': 20},
        {'bank': 'ВТБ', 'fz_type': '44/223', 'guarantee_type': 'execution_application', 'client_limit': 1000, 'fz_application_limit': 500, 'commercial_application_limit': 300, 'corporate_dept_limit': 500, 'term': 'до 3 лет', 'bank_rate': 'от 2.2%', 'service_commission': 20},
        {'bank': 'Альфа', 'fz_type': '44/223', 'guarantee_type': 'all', 'client_limit': 300, 'fz_application_limit': 150, 'commercial_application_limit': 50, 'corporate_dept_limit': 150, 'term': 'до 2 лет', 'bank_rate': 'от 2.5%', 'service_commission': 25},
        {'bank': 'Совком', 'fz_type': '44/223/185', 'guarantee_type': 'all', 'client_limit': 500, 'fz_application_limit': 200, 'commercial_application_limit': 100, 'corporate_dept_limit': 200, 'term': 'до 5 лет', 'bank_rate': 'от 3%', 'service_commission': 20},
        {'bank': 'ПСБ', 'fz_type': '44/223 (ГОЗ)', 'guarantee_type': 'all', 'client_limit': 1000, 'fz_application_limit': 500, 'commercial_application_limit': 500, 'corporate_dept_limit': 500, 'term': 'до 3 лет', 'bank_rate': 'от 2%', 'service_commission': 20},
    ]
    
    for data in individual_data:
        bank_short = data.pop('bank')
        bank = banks.get(bank_short)
        if bank:
            IndividualReviewCondition.objects.create(bank=bank, **data)

    # RKO conditions
    rko_data = [
        {'bank': 'Сбербанк', 'description': 'Открытие счета бесплатно. 3 месяца обслуживания в подарок.', 'order': 1},
        {'bank': 'ВТБ', 'description': 'Кешбэк по бизнес-карте. Бесплатные платежи контрагентам.', 'order': 2},
        {'bank': 'Альфа', 'description': '1% на остаток по счету. Бесплатная бухгалтерия для ИП.', 'order': 3},
        {'bank': 'Точка', 'description': 'Полностью онлайн. Встроенная проверка контрагентов.', 'order': 4},
        {'bank': 'Тинькофф', 'description': 'Процент на остаток. Бесплатный выпуск бизнес-карт.', 'order': 5},
    ]
    
    for data in rko_data:
        bank_short = data.pop('bank')
        bank = banks.get(bank_short)
        if bank:
            RKOCondition.objects.create(bank=bank, **data)

    # Stop-factors
    stop_factors = [
        'Наличие блокировок по счетам (картотека №2).',
        'Негативная кредитная история учредителей/директора.',
        'Отсутствие опыта исполнения государственных контрактов (для сумм свыше 10 млн).',
        'Массовый адрес регистрации (без подтверждения аренды).',
        'Банкротство или стадия ликвидации.',
    ]
    
    for i, desc in enumerate(stop_factors):
        StopFactor.objects.create(description=desc, order=i+1)


def reverse_data(apps, schema_editor):
    """Reverse migration - delete all data."""
    Bank = apps.get_model('bank_conditions', 'Bank')
    StopFactor = apps.get_model('bank_conditions', 'StopFactor')
    Bank.objects.all().delete()
    StopFactor.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('bank_conditions', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(populate_bank_data, reverse_data),
    ]
