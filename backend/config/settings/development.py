"""
Development settings for Lider Garant project.
"""
from .base import *

DEBUG = True

# Use console email backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

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
