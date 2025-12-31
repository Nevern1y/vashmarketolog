/**
 * Document Types - aligned with ТЗ Клиенты specification (135 types)
 * Organized into logical groups for filtering in the UI
 */

export interface DocumentTypeOption {
    value: string
    label: string
    group: string
}

// Document type groups for filtering
export const DOCUMENT_GROUPS = {
    LEGAL: "Юридические / Учредительные",
    FINANCIAL: "Финансовые / Бухгалтерские",
    CARDS_OSV: "Карточки счетов / ОСВ",
    PASSPORTS: "Паспорта / Удостоверения",
    CERTIFICATES: "Справки / Сертификаты",
    OTHER: "Прочие",
} as const

// Full list of 135 document types per ТЗ Клиенты
export const DOCUMENT_TYPES: DocumentTypeOption[] = [
    // ============ GROUP 1: LEGAL & FOUNDERS ============
    { value: "company_card", label: "1. Карточка компании с реквизитами", group: DOCUMENT_GROUPS.LEGAL },
    { value: "passport_director_all", label: "2. Паспорт руководителя (все страницы)", group: DOCUMENT_GROUPS.PASSPORTS },
    { value: "decision_appointment", label: "3. Решение/Протокол о назначении ЕИО", group: DOCUMENT_GROUPS.LEGAL },
    { value: "order_director", label: "4. Приказ о назначении руководителя", group: DOCUMENT_GROUPS.LEGAL },
    { value: "decision_creation", label: "5. Решение о создании организации", group: DOCUMENT_GROUPS.LEGAL },
    { value: "lease_contract", label: "6. Договор аренды / свидетельство о собственности", group: DOCUMENT_GROUPS.LEGAL },
    { value: "fns_no_debt", label: "7. Справка ИФНС об отсутствии задолженности", group: DOCUMENT_GROUPS.CERTIFICATES },
    { value: "statute", label: "8. Устав в действующей редакции", group: DOCUMENT_GROUPS.LEGAL },
    { value: "egrul_extract", label: "9. Выписка ЕГРЮЛ", group: DOCUMENT_GROUPS.LEGAL },
    { value: "passport_founders_all", label: "10. Паспорта всех учредителей (все страницы)", group: DOCUMENT_GROUPS.PASSPORTS },

    // ============ GROUP 2: FINANCIAL / ACCOUNTING ============
    { value: "revenue_certificate", label: "11. Справка о выручке за предыдущий год", group: DOCUMENT_GROUPS.CERTIFICATES },
    { value: "staff_count_certificate", label: "12. Справка о среднесписочной численности", group: DOCUMENT_GROUPS.CERTIFICATES },
    { value: "credit_portfolio", label: "13. Кредитный портфель", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "account_card_51_12m", label: "14. Карточка 51 за последние 12 мес (Excel)", group: DOCUMENT_GROUPS.CARDS_OSV },
    { value: "balance_f1_f2_q2_2025", label: "15. Бухбаланс Ф1 и ФР Ф2 на 30.06.2025", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "balance_f1_f2_q1_2025", label: "16. Бухбаланс Ф1 и ФР Ф2 на 31.03.2025", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "balance_f1_f2_2024_annual", label: "17. Бухбаланс Ф1 и ФР Ф2 на 31.12.2024 с ИФНС", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "balance_f1_f2_q3_2024", label: "18. Бухбаланс Ф1 и ФР Ф2 на 30.09.2024", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "balance_f1_f2_q2_2024", label: "19. Бухбаланс Ф1 и ФР Ф2 на 30.06.2024", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "contract_register", label: "20. Реестр контрактов", group: DOCUMENT_GROUPS.LEGAL },
    { value: "group_scheme", label: "21. Юридическая схема Группы и схема потоков", group: DOCUMENT_GROUPS.LEGAL },
    { value: "account_card_51_52_monthly", label: "22. Анализ и карточка 51, 52 счета (Excel)", group: DOCUMENT_GROUPS.CARDS_OSV },
    { value: "account_90_12m", label: "23. Анализ счета 90 за 12 месяцев (Excel)", group: DOCUMENT_GROUPS.CARDS_OSV },
    { value: "audit_conclusion", label: "24. Аудиторское заключение за последний год", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "bg_client_version", label: "25. Банковская гарантия в редакции клиента", group: DOCUMENT_GROUPS.LEGAL },
    { value: "fin_report_nalog_last", label: "26. Бухотчётность за последний год с NALOG.RU", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "fin_report_nalog_prev", label: "27. Бухотчётность за предыдущий год с NALOG.RU", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "fin_report_5_periods", label: "28. Бухотчётность за 5 последних периодов", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "fin_report_last_year", label: "29. Бухотчётность за последний завершённый год", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "fin_report_last_quarter", label: "30. Бухотчётность за последний завершённый квартал", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "questionnaire", label: "31. Вопросный лист", group: DOCUMENT_GROUPS.OTHER },
    { value: "shareholder_register", label: "32. Выписка из реестра акционеров", group: DOCUMENT_GROUPS.LEGAL },
    { value: "bank_statements_excel", label: "33. Выписки в Excel за последние 12 мес", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "bank_statements_txt", label: "34. Выписки из банков (TXT)", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "credit_agreements", label: "35. Действующие кредитные договоры, гарантии, лизинг", group: DOCUMENT_GROUPS.LEGAL },
    { value: "patent_active", label: "36. Действующий Патент", group: DOCUMENT_GROUPS.LEGAL },
    { value: "power_of_attorney", label: "37. Доверенность на подписанта БГ", group: DOCUMENT_GROUPS.LEGAL },
    { value: "contract_for_bg", label: "38. Договор/контракт для обеспечения гарантией", group: DOCUMENT_GROUPS.LEGAL },
    { value: "buyer_supplier_contracts", label: "39. Договоры с покупателями и поставщиками", group: DOCUMENT_GROUPS.LEGAL },
    { value: "premises_right", label: "40. Документ о праве на занимаемые площади", group: DOCUMENT_GROUPS.LEGAL },
    { value: "company_presentation", label: "41. Презентация компании", group: DOCUMENT_GROUPS.OTHER },
    { value: "ceo_appointment_docs", label: "42. Документы о назначении ЕИО", group: DOCUMENT_GROUPS.LEGAL },
    { value: "no_claims_customer", label: "43. Документы об отсутствии претензий заказчика", group: DOCUMENT_GROUPS.LEGAL },
    { value: "bg_obligation_docs", label: "44. Документы по обеспечиваемому Гарантией обязательству", group: DOCUMENT_GROUPS.LEGAL },
    { value: "pledge_docs", label: "45. Документы по предоставляемому залогу", group: DOCUMENT_GROUPS.LEGAL },
    { value: "target_use_docs", label: "46. Документы по целевому использованию", group: DOCUMENT_GROUPS.LEGAL },
    { value: "location_confirmation", label: "47. Документы о фактическом нахождении клиента", group: DOCUMENT_GROUPS.LEGAL },
    { value: "addendum_executed", label: "48. Доп. соглашения к исполненному контракту", group: DOCUMENT_GROUPS.LEGAL },
    { value: "signed_contract", label: "49. Заключенный договор", group: DOCUMENT_GROUPS.LEGAL },
    { value: "bg_frame_application", label: "50. Заявка на гарантию по рамочному договору", group: DOCUMENT_GROUPS.LEGAL },
    { value: "bg_application", label: "51. Заявление на банковскую гарантию", group: DOCUMENT_GROUPS.LEGAL },
    { value: "other_collateral", label: "52. Иное обеспечение", group: DOCUMENT_GROUPS.OTHER },
    { value: "other", label: "53. Иной документ", group: DOCUMENT_GROUPS.OTHER },
    { value: "executed_contract", label: "54. Исполненный контракт", group: DOCUMENT_GROUPS.LEGAL },

    // ============ GROUP 3: ACCOUNT CARDS / OSV ============
    { value: "card_51_12m", label: "55. Карточка 51 счета за последние 12 месяцев", group: DOCUMENT_GROUPS.CARDS_OSV },
    { value: "card_51_2y", label: "56. Карточка 51 счета за последние 2 года (Excel)", group: DOCUMENT_GROUPS.CARDS_OSV },
    { value: "card_51_last_year", label: "57. Карточка 51 счета за последний завершённый год", group: DOCUMENT_GROUPS.CARDS_OSV },
    { value: "card_51_last_quarter", label: "58. Карточка 51 счета за последний завершённый квартал", group: DOCUMENT_GROUPS.CARDS_OSV },
    { value: "card_62_debtor", label: "59. Карточка 62 сч. по взаиморасчетам с дебитором", group: DOCUMENT_GROUPS.CARDS_OSV },
    { value: "card_company_requisites", label: "60. Карточка компании с реквизитами", group: DOCUMENT_GROUPS.LEGAL },
    { value: "signature_card", label: "61. Карточка образцов подписей", group: DOCUMENT_GROUPS.LEGAL },
    { value: "kudir_last_year", label: "62. Книга учёта доходов и расходов за год", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "kudir_last_quarter", label: "63. Книга учёта доходов и расходов за квартал", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "warranty_contract", label: "64. Контракт по гарантийным обязательствам", group: DOCUMENT_GROUPS.LEGAL },
    { value: "bg_copy_44_223", label: "65. Копия действующей БГ (44/223-ФЗ)", group: DOCUMENT_GROUPS.LEGAL },
    { value: "credit_history", label: "66. Кредитная история ЮЛ и ФЛ", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "credit_doc_portfolio", label: "67. Кредитно-документарный портфель по Группе", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "license_sro", label: "68. Лицензии/СРО на осуществление деятельности", group: DOCUMENT_GROUPS.LEGAL },
    { value: "tax_declaration_quarter", label: "69. Налоговая декларация за квартал", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "tax_declaration_year_fns", label: "70. Налоговая декларация за год с отметкой ФНС", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "tax_declaration_year", label: "71. Налоговая декларация за последний год", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "deposit_pledge", label: "72. Обеспечение залогом по депозиту", group: DOCUMENT_GROUPS.LEGAL },
    { value: "realty_pledge", label: "73. Обеспечение залогом по недвижимости", group: DOCUMENT_GROUPS.LEGAL },
    { value: "vehicle_pledge", label: "74. Обеспечение залогом по транспортному средству", group: DOCUMENT_GROUPS.LEGAL },
    { value: "capital_profit_explanation", label: "75. Обоснование расхождения капитала с прибылью", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "osv_all_last_quarter", label: "76. Общая ОСВ по всем счетам (Excel)", group: DOCUMENT_GROUPS.CARDS_OSV },
    { value: "general_fin_report", label: "77. Общая финансовая отчетность организации", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "sales_volume_natural", label: "78. Объемы продаж в натуральных показателях", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "osv_01_02_08_10_41_43", label: "79. ОСВ 01, 02, 08, 10, 41, 43 счетов", group: DOCUMENT_GROUPS.CARDS_OSV },
    { value: "osv_58_66_67", label: "80. ОСВ 58, 66 и 67 счетов по субконто", group: DOCUMENT_GROUPS.CARDS_OSV },
    { value: "osv_60_62_76", label: "81. ОСВ 60, 62 и 76 счетов по субконто", group: DOCUMENT_GROUPS.CARDS_OSV },
    { value: "osv_62_detailed", label: "82. ОСВ 62 в разбивке по субсчетам", group: DOCUMENT_GROUPS.CARDS_OSV },
    { value: "osv_62_last_quarter", label: "83. ОСВ 62 счета за последний отчетный квартал", group: DOCUMENT_GROUPS.CARDS_OSV },
    { value: "osv_70_last_quarter", label: "84. ОСВ 70 счета за последний отчетный квартал", group: DOCUMENT_GROUPS.CARDS_OSV },
    { value: "osv_76_detailed", label: "85. ОСВ 76 в разбивке по субсчетам", group: DOCUMENT_GROUPS.CARDS_OSV },
    { value: "osv_general_detailed", label: "86. ОСВ общая в разбивке по субсчетам", group: DOCUMENT_GROUPS.CARDS_OSV },
    { value: "osv_balance_10_percent", label: "87. ОСВ по статьям баланса > 10%", group: DOCUMENT_GROUPS.CARDS_OSV },
    { value: "osv_60_62_66_67_76_year", label: "88. ОСВ по счетам 60, 62, 66, 67, 76 за год", group: DOCUMENT_GROUPS.CARDS_OSV },
    { value: "osv_60_62_66_67_76_quarter", label: "89. ОСВ по счетам 60, 62, 66, 67, 76 за квартал", group: DOCUMENT_GROUPS.CARDS_OSV },
    { value: "bki_report", label: "90. Отчет БКИ", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "factor_report", label: "91. Отчет действующего фактора", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "financial_results_report", label: "92. Отчет о финансовых результатах", group: DOCUMENT_GROUPS.FINANCIAL },

    // ============ GROUP 4: PASSPORTS / IDs ============
    { value: "passport_bo", label: "93. Паспорт БВ (бенефициарного владельца)", group: DOCUMENT_GROUPS.PASSPORTS },
    { value: "passport_bo_pages", label: "94. Паспорт БВ (1-я страница и прописка)", group: DOCUMENT_GROUPS.PASSPORTS },
    { value: "passport_bo_founder", label: "95. Паспорт БВ и учредителя", group: DOCUMENT_GROUPS.PASSPORTS },
    { value: "passport_eio", label: "96. Паспорт ЕИО", group: DOCUMENT_GROUPS.PASSPORTS },
    { value: "passport_pledger", label: "97. Паспорт залогодателя - физ. лица", group: DOCUMENT_GROUPS.PASSPORTS },
    { value: "passport_guarantor", label: "98. Паспорт поручителя - физ. лица", group: DOCUMENT_GROUPS.PASSPORTS },
    { value: "passport_owners_25", label: "99. Паспорта физлиц с долей > 25%", group: DOCUMENT_GROUPS.PASSPORTS },
    { value: "primary_docs_contract", label: "100. Первичные документы к исполненному контракту", group: DOCUMENT_GROUPS.LEGAL },
    { value: "passport_first_page", label: "101. Первый разворот паспорта", group: DOCUMENT_GROUPS.PASSPORTS },
    { value: "fin_report_resubmit", label: "102. Пересдача годового БО", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "bo_letter", label: "103. Письмо о бенефициарном владельце", group: DOCUMENT_GROUPS.LEGAL },
    { value: "compliance_letter", label: "104. Письмо-гарантия о соблюдении законодательства", group: DOCUMENT_GROUPS.LEGAL },
    { value: "experience_contracts", label: "105. Опыт аналогичных исполненных договоров (18 мес.)", group: DOCUMENT_GROUPS.LEGAL },
    { value: "bg_approval_other_bank", label: "106. Подтверждение одобрения БГ сторонним банком", group: DOCUMENT_GROUPS.LEGAL },
    { value: "order_accountant", label: "107. Приказ о назначении главного бухгалтера", group: DOCUMENT_GROUPS.LEGAL },
    { value: "shareholder_protocol", label: "108. Протокол собрания о согласии на получение гарантии", group: DOCUMENT_GROUPS.LEGAL },
    { value: "off_balance_obligations", label: "109. Расшифровка забалансовых обязательств", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "receivables_breakdown", label: "110. Расшифровка дебиторской задолженности", group: DOCUMENT_GROUPS.FINANCIAL },
    { value: "active_contracts_register", label: "111. Реестр действующих и исполненных контрактов", group: DOCUMENT_GROUPS.LEGAL },
    { value: "counterparty_register", label: "112. Реестр основных контрагентов", group: DOCUMENT_GROUPS.LEGAL },
    { value: "major_deal_decision", label: "113. Решение о крупности сделки", group: DOCUMENT_GROUPS.LEGAL },
    { value: "deal_approval_decision", label: "114. Решение о согласии на сделку", group: DOCUMENT_GROUPS.LEGAL },
    { value: "management_composition", label: "115. Сведения о персональном составе органов управления", group: DOCUMENT_GROUPS.LEGAL },
    { value: "rosstat_forms", label: "116. Сведения в составе форм Росстат (П3, П5, ПМ и т.д.)", group: DOCUMENT_GROUPS.CERTIFICATES },
    { value: "signed_contract_docs", label: "117. Скан контракта и первичных документов", group: DOCUMENT_GROUPS.LEGAL },
    { value: "financed_debtor_contract", label: "118. Скан-копия финансируемого договора с дебитором", group: DOCUMENT_GROUPS.LEGAL },
    { value: "snils_eio", label: "119. СНИЛС ЕИО", group: DOCUMENT_GROUPS.PASSPORTS },
    { value: "snils_founders", label: "120. СНИЛС учредителей", group: DOCUMENT_GROUPS.PASSPORTS },
    { value: "consent_personal_data", label: "121. Согласие на обработку персональных данных", group: DOCUMENT_GROUPS.LEGAL },
    { value: "consent_credit_report", label: "122. Согласие на получение кредитных отчетов", group: DOCUMENT_GROUPS.LEGAL },
    { value: "consent_edo", label: "123. Согласие с Регламентом ЭДО", group: DOCUMENT_GROUPS.LEGAL },
    { value: "participants_list", label: "124. Список участников общества", group: DOCUMENT_GROUPS.LEGAL },
    { value: "fns_tax_status", label: "125. Справка из ФНС о расчетах по налогам", group: DOCUMENT_GROUPS.CERTIFICATES },
    { value: "fns_accounts", label: "126. Справка из ФНС об открытых счетах (45 дней)", group: DOCUMENT_GROUPS.CERTIFICATES },
    { value: "fns_bank_accounts", label: "127. Справка ИФНС об открытых банковских счетах", group: DOCUMENT_GROUPS.CERTIFICATES },
    { value: "off_balance_cert", label: "128. Справка о забалансовых обязательствах", group: DOCUMENT_GROUPS.CERTIFICATES },
    { value: "accountant_status", label: "129. Справка о наличии/отсутствии главного бухгалтера", group: DOCUMENT_GROUPS.CERTIFICATES },
    { value: "salary_debt_cert", label: "130. Справка о просроченной задолженности по зарплате", group: DOCUMENT_GROUPS.CERTIFICATES },
    { value: "staff_count_cert", label: "131. Справка о численности и выплатах работникам", group: DOCUMENT_GROUPS.CERTIFICATES },
    { value: "real_activity_cert", label: "132. Справка о наличии/отсутствии реальной деятельности", group: DOCUMENT_GROUPS.CERTIFICATES },
    { value: "no_major_deal_cert", label: "133. Справка об отсутствии крупной сделки", group: DOCUMENT_GROUPS.CERTIFICATES },
    { value: "location_cert", label: "134. Справка о месте нахождения Заемщика", group: DOCUMENT_GROUPS.CERTIFICATES },
    { value: "fns_registration_notice", label: "135. Уведомление о постановке на учет в ФНС", group: DOCUMENT_GROUPS.CERTIFICATES },
]

// Create a map for lookup by value
export const DOCUMENT_TYPE_MAP: Record<string, string> = DOCUMENT_TYPES.reduce(
    (acc, item) => ({ ...acc, [item.value]: item.label }),
    {}
)

// Get documents grouped by category
export const getGroupedDocumentTypes = () => {
    const groups: Record<string, DocumentTypeOption[]> = {}

    DOCUMENT_TYPES.forEach(type => {
        if (!groups[type.group]) {
            groups[type.group] = []
        }
        groups[type.group].push(type)
    })

    return groups
}

// Get most common document types for quick selection (first 20)
export const COMMON_DOCUMENT_TYPES = DOCUMENT_TYPES.slice(0, 20)
