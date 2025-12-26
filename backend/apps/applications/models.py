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
    FACTORING = 'factoring', 'Факторинг'
    LEASING = 'leasing', 'Лизинг'


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
    amount = models.DecimalField(
        'Сумма',
        max_digits=15,
        decimal_places=2
    )
    term_months = models.IntegerField('Срок (месяцы)')
    
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
