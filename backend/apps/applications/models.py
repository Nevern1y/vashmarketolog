"""
Application models for Lider Garant.
Loan/guarantee applications with status workflow and partner decisions.
"""
from django.db import models
from django.conf import settings


class ProductType(models.TextChoices):
    """Financial product types - 11 types per ТЗ Калькулятор."""
    # Original 6 products
    BANK_GUARANTEE = 'bank_guarantee', 'Банковская гарантия'
    TENDER_LOAN = 'tender_loan', 'Тендерный кредит'
    CONTRACT_LOAN = 'contract_loan', 'Кредит на исполнение контракта'
    CORPORATE_CREDIT = 'corporate_credit', 'Корпоративный кредит'
    FACTORING = 'factoring', 'Факторинг'
    LEASING = 'leasing', 'Лизинг'
    # Phase 1 additions from ТЗ
    VED = 'ved', 'ВЭД (Валютные операции)'
    INSURANCE = 'insurance', 'Страхование'
    RKO = 'rko', 'РКО'
    SPECIAL_ACCOUNT = 'special_account', 'Спецсчет'
    TENDER_SUPPORT = 'tender_support', 'Тендерное сопровождение'
    DEPOSITS = 'deposits', 'Депозиты'


class InsuranceCategory(models.TextChoices):
    """Insurance categories per ТЗ Страхование."""
    PERSONNEL = 'personnel', 'Персонал'
    TRANSPORT = 'transport', 'Транспорт'
    PROPERTY = 'property', 'Имущество'
    LIABILITY = 'liability', 'Ответственность'


class InsuranceProductType(models.TextChoices):
    """Insurance product subtypes per ТЗ."""
    # Personnel
    DMS = 'dms', 'Добровольное медицинское страхование (ДМС)'
    CRITICAL_ILLNESS = 'critical_illness', 'Страхование критических заболеваний'
    ACCIDENT = 'accident', 'Страхование несчастных случаев'
    TRAVEL = 'travel', 'Комплексное страхование в поездках'
    # Transport
    OSAGO = 'osago', 'ОСАГО юридических лиц'
    FLEET = 'fleet', 'Комплексное страхование автопарков'
    SPECIAL_TECH = 'special_tech', 'Страхование специальной техники'
    CARRIER_LIABILITY = 'carrier_liability', 'Страхование ответственности перевозчика'
    # Property
    CONSTRUCTION = 'construction', 'Страхование объектов строительства'
    CARGO = 'cargo', 'Страхование грузов и перевозок'
    COMPANY_PROPERTY = 'company_property', 'Страхование имущества компаний'
    BUSINESS_INTERRUPTION = 'business_interruption', 'Страхование перерывов деятельности'
    # Liability
    CIVIL_LIABILITY = 'civil_liability', 'Страхование гражданской ответственности'
    HAZARDOUS_OBJECTS = 'hazardous_objects', 'Страхование опасных объектов'
    PROFESSIONAL_RISKS = 'professional_risks', 'Страхование профессиональных рисков'
    QUALITY_LIABILITY = 'quality_liability', 'Страхование ответственности за качество'


class FactoringType(models.TextChoices):
    """Factoring types per ТЗ Факторинг."""
    CLASSIC = 'classic', 'Классический факторинг'
    CLOSED = 'closed', 'Закрытый факторинг'
    PROCUREMENT = 'procurement', 'Закупочный факторинг'


class TenderSupportType(models.TextChoices):
    """Tender support types per ТЗ Тендерное сопровождение."""
    ONE_TIME = 'one_time', 'Разовое сопровождение'
    FULL_CYCLE = 'full_cycle', 'Тендерное сопровождение под ключ'


class PurchaseCategory(models.TextChoices):
    """Purchase category types per ТЗ."""
    GOV_44 = 'gov_44', 'Госзакупки по 44-ФЗ'
    GOV_223 = 'gov_223', 'Закупки по 223-ФЗ'
    PROPERTY = 'property', 'Имущественные торги'
    COMMERCIAL = 'commercial', 'Коммерческие закупки'


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
    """Application workflow statuses (internal string-based)."""
    DRAFT = 'draft', 'Черновик'
    PENDING = 'pending', 'На рассмотрении'
    IN_REVIEW = 'in_review', 'В работе'
    INFO_REQUESTED = 'info_requested', 'Запрошена информация'
    APPROVED = 'approved', 'Одобрено'
    REJECTED = 'rejected', 'Отклонено'
    WON = 'won', 'Выигран'
    LOST = 'lost', 'Проигран'


