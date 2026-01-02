"""
Company Profile models for Lider Garant.
Supports both Client companies and Agent's CRM clients.

API-Ready Architecture: Fields are structured to match future Bank API integrations
(specifically Realist Bank structure).
"""
from django.db import models
from django.conf import settings


class CompanyProfile(models.Model):
    """
    Company profile model.
    - For CLIENT: their own company (is_crm_client=False)
    - For AGENT: their own company + CRM managed clients (is_crm_client=True)
    """
    # Ownership
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_companies',
        verbose_name='Владелец'
    )
    is_crm_client = models.BooleanField(
        'CRM клиент',
        default=False,
        help_text='True = клиент агента (CRM), False = собственная компания'
    )
    
    # =============================================================================
    # CLIENT STATUS (ТЗ: Скриншот 3, 6 - статус клиента агента)
    # =============================================================================
    CLIENT_STATUS_CHOICES = [
        ('pending', 'На рассмотрении'),
        ('confirmed', 'Закреплен'),
    ]
    client_status = models.CharField(
        'Статус клиента',
        max_length=20,
        choices=CLIENT_STATUS_CHOICES,
        default='pending',
        help_text='pending = добавлен агентом, confirmed = зарегистрирован и аккредитован'
    )
    invitation_email = models.EmailField(
        'Email для приглашения',
        blank=True,
        default='',
        help_text='Email на который отправлено приглашение'
    )
    invitation_token = models.CharField(
        'Токен приглашения',
        max_length=64,
        blank=True,
        default='',
        help_text='Уникальный токен для связывания регистрации клиента'
    )

    
    # Company identification (Manual Entry Only - no validation against external DBs)
    inn = models.CharField('ИНН', max_length=12)
    kpp = models.CharField('КПП', max_length=9, blank=True, default='')
    ogrn = models.CharField('ОГРН', max_length=15, blank=True, default='')
    
    # Company names
    name = models.CharField('Полное наименование', max_length=500)
    short_name = models.CharField('Краткое наименование', max_length=200, blank=True, default='')
    foreign_name = models.CharField(
        'Наименование на иностранном языке', 
        max_length=500, 
        blank=True, 
        default='',
        help_text='Наименование на иностранном языке (если имеется)'
    )
    legal_form = models.CharField(
        'Организационно-правовая форма',
        max_length=100,
        blank=True,
        default='',
        help_text='ООО, АО, ИП и т.д.'
    )
    is_resident = models.BooleanField(
        'Резидент РФ',
        default=True,
        help_text='Является ли резидентом РФ'
    )
    
    # Addresses
    legal_address = models.TextField('Юридический адрес', blank=True, default='')
    legal_address_postal_code = models.CharField(
        'Индекс юр. адреса',
        max_length=6,
        blank=True,
        default=''
    )
    actual_address = models.TextField('Фактический адрес', blank=True, default='')
    actual_address_postal_code = models.CharField(
        'Индекс факт. адреса',
        max_length=6,
        blank=True,
        default=''
    )
    post_address = models.TextField(
        'Почтовый адрес',
        blank=True,
        default='',
        help_text='Адрес для корреспонденции'
    )
    post_address_postal_code = models.CharField(
        'Индекс почт. адреса',
        max_length=6,
        blank=True,
        default=''
    )
    region = models.CharField('Регион', max_length=100, blank=True, default='')
    
    # =============================================================================
    # STATE REGISTRATION (ТЗ: Раздел Клиенты - Блок "Государственная регистрация")
    # =============================================================================
    okato = models.CharField('ОКАТО', max_length=11, blank=True, default='')
    oktmo = models.CharField('ОКТМО', max_length=11, blank=True, default='')
    okpo = models.CharField('ОКПО', max_length=10, blank=True, default='')
    okfs = models.CharField('ОКФС', max_length=2, blank=True, default='')
    okogu = models.CharField('ОКОГУ', max_length=10, blank=True, default='')
    okved = models.TextField('ОКВЭД (основной)', blank=True, default='')
    registration_date = models.DateField(
        'Дата гос. регистрации',
        null=True,
        blank=True
    )
    registration_authority = models.CharField(
        'Наименование регистрирующего органа',
        max_length=500,
        blank=True,
        default=''
    )
    authorized_capital_declared = models.DecimalField(
        'Объявленный уставный капитал',
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True
    )
    authorized_capital_paid = models.DecimalField(
        'Оплаченный уставный капитал',
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True
    )
    authorized_capital_paid_date = models.DateField(
        'Дата изменения оплаченного УК',
        null=True,
        blank=True
    )
    
    # Employee and contract counts
    employee_count = models.IntegerField(
        'Количество сотрудников',
        null=True,
        blank=True
    )
    contracts_count = models.IntegerField(
        'Количество контрактов',
        null=True,
        blank=True
    )
    contracts_44fz_count = models.IntegerField(
        'Контрактов по 44-ФЗ',
        null=True,
        blank=True
    )
    contracts_223fz_count = models.IntegerField(
        'Контрактов по 223-ФЗ',
        null=True,
        blank=True
    )
    
    # Official company contacts
    company_website = models.URLField('Сайт компании', blank=True, default='')
    company_email = models.EmailField('Email компании', blank=True, default='')
    office_phone = models.CharField('Тел. офиса', max_length=20, blank=True, default='')
    
    # Director info
    director_name = models.CharField('ФИО руководителя', max_length=300, blank=True, default='')
    director_position = models.CharField('Должность руководителя', max_length=100, blank=True, default='')
    
    # Director passport details (API-Ready for Realist Bank integration)
    passport_series = models.CharField(
        'Серия паспорта',
        max_length=4,
        blank=True,
        null=True,
        help_text='4 цифры серии паспорта'
    )
    passport_number = models.CharField(
        'Номер паспорта',
        max_length=6,
        blank=True,
        null=True,
        help_text='6 цифр номера паспорта'
    )
    passport_issued_by = models.TextField(
        'Кем выдан паспорт',
        blank=True,
        null=True,
        help_text='Орган, выдавший паспорт'
    )
    passport_date = models.DateField(
        'Дата выдачи паспорта',
        blank=True,
        null=True
    )
    passport_code = models.CharField(
        'Код подразделения',
        max_length=7,
        blank=True,
        null=True,
        help_text='Код подразделения (формат: XXX-XXX)'
    )
    
    # =============================================================================
    # FOUNDERS STRUCTURE (JSONField for MVP - Phase 2 Ready)
    # Reference: Postman API 1.1 - add_ticket: client[founders][n][...]
    # Lines 1603-1697 in API_1.1.postman_collection_2025-03
    # =============================================================================
    # API Structure (Realist Bank):
    # client[founders][0][full_name]              - ФИО участника/акционера
    # client[founders][0][inn]                    - ИНН участника
    # client[founders][0][share_relative]         - Доля в капитале (%)
    # client[founders][0][document][series]       - Серия паспорта
    # client[founders][0][document][number]       - Номер паспорта
    # client[founders][0][document][issued_at]    - Дата выдачи паспорта
    # client[founders][0][document][authority_name] - Наименование подразделения
    # client[founders][0][document][authority_code] - Код подразделения (777-777)
    # client[founders][0][birth_place]            - Место рождения
    # client[founders][0][birth_date]             - Дата рождения
    # client[founders][0][gender]                 - Пол (1=муж, 2=жен)
    # client[founders][0][citizen]                - Гражданство
    # client[founders][0][legal_address][value]   - Адрес регистрации
    # client[founders][0][legal_address][postal_code] - Индекс
    # client[founders][0][actual_address][value]  - Фактический адрес
    # client[founders][0][actual_address][postal_code] - Индекс
    # =============================================================================
    founders_data = models.JSONField(
        'Учредители (JSON)',
        default=list,
        blank=True,
        help_text='''Список учредителей для Phase 2 интеграции:
        [{
            "full_name": "ФИО",
            "inn": "ИНН",
            "share_relative": доля%,
            "document": {
                "series": "серия паспорта",
                "number": "номер паспорта",
                "issued_at": "YYYY-MM-DD",
                "authority_name": "Кем выдан",
                "authority_code": "XXX-XXX"
            },
            "birth_place": "Место рождения",
            "birth_date": "YYYY-MM-DD",
            "gender": 1 или 2,
            "citizen": "РФ"
        }]'''
    )
    
    # =============================================================================
    # BANK ACCOUNTS STRUCTURE (JSONField for MVP - Phase 2 Ready)
    # Reference: Postman API 1.1 - add_ticket: client[checking_accounts][n][...]
    # Lines 1699-1708 in API_1.1.postman_collection_2025-03
    # =============================================================================
    # API Structure (Realist Bank):
    # client[checking_accounts][0][bank_name] - Наименование банка
    # client[checking_accounts][0][bank_bik]  - БИК банка
    # =============================================================================
    bank_accounts_data = models.JSONField(
        'Банковские счета (JSON)',
        default=list,
        blank=True,
        help_text='''Список банковских счетов:
        [{
            "bank_name": "АО РЕАЛИСТ БАНК",
            "bank_bik": "044525285",
            "account": "40702810000000000000"
        }]'''
    )
    
    # =============================================================================
    # LEADERSHIP DATA (ТЗ: Раздел Клиенты - Блок "Руководство")
    # =============================================================================
    leadership_data = models.JSONField(
        'Руководство (JSON)',
        default=list,
        blank=True,
        help_text='''Список руководителей компании:
        [{
            "position": "Должность",
            "full_name": "ФИО",
            "share_percent": доля%,
            "citizenship": "РФ",
            "birth_date": "YYYY-MM-DD",
            "birth_place": "Место рождения",
            "email": "email@example.com",
            "phone": "+7...",
            "passport": {
                "document_type": "passport_rf",
                "series": "1234",
                "number": "567890",
                "issued_date": "YYYY-MM-DD",
                "issued_by": "Кем выдан",
                "department_code": "XXX-XXX",
                "registration_address": "Адрес"
            }
        }]'''
    )
    
    # =============================================================================
    # ACTIVITIES AND LICENSES (ТЗ: Раздел Клиенты - Блок "Деятельность и лицензии")
    # =============================================================================
    activities_data = models.JSONField(
        'Деятельность/ОКВЭД (JSON)',
        default=list,
        blank=True,
        help_text='''Виды деятельности и ОКВЭД:
        [{
            "code": "62.01",
            "name": "Разработка компьютерного ПО",
            "is_primary": true
        }]'''
    )
    licenses_data = models.JSONField(
        'Лицензии (JSON)',
        default=list,
        blank=True,
        help_text='''СРО и лицензии:
        [{
            "type": "СРО",
            "name": "Наименование",
            "number": "Номер",
            "issued_date": "YYYY-MM-DD",
            "valid_until": "YYYY-MM-DD"
        }]'''
    )
    
    # =============================================================================
    # ETP ACCOUNTS (ТЗ: Раздел Клиенты - Блок "Реквизиты счетов ЭТП")
    # 16 площадок: ЕЭТП, РТС, ЭТП НЭП, СБЕРБАНК-АСТ, АГЗ РТ, ГАЗПРОМ, etc.
    # =============================================================================
    etp_accounts_data = models.JSONField(
        'Счета ЭТП (JSON)',
        default=list,
        blank=True,
        help_text='''Реквизиты счетов на электронных площадках:
        [{
            "platform": "ЕЭТП (roseltorg.ru)",
            "account": "40702810...",
            "bik": "044525285",
            "bank_name": "Сбербанк",
            "corr_account": "30101810..."
        }]'''
    )
    
    # =============================================================================
    # CONTACT PERSONS (ТЗ: Раздел Клиенты - Блок "Контактные лица")
    # =============================================================================
    contact_persons_data = models.JSONField(
        'Контактные лица (JSON)',
        default=list,
        blank=True,
        help_text='''Список контактных лиц:
        [{
            "position": "Должность",
            "last_name": "Фамилия",
            "first_name": "Имя",
            "patronymic": "Отчество",
            "email": "email@example.com",
            "phone": "+7..."
        }]'''
    )
    
    # =============================================================================
    # TAX AND SIGNATORY SETTINGS (ТЗ Настройки → Реквизиты)
    # =============================================================================
    
    # Signatory basis - on what grounds the director signs documents
    SIGNATORY_BASIS_CHOICES = [
        ('charter', 'Устава'),
        ('power_of_attorney', 'Доверенности'),
    ]
    signatory_basis = models.CharField(
        'Действует на основании',
        max_length=20,
        choices=SIGNATORY_BASIS_CHOICES,
        default='charter',
        blank=True
    )
    
    # Tax system - ОСН, УСН and variants
    TAX_SYSTEM_CHOICES = [
        ('osn', 'ОСН (Общая)'),
        ('usn_income', 'УСН (Доходы)'),
        ('usn_income_expense', 'УСН (Доходы-Расходы)'),
        ('esn', 'ЕСХН'),
        ('patent', 'ПСН (Патент)'),
    ]
    tax_system = models.CharField(
        'Система налогообложения',
        max_length=20,
        choices=TAX_SYSTEM_CHOICES,
        null=True,
        blank=True
    )
    
    # VAT rate - НДС ставка
    VAT_RATE_CHOICES = [
        ('none', 'НДС не облагается'),
        ('0', '0%'),
        ('5', '5%'),
        ('7', '7%'),
        ('10', '10%'),
        ('20', '20%'),
    ]
    vat_rate = models.CharField(
        'Ставка НДС',
        max_length=10,
        choices=VAT_RATE_CHOICES,
        null=True,
        blank=True
    )
    
    # Primary bank details (for backwards compatibility)
    bank_name = models.CharField('Наименование банка', max_length=300, blank=True, default='')
    bank_bic = models.CharField('БИК', max_length=9, blank=True, default='')
    bank_account = models.CharField('Расчётный счёт', max_length=20, blank=True, default='')
    bank_corr_account = models.CharField('Корр. счёт', max_length=20, blank=True, default='')
    
    # Contact info
    contact_person = models.CharField('Контактное лицо', max_length=300, blank=True, default='')
    contact_phone = models.CharField('Телефон контактного лица', max_length=20, blank=True, default='')
    contact_email = models.EmailField('Email контактного лица', blank=True, default='')
    website = models.URLField('Веб-сайт', blank=True, default='')
    
    # Timestamps
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)

    class Meta:
        verbose_name = 'Профиль компании'
        verbose_name_plural = 'Профили компаний'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.short_name or self.name} (ИНН: {self.inn})"
    
    @property
    def checko_url(self):
        """Generate Checko.ru verification URL for this company."""
        if self.inn:
            return f"https://checko.ru/company/{self.inn}"
        return None
