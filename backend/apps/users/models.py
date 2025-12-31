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
