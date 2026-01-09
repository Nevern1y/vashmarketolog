"""
Bank Conditions models for storing partner bank tariffs and conditions.
"""
from django.db import models


class Bank(models.Model):
    """Partner bank information."""
    name = models.CharField('Наименование банка', max_length=255)
    short_name = models.CharField('Краткое название', max_length=100, blank=True)
    logo_url = models.URLField('URL логотипа', blank=True)
    is_active = models.BooleanField('Активен', default=True)
    order = models.IntegerField('Порядок сортировки', default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Банк-партнёр'
        verbose_name_plural = 'Банки-партнёры'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class BankCondition(models.Model):
    """General bank conditions (Table 1: Условия банков)."""
    
    bank = models.ForeignKey(
        Bank,
        on_delete=models.CASCADE,
        related_name='conditions',
        verbose_name='Банк'
    )
    product = models.CharField('Продукт', max_length=255)
    sum_min = models.DecimalField(
        'Сумма минимальная',
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True
    )
    sum_max = models.DecimalField(
        'Сумма максимальная',
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True
    )
    term_months = models.IntegerField('Срок (мес)', null=True, blank=True)
    term_days = models.IntegerField('Срок (дней)', null=True, blank=True)
    rate_min = models.DecimalField(
        'Ставка минимальная (%)',
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )
    rate_type = models.CharField(
        'Тип ставки',
        max_length=50,
        default='annual',
        choices=[
            ('annual', 'Годовая'),
            ('individual', 'Индивидуальная'),
        ]
    )
    service_commission = models.DecimalField(
        'Комиссия сервиса (%)',
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )
    service_commission_max = models.DecimalField(
        'Комиссия максимальная (%)',
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )
    additional_conditions = models.TextField(
        'Дополнительные условия / Стоп-факторы',
        blank=True
    )
    is_active = models.BooleanField('Активен', default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Условие банка'
        verbose_name_plural = 'Условия банков'
        ordering = ['bank__order', 'bank__name']

    def __str__(self):
        return f"{self.bank.name} - {self.product}"


class IndividualReviewCondition(models.Model):
    """Individual review conditions (Table 2: Индивидуальное рассмотрение)."""
    
    GUARANTEE_TYPE_CHOICES = [
        ('all', 'Все виды'),
        ('execution', 'Исполнение'),
        ('application', 'Заявка'),
        ('execution_application', 'Исполнение, Заявка'),
    ]
    
    bank = models.ForeignKey(
        Bank,
        on_delete=models.CASCADE,
        related_name='individual_conditions',
        verbose_name='Банк'
    )
    fz_type = models.CharField('ФЗ', max_length=50)  # 44/223, 44/223/185, etc.
    guarantee_type = models.CharField(
        'Вид БГ',
        max_length=50,
        choices=GUARANTEE_TYPE_CHOICES,
        default='all'
    )
    client_limit = models.DecimalField(
        'Лимит на клиента (млн)',
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    fz_application_limit = models.DecimalField(
        'Лимит по заявке ФЗ (млн)',
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    commercial_application_limit = models.DecimalField(
        'Лимит по заявке коммерции (млн)',
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    corporate_dept_limit = models.DecimalField(
        'Корп. Отдел (млн)',
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    term = models.CharField('Срок', max_length=50, blank=True)
    bank_rate = models.CharField('Ставка банка', max_length=50, blank=True)
    service_commission = models.DecimalField(
        'Комиссия Лидер-Гарант (%)',
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )
    is_active = models.BooleanField('Активен', default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Индивидуальное рассмотрение'
        verbose_name_plural = 'Индивидуальные рассмотрения'
        ordering = ['bank__order', 'bank__name']

    def __str__(self):
        return f"{self.bank.name} - {self.fz_type}"


class RKOCondition(models.Model):
    """RKO and special accounts conditions."""
    
    bank = models.ForeignKey(
        Bank,
        on_delete=models.CASCADE,
        related_name='rko_conditions',
        verbose_name='Банк'
    )
    description = models.TextField('Описание условий')
    is_active = models.BooleanField('Активен', default=True)
    order = models.IntegerField('Порядок', default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Условия РКО'
        verbose_name_plural = 'Условия РКО'
        ordering = ['order', 'bank__name']

    def __str__(self):
        return f"РКО - {self.bank.name}"


class StopFactor(models.Model):
    """Common stop-factors for all banks."""
    
    description = models.TextField('Описание')
    is_active = models.BooleanField('Активен', default=True)
    order = models.IntegerField('Порядок', default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Стоп-фактор'
        verbose_name_plural = 'Стоп-факторы'
        ordering = ['order']

    def __str__(self):
        return self.description[:50]
