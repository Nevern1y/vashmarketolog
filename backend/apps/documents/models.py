"""
Document Library models for Lider Garant.
Documents are uploaded once and attached to multiple applications via ManyToMany.

=============================================================================
BREAKING CHANGE: Refactored to use numeric IDs per Appendix B (Приложение Б)
=============================================================================
Document Type IDs are PRODUCT-SPECIFIC:
- ID 21 for Bank Guarantee = "Паспорт генерального директора"
- ID 74 for Contract Loan = "Паспорт генерального директора" (same meaning, different ID)
"""
from django.db import models
from django.conf import settings


class DocumentSource(models.TextChoices):
    """Source of document - who uploads/generates it."""
    AUTO = 'auto', 'Формируется автоматически'
    AGENT = 'agent', 'Загружается Агентом'
    BANK = 'bank', 'Загружается Банком'
    AGENT_BANK = 'agent_bank', 'Загружается Агентом/Банком'


class DocumentStatus(models.TextChoices):
    """Document verification status."""
    PENDING = 'pending', 'На проверке'
    VERIFIED = 'verified', 'Проверен'
    REJECTED = 'rejected', 'Отклонён'
    NOT_ALLOWED = 'not_allowed', 'Не допущен'  # Per ТЗ requirement


class DocumentTypeDefinition(models.Model):
    """
    Reference table for Document Types per Appendix B (Приложение Б).
    
    CRITICAL: Document Type ID depends on Product Type!
    The same document (e.g., "Passport of Director") has different IDs:
    - ID 21 for Bank Guarantee (БГ)
    - ID 74 for Contract Loan (КИК)
    
    This table is populated via data migration from Appendix B specifications.
    """
    # Use composite key: (id, product_type) 
    # But Django requires single PK, so we use auto PK and unique_together
    
    document_type_id = models.IntegerField(
        'ID типа документа',
        help_text='Числовой ID из Приложения Б (17, 18, 21, 68, ...)'
    )
    product_type = models.CharField(
        'Тип продукта',
        max_length=30,
        db_index=True,
        help_text='bank_guarantee, contract_loan, etc.'
    )
    name = models.CharField(
        'Наименование',
        max_length=500,
        help_text='Название документа из Приложения Б'
    )
    source = models.CharField(
        'Источник',
        max_length=20,
        choices=DocumentSource.choices,
        default=DocumentSource.AGENT,
        help_text='Кто загружает: Автоматически / Агент / Банк'
    )
    is_active = models.BooleanField(
        'Активен',
        default=True,
        help_text='Используется ли этот тип документа'
    )
    
    class Meta:
        verbose_name = 'Тип документа (справочник)'
        verbose_name_plural = 'Типы документов (справочник)'
        ordering = ['product_type', 'document_type_id']
        unique_together = ['document_type_id', 'product_type']
        indexes = [
            models.Index(fields=['product_type', 'document_type_id']),
        ]
    
    def __str__(self):
        return f"[{self.product_type}] ID:{self.document_type_id} - {self.name}"


def document_upload_path(instance, filename):
    """Generate upload path for documents."""
    return f'documents/{instance.owner.id}/{filename}'


