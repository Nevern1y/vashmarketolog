"""
Document Library models for Lider Garant.
Documents are uploaded once and attached to multiple applications via ManyToMany.
"""
from django.db import models
from django.conf import settings


class DocumentType(models.TextChoices):
    """Document type categories - aligned with CSV specification."""
    # Legal / Founders (Юридические / Учредительные)
    PASSPORT_ALL_PAGES = 'passport_all_pages', 'Паспорт (все страницы)'
    FOUNDER_PASSPORT = 'founder_passport', 'Паспорт учредителя'
    APPOINTMENT_ORDER = 'appointment_order', 'Приказ о назначении директора'
    STATUTE = 'statute', 'Устав'
    LEASE_CONTRACT = 'lease_contract', 'Договор аренды'
    # Financials (Финансовые / Бухгалтерские)
    ACCOUNT_CARD_51 = 'account_card_51', 'Карточка 51 счета'
    ACCOUNT_CARD_60_62 = 'account_card_60_62', 'Карточка 60/62 счета'
    BALANCE_SHEET_F1 = 'balance_sheet_f1', 'Бухгалтерский баланс Ф1'
    FINANCIAL_RESULTS_F2 = 'financial_results_f2', 'Отчет о прибылях и убытках Ф2'
    TAX_DECLARATION = 'tax_declaration', 'Налоговая декларация'
    OSV_ALL = 'osv_all', 'ОСВ (общая)'
    # Contracts / Business (Договоры / Бизнес)
    CONTRACT_REGISTER = 'contract_register', 'Реестр контрактов'
    EXECUTED_CONTRACTS = 'executed_contracts', 'Исполненные контракты'
    # Other (Прочие)
    OTHER = 'other', 'Прочие'


class DocumentStatus(models.TextChoices):
    """Document verification status."""
    PENDING = 'pending', 'На проверке'
    VERIFIED = 'verified', 'Проверен'
    REJECTED = 'rejected', 'Отклонён'


def document_upload_path(instance, filename):
    """Generate upload path for documents."""
    return f'documents/{instance.owner.id}/{filename}'


class Document(models.Model):
    """
    Document model for the Document Library.
    
    Key business rule:
    Documents are stored in a library. When creating an application,
    user selects existing docs via checkbox - no re-upload.
    """
    # Ownership
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name='Владелец'
    )
    company = models.ForeignKey(
        'companies.CompanyProfile',
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name='Компания',
        null=True,
        blank=True
    )
    
    # Document info
    name = models.CharField('Название', max_length=300)
    file = models.FileField('Файл', upload_to=document_upload_path)
    document_type = models.CharField(
        'Тип документа',
        max_length=30,
        choices=DocumentType.choices,
        default=DocumentType.OTHER
    )
    
    # Verification status
    status = models.CharField(
        'Статус',
        max_length=20,
        choices=DocumentStatus.choices,
        default=DocumentStatus.PENDING
    )
    rejection_reason = models.TextField('Причина отклонения', blank=True, default='')
    
    # Verification audit trail
    verified_at = models.DateTimeField('Дата проверки', null=True, blank=True)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_documents',
        verbose_name='Проверил'
    )
    
    # Timestamps
    uploaded_at = models.DateTimeField('Дата загрузки', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)

    class Meta:
        verbose_name = 'Документ'
        verbose_name_plural = 'Документы'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.name} ({self.get_document_type_display()})"

    @property
    def file_extension(self):
        """Get file extension."""
        if self.file:
            return self.file.name.split('.')[-1].lower()
        return ''

    @property
    def is_verified(self):
        return self.status == DocumentStatus.VERIFIED

    @property
    def is_rejected(self):
        return self.status == DocumentStatus.REJECTED

    @property
    def is_pending(self):
        return self.status == DocumentStatus.PENDING
