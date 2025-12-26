"""
Production settings for Lider Garant project.
"""
from .base import *

DEBUG = False

# Security settings for production
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True

# CORS - strict origins in production
CORS_ALLOW_ALL_ORIGINS = False

# Channels - use Redis in production
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [(os.getenv('REDIS_HOST', '127.0.0.1'), 6379)],
        },
    }
}
