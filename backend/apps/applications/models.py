"""
Application models for Lider Garant.
Loan/guarantee applications with status workflow and partner decisions.
"""
from django.db import models
from django.conf import settings


class ProductType(models.TextChoices):
    """Financial product types."""
    BANK_GUARANTEE = 'bank_guarantee', 'Банковская гарантия'
    TENDER_LOAN = 'tender_loan', 'Тендерный кредит'
    CONTRACT_LOAN = 'contract_loan', 'Кредит на исполнение контракта'
    CORPORATE_CREDIT = 'corporate_credit', 'Корпоративный кредит'
    FACTORING = 'factoring', 'Факторинг'
    LEASING = 'leasing', 'Лизинг'


class GuaranteeType(models.TextChoices):
    """Bank Guarantee subtypes per TZ requirements."""
    APPLICATION_SECURITY = 'application_security', 'Обеспечение заявки'
    CONTRACT_EXECUTION = 'contract_execution', 'Исполнение контракта'
    ADVANCE_RETURN = 'advance_return', 'Возврат аванса'
    WARRANTY_OBLIGATIONS = 'warranty_obligations', 'Гарантийные обязательства'
    PAYMENT_GUARANTEE = 'payment_guarantee', 'Гарантии оплаты товара'
    CUSTOMS_GUARANTEE = 'customs_guarantee', 'Таможенные гарантии'
    VAT_REFUND = 'vat_refund', 'Возмещение НДС'


class TenderLaw(models.TextChoices):
    """Tender law types."""
    FZ_44 = '44_fz', '44-ФЗ'
    FZ_223 = '223_fz', '223-ФЗ'
    PP_615 = '615_pp', '615-ПП'
    FZ_185 = '185_fz', '185-ФЗ'
    KBG = 'kbg', 'КБГ (Коммерческая)'
    COMMERCIAL = 'commercial', 'Коммерческий'


class CreditSubType(models.TextChoices):
    """Corporate credit sub-types."""
    ONE_TIME_CREDIT = 'one_time_credit', 'Разовый кредит'
    NON_REVOLVING_LINE = 'non_revolving_line', 'Невозобновляемая КЛ'
    REVOLVING_LINE = 'revolving_line', 'Возобновляемая КЛ'
    OVERDRAFT = 'overdraft', 'Овердрафт'


class ApplicationStatus(models.TextChoices):
    """Application workflow statuses."""
    DRAFT = 'draft', 'Черновик'
    PENDING = 'pending', 'На рассмотрении'
    IN_REVIEW = 'in_review', 'В работе'
    INFO_REQUESTED = 'info_requested', 'Запрошена информация'
    APPROVED = 'approved', 'Одобрено'
    REJECTED = 'rejected', 'Отклонено'
    WON = 'won', 'Выигран'
    LOST = 'lost', 'Проигран'


