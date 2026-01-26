"""
Production settings for Lider Garant project.
Deployment target: lk.lider-garant.ru
"""
import os
from .base import *

# =============================================================================
# CORE SECURITY SETTINGS
# =============================================================================
DEBUG = False

# Allowed hosts - pull from environment, with defaults for the production domain
ALLOWED_HOSTS = os.getenv(
    'ALLOWED_HOSTS', 
    '.lider-garant.ru,lk.lider-garant.ru,localhost,127.0.0.1'
).split(',')

# =============================================================================
# EMAIL CONFIGURATION
# =============================================================================
# Email backend - use SMTP for production
EMAIL_BACKEND = os.getenv(
    'EMAIL_BACKEND',
    'django.core.mail.backends.smtp.EmailBackend'
)

# SMTP server settings (Beget defaults)
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.beget.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '465'))
EMAIL_USE_SSL = os.getenv('EMAIL_USE_SSL', 'True').lower() == 'true'
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'False').lower() == 'true'

# SMTP authentication
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')

# Default sender
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@lider-garant.ru')
SERVER_EMAIL = os.getenv('SERVER_EMAIL', DEFAULT_FROM_EMAIL)

# Email subject prefix for admin notifications
EMAIL_SUBJECT_PREFIX = '[Лидер Гарант] '

# Timeout for email sending (seconds)
EMAIL_TIMEOUT = int(os.getenv('EMAIL_TIMEOUT', '30'))

# Frontend URL for email links (invitation, verification, password reset)
FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://lk.lider-garant.ru')

# =============================================================================
# HTTPS / SSL ENFORCEMENT
# =============================================================================
# These should be True when behind an HTTPS reverse proxy (Nginx with SSL)
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'True').lower() == 'true'
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# HSTS (HTTP Strict Transport Security)
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# =============================================================================
# COOKIE SECURITY
# =============================================================================
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_HTTPONLY = True

# CSRF trusted origins for the production domain
CSRF_TRUSTED_ORIGINS = [
    'https://lk.lider-garant.ru',
    'https://*.lider-garant.ru',
]

# =============================================================================
# CONTENT SECURITY
# =============================================================================
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# =============================================================================
# CORS CONFIGURATION
# =============================================================================
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ALLOWED_ORIGINS',
    'https://lk.lider-garant.ru,https://www.lider-garant.ru'
).split(',')
CORS_ALLOW_CREDENTIALS = True

# =============================================================================
# CHANNELS - REDIS IN PRODUCTION
# =============================================================================
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [(os.getenv('REDIS_HOST', 'redis'), int(os.getenv('REDIS_PORT', 6379)))],
        },
    }
}

# =============================================================================
# STATIC FILES - USE WHITENOISE FOR PRODUCTION
# =============================================================================
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# =============================================================================
# LOGGING - PRODUCTION LEVEL
# =============================================================================
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} {name} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
