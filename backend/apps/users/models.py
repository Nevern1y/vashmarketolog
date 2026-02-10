"""
Custom User model for Lider Garant.
Supports 4 roles: Client, Agent, Partner (Bank), Admin.
"""
import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone


class UserRole(models.TextChoices):
    """User role choices."""
    CLIENT = 'client', 'Клиент'
    AGENT = 'agent', 'Агент'
    PARTNER = 'partner', 'Партнёр (Банк)'
    ADMIN = 'admin', 'Администратор'
    SEO = 'seo', 'SEO-менеджер'


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication."""

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user with the given email and password."""
        if not email:
            raise ValueError('Email is required')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', UserRole.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model.
    Uses email as the unique identifier instead of username.
    """
    email = models.EmailField(
        'Email',
        unique=True,
        error_messages={
            'unique': 'Пользователь с таким email уже существует.',
        }
    )
    phone = models.CharField(
        'Телефон',
        max_length=20,
        blank=True,
        default=''
    )

    avatar = models.ImageField(
        'Аватар',
        upload_to='avatars/',
        null=True,
        blank=True
    )
    
    # Role-based access
    role = models.CharField(
        'Роль',
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.CLIENT
    )
    
    # Profile fields
    first_name = models.CharField('Имя', max_length=150, blank=True)
    last_name = models.CharField('Фамилия', max_length=150, blank=True)
    
    # Status
    is_active = models.BooleanField(
        'Активен',
        default=True,
        help_text='Определяет, может ли пользователь войти в систему.'
    )
    is_staff = models.BooleanField(
        'Сотрудник',
        default=False,
        help_text='Определяет доступ к админ-панели.'
    )
    
    # Partner invite fields (for invite-only registration)
    invite_token = models.UUIDField(
        'Токен приглашения',
        null=True,
        blank=True,
        unique=True
    )
    invite_accepted_at = models.DateTimeField(
        'Дата принятия приглашения',
        null=True,
        blank=True
    )
    invited_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invited_users',
        verbose_name='Приглашён пользователем'
    )
    
    # Phase 4: Agent Accreditation
    class AccreditationStatus(models.TextChoices):
        NONE = 'none', 'Не подана'
        PENDING = 'pending', 'На проверке'
        APPROVED = 'approved', 'Аккредитован'
        REJECTED = 'rejected', 'Отклонена'
    
    accreditation_status = models.CharField(
        'Статус аккредитации',
        max_length=20,
        choices=AccreditationStatus.choices,
        default=AccreditationStatus.NONE,
        help_text='Статус аккредитации агента (только для роли Agent)'
    )
    accreditation_submitted_at = models.DateTimeField(
        'Дата подачи аккредитации',
        null=True,
        blank=True
    )
    accreditation_reviewed_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_accreditations',
        verbose_name='Проверил'
    )
    accreditation_reviewed_at = models.DateTimeField(
        'Дата проверки',
        null=True,
        blank=True
    )
    accreditation_comment = models.TextField(
        'Комментарий администратора',
        blank=True,
        default='',
        help_text='Причина отклонения или примечания'
    )
    
    # Timestamps
    date_joined = models.DateTimeField('Дата регистрации', default=timezone.now)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)

    # Email verification
    email_verified = models.BooleanField(
        'Email подтверждён',
        default=False,
        help_text='Подтверждён ли email пользователя'
    )
    email_verification_token = models.CharField(
        'Токен верификации email',
        max_length=64,
        blank=True,
        null=True
    )
    email_verification_sent_at = models.DateTimeField(
        'Дата отправки верификации',
        null=True,
        blank=True
    )

    # Password reset
    password_reset_token = models.CharField(
        'Токен сброса пароля',
        max_length=64,
        blank=True,
        null=True
    )
    password_reset_sent_at = models.DateTimeField(
        'Дата отправки сброса пароля',
        null=True,
        blank=True
    )

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # Email is already required as USERNAME_FIELD

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
        ordering = ['-date_joined']

    def __str__(self):
        return self.email

    def get_full_name(self):
        """Return the first_name plus the last_name, with a space in between."""
        full_name = f'{self.first_name} {self.last_name}'.strip()
        return full_name or self.email

    def get_short_name(self):
        """Return the short name for the user."""
        return self.first_name or self.email.split('@')[0]

    @property
    def is_client(self):
        return self.role == UserRole.CLIENT

    @property
    def is_agent(self):
        return self.role == UserRole.AGENT

    @property
    def is_partner(self):
        return self.role == UserRole.PARTNER

    @property
    def is_admin(self):
        return self.role == UserRole.ADMIN or self.is_superuser

    @property
    def is_seo(self):
        return self.role == UserRole.SEO

    @property
    def can_access_seo_admin(self):
        """Check if user can access SEO admin panel."""
        return self.is_admin or self.is_seo

    def generate_invite_token(self):
        """Generate a unique invite token for partner registration."""
        self.invite_token = uuid.uuid4()
        self.save(update_fields=['invite_token'])
        return self.invite_token

    def accept_invite(self, password):
        """Accept invite and set password."""
        self.set_password(password)
        self.invite_accepted_at = timezone.now()
        self.invite_token = None  # Invalidate token after use
        self.is_active = True
        self.save(update_fields=['password', 'invite_accepted_at', 'invite_token', 'is_active'])


class EmailVerificationCode(models.Model):
    """
    Temporary verification codes for email confirmation during registration.
    Codes expire after 20 minutes.
    """
    email = models.EmailField('Email', db_index=True)
    code = models.CharField('Код', max_length=6)
    created_at = models.DateTimeField('Создан', auto_now_add=True)
    expires_at = models.DateTimeField('Истекает')
    is_used = models.BooleanField('Использован', default=False)
    attempts = models.IntegerField('Попытки ввода', default=0)

    class Meta:
        verbose_name = 'Код верификации email'
        verbose_name_plural = 'Коды верификации email'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.email} - {self.code}"

    @classmethod
    def generate_code(cls):
        """Generate a 6-digit code."""
        import random
        return ''.join([str(random.randint(0, 9)) for _ in range(6)])

    @classmethod
    def create_for_email(cls, email):
        """Create a new verification code for the given email."""
        from datetime import timedelta
        
        # Invalidate any existing codes for this email
        cls.objects.filter(email=email.lower(), is_used=False).update(is_used=True)
        
        # Create new code (expires in 20 minutes)
        code = cls.generate_code()
        expires_at = timezone.now() + timedelta(minutes=20)
        
        return cls.objects.create(
            email=email.lower(),
            code=code,
            expires_at=expires_at
        )

    def is_valid(self):
        """Check if code is still valid (not used, not expired, not too many attempts)."""
        if self.is_used:
            return False
        if self.attempts >= 5:  # Max 5 attempts
            return False
        if timezone.now() > self.expires_at:
            return False
        return True

    def verify(self, input_code):
        """Verify the input code. Returns True if valid, False otherwise."""
        self.attempts += 1
        self.save(update_fields=['attempts'])
        
        if not self.is_valid():
            return False
        
        if self.code == input_code:
            self.is_used = True
            self.save(update_fields=['is_used'])
            return True
        
        return False
