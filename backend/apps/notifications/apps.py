"""
Notifications app configuration.
"""
from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.notifications'
    verbose_name = 'Уведомления'

    def ready(self):
        """Import signals when app is ready."""
        import apps.notifications.signals  # noqa: F401
