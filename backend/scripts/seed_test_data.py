"""
Seed Test Data Script for Lider Garant Dashboard Testing
=========================================================
Creates:
1. Agent user + Company (with INN and Passport)
2. Partner user (Bank)
3. Application from Agent with PENDING status

Run via:
    cd d:\New folder\dashboarddesignanalysis\backend
    python manage.py shell < scripts/seed_test_data.py
"""

from django.contrib.auth import get_user_model
from apps.companies.models import CompanyProfile
from apps.applications.models import Application, ApplicationStatus, ProductType
from datetime import date

User = get_user_model()

print("=" * 60)
print("SEED DATA: Создание тестовых данных для Dashboard")
print("=" * 60)

# =====================
# 1. CREATE AGENT USER
# =====================
agent_email = "agent@test.com"
agent_user, created = User.objects.get_or_create(
    email=agent_email,
    defaults={
        'role': 'agent',
        'first_name': 'Иван',
        'last_name': 'Агентов',
        'phone': '+7 (999) 123-45-67',
        'is_active': True,
    }
)
if created:
    agent_user.set_password('agent123')
    agent_user.save()
    print(f"✓ Создан Agent: {agent_email}")
else:
    print(f"• Agent уже существует: {agent_email}")

# =====================
# 2. CREATE AGENT'S COMPANY (with INN and Passport)
# =====================
try:
    company = CompanyProfile.objects.get(owner=agent_user, is_crm_client=False)
    print(f"• Компания агента уже существует: {company.name}")
except CompanyProfile.DoesNotExist:
    company = CompanyProfile.objects.create(
        owner=agent_user,
        is_crm_client=False,
        inn='7707123456',
        kpp='770701001',
        ogrn='1027700123456',
        name='ООО "Тест-Финанс"',
        short_name='Тест-Финанс',
        legal_address='г. Москва, ул. Тестовая, д. 1',
        actual_address='г. Москва, ул. Тестовая, д. 1',
        director_name='Иванов Иван Иванович',
        director_position='Генеральный директор',
        # Passport data (for API-Ready structure)
        passport_series='4510',
        passport_number='123456',
        passport_issued_by='ОВД Центрального района г. Москвы',
        passport_date=date(2015, 5, 15),
        passport_code='770-001',
        # Founders
        founders_data=[
            {'name': 'Иванов И.И.', 'inn': '771234567890', 'share': 100.0}
        ],
        # Bank accounts
        bank_accounts_data=[
            {'account': '40702810500000012345', 'bic': '044525225', 'bank_name': 'ПАО Сбербанк'}
        ],
        bank_name='ПАО Сбербанк',
        bank_bic='044525225',
        bank_account='40702810500000012345',
        bank_corr_account='30101810400000000225',
        contact_person='Иванов Иван Иванович',
        contact_phone='+7 (999) 123-45-67',
        contact_email=agent_email,
    )
    print(f"✓ Создана компания: {company.name} (ИНН: {company.inn})")

# =====================
# 3. CREATE PARTNER USER (Bank)
# =====================
partner_email = "partner@sberbank.test"
partner_user, created = User.objects.get_or_create(
    email=partner_email,
    defaults={
        'role': 'partner',
        'first_name': 'Сергей',
        'last_name': 'Партнёров',
        'phone': '+7 (495) 500-55-55',
        'is_active': True,
    }
)
if created:
    partner_user.set_password('partner123')
    partner_user.save()
    print(f"✓ Создан Partner (Bank): {partner_email}")
else:
    print(f"• Partner уже существует: {partner_email}")

# =====================
# 4. CREATE APPLICATION (PENDING status)
# =====================
# Check if test application already exists
existing_app = Application.objects.filter(
    created_by=agent_user, 
    company=company,
    target_bank_name='Сбербанк'
).first()

if existing_app:
    print(f"• Заявка уже существует: #{existing_app.id} - {existing_app.status}")
    # Update status to PENDING for testing
    if existing_app.status != ApplicationStatus.PENDING:
        existing_app.status = ApplicationStatus.PENDING
        existing_app.save()
        print(f"  → Статус обновлён на PENDING")
else:
    application = Application.objects.create(
        created_by=agent_user,
        company=company,
        product_type=ProductType.BANK_GUARANTEE,
        amount=5000000.00,
        term_months=12,
        target_bank_name='Сбербанк',
        tender_number='0373100112523000001',
        tender_platform='zakupki.gov.ru',
        status=ApplicationStatus.PENDING,
        notes='Тестовая заявка на банковскую гарантию',
    )
    print(f"✓ Создана заявка: #{application.id}")
    print(f"  - Продукт: {application.get_product_type_display()}")
    print(f"  - Сумма: {application.amount:,.2f} ₽")
    print(f"  - Целевой банк: {application.target_bank_name}")
    print(f"  - Статус: {application.get_status_display()}")

print("=" * 60)
print("SEED DATA: Готово!")
print("=" * 60)
print("\nДанные для входа:")
print(f"  Agent:   {agent_email} / agent123")
print(f"  Partner: {partner_email} / partner123")
print("=" * 60)
