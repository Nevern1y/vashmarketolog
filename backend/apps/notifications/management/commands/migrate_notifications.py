"""
Management command to migrate existing PartnerDecision and DocumentRequest
to the new unified Notification model.
"""
from django.core.management.base import BaseCommand
from django.contrib.contenttypes.models import ContentType

from apps.notifications.models import Notification, NotificationType


class Command(BaseCommand):
    help = 'Migrate existing PartnerDecision and DocumentRequest to Notification model'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be migrated without actually creating notifications',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No data will be created'))
        
        decisions_count = self.migrate_partner_decisions(dry_run)
        requests_count = self.migrate_document_requests(dry_run)
        
        self.stdout.write(self.style.SUCCESS(
            f'\nMigration complete:\n'
            f'  - Partner Decisions: {decisions_count}\n'
            f'  - Document Requests: {requests_count}\n'
            f'  - Total: {decisions_count + requests_count}'
        ))

    def migrate_partner_decisions(self, dry_run: bool) -> int:
        """Migrate PartnerDecision records to Notification."""
        from apps.applications.models import PartnerDecision
        
        self.stdout.write('\nMigrating PartnerDecision records...')
        
        decisions = PartnerDecision.objects.select_related(
            'application', 
            'application__company',
            'application__created_by',
            'partner'
        ).all()
        
        migrated = 0
        skipped = 0
        
        for decision in decisions:
            application = decision.application
            
            # Skip if no user to notify
            if not application.created_by:
                skipped += 1
                continue
            
            # Check if notification already exists
            ct = ContentType.objects.get_for_model(decision)
            if Notification.objects.filter(content_type=ct, object_id=decision.id).exists():
                skipped += 1
                continue
            
            # Map decision type
            decision_type_map = {
                'approved': NotificationType.DECISION_APPROVED,
                'rejected': NotificationType.DECISION_REJECTED,
                'info_requested': NotificationType.DECISION_INFO_REQUESTED,
            }
            notification_type = decision_type_map.get(decision.decision)
            if not notification_type:
                skipped += 1
                continue
            
            # Build title
            title_map = {
                NotificationType.DECISION_APPROVED: 'Заявка одобрена',
                NotificationType.DECISION_REJECTED: 'Заявка отклонена',
                NotificationType.DECISION_INFO_REQUESTED: 'Возвращение на доработку',
            }
            title = title_map.get(notification_type, 'Решение по заявке')
            
            # Build message
            if notification_type == NotificationType.DECISION_APPROVED:
                message = f"Ставка: {decision.offered_rate}%" if decision.offered_rate else "Без указания ставки"
            elif notification_type == NotificationType.DECISION_REJECTED:
                message = decision.comment or "Причина не указана"
            else:
                message = decision.comment or "Заявка возвращена на доработку"
            
            # Get partner name
            partner = decision.partner
            if partner.first_name and partner.last_name:
                partner_name = f"{partner.first_name} {partner.last_name}"
            elif partner.first_name:
                partner_name = partner.first_name
            else:
                partner_name = partner.email
            
            # Build data
            data = {
                'application_id': application.id,
                'company_name': application.company.short_name or application.company.name if application.company else 'Не указана',
                'product_type': application.product_type,
                'product_type_display': application.get_product_type_display(),
                'amount': str(application.amount) if application.amount else None,
                'partner_name': partner_name,
                'comment': decision.comment or None,
                'offered_rate': str(decision.offered_rate) if decision.offered_rate else None,
                'offered_amount': str(decision.offered_amount) if decision.offered_amount else None,
                'decision_id': decision.id,
            }
            
            if not dry_run:
                Notification.objects.create(
                    user=application.created_by,
                    type=notification_type,
                    title=title,
                    message=message,
                    data=data,
                    is_read=False,  # All migrated as unread
                    created_at=decision.created_at,
                    content_type=ct,
                    object_id=decision.id,
                )
            
            migrated += 1
            if migrated % 100 == 0:
                self.stdout.write(f'  Processed {migrated} decisions...')
        
        self.stdout.write(f'  Migrated: {migrated}, Skipped: {skipped}')
        return migrated

    def migrate_document_requests(self, dry_run: bool) -> int:
        """Migrate DocumentRequest records to Notification."""
        from apps.documents.models import DocumentRequest
        
        self.stdout.write('\nMigrating DocumentRequest records...')
        
        requests = DocumentRequest.objects.select_related(
            'user',
            'requested_by'
        ).all()
        
        migrated = 0
        skipped = 0
        
        for request in requests:
            # Check if notification already exists
            ct = ContentType.objects.get_for_model(request)
            if Notification.objects.filter(content_type=ct, object_id=request.id).exists():
                skipped += 1
                continue
            
            # Get requester name
            requester_name = "Администратор"
            if request.requested_by:
                if request.requested_by.first_name:
                    requester_name = f"{request.requested_by.first_name} {request.requested_by.last_name or ''}".strip()
                else:
                    requester_name = request.requested_by.email
            
            data = {
                'request_id': request.id,
                'document_type_name': request.document_type_name,
                'document_type_id': request.document_type_id,
                'requester_name': requester_name,
                'comment': request.comment or None,
            }
            
            if not dry_run:
                Notification.objects.create(
                    user=request.user,
                    type=NotificationType.DOCUMENT_REQUESTED,
                    title='Запрос документа',
                    message=f"Запрошен документ: {request.document_type_name}",
                    data=data,
                    is_read=request.is_read,  # Preserve read status
                    created_at=request.created_at,
                    content_type=ct,
                    object_id=request.id,
                )
            
            migrated += 1
            if migrated % 100 == 0:
                self.stdout.write(f'  Processed {migrated} requests...')
        
        self.stdout.write(f'  Migrated: {migrated}, Skipped: {skipped}')
        return migrated
