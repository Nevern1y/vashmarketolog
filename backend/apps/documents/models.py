"""
Document Library models for Lider Garant.
Documents are uploaded once and attached to multiple applications via ManyToMany.
"""
from django.db import models
from django.conf import settings


class DocumentType(models.TextChoices):
    """
    Document type categories - aligned with ТЗ Клиенты specification (135 types).
    Organized into logical groups for easier frontend filtering.
    """
    # ====================================================================
    # GROUP 1: LEGAL & FOUNDERS (Юридические / Учредительные)
    # ====================================================================
    COMPANY_CARD = 'company_card', '1. Карточка компании с реквизитами'
    PASSPORT_DIRECTOR_ALL = 'passport_director_all', '2. Паспорт руководителя (все страницы)'
    DECISION_APPOINTMENT = 'decision_appointment', '3. Решение/Протокол о назначении ЕИО'
    ORDER_DIRECTOR = 'order_director', '4. Приказ о назначении руководителя'
    DECISION_CREATION = 'decision_creation', '5. Решение о создании организации'
    LEASE_CONTRACT = 'lease_contract', '6. Договор аренды / свидетельство о праве собственности'
    FNS_NO_DEBT = 'fns_no_debt', '7. Справка ИФНС об отсутствии задолженности'
    STATUTE = 'statute', '8. Устав в действующей редакции'
    EGRUL_EXTRACT = 'egrul_extract', '9. Выписка ЕГРЮЛ'
    PASSPORT_FOUNDERS_ALL = 'passport_founders_all', '10. Паспорта всех учредителей (все страницы)'
    
    # ====================================================================
    # GROUP 2: FINANCIAL / ACCOUNTING (Финансовые / Бухгалтерские)
    # ====================================================================
    REVENUE_CERTIFICATE = 'revenue_certificate', '11. Справка о выручке за предыдущий год'
    STAFF_COUNT_CERTIFICATE = 'staff_count_certificate', '12. Справка о среднесписочной численности'
    CREDIT_PORTFOLIO = 'credit_portfolio', '13. Кредитный портфель'
    ACCOUNT_CARD_51_12M = 'account_card_51_12m', '14. Карточка 51 за последние 12 мес (Excel)'
    BALANCE_F1_F2_Q2_2025 = 'balance_f1_f2_q2_2025', '15. Бухбаланс Ф1 и ФР Ф2 на 30.06.2025'
    BALANCE_F1_F2_Q1_2025 = 'balance_f1_f2_q1_2025', '16. Бухбаланс Ф1 и ФР Ф2 на 31.03.2025'
    BALANCE_F1_F2_2024_ANNUAL = 'balance_f1_f2_2024_annual', '17. Бухбаланс Ф1 и ФР Ф2 на 31.12.2024 с квитанцией ИФНС'
    BALANCE_F1_F2_Q3_2024 = 'balance_f1_f2_q3_2024', '18. Бухбаланс Ф1 и ФР Ф2 на 30.09.2024'
    BALANCE_F1_F2_Q2_2024 = 'balance_f1_f2_q2_2024', '19. Бухбаланс Ф1 и ФР Ф2 на 30.06.2024'
    CONTRACT_REGISTER = 'contract_register', '20. Реестр контрактов'
    GROUP_SCHEME = 'group_scheme', '21. Юридическая схема Группы и схема потоков'
    ACCOUNT_CARD_51_52_MONTHLY = 'account_card_51_52_monthly', '22. Анализ и карточка 51, 52 счета помесячно (Excel)'
    ACCOUNT_90_12M = 'account_90_12m', '23. Анализ счета 90 за 12 месяцев (Excel)'
    AUDIT_CONCLUSION = 'audit_conclusion', '24. Аудиторское заключение за последний год'
    BG_CLIENT_VERSION = 'bg_client_version', '25. Банковская гарантия в редакции клиента'
    FIN_REPORT_NALOG_LAST = 'fin_report_nalog_last', '26. Бухотчётность за последний год с NALOG.RU'
    FIN_REPORT_NALOG_PREV = 'fin_report_nalog_prev', '27. Бухотчётность за предыдущий год с NALOG.RU'
    FIN_REPORT_5_PERIODS = 'fin_report_5_periods', '28. Бухотчётность за 5 последних периодов'
    FIN_REPORT_LAST_YEAR = 'fin_report_last_year', '29. Бухотчётность за последний завершённый год'
    FIN_REPORT_LAST_QUARTER = 'fin_report_last_quarter', '30. Бухотчётность за последний завершённый квартал'
    QUESTIONNAIRE = 'questionnaire', '31. Вопросный лист'
    SHAREHOLDER_REGISTER = 'shareholder_register', '32. Выписка из реестра акционеров'
    BANK_STATEMENTS_EXCEL = 'bank_statements_excel', '33. Выписки в Excel за последние 12 мес'
    BANK_STATEMENTS_TXT = 'bank_statements_txt', '34. Выписки из банков по всем счетам (TXT)'
    CREDIT_AGREEMENTS = 'credit_agreements', '35. Действующие кредитные договоры, займы, гарантии, лизинг'
    PATENT_ACTIVE = 'patent_active', '36. Действующий Патент'
    POWER_OF_ATTORNEY = 'power_of_attorney', '37. Доверенность на подписанта БГ'
    CONTRACT_FOR_BG = 'contract_for_bg', '38. Договор/контракт для обеспечения гарантией'
    BUYER_SUPPLIER_CONTRACTS = 'buyer_supplier_contracts', '39. Договоры с покупателями и поставщиками (мин. 3)'
    PREMISES_RIGHT = 'premises_right', '40. Документ о праве на занимаемые площади'
    COMPANY_PRESENTATION = 'company_presentation', '41. Презентация компании'
    CEO_APPOINTMENT_DOCS = 'ceo_appointment_docs', '42. Документы о назначении ЕИО'
    NO_CLAIMS_CUSTOMER = 'no_claims_customer', '43. Документы об отсутствии претензий заказчика'
    BG_OBLIGATION_DOCS = 'bg_obligation_docs', '44. Документы по обеспечиваемому Гарантией обязательству'
    PLEDGE_DOCS = 'pledge_docs', '45. Документы по предоставляемому залогу'
    TARGET_USE_DOCS = 'target_use_docs', '46. Документы по целевому использованию'
    LOCATION_CONFIRMATION = 'location_confirmation', '47. Документы о фактическом нахождении клиента'
    ADDENDUM_EXECUTED = 'addendum_executed', '48. Доп. соглашения к исполненному контракту'
    SIGNED_CONTRACT = 'signed_contract', '49. Заключенный договор'
    BG_FRAME_APPLICATION = 'bg_frame_application', '50. Заявка на гарантию по рамочному договору'
    BG_APPLICATION = 'bg_application', '51. Заявление на банковскую гарантию'
    OTHER_COLLATERAL = 'other_collateral', '52. Иное обеспечение'
    OTHER = 'other', '53. Иной документ'
    EXECUTED_CONTRACT = 'executed_contract', '54. Исполненный контракт'
    
    # ====================================================================
    # GROUP 3: ACCOUNT CARDS / OSV (Карточки счетов / ОСВ)
    # ====================================================================
    CARD_51_12M = 'card_51_12m', '55. Карточка 51 счета за последние 12 месяцев'
    CARD_51_2Y = 'card_51_2y', '56. Карточка 51 счета за последние 2 года (Excel)'
    CARD_51_LAST_YEAR = 'card_51_last_year', '57. Карточка 51 счета за последний завершённый год'
    CARD_51_LAST_QUARTER = 'card_51_last_quarter', '58. Карточка 51 счета за последний завершённый квартал'
    CARD_62_DEBTOR = 'card_62_debtor', '59. Карточка 62 сч. по взаиморасчетам с дебитором'
    CARD_COMPANY_REQUISITES = 'card_company_requisites', '60. Карточка компании с реквизитами'
    SIGNATURE_CARD = 'signature_card', '61. Карточка образцов подписей'
    KUDIR_LAST_YEAR = 'kudir_last_year', '62. Книга учёта доходов и расходов за год'
    KUDIR_LAST_QUARTER = 'kudir_last_quarter', '63. Книга учёта доходов и расходов за квартал'
    WARRANTY_CONTRACT = 'warranty_contract', '64. Контракт по гарантийным обязательствам'
    BG_COPY_44_223 = 'bg_copy_44_223', '65. Копия действующей БГ (44/223-ФЗ)'
    CREDIT_HISTORY = 'credit_history', '66. Кредитная история ЮЛ и ФЛ'
    CREDIT_DOC_PORTFOLIO = 'credit_doc_portfolio', '67. Кредитно-документарный портфель по Группе'
    LICENSE_SRO = 'license_sro', '68. Лицензии/СРО на осуществление деятельности'
    TAX_DECLARATION_QUARTER = 'tax_declaration_quarter', '69. Налоговая декларация за квартал'
    TAX_DECLARATION_YEAR_FNS = 'tax_declaration_year_fns', '70. Налоговая декларация за год с отметкой ФНС'
    TAX_DECLARATION_YEAR = 'tax_declaration_year', '71. Налоговая декларация за последний завершённый год'
    DEPOSIT_PLEDGE = 'deposit_pledge', '72. Обеспечение залогом по депозиту'
    REALTY_PLEDGE = 'realty_pledge', '73. Обеспечение залогом по недвижимости'
    VEHICLE_PLEDGE = 'vehicle_pledge', '74. Обеспечение залогом по транспортному средству'
    CAPITAL_PROFIT_EXPLANATION = 'capital_profit_explanation', '75. Обоснование расхождения капитала с прибылью'
    OSV_ALL_LAST_QUARTER = 'osv_all_last_quarter', '76. Общая ОСВ по всем счетам (Excel)'
    GENERAL_FIN_REPORT = 'general_fin_report', '77. Общая финансовая отчетность организации'
    SALES_VOLUME_NATURAL = 'sales_volume_natural', '78. Объемы продаж в натуральных показателях'
    OSV_01_02_08_10_41_43 = 'osv_01_02_08_10_41_43', '79. ОСВ 01, 02, 08, 10, 41, 43 счетов'
    OSV_58_66_67 = 'osv_58_66_67', '80. ОСВ 58, 66 и 67 счетов по субконто'
    OSV_60_62_76 = 'osv_60_62_76', '81. ОСВ 60, 62 и 76 счетов по субконто'
    OSV_62_DETAILED = 'osv_62_detailed', '82. ОСВ 62 в разбивке по субсчетам'
    OSV_62_LAST_QUARTER = 'osv_62_last_quarter', '83. ОСВ 62 счета за последний отчетный квартал'
    OSV_70_LAST_QUARTER = 'osv_70_last_quarter', '84. ОСВ 70 счета за последний отчетный квартал'
    OSV_76_DETAILED = 'osv_76_detailed', '85. ОСВ 76 в разбивке по субсчетам'
    OSV_GENERAL_DETAILED = 'osv_general_detailed', '86. ОСВ общая в разбивке по субсчетам'
    OSV_BALANCE_10_PERCENT = 'osv_balance_10_percent', '87. ОСВ по статьям баланса > 10%'
    OSV_60_62_66_67_76_YEAR = 'osv_60_62_66_67_76_year', '88. ОСВ по счетам 60, 62, 66, 67, 76 за год'
    OSV_60_62_66_67_76_QUARTER = 'osv_60_62_66_67_76_quarter', '89. ОСВ по счетам 60, 62, 66, 67, 76 за квартал'
    BKI_REPORT = 'bki_report', '90. Отчет БКИ'
    FACTOR_REPORT = 'factor_report', '91. Отчет действующего фактора'
    FINANCIAL_RESULTS_REPORT = 'financial_results_report', '92. Отчет о финансовых результатах'
    
    # ====================================================================
    # GROUP 4: PASSPORTS / IDs (Паспорта / Удостоверения личности)
    # ====================================================================
    PASSPORT_BO = 'passport_bo', '93. Паспорт БВ (бенефициарного владельца)'
    PASSPORT_BO_PAGES = 'passport_bo_pages', '94. Паспорт БВ (1-я страница и прописка)'
    PASSPORT_BO_FOUNDER = 'passport_bo_founder', '95. Паспорт БВ и учредителя'
    PASSPORT_EIO = 'passport_eio', '96. Паспорт ЕИО'
    PASSPORT_PLEDGER = 'passport_pledger', '97. Паспорт залогодателя - физ. лица'
    PASSPORT_GUARANTOR = 'passport_guarantor', '98. Паспорт поручителя - физ. лица'
    PASSPORT_OWNERS_25 = 'passport_owners_25', '99. Паспорта физлиц с долей > 25%'
    PRIMARY_DOCS_CONTRACT = 'primary_docs_contract', '100. Первичные документы к исполненному контракту'
    PASSPORT_FIRST_PAGE = 'passport_first_page', '101. Первый разворот паспорта'
    FIN_REPORT_RESUBMIT = 'fin_report_resubmit', '102. Пересдача годового БО'
    BO_LETTER = 'bo_letter', '103. Письмо о бенефициарном владельце'
    COMPLIANCE_LETTER = 'compliance_letter', '104. Письмо-гарантия о соблюдении законодательства'
    EXPERIENCE_CONTRACTS = 'experience_contracts', '105. Опыт аналогичных исполненных договоров (18 мес.)'
    BG_APPROVAL_OTHER_BANK = 'bg_approval_other_bank', '106. Подтверждение одобрения БГ сторонним банком'
    ORDER_ACCOUNTANT = 'order_accountant', '107. Приказ о назначении главного бухгалтера'
    SHAREHOLDER_PROTOCOL = 'shareholder_protocol', '108. Протокол собрания о согласии на получение гарантии'
    OFF_BALANCE_OBLIGATIONS = 'off_balance_obligations', '109. Расшифровка забалансовых обязательств'
    RECEIVABLES_BREAKDOWN = 'receivables_breakdown', '110. Расшифровка дебиторской задолженности'
    ACTIVE_CONTRACTS_REGISTER = 'active_contracts_register', '111. Реестр действующих и исполненных контрактов'
    COUNTERPARTY_REGISTER = 'counterparty_register', '112. Реестр основных контрагентов'
    MAJOR_DEAL_DECISION = 'major_deal_decision', '113. Решение о крупности сделки'
    DEAL_APPROVAL_DECISION = 'deal_approval_decision', '114. Решение о согласии на сделку'
    MANAGEMENT_COMPOSITION = 'management_composition', '115. Сведения о персональном составе органов управления'
    ROSSTAT_FORMS = 'rosstat_forms', '116. Сведения в составе форм Росстат (П3, П5, ПМ и т.д.)'
    SIGNED_CONTRACT_DOCS = 'signed_contract_docs', '117. Скан контракта и первичных документов'
    FINANCED_DEBTOR_CONTRACT = 'financed_debtor_contract', '118. Скан-копия финансируемого договора с дебитором'
    SNILS_EIO = 'snils_eio', '119. СНИЛС ЕИО'
    SNILS_FOUNDERS = 'snils_founders', '120. СНИЛС учредителей'
    CONSENT_PERSONAL_DATA = 'consent_personal_data', '121. Согласие на обработку персональных данных'
    CONSENT_CREDIT_REPORT = 'consent_credit_report', '122. Согласие на получение кредитных отчетов'
    CONSENT_EDO = 'consent_edo', '123. Согласие с Регламентом ЭДО'
    PARTICIPANTS_LIST = 'participants_list', '124. Список участников общества'
    FNS_TAX_STATUS = 'fns_tax_status', '125. Справка из ФНС о расчетах по налогам'
    FNS_ACCOUNTS = 'fns_accounts', '126. Справка из ФНС об открытых счетах (45 дней)'
    FNS_BANK_ACCOUNTS = 'fns_bank_accounts', '127. Справка ИФНС об открытых банковских счетах'
    OFF_BALANCE_CERT = 'off_balance_cert', '128. Справка о забалансовых обязательствах'
    ACCOUNTANT_STATUS = 'accountant_status', '129. Справка о наличии/отсутствии главного бухгалтера'
    SALARY_DEBT_CERT = 'salary_debt_cert', '130. Справка о просроченной задолженности по зарплате'
    STAFF_COUNT_CERT = 'staff_count_cert', '131. Справка о численности и выплатах работникам'
    REAL_ACTIVITY_CERT = 'real_activity_cert', '132. Справка о наличии/отсутствии реальной деятельности'
    NO_MAJOR_DEAL_CERT = 'no_major_deal_cert', '133. Справка об отсутствии крупной сделки'
    LOCATION_CERT = 'location_cert', '134. Справка о месте нахождения Заемщика'
    FNS_REGISTRATION_NOTICE = 'fns_registration_notice', '135. Уведомление о постановке на учет в ФНС'


