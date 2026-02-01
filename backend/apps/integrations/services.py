"""
Bank Integration Service for Lider Garant.

This module provides the BankIntegrationService class that constructs 
JSON payloads for the Realist Bank API from internal Django models.

Reference: API_1.1.postman_collection_2025-03 (add_ticket endpoint)
"""
import logging
from datetime import date, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional

from django.conf import settings

from apps.applications.models import Application, ProductType, GuaranteeType
from apps.companies.models import CompanyProfile


logger = logging.getLogger(__name__)


class BankIntegrationService:
    """
    Service to construct API payload for Realist Bank.
    
    This service takes an application_id and returns a dictionary
    that matches the Realist Bank add_ticket endpoint structure.
    
    Usage:
        service = BankIntegrationService()
        payload = service.generate_payload(application_id=123)
    """
    
    # Product ID mapping (API values)
    PRODUCT_ID_MAPPING = {
        ProductType.BANK_GUARANTEE: '1',      # БГ = 1
        ProductType.TENDER_LOAN: '2',         # КИК = 2
        ProductType.CONTRACT_LOAN: '2',       # КИК = 2
        ProductType.CORPORATE_CREDIT: '2',    # КИК = 2
    }
    
    # Guarantee Type ID mapping
    GUARANTEE_TYPE_MAPPING = {
        GuaranteeType.APPLICATION_SECURITY: '1',    # Обеспечение заявки
        GuaranteeType.CONTRACT_EXECUTION: '2',      # Исполнение контракта
        GuaranteeType.ADVANCE_RETURN: '3',          # Возврат аванса
        GuaranteeType.WARRANTY_OBLIGATIONS: '4',    # Гарантийные обязательства
        GuaranteeType.PAYMENT_GUARANTEE: '5',       # Гарантии оплаты
        GuaranteeType.CUSTOMS_GUARANTEE: '6',       # Таможенные гарантии
        GuaranteeType.VAT_REFUND: '7',              # Возмещение НДС
    }
    
    # Tender Law -> Form ID mapping
    TENDER_LAW_FORM_MAPPING = {
        '44_fz': '1',
        '223_fz': '2',
        '615_pp': '3',
        '185_fz': '4',
        'kbg': '5',
        'commercial': '6',
    }
    
    def __init__(self, login: str = None, password: str = None):
        """
        Initialize with bank API credentials.
        
        Args:
            login: Bank API login. If not provided, uses settings.BANK_API_LOGIN
            password: Bank API password. If not provided, uses settings.BANK_API_PASSWORD
        """
        self.login = login or getattr(settings, 'BANK_API_LOGIN', '')
        self.password = password or getattr(settings, 'BANK_API_PASSWORD', '')
        self.api_url = getattr(settings, 'BANK_API_URL', 'https://stagebg.realistbank.ru/agent_api1_1')
    
    def generate_payload(self, application_id: int) -> Dict[str, Any]:
        """
        Generate full API payload for add_ticket endpoint.
        
        Args:
            application_id: ID of the Application to generate payload for.
            
        Returns:
            Dictionary with all required fields for Realist Bank API.
            
        Raises:
            Application.DoesNotExist: If application not found.
            ValueError: If application has no associated company.
        """
        try:
            application = Application.objects.select_related('company').prefetch_related('documents').get(id=application_id)
        except Application.DoesNotExist:
            logger.error(f"Application {application_id} not found")
            raise
        
        if not application.company:
            raise ValueError(f"Application {application_id} has no associated company")
        
        company = application.company
        
        # Build payload sections
        payload = {}
        
        # 1. Authentication
        payload.update(self._build_authentication())
        
        # 2. Ticket data (product-specific)
        payload.update(self._build_ticket_data(application))
        
        # 3. Goscontract (tender info)
        payload.update(self._build_goscontract_data(application))
        
        # 4. Client (company/principal)
        payload.update(self._build_client_data(company))
        
        # 5. Founders
        payload.update(self._build_founders_data(company))
        
        # 6. Bank accounts
        payload.update(self._build_bank_accounts_data(company))
        
        # 7. Compliance fields (defaults)
        payload.update(self._build_compliance_defaults(application))
        
        # 8. Beneficiary (if available from tender data)
        payload.update(self._build_beneficiary_data(application))
        
        # 9. Documents (NEW: with numeric IDs per Appendix B)
        payload.update(self._build_documents_data(application))
        
        logger.info(f"Generated payload for application {application_id} with {len(payload)} fields")
        return payload
    
    def _build_documents_data(self, application: Application) -> Dict[str, str]:
        """
        Build documents section for bank API with numeric document_type_id.
        
        Per Appendix B, document type IDs are product-specific:
        - ID 21 for BG = "Паспорт генерального директора"
        - ID 74 for KIK = "Паспорт генерального директора"
        
        Bank API expects documents in format:
        documents[0][type_id] = 21
        documents[0][file] = base64_or_url
        
        NOTE: For files, we send URLs that the bank can fetch.
        """
        payload = {}
        documents = application.documents.all()
        
        if not documents.exists():
            logger.debug(f"No documents attached to application {application.id}")
            return payload
        
        for idx, doc in enumerate(documents):
            prefix = f'documents[{idx}]'
            
            # Use numeric document_type_id (Appendix B compliant)
            # If document_type_id is 0 or not set, it means "Дополнительный документ"
            type_id = doc.document_type_id if hasattr(doc, 'document_type_id') else 0
            
            payload[f'{prefix}[type_id]'] = str(type_id)
            payload[f'{prefix}[name]'] = doc.name or ''
            
            # Send file URL (bank will fetch it)
            # In production, this should be a publicly accessible URL
            if doc.file:
                payload[f'{prefix}[file_url]'] = doc.file.url
            
            logger.debug(f"Added document {doc.id} with type_id={type_id} to payload")
        
        logger.info(f"Built documents section with {documents.count()} documents for app {application.id}")
        return payload
    
    def serialize_documents_for_bank(self, application_id: int) -> List[Dict[str, Any]]:
        """
        Serialize application documents for bank submission.
        
        This is a utility method that returns a list of documents
        in the format expected by the bank API, using numeric IDs.
        
        Optimized: Pre-fetches all DocumentTypeDefinition records to avoid N+1 queries.
        
        Returns:
            List of dicts with document data:
            [
                {
                    'type_id': 21,          # Numeric ID from Appendix B
                    'type_name': 'Паспорт генерального директора',
                    'name': 'passport_ceo.pdf',
                    'file_url': '/media/documents/...',
                    'status': 'verified'
                },
                ...
            ]
        """
        from apps.documents.models import DocumentTypeDefinition
        
        try:
            application = Application.objects.prefetch_related('documents').get(id=application_id)
        except Application.DoesNotExist:
            logger.error(f"Application {application_id} not found")
            return []
        
        result = []
        product_type = application.product_type
        documents = list(application.documents.all())
        
        if not documents:
            return result
        
        # Pre-fetch all document type definitions in ONE query to avoid N+1
        type_ids = [getattr(doc, 'document_type_id', 0) or 0 for doc in documents]
        definitions = {
            (d.document_type_id, d.product_type): d.name
            for d in DocumentTypeDefinition.objects.filter(
                document_type_id__in=type_ids
            )
        }
        
        for doc in documents:
            # Get document type_id (default to 0 if not set)
            type_id = getattr(doc, 'document_type_id', 0) or 0
            doc_product_type = getattr(doc, 'product_type', '') or product_type
            
            # Look up type name from pre-fetched dictionary
            type_name = definitions.get(
                (type_id, doc_product_type),
                definitions.get(
                    (type_id, ''), 
                    'Дополнительный документ' if type_id == 0 else f'Документ (ID: {type_id})'
                )
            )
            
            result.append({
                'type_id': type_id,
                'type_name': type_name,
                'name': doc.name,
                'file_url': doc.file.url if doc.file else '',
                'status': doc.status,
            })
        
        return result

    
    def _build_authentication(self) -> Dict[str, str]:
        """Build login/password fields."""
        return {
            'login': self.login,
            'password': self.password,
        }
    
    def _build_ticket_data(self, application: Application) -> Dict[str, str]:
        """
        Build ticket[bg] or ticket[kik] based on product type.
        
        - product_id = 1 -> Bank Guarantee (БГ)
        - product_id = 2 -> Contract Credit (КИК)
        """
        payload = {}
        
        # Product ID
        product_id = self.PRODUCT_ID_MAPPING.get(application.product_type, '1')
        payload['ticket[product_id]'] = product_id
        
        # Calculate dates
        start_date = date.today()
        if application.term_months:
            end_date = start_date + timedelta(days=application.term_months * 30)
        else:
            end_date = start_date + timedelta(days=365)
        
        if product_id == '1':
            # Bank Guarantee (БГ)
            payload['ticket[bg][sum]'] = str(int(application.amount)) if application.amount else '0'
            payload['ticket[bg][start_at_type_id]'] = '1'  # После подписания
            payload['ticket[bg][start_at]'] = start_date.strftime('%Y-%m-%d')
            payload['ticket[bg][end_at]'] = end_date.strftime('%Y-%m-%d')
            
            # Guarantee type mapping
            type_id = self.GUARANTEE_TYPE_MAPPING.get(application.guarantee_type, '2')
            payload['ticket[bg][type_id]'] = type_id
            payload['ticket[bg][reason_id]'] = type_id  # Using same as type for now
            
            # Form ID based on tender law
            form_id = self.TENDER_LAW_FORM_MAPPING.get(application.tender_law, '1')
            payload['ticket[bg][form_id]'] = form_id
            
        else:
            # Contract Credit (КИК)
            payload['ticket[kik][sum]'] = str(int(application.amount)) if application.amount else '0'
            payload['ticket[kik][start_at_type_id]'] = '1'
            payload['ticket[kik][start_at]'] = start_date.strftime('%Y-%m-%d')
            payload['ticket[kik][end_at]'] = end_date.strftime('%Y-%m-%d')
            payload['ticket[kik][type_id]'] = '2'  # Default credit type
        
        return payload
    
    def _build_goscontract_data(self, application: Application) -> Dict[str, str]:
        """
        Build goscontract section from goscontract_data JSONField.
        
        Expected goscontract_data structure:
        {
            "purchase_number": "0848600005323000300",
            "subject": "Описание закупки",
            "is_close_auction": "0",
            "is_single_supplier": "0",
            "contract_number": ""
        }
        """
        payload = {}
        goscontract = application.goscontract_data or {}
        
        # Main tender number (from goscontract_data or fallback to tender_number)
        purchase_number = goscontract.get('purchase_number', '') or application.tender_number or ''
        payload['goscontract[purchase_number]'] = purchase_number
        
        # Subject
        subject = goscontract.get('subject', '') or ''
        payload['goscontract[subject]'] = subject
        
        # Flags (defaults to open auction, not single supplier)
        payload['goscontract[is_close_auction]'] = goscontract.get('is_close_auction', '0')
        payload['goscontract[is_single_supplier]'] = goscontract.get('is_single_supplier', '0')
        
        # Contract number (for single supplier cases)
        payload['goscontract[contract_number]'] = goscontract.get('contract_number', '')
        
        return payload
    
    def _build_client_data(self, company: CompanyProfile) -> Dict[str, str]:
        """
        Build client section from CompanyProfile.
        
        Includes: INN, addresses, contact person, website, etc.
        """
        payload = {}
        
        # Core identification
        payload['client[inn]'] = company.inn or ''
        
        # Legal address is fetched from ЕГРЮЛ by bank, we don't send it
        
        # Actual address
        is_same_actual = company.actual_address == company.legal_address
        payload['client[actual_address][is_equal_to_legal_address]'] = '1' if is_same_actual else '0'
        if not is_same_actual:
            payload['client[actual_address][value]'] = company.actual_address or ''
            # Extract postal code if present (format: "123456, город...")
            postal_code = self._extract_postal_code(company.actual_address)
            payload['client[actual_address][postal_code]'] = postal_code
        
        # Post address (same logic)
        payload['client[post_address][is_equal_to_legal_address]'] = '1' if is_same_actual else '0'
        if not is_same_actual:
            payload['client[post_address][value]'] = company.actual_address or ''
            payload['client[post_address][postal_code]'] = postal_code
        
        # Employee count (default to 1 if not specified)
        payload['client[employee_count]'] = '1'
        
        # Contact person
        payload['client[contact_person][full_name]'] = company.contact_person or company.director_name or ''
        payload['client[contact_person][phone]'] = company.contact_phone or ''
        payload['client[contact_person][email]'] = company.contact_email or ''
        
        # Website
        payload['client[website]'] = company.website or ''
        
        # MCHD (signatory by power of attorney) - defaults to no
        payload['client[is_mchd]'] = '0'
        
        return payload
    
    def _build_founders_data(self, company: CompanyProfile) -> Dict[str, str]:
        """
        Build client[founders] from founders_data JSONField.
        
        Handles empty/None founders_data gracefully.
        
        Expected founders_data structure (list):
        [
            {
                "full_name": "ФИО",
                "inn": "ИНН",
                "share_relative": 80,
                "document": {
                    "series": "99 99",
                    "number": "999999",
                    "issued_at": "2000-01-01",
                    "authority_name": "Орган",
                    "authority_code": "777-777"
                },
                "birth_place": "Москва",
                "birth_date": "1985-01-01",
                "gender": 1,
                "citizen": "РФ",
                "legal_address": {"value": "...", "postal_code": "123456"},
                "actual_address": {"value": "...", "postal_code": "123456"}
            }
        ]
        """
        payload = {}
        founders = company.founders_data
        
        # Graceful handling of empty/None data
        if not founders or not isinstance(founders, list):
            logger.debug(f"No founders_data for company {company.id}, skipping founders section")
            return payload
        
        for idx, founder in enumerate(founders):
            if not isinstance(founder, dict):
                logger.warning(f"Invalid founder data at index {idx} for company {company.id}")
                continue
            
            prefix = f'client[founders][{idx}]'
            
            # Basic info
            payload[f'{prefix}[full_name]'] = founder.get('full_name', '')
            payload[f'{prefix}[inn]'] = founder.get('inn', '')
            payload[f'{prefix}[share_relative]'] = str(founder.get('share_relative', 0))
            
            # Legal address
            legal_addr = founder.get('legal_address', {}) or {}
            payload[f'{prefix}[legal_address][value]'] = legal_addr.get('value', '')
            payload[f'{prefix}[legal_address][postal_code]'] = legal_addr.get('postal_code', '')
            
            # Actual address
            actual_addr = founder.get('actual_address', {}) or {}
            payload[f'{prefix}[actual_address][value]'] = actual_addr.get('value', '')
            payload[f'{prefix}[actual_address][postal_code]'] = actual_addr.get('postal_code', '')
            
            # Passport (document)
            doc = founder.get('document', {}) or {}
            payload[f'{prefix}[document][series]'] = doc.get('series', '')
            payload[f'{prefix}[document][number]'] = doc.get('number', '')
            payload[f'{prefix}[document][issued_at]'] = doc.get('issued_at', '')
            payload[f'{prefix}[document][authority_name]'] = doc.get('authority_name', '')
            payload[f'{prefix}[document][authority_code]'] = doc.get('authority_code', '')
            
            # Personal data
            payload[f'{prefix}[birth_place]'] = founder.get('birth_place', '')
            payload[f'{prefix}[birth_date]'] = founder.get('birth_date', '')
            payload[f'{prefix}[gender]'] = str(founder.get('gender', 1))  # 1=male, 2=female
            payload[f'{prefix}[citizen]'] = founder.get('citizen', 'РФ')
        
        logger.debug(f"Built {len(founders)} founders for company {company.id}")
        return payload
    
    def _build_bank_accounts_data(self, company: CompanyProfile) -> Dict[str, str]:
        """
        Build client[checking_accounts] from bank_accounts_data JSONField.
        
        Handles empty/None bank_accounts_data gracefully.
        Falls back to legacy bank_name/bank_bic fields if JSONField is empty.
        
        Expected bank_accounts_data structure (list):
        [
            {
                "bank_name": "АО РЕАЛИСТ БАНК",
                "bank_bik": "044525285",
                "account": "40702810000000000000"
            }
        ]
        """
        payload = {}
        bank_accounts = company.bank_accounts_data
        
        # Graceful handling: try JSONField first, then legacy fields
        if bank_accounts and isinstance(bank_accounts, list) and len(bank_accounts) > 0:
            for idx, account in enumerate(bank_accounts):
                if not isinstance(account, dict):
                    continue
                    
                prefix = f'client[checking_accounts][{idx}]'
                payload[f'{prefix}[bank_name]'] = account.get('bank_name', '')
                payload[f'{prefix}[bank_bik]'] = account.get('bank_bik', '')
            
            logger.debug(f"Built {len(bank_accounts)} bank accounts from JSONField for company {company.id}")
        elif company.bank_name or company.bank_bic:
            # Fallback to legacy fields
            payload['client[checking_accounts][0][bank_name]'] = company.bank_name or ''
            payload['client[checking_accounts][0][bank_bik]'] = company.bank_bic or ''
            logger.debug(f"Built 1 bank account from legacy fields for company {company.id}")
        else:
            logger.debug(f"No bank accounts for company {company.id}")
        
        return payload
    
    def _build_compliance_defaults(self, application: Application) -> Dict[str, str]:
        """
        Build default compliance fields required by the bank.
        
        These are regulatory fields that have standard default values.
        """
        is_guarantee = application.product_type == ProductType.BANK_GUARANTEE
        
        return {
            'client[has_beneficiaries_comment]': 'отсутствует',
            'client[relationship_purpose]': 'получение Гарантии' if is_guarantee else 'получение кредитных средств',
            'client[expected_relationship_duration]': 'долгосрочный',
            'client[business_objectives]': 'получение прибыли',
            'client[business_reputation]': 'положительная',
            'client[funds_source]': 'результат финансовой деятельности',
            'client[has_executive_board]': '0',
            'client[is_pdl]': '0',
        }
    
    def _build_beneficiary_data(self, application: Application) -> Dict[str, str]:
        """
        Build beneficiary section (заказчик тендера).
        
        This data may come from goscontract_data if tender was searched.
        """
        payload = {}
        goscontract = application.goscontract_data or {}
        
        # Check if beneficiary data exists in goscontract
        beneficiary = goscontract.get('beneficiary', {}) or {}
        
        if beneficiary.get('inn'):
            payload['beneficiary[inn]'] = beneficiary.get('inn', '')
            legal_addr = beneficiary.get('legal_address', {}) or {}
            payload['beneficiary[legal_address][value]'] = legal_addr.get('value', '')
        
        return payload
    
    def _create_company_snapshot(self, company: CompanyProfile) -> Dict[str, Any]:
        """
        Create a snapshot of company data for preservation in full_client_data.
        
        This captures all company fields at the time of application submission
        so that subsequent edits to the company profile don't affect the application.
        
        Returns:
            Dict containing all relevant company fields in a normalized structure.
        """
        def safe_str(value):
            """Convert value to string or return None."""
            if value is None:
                return None
            return str(value)
        
        def safe_date(value):
            """Convert date to ISO string or return None."""
            if value is None:
                return None
            if hasattr(value, 'isoformat'):
                return value.isoformat()
            return str(value)
        
        def safe_decimal(value):
            """Convert Decimal to string or return None."""
            if value is None:
                return None
            return str(value)
        
        snapshot = {
            # Core identification
            'id': company.id,
            'inn': company.inn,
            'kpp': company.kpp,
            'ogrn': company.ogrn,
            'name': company.name,
            'short_name': company.short_name,
            
            # Addresses
            'legal_address': company.legal_address,
            'actual_address': company.actual_address,
            
            # Director info
            'director_name': company.director_name,
            'director_position': company.director_position,
            'director_birth_date': safe_date(company.director_birth_date),
            'director_birth_place': company.director_birth_place,
            'director_email': company.director_email,
            'director_phone': company.director_phone,
            'director_registration_address': company.director_registration_address,
            
            # Director passport
            'passport_series': company.passport_series,
            'passport_number': company.passport_number,
            'passport_issued_by': company.passport_issued_by,
            'passport_date': safe_date(company.passport_date),
            'passport_code': company.passport_code,
            
            # JSONField data (these are already dicts/lists)
            'founders_data': company.founders_data or [],
            'bank_accounts_data': company.bank_accounts_data or [],
            'legal_founders_data': company.legal_founders_data or [],
            'leadership_data': company.leadership_data or [],
            'activities_data': company.activities_data or [],
            'licenses_data': company.licenses_data or [],
            'etp_accounts_data': company.etp_accounts_data or [],
            'contact_persons_data': company.contact_persons_data or [],
            
            # Tax and signatory
            'signatory_basis': company.signatory_basis,
            'tax_system': company.tax_system,
            'vat_rate': company.vat_rate,
            
            # Registration and capital
            'registration_date': safe_date(company.registration_date),
            'authorized_capital_declared': safe_decimal(company.authorized_capital_declared),
            'authorized_capital_paid': safe_decimal(company.authorized_capital_paid),
            'employee_count': company.employee_count,
            'website': company.website,
            
            # MCHD
            'is_mchd': company.is_mchd,
            'mchd_number': company.mchd_number,
            'mchd_issue_date': safe_date(company.mchd_issue_date),
            'mchd_expiry_date': safe_date(company.mchd_expiry_date),
            'mchd_principal_inn': company.mchd_principal_inn,
            'mchd_file': company.mchd_file.url if company.mchd_file else None,
            
            # Bank details
            'bank_name': company.bank_name,
            'bank_bic': company.bank_bic,
            'bank_account': company.bank_account,
            'bank_corr_account': company.bank_corr_account,
            
            # Contact
            'contact_person': company.contact_person,
            'contact_phone': company.contact_phone,
            'contact_email': company.contact_email,
        }
        
        return snapshot
    
    def _extract_postal_code(self, address: str) -> str:
        """
        Extract postal code from address string.
        
        Handles formats like:
        - "123456, город Москва..."
        - "город Москва, 123456"
        
        Returns empty string if no postal code found.
        """
        if not address:
            return ''
        
        import re
        # Look for 6-digit postal code
        match = re.search(r'\b(\d{6})\b', address)
        return match.group(1) if match else ''
    
    def to_form_data(self, payload: Dict[str, str]) -> Dict[str, str]:
        """
        Convert payload to form-data format for requests library.
        
        The Realist Bank API uses x-www-form-urlencoded format.
        This method ensures all values are strings.
        """
        return {k: str(v) for k, v in payload.items()}
    
    def validate_payload(self, payload: Dict[str, str]) -> List[str]:
        """
        Validate payload has all required fields.
        
        Returns list of missing/invalid field names.
        """
        errors = []
        
        phase1_mode = getattr(settings, 'BANK_API_PHASE1_MODE', True)

        # Required fields
        required = [
            'ticket[product_id]',
            'client[inn]',
        ]

        if not phase1_mode:
            required = [
                'login',
                'password',
                *required,
            ]
        
        for field in required:
            if not payload.get(field):
                errors.append(f"Missing required field: {field}")
        
        # Validate INN format (10 or 12 digits)
        inn = payload.get('client[inn]', '')
        if inn and len(inn) not in [10, 12]:
            errors.append(f"Invalid INN format: {inn} (must be 10 or 12 digits)")
        
        return errors
    
    def send_application(self, application_id: int) -> Dict[str, Any]:
        """
        Send application to Realist Bank API.
        
        This is the main method that:
        1. Generates payload using generate_payload()
        2. Validates the payload
        3. Converts to form-data format
        4. POSTs to bank API /add_ticket endpoint (Phase 2 only)
        5. Parses response and saves external_id to application
        
        Phase 1 Mode: When BANK_API_PHASE1_MODE=True (default), simulates
        the bank response without making external HTTP calls.
        
        Args:
            application_id: ID of the Application to send.
            
        Returns:
            Dict with ticket_id, status info, and message
            
        Raises:
            ValueError: If validation fails or API returns error
            requests.RequestException: On network errors (Phase 2 only)
        """
        import time
        from apps.applications.models import ApplicationStatus
        
        logger.info(f"Sending application {application_id} to Realist Bank")
        
        # Step 1: Generate payload
        try:
            payload = self.generate_payload(application_id)
        except Application.DoesNotExist:
            raise ValueError(f"Application {application_id} not found")
        except Exception as e:
            raise ValueError(f"Failed to generate payload: {str(e)}")
        
        # Step 2: Validate payload
        errors = self.validate_payload(payload)
        if errors:
            logger.error(f"Payload validation failed for app {application_id}: {errors}")
            raise ValueError(f"Payload validation failed: {', '.join(errors)}")
        
        # Step 3: Convert to form-data
        form_data = self.to_form_data(payload)
        logger.debug(f"Form data has {len(form_data)} fields")
        
        # =====================================================================
        # PHASE 1 MODE: Simulate bank response without HTTP calls
        # =====================================================================
        phase1_mode = getattr(settings, 'BANK_API_PHASE1_MODE', True)
        
        if phase1_mode:
            logger.info(f"[PHASE 1] Simulating bank response for application {application_id}")
            
            # Generate simulated ticket_id (like bank would return)
            timestamp = int(time.time())
            ticket_id_str = f"SIM-{application_id}-{timestamp}"
            
            # Update application with simulated external_id
            try:
                application = Application.objects.get(id=application_id)
                application.external_id = ticket_id_str
                application.bank_status = 'Отправлено (Phase 1)'
                # Update status to in_review (На рассмотрении в банке) after sending to bank
                # Flow: draft -> pending (client submit) -> in_review (admin send to bank)
                if application.status in [ApplicationStatus.DRAFT, ApplicationStatus.PENDING]:
                    application.status = ApplicationStatus.IN_REVIEW
                
                # Save client data snapshot (Phase 2 enhancement)
                # This preserves the company data at the time of submission
                company = application.company
                if company and not application.full_client_data:
                    application.full_client_data = self._create_company_snapshot(company)
                    logger.info(f"[PHASE 1] Saved full_client_data snapshot for application {application_id}")
                
                application.save()
                logger.info(f"[PHASE 1] Application {application_id} saved with external_id={ticket_id_str}")
            except Exception as e:
                logger.error(f"Failed to save external_id for app {application_id}: {e}")
            
            return {
                'ticket_id': ticket_id_str,
                'bank_status': 'Отправлено (Phase 1)',
                'message': 'Заявка успешно отправлена (режим симуляции Phase 1)'
            }
        
        # =====================================================================
        # PHASE 2 MODE: Real HTTP request to bank API
        # =====================================================================
        import requests
        
        url = f"{self.api_url}/add_ticket"
        logger.info(f"POSTing to {url}")
        
        try:
            response = requests.post(url, data=form_data, timeout=60)
            response.raise_for_status()
            response_data = response.json()
        except requests.exceptions.Timeout:
            raise ValueError("Bank API request timed out")
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Bank API request failed: {str(e)}")
        except ValueError:
            raise ValueError("Bank API returned invalid JSON response")
        
        # Step 5: Parse response
        if response_data.get('status') != 'success':
            error_msg = response_data.get('message', 'Unknown error from bank')
            logger.error(f"Bank API error for app {application_id}: {error_msg}")
            raise ValueError(f"Банк отклонил заявку: {error_msg}")
        
        # Extract ticket_id from response
        ticket_data = response_data.get('data', {}).get('ticket', {})
        ticket_id = ticket_data.get('id')
        
        if not ticket_id:
            raise ValueError("Bank API did not return ticket_id")
        
        ticket_id_str = str(ticket_id)
        ticket_status = ticket_data.get('status', {})
        
        # Step 6: Update application with external_id
        try:
            application = Application.objects.get(id=application_id)
            application.external_id = ticket_id_str
            application.bank_status = 'sent'
            # Update status to in_review (На рассмотрении в банке) after sending to bank
            # Flow: draft -> pending (client submit) -> in_review (admin send to bank)
            if application.status in [ApplicationStatus.DRAFT, ApplicationStatus.PENDING]:
                application.status = ApplicationStatus.IN_REVIEW
            application.save()
            logger.info(f"Application {application_id} saved with external_id={ticket_id_str}")
        except Exception as e:
            logger.error(f"Failed to save external_id for app {application_id}: {e}")
            # Don't raise - the bank already accepted the ticket
        
        return {
            'ticket_id': ticket_id_str,
            'bank_status': ticket_status.get('name', 'Отправлено'),
            'message': response_data.get('message', 'Заявка успешно отправлена')
        }

    def sync_application_status(self, application_id: int) -> Dict[str, Any]:
        """
        Sync application status from Realist Bank API.
        
        Phase 7.2: Polls the bank API to get current ticket status
        and updates the local database.
        
        Phase 1 Mode: When BANK_API_PHASE1_MODE=True (default), returns
        a simulated status without making external HTTP calls.
        
        Args:
            application_id: ID of the Application to sync.
            
        Returns:
            Dict with current bank status info
            
        Raises:
            ValueError: If application not found or has no external_id
        """
        logger.info(f"Syncing status for application {application_id}")
        
        # Get application and verify it has external_id
        try:
            application = Application.objects.get(id=application_id)
        except Application.DoesNotExist:
            raise ValueError(f"Application {application_id} not found")
        
        if not application.external_id:
            raise ValueError("Заявка ещё не отправлена в банк")
        
        # =====================================================================
        # PHASE 1 MODE: Simulate bank response
        # =====================================================================
        phase1_mode = getattr(settings, 'BANK_API_PHASE1_MODE', True)
        
        if phase1_mode:
            logger.info(f"[PHASE 1] Simulating status sync for application {application_id}")
            
            # Return the current simulated status
            current_status = application.bank_status or 'Отправлено (Phase 1)'
            
            return {
                'bank_status': current_status,
                'bank_status_id': 101,  # Simulated ID
                'status_comment': 'Режим симуляции Phase 1 - реальный статус будет доступен в Phase 2',
                'manager_name': '',
                'payment_status': '',
                'changed': False,
                'message': f'Статус: {current_status} (Phase 1 режим)'
            }
        
        # =====================================================================
        # PHASE 2 MODE: Real HTTP request to bank API
        # =====================================================================
        import requests
        
        # Prepare request data
        form_data = {
            'login': self.login,
            'password': self.password,
            'ticket_id': application.external_id,
        }
        
        # Call bank API
        url = f"{self.api_url}/get_ticket_info"
        logger.info(f"Querying ticket status from {url} for ticket_id={application.external_id}")
        
        try:
            response = requests.post(url, data=form_data, timeout=30)
            response.raise_for_status()
            response_data = response.json()
        except requests.exceptions.Timeout:
            raise ValueError("Таймаут запроса к банку")
        except requests.exceptions.RequestException as e:
            logger.error(f"Bank API request failed: {e}")
            raise ValueError("Не удалось связаться с банком")
        except ValueError:
            raise ValueError("Банк вернул некорректный ответ")
        
        # Check response status
        if response_data.get('status') != 'success':
            error_msg = response_data.get('message', 'Unknown error')
            raise ValueError(f"Ошибка банка: {error_msg}")
        
        # Extract status info
        ticket_data = response_data.get('data', {}).get('ticket', {})
        status_data = ticket_data.get('status', {})
        
        new_status_name = status_data.get('name', '')
        new_status_id = status_data.get('id')
        status_comment = status_data.get('comment', '')
        
        # Get additional info
        manager_data = ticket_data.get('manager', {})
        manager_name = manager_data.get('full_name', '')
        
        payment_data = ticket_data.get('payment_status', {})
        payment_status = payment_data.get('name', '')
        
        # Update application if status changed
        old_status = application.bank_status
        if new_status_name and new_status_name != old_status:
            application.bank_status = new_status_name
            # Also update status_id if provided
            if new_status_id:
                application.status_id = new_status_id
            application.save()
            logger.info(f"Application {application_id} bank_status updated: {old_status} -> {new_status_name}")
        
        return {
            'bank_status': new_status_name,
            'bank_status_id': new_status_id,
            'status_comment': status_comment,
            'manager_name': manager_name,
            'payment_status': payment_status,
            'changed': new_status_name != old_status,
            'message': f"Статус: {new_status_name}" if new_status_name else "Статус получен"
        }

    def process_bank_status_webhook(
        self, 
        external_id: str, 
        status_id: int, 
        status_name: str = ''
    ) -> Dict[str, Any]:
        """
        Process incoming status update from bank webhook.
        
        This method handles bank callbacks when status changes.
        It maps the bank's numeric status_id to our internal status
        using ApplicationStatusDefinition (Appendix A).
        
        Args:
            external_id: Bank ticket ID (stored in Application.external_id)
            status_id: Numeric status ID from bank (e.g., 710, 2712)
            status_name: Optional status name from bank
            
        Returns:
            Dict with update result
            
        Example:
            service.process_bank_status_webhook(
                external_id='12345',
                status_id=710,  # "Одобрено, ожидается согласование БГ"
            )
        """
        from apps.applications.models import ApplicationStatus, ApplicationStatusDefinition
        
        logger.info(f"Processing bank webhook: ticket={external_id}, status_id={status_id}")
        
        # Find application by external_id
        try:
            application = Application.objects.get(external_id=external_id)
        except Application.DoesNotExist:
            logger.error(f"No application found with external_id={external_id}")
            return {
                'success': False,
                'error': f'Application with external_id {external_id} not found'
            }
        
        # Look up status definition in our reference table
        status_def = None
        try:
            status_def = ApplicationStatusDefinition.objects.get(
                status_id=status_id,
                product_type=application.product_type
            )
        except ApplicationStatusDefinition.DoesNotExist:
            # Try without product filter (for general statuses)
            try:
                status_def = ApplicationStatusDefinition.objects.filter(
                    status_id=status_id
                ).first()
            except:
                pass
        
        # Update application
        old_status = application.status
        old_status_id = application.status_id
        old_bank_status = application.bank_status
        
        # Always save bank's status_id
        application.status_id = status_id
        
        # Update bank_status name
        if status_name:
            application.bank_status = status_name
        elif status_def:
            application.bank_status = status_def.name
        
        # Map to internal status if found in reference table
        if status_def and status_def.internal_status:
            # Map internal_status string to ApplicationStatus enum
            internal_status_map = {
                'draft': ApplicationStatus.DRAFT,
                'pending': ApplicationStatus.PENDING,
                'in_review': ApplicationStatus.IN_REVIEW,
                'info_requested': ApplicationStatus.INFO_REQUESTED,
                'approved': ApplicationStatus.APPROVED,
                'rejected': ApplicationStatus.REJECTED,
                'won': ApplicationStatus.WON,
                'lost': ApplicationStatus.LOST,
            }
            new_internal = internal_status_map.get(status_def.internal_status)
            if new_internal:
                application.status = new_internal
        
        application.save()
        
        logger.info(
            f"Application {application.id} updated: "
            f"status_id {old_status_id}->{status_id}, "
            f"status {old_status}->{application.status}, "
            f"bank_status {old_bank_status}->{application.bank_status}"
        )
        
        return {
            'success': True,
            'application_id': application.id,
            'old_status_id': old_status_id,
            'new_status_id': status_id,
            'old_status': old_status,
            'new_status': application.status,
            'bank_status': application.bank_status,
            'status_definition': {
                'name': status_def.name if status_def else status_name,
                'internal_status': status_def.internal_status if status_def else '',
                'is_terminal': status_def.is_terminal if status_def else False,
            } if status_def else None
        }
