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
    
    # Founders structure (JSONField for MVP - avoids complex DB relations)
    # Format: [{"name": "Иванов И.И.", "inn": "123456789012", "share": 50.0}, ...]
    founders_data = models.JSONField(
        'Учредители (JSON)',
        default=list,
        blank=True,
        help_text='Список учредителей: [{"name": "ФИО", "inn": "ИНН", "share": доля%}]'
    )
    
    # Bank accounts list (JSONField for MVP)
    # Format: [{"account": "40702810...", "bic": "044525000", "bank_name": "..."}, ...]
    bank_accounts_data = models.JSONField(
        'Банковские счета (JSON)',
        default=list,
        blank=True,
        help_text='Список счетов: [{"account": "р/с", "bic": "БИК", "bank_name": "Банк"}]'
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