class Document(models.Model):
    """
    Document model for the Document Library.
    
    BREAKING CHANGE: document_type is now INTEGER (Приложение Б ID)
    instead of string choices.
    
    Key business rule:
    Documents are stored in a library. When creating an application,
    user selects existing docs via checkbox - no re-upload.
    """
    # Ownership
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='documents',
        verbose_name='Владелец'
    )
    company = models.ForeignKey(
        'companies.CompanyProfile',
        on_delete=models.SET_NULL,
        related_name='documents',
        verbose_name='Компания',
        null=True,
        blank=True
    )
    
    # Document info
    name = models.CharField('Название', max_length=300)
    file = models.FileField('Файл', upload_to=document_upload_path)
    
    # NEW: Numeric document type ID per Приложение Б
    document_type_id = models.IntegerField(
        'ID типа документа',
        default=0,  # 0 = "Дополнительный документ" (universal fallback)
        db_index=True,
        help_text='Числовой ID типа документа из Приложения Б'
    )
    
    # NEW: Product type context for document
    # This is crucial because same document_type_id means different things per product
    product_type = models.CharField(
        'Тип продукта',
        max_length=30,
        blank=True,
        default='',
        db_index=True,
        help_text='Контекст продукта (bank_guarantee, contract_loan, etc.)'
    )
    
    # Document status (auto-verified on upload - no admin verification needed)
    status = models.CharField(
        'Статус',
        max_length=20,
        choices=DocumentStatus.choices,
        default=DocumentStatus.VERIFIED
    )
    
    # Timestamps
    uploaded_at = models.DateTimeField('Дата загрузки', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)

    class Meta:
        verbose_name = 'Документ'
        verbose_name_plural = 'Документы'
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['document_type_id', 'product_type']),
        ]

    def __str__(self):
        return f"{self.name} (ID:{self.document_type_id})"

    @property
    def file_extension(self):
        """Get file extension."""
        if self.file:
            return self.file.name.split('.')[-1].lower()
        return ''

    def get_type_definition(self):
        """
        Get the DocumentTypeDefinition for this document.
        Returns None if not found in reference table.
        """
        if not self.document_type_id or not self.product_type:
            return None
        try:
            return DocumentTypeDefinition.objects.get(
                document_type_id=self.document_type_id,
                product_type=self.product_type
            )
        except DocumentTypeDefinition.DoesNotExist:
            return None
    
    @property
    def type_display(self):
        """
        Get human-readable document type name from reference table.
        Falls back to ID if not found.
        """
        type_def = self.get_type_definition()
        if type_def:
            return type_def.name
        # Fallback for documents without proper type definition
        if self.document_type_id == 0:
            return "Дополнительный документ"
        return f"Документ (ID: {self.document_type_id})"
    
    @property
    def source_display(self):
        """
        Get source information from reference table.
        """
        type_def = self.get_type_definition()
        if type_def:
            return type_def.get_source_display()
        return "Неизвестно"


class DocumentRequestStatus(models.TextChoices):
    """Status for document requests from admin to agent/client."""
    PENDING = 'pending', 'Ожидает'
    FULFILLED = 'fulfilled', 'Выполнено'
    CANCELLED = 'cancelled', 'Отменено'


class DocumentRequest(models.Model):
    """
    Model for admin to request specific documents from agents/clients.
    Creates a notification for the user to upload the requested document.
    """
    # Who needs to provide the document
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='document_requests',
        verbose_name='Пользователь'
    )
    
    # Who requested
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sent_document_requests',
        verbose_name='Запросил'
    )
    
    # What is requested
    document_type_name = models.CharField(
        'Название документа',
        max_length=500,
        help_text='Название запрашиваемого документа'
    )
    document_type_id = models.IntegerField(
        'ID типа документа',
        null=True,
        blank=True,
        help_text='Опциональный ID типа из Приложения Б'
    )
    comment = models.TextField(
        'Комментарий',
        blank=True,
        default='',
        help_text='Дополнительные указания для пользователя'
    )
    
    # Status tracking
    status = models.CharField(
        'Статус',
        max_length=20,
        choices=DocumentRequestStatus.choices,
        default=DocumentRequestStatus.PENDING
    )
    
    # Fulfilled document reference
    fulfilled_document = models.ForeignKey(
        Document,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='fulfilled_requests',
        verbose_name='Предоставленный документ'
    )
    
    # Timestamps
    created_at = models.DateTimeField('Дата запроса', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)
    fulfilled_at = models.DateTimeField('Дата выполнения', null=True, blank=True)
    
    # Notification tracking
    is_read = models.BooleanField('Прочитано', default=False)

    class Meta:
        verbose_name = 'Запрос документа'
        verbose_name_plural = 'Запросы документов'
        ordering = ['-created_at']

    def __str__(self):
        return f"Запрос: {self.document_type_name} от {self.user.email}"
    
    @property
    def is_pending(self):
        return self.status == DocumentRequestStatus.PENDING