class DocumentStatus(models.TextChoices):
    """Document verification status."""
    PENDING = 'pending', 'На проверке'
    VERIFIED = 'verified', 'Проверен'
    REJECTED = 'rejected', 'Отклонён'


def document_upload_path(instance, filename):
    """Generate upload path for documents."""
    return f'documents/{instance.owner.id}/{filename}'


class Document(models.Model):
    """
    Document model for the Document Library.
    
    Key business rule:
    Documents are stored in a library. When creating an application,
    user selects existing docs via checkbox - no re-upload.
    """
    # Ownership
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name='Владелец'
    )
    company = models.ForeignKey(
        'companies.CompanyProfile',
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name='Компания',
        null=True,
        blank=True
    )
    
    # Document info
    name = models.CharField('Название', max_length=300)
    file = models.FileField('Файл', upload_to=document_upload_path)
    document_type = models.CharField(
        'Тип документа',
        max_length=50,  # Expanded for 135 document types per ТЗ
        choices=DocumentType.choices,
        default=DocumentType.OTHER
    )
    
    # Verification status
    status = models.CharField(
        'Статус',
        max_length=20,
        choices=DocumentStatus.choices,
        default=DocumentStatus.PENDING
    )
    rejection_reason = models.TextField('Причина отклонения', blank=True, default='')
    
    # Verification audit trail
    verified_at = models.DateTimeField('Дата проверки', null=True, blank=True)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_documents',
        verbose_name='Проверил'
    )
    
    # Timestamps
    uploaded_at = models.DateTimeField('Дата загрузки', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)

    class Meta:
        verbose_name = 'Документ'
        verbose_name_plural = 'Документы'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.name} ({self.get_document_type_display()})"

    @property
    def file_extension(self):
        """Get file extension."""
        if self.file:
            return self.file.name.split('.')[-1].lower()
        return ''

    @property
    def is_verified(self):
        return self.status == DocumentStatus.VERIFIED

    @property
    def is_rejected(self):
        return self.status == DocumentStatus.REJECTED

    @property
    def is_pending(self):
        return self.status == DocumentStatus.PENDING
