"""
Process reliable SMTP outbox.
"""

import time

from django.conf import settings
from django.core.management.base import BaseCommand

from apps.notifications.email_service import process_outbox_batch, cleanup_outbox


class Command(BaseCommand):
    help = 'Send pending emails from outbox with retry support.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--loop',
            action='store_true',
            help='Run continuously as worker.',
        )
        parser.add_argument(
            '--sleep',
            type=int,
            default=int(getattr(settings, 'EMAIL_OUTBOX_WORKER_SLEEP_SECONDS', 10)),
            help='Sleep seconds between worker iterations.',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=int(getattr(settings, 'EMAIL_OUTBOX_BATCH_SIZE', 50)),
            help='Max emails processed per iteration.',
        )
        parser.add_argument(
            '--cleanup-every',
            type=int,
            default=360,
            help='Run outbox cleanup every N loop iterations (loop mode only).',
        )

    def handle(self, *args, **options):
        loop = options['loop']
        sleep_seconds = max(1, int(options['sleep']))
        batch_size = max(1, int(options['batch_size']))
        cleanup_every = max(1, int(options['cleanup_every']))
        iteration = 0

        self.stdout.write(self.style.SUCCESS(
            f"Email outbox processor started (loop={loop}, batch_size={batch_size}, cleanup_every={cleanup_every})"
        ))

        try:
            while True:
                iteration += 1
                stats = process_outbox_batch(batch_size=batch_size)
                self.stdout.write(
                    f"processed={stats['processed']} sent={stats['sent']} failed={stats['failed']}"
                )

                if loop and iteration % cleanup_every == 0:
                    cleanup_stats = cleanup_outbox()
                    self.stdout.write(
                        f"cleanup sent_deleted={cleanup_stats['sent_deleted']} failed_deleted={cleanup_stats['failed_deleted']}"
                    )

                if not loop:
                    break

                if stats['processed'] == 0:
                    time.sleep(sleep_seconds)
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING('Email outbox processor stopped.'))
