"""
Development settings for Lider Garant project.
"""
from .base import *

DEBUG = True

# Frontend URL for invitation links
FRONTEND_URL = 'http://localhost:3000'
DEFAULT_FROM_EMAIL = 'info@lider-garant.ru'

# Use console email backend for development (can be overridden in .env)
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')

# Additional CORS origins for development
CORS_ALLOW_ALL_ORIGINS = True  # Only for development!

# Channels - use in-memory for development
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    }
}

# More verbose logging in development
LOGGING['root']['level'] = 'DEBUG'
LOGGING['loggers']['django.db.backends'] = {
    'handlers': ['console'],
    'level': 'WARNING',  # Set to DEBUG to see SQL queries
    'propagate': False,
}