class Application(models.Model):
    """
    Loan/Guarantee Application model.
    
    Key business rules:
    - CLIENT creates for their own company
    - AGENT creates on behalf of CRM clients
    - PARTNER can only view assigned applications and make decisions
    - ADMIN assigns applications to partners
    """
    # Creator and Company
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_applications',
        verbose_name='Создал'
    )
    company = models.ForeignKey(
        'companies.CompanyProfile',
        on_delete=models.CASCADE,
        related_name='applications',
        verbose_name='Компания'
    )
    
    # Product details
    product_type = models.CharField(
        'Тип продукта',
        max_length=30,
        choices=ProductType.choices
    )
    # Bank Guarantee specific fields
    guarantee_type = models.CharField(
        'Тип гарантии',
        max_length=30,
        choices=GuaranteeType.choices,
        blank=True,
        default='',
        help_text='Тип БГ (только для bank_guarantee)'
    )
    tender_law = models.CharField(
        'Закон о закупках',
        max_length=20,
        choices=TenderLaw.choices,
        blank=True,
        default='',
        help_text='Федеральный закон (44-ФЗ, 223-ФЗ, 185-ФЗ, КБГ)'
    )
    amount = models.DecimalField(
        'Сумма',
        max_digits=15,
        decimal_places=2
    )
    term_months = models.IntegerField('Срок (месяцы)')
    
    # Credit-specific fields
    credit_sub_type = models.CharField(
        'Тип кредита',
        max_length=30,
        choices=CreditSubType.choices,
        blank=True,
        default='',
        help_text='Подтип кредита (только для corporate_credit)'
    )
    financing_term_days = models.IntegerField(
        'Срок в днях',
        null=True,
        blank=True,
        help_text='Срок финансирования в днях (альтернатива term_months)'
    )
    pledge_description = models.TextField(
        'Описание залога',
        blank=True,
        default='',
        help_text='Обеспечение/залог: недвижимость, транспорт, депозит и т.д.'
    )
    
    # Target Bank - for Admin routing to specific Partner
    target_bank_name = models.CharField(
        'Целевой банк',
        max_length=200,
        blank=True,
        default='',
        help_text='Банк, в который планируется направить заявку (для маршрутизации Админом)'
    )
    
    # Tender info (optional)
    tender_number = models.CharField(
        'Номер тендера',
        max_length=100,
        blank=True,
        default=''
    )
    tender_platform = models.CharField(
        'Площадка',
        max_length=200,
        blank=True,
        default=''
    )
    tender_deadline = models.DateField(
        'Дедлайн тендера',
        null=True,
        blank=True
    )
    
    # Goscontract data - structured JSON for Bank API (Postman Collection) compliance
    # Stores data for Postman keys:
    #   goscontract[purchase_number] -> purchase_number (номер закупки)
    #   goscontract[subject] -> subject (предмет закупки)
    #   goscontract[is_close_auction] -> is_close_auction ("1" or "0")
    #   goscontract[contract_number] -> contract_number (номер контракта)
    goscontract_data = models.JSONField(
        'Данные тендера (JSON)',
        default=dict,
        blank=True,
        help_text='Структурированные данные о госконтракте для API банка'
    )
    
    # Status
    status = models.CharField(
        'Статус',
        max_length=20,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.DRAFT
    )
    
    # Partner assignment (Admin only)
    assigned_partner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_applications',
        limit_choices_to={'role': 'partner'},
        verbose_name='Назначенный партнёр'
    )
    
    # Documents (ManyToMany for checkbox selection)
    documents = models.ManyToManyField(
        'documents.Document',
        blank=True,
        related_name='applications',
        verbose_name='Документы'
    )
    
    # Digital signature stub
    has_signature = models.BooleanField(
        'Есть ЭЦП',
        default=False
    )
    signature_file = models.FileField(
        'Файл ЭЦП',
        upload_to='signatures/%Y/%m/',
        null=True,
        blank=True
    )
    
    # Comments/Notes
    notes = models.TextField('Примечания', blank=True, default='')
    
    # Timestamps
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)
    submitted_at = models.DateTimeField('Дата подачи', null=True, blank=True)

    class Meta:
        verbose_name = 'Заявка'
        verbose_name_plural = 'Заявки'
        ordering = ['-created_at']

    def __str__(self):
        return f"#{self.id} - {self.get_product_type_display()} - {self.amount}₽"

    @property
    def is_editable(self):
        """Can only edit drafts."""
        return self.status == ApplicationStatus.DRAFT

    @property
    def can_submit(self):
        """Can submit if in draft."""
        return self.status == ApplicationStatus.DRAFT


class PartnerDecision(models.Model):
    """
    Partner's decision on an application.
    Partners can Approve, Reject, or Request more info.
    """
    class DecisionType(models.TextChoices):
        APPROVED = 'approved', 'Одобрено'
        REJECTED = 'rejected', 'Отклонено'
        INFO_REQUESTED = 'info_requested', 'Запрошена информация'

    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='decisions',
        verbose_name='Заявка'
    )
    partner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='decisions',
        verbose_name='Партнёр'
    )
    
    decision = models.CharField(
        'Решение',
        max_length=20,
        choices=DecisionType.choices
    )
    comment = models.TextField('Комментарий', blank=True, default='')
    
    # Offer details (if approved)
    offered_rate = models.DecimalField(
        'Предложенная ставка %',
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )
    offered_amount = models.DecimalField(
        'Предложенная сумма',
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField('Дата решения', auto_now_add=True)

    class Meta:
        verbose_name = 'Решение партнёра'
        verbose_name_plural = 'Решения партнёров'
        ordering = ['-created_at']

    def __str__(self):
        return f"Решение от {self.partner.email}: {self.get_decision_display()}"


class TicketMessage(models.Model):
    """
    Chat message within an application.
    
    Allows Agent <-> Admin <-> Partner communication.
    Uses REST API + Polling for MVP (WebSocket deferred to Phase 2).
    """
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='ticket_chat',
        verbose_name='Заявка'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ticket_messages',
        verbose_name='Отправитель'
    )
    content = models.TextField('Сообщение', blank=True, default='')
    file = models.FileField(
        'Вложение',
        upload_to='chat_files/%Y/%m/',
        null=True,
        blank=True,
        help_text='Документ (PDF, JPG, PNG и др.)'
    )
    created_at = models.DateTimeField('Дата отправки', auto_now_add=True)

    class Meta:
        verbose_name = 'Сообщение чата'
        verbose_name_plural = 'Сообщения чата'
        ordering = ['created_at']

    def __str__(self):
        return f"Сообщение от {self.sender.email} в заявке #{self.application_id}"

    @property
    def file_url(self):
        """Return file URL if file exists."""
        if self.file:
            return self.file.url
        return None
