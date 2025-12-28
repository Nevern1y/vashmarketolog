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
    
    # Company identification (Manual Entry Only - no validation against external DBs)
    inn = models.CharField('ИНН', max_length=12)
    kpp = models.CharField('КПП', max_length=9, blank=True, default='')
    ogrn = models.CharField('ОГРН', max_length=15, blank=True, default='')
    
    # Company names
    name = models.CharField('Полное наименование', max_length=500)
    short_name = models.CharField('Краткое наименование', max_length=200, blank=True, default='')
    
    # Addresses
    legal_address = models.TextField('Юридический адрес', blank=True, default='')
    actual_address = models.TextField('Фактический адрес', blank=True, default='')
    region = models.CharField('Регион', max_length=100, blank=True, default='')
    
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