class ApplicationStatusDefinition(models.Model):
    """
    Reference table for Application Statuses per Appendix A (Приложение А).
    
    CRITICAL: Status ID depends on Product Type!
    The same status (e.g., "Анкета") has different IDs:
    - ID 101 for Bank Guarantee (БГ)
    - ID 2101 for Contract Loan (КИК)
    
    Status Model for БГ (from Appendix A.1):
    - ID101: Анкета, ID102: Предзаявка, ID110: Прескоринг
    - ID120: Дозаполнение заявки, ID210: Проверка документов
    - ID520: Не актуальна, ID530: Отклонена
    - ID640: Одобрено с замечаниями, ID710: Ожидается согласование БГ
    - ID715: Ожидается формирование ЭЦП, ID720: Ожидаются документы ЭЦП
    - ID750: Проверка ЭЦП, ID810: Ожидается оплата
    - ID850: Ожидается выпуск, ID910: Гарантия выпущена
    - ID1010: Гарантия в реестре, ID1090: Гарантия закрыта
    
    Status Model for КИК (from Appendix A.2):
    - ID2101: Анкета, ID2102: Предзаявка, ID2110: Прескоринг
    - ID2120: Дозаполнение заявки, ID2210: Проверка документов
    - ID2520: Не актуальна, ID2530: Отклонена
    - ID2540: Одобрено с замечаниями, ID2712: Согласование условий
    - ID2715: Ожидается формирование ЭЦП, ID2720: Ожидаются документы ЭЦП
    - ID2750: Проверка ЭЦП, ID2810: Ожидается оплата
    - ID2860: Выдача кредита, ID2910: Кредит выдан, ID2990: Кредит погашен
    """
    status_id = models.IntegerField(
        'ID статуса',
        help_text='Числовой ID из Приложения А (101, 102, 2101, ...)'
    )
    product_type = models.CharField(
        'Тип продукта',
        max_length=30,
        db_index=True,
        help_text='bank_guarantee, contract_loan, etc.'
    )
    name = models.CharField(
        'Наименование',
        max_length=200,
        help_text='Название статуса из Приложения А'
    )
    internal_status = models.CharField(
        'Внутренний статус',
        max_length=20,
        choices=ApplicationStatus.choices,
        blank=True,
        default='',
        help_text='Маппинг на внутренний статус (draft, pending, approved, etc.)'
    )
    order = models.IntegerField(
        'Порядок',
        default=0,
        help_text='Порядок отображения в воронке статусов'
    )
    is_terminal = models.BooleanField(
        'Конечный статус',
        default=False,
        help_text='Является ли статус финальным (закрыта, выдан, погашен)'
    )
    is_active = models.BooleanField(
        'Активен',
        default=True,
        help_text='Используется ли этот статус'
    )
    
    class Meta:
        verbose_name = 'Статус заявки (справочник)'
        verbose_name_plural = 'Статусы заявок (справочник)'
        ordering = ['product_type', 'order', 'status_id']
        unique_together = ['status_id', 'product_type']
        indexes = [
            models.Index(fields=['product_type', 'status_id']),
        ]
    
    def __str__(self):
        return f"[{self.product_type}] ID:{self.status_id} - {self.name}"



class CalculationSession(models.Model):
    """
    Stores a calculation session with bank offers.
    
    This is the "root application" that groups multiple Application records
    created from the same calculation. Allows users to return to the bank
    selection page via breadcrumb navigation.
    
    Flow:
    1. User fills calculator form → Calculate → CalculationSession created
    2. User selects banks → Application records created with calculation_session FK
    3. User opens Application detail → breadcrumb links back to CalculationSession
    """
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='calculation_sessions',
        verbose_name='Создал'
    )
    company = models.ForeignKey(
        'companies.CompanyProfile',
        on_delete=models.CASCADE,
        related_name='calculation_sessions',
        verbose_name='Компания'
    )
    
    # Product type from calculator
    product_type = models.CharField(
        'Тип продукта',
        max_length=30,
        choices=ProductType.choices
    )
    
    # Calculation form data (all fields from calculator form)
    form_data = models.JSONField(
        'Данные формы',
        default=dict,
        help_text='Данные формы калькулятора: сумма, сроки, закон, тип и т.д.'
    )
    
    # Calculated offers (approved banks with rates)
    approved_banks = models.JSONField(
        'Одобренные банки',
        default=list,
        help_text='Список одобренных банков с тарифами: [{name, rate, speed, ...}]'
    )
    
    # Rejected banks with reasons
    rejected_banks = models.JSONField(
        'Отклонённые банки',
        default=list,
        help_text='Список отклонённых банков: [{bank, reason}]'
    )
    
    # Selected bank names (for tracking which banks user already submitted to)
    submitted_banks = models.JSONField(
        'Отправленные банки',
        default=list,
        help_text='Список банков, по которым созданы заявки'
    )
    
    # Display title (e.g., "БГ 24 444 244 ₽ • contract_execution")
    title = models.CharField(
        'Заголовок',
        max_length=200,
        blank=True,
        default='',
        help_text='Отображаемый заголовок сессии калькуляции'
    )
    
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)
    
    class Meta:
        verbose_name = 'Сессия калькуляции'
        verbose_name_plural = 'Сессии калькуляции'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Calc #{self.id} - {self.get_product_type_display()} - {self.title}"
    
    @property
    def remaining_banks_count(self):
        """Number of approved banks not yet submitted."""
        submitted = set(self.submitted_banks)
        return sum(1 for bank in self.approved_banks if bank.get('name') not in submitted)


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
    
    # Link to calculation session (root application)
    calculation_session = models.ForeignKey(
        CalculationSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='applications',
        verbose_name='Сессия калькуляции',
        help_text='Ссылка на сессию калькуляции (корневую заявку)'
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
    
    # =============================================================================
    # PRODUCT-SPECIFIC FIELDS (Phase 1: ТЗ Compliance)
    # =============================================================================
    
    # Insurance fields (ТЗ: Страхование)
    insurance_category = models.CharField(
        'Категория страхования',
        max_length=30,
        choices=InsuranceCategory.choices,
        blank=True,
        default='',
        help_text='Персонал/Транспорт/Имущество/Ответственность'
    )
    insurance_product_type = models.CharField(
        'Страховой продукт',
        max_length=40,
        choices=InsuranceProductType.choices,
        blank=True,
        default='',
        help_text='Подтип страхования (ДМС, ОСАГО, и т.д.)'
    )
    
    # Factoring fields (ТЗ: Факторинг)
    factoring_type = models.CharField(
        'Тип факторинга',
        max_length=20,
        choices=FactoringType.choices,
        blank=True,
        default='',
        help_text='Классический/Закрытый/Закупочный'
    )
    contractor_inn = models.CharField(
        'ИНН контрагента',
        max_length=12,
        blank=True,
        default='',
        help_text='ИНН дебитора для факторинга'
    )
    
    # VED fields (ТЗ: ВЭД)
    ved_currency = models.CharField(
        'Валюта ВЭД',
        max_length=10,
        blank=True,
        default='',
        help_text='Валюта платежа (USD, EUR, CNY, RUB)'
    )
    ved_country = models.CharField(
        'Страна контрагента',
        max_length=100,
        blank=True,
        default='',
        help_text='Страна платежа для ВЭД'
    )
    
    # Tender Support fields (ТЗ: Тендерное сопровождение)
    tender_support_type = models.CharField(
        'Тип сопровождения',
        max_length=20,
        choices=TenderSupportType.choices,
        blank=True,
        default='',
        help_text='Разовое/Под ключ'
    )
    purchase_category = models.CharField(
        'Категория закупок',
        max_length=20,
        choices=PurchaseCategory.choices,
        blank=True,
        default='',
        help_text='44-ФЗ/223-ФЗ/Имущественные/Коммерческие'
    )
    industry = models.CharField(
        'Отрасль закупок',
        max_length=200,
        blank=True,
        default='',
        help_text='Интересующая отрасль закупок'
    )
    
    # RKO/SpecAccount type (ТЗ: РКО и Спецсчета)
    account_type = models.CharField(
        'Тип счета',
        max_length=20,
        blank=True,
        default='',
        help_text='РКО или Спецсчет'
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
    
    # Phase 1: Full client data for Bank API compliance (API 1.1)
    # Stores complete client[] payload structure:
    #   - actual_address, post_address (with postal_code)
    #   - founders[] (with passport data, addresses)
    #   - checking_accounts[]
    #   - contact_person (full_name, phone, email)
    #   - beneficiary (inn, legal_address)
    full_client_data = models.JSONField(
        'Полные данные клиента (JSON)',
        default=dict,
        blank=True,
        help_text='Полная структура client[] для API банка (учредители, адреса, счета)'
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
    
    # Bank Integration fields (Phase 7)
    external_id = models.CharField(
        'ID заявки в банке',
        max_length=100,
        null=True,
        blank=True,
        db_index=True,  # Index for efficient webhook lookups by ticket_id
        help_text='ID заявки, возвращённый банком после отправки (ticket_id)'
    )
    bank_status = models.CharField(
        'Статус в банке',
        max_length=50,
        default='new',
        blank=True,
        help_text='Статус заявки в банке (new, sent, scoring, approved, rejected)'
    )
    
    # Bank API Integration Fields (from API_1.1 analysis)
    commission_data = models.JSONField(
        'Комиссия (JSON)',
        default=dict,
        blank=True,
        help_text='Структура комиссии от банка: {total, bank, agent, default}'
    )
    signing_url = models.URLField(
        'URL для подписи',
        max_length=500,
        blank=True,
        default='',
        help_text='URL для подписи документов в банке (из get_ticket_token)'
    )
    
    # NEW: Numeric status ID per Appendix A (Приложение А)
    # This stores the bank-compatible status ID (101, 110, 520, etc.)
    status_id = models.IntegerField(
        'ID статуса (банк)',
        null=True,
        blank=True,
        db_index=True,
        help_text='Числовой ID статуса из Приложения А для интеграции с банком'
    )
    
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
    
    # Bank integration: distinguish messages from bank webhook
    is_bank_message = models.BooleanField(
        'Сообщение от банка',
        default=False,
        help_text='True если сообщение получено через вебхук TICKET_CHAT_MESSAGE_URL'
    )

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
