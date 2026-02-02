/**
 * Document Types per Appendix B (Приложение Б)
 * 
 * BREAKING CHANGE: Now uses numeric IDs instead of string keys.
 * Document Type IDs are PRODUCT-SPECIFIC:
 * - ID 21 for Bank Guarantee = "Паспорт генерального директора"
 * - ID 74 for Contract Loan = "Паспорт генерального директора" (same meaning, different ID)
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type DocumentSource = 'auto' | 'agent' | 'bank' | 'agent_bank';

export interface DocumentTypeOption {
    id: number;              // Numeric ID from Appendix B
    productType: string;     // bank_guarantee | contract_loan | general
    name: string;            // Document name in Russian
    source: DocumentSource;  // Who uploads/generates
}

// Document type groups for UI filtering
export const DOCUMENT_GROUPS = {
    FINANCIAL: "Финансовые / Бухгалтерские",
    LEGAL: "Юридические / Учредительные",
    PERSONAL: "Паспорта / Удостоверения",
    GUARANTEE: "Гарантии / Договоры",
    SURETY: "Поручители",
    OTHER: "Прочие",
} as const;

// ============================================================================
// Б.1 БАНКОВСКИЕ ГАРАНТИИ (63 types)
// ============================================================================

export const BG_DOCUMENT_TYPES: DocumentTypeOption[] = [
    // General
    { id: 0, productType: 'bank_guarantee', name: 'Дополнительный документ', source: 'agent_bank' },

    // Applications (Auto-generated)
    { id: 17, productType: 'bank_guarantee', name: 'Заявление', source: 'auto' },
    { id: 18, productType: 'bank_guarantee', name: 'Черновик заявления', source: 'auto' },

    // Financial Documents (Agent uploads)
    { id: 20, productType: 'bank_guarantee', name: 'Бухгалтерская отчетность Ф1 и Ф2 за последний отчетный период', source: 'agent' },
    { id: 21, productType: 'bank_guarantee', name: 'Паспорт генерального директора', source: 'agent' },
    { id: 24, productType: 'bank_guarantee', name: 'Налоговая декларация за последний отчетный период', source: 'agent' },

    // Auto-generated documents
    { id: 26, productType: 'bank_guarantee', name: 'Акт приема-передачи', source: 'auto' },
    { id: 29, productType: 'bank_guarantee', name: 'Договор поручительства ФЛ', source: 'auto' },

    // Agent uploads
    { id: 31, productType: 'bank_guarantee', name: 'Пролонгация по договору Аренды', source: 'agent' },
    { id: 32, productType: 'bank_guarantee', name: 'Пояснение по завышению ЧА за отчетный период', source: 'agent' },

    // Auto-generated
    { id: 33, productType: 'bank_guarantee', name: 'Договор поручительства ЮЛ', source: 'auto' },

    // Agent uploads
    { id: 34, productType: 'bank_guarantee', name: 'Бухгалтерская отчетность Ф1 и Ф2 за предыдущий отчетный период', source: 'agent' },

    // Bank Guarantee types (Auto-generated)
    { id: 35, productType: 'bank_guarantee', name: 'БГ 44-ФЗ', source: 'auto' },
    { id: 36, productType: 'bank_guarantee', name: 'БГ 185-ФЗ', source: 'auto' },
    { id: 37, productType: 'bank_guarantee', name: 'БГ 223-ФЗ', source: 'auto' },
    { id: 38, productType: 'bank_guarantee', name: 'Счет на оплату', source: 'auto' },

    // Bank uploads
    { id: 42, productType: 'bank_guarantee', name: 'БГ по форме заказчика', source: 'bank' },
    { id: 43, productType: 'bank_guarantee', name: 'Скан БГ', source: 'bank' },

    // Agent uploads - Tender documents
    { id: 44, productType: 'bank_guarantee', name: 'Письмо по налогам', source: 'agent' },
    { id: 45, productType: 'bank_guarantee', name: 'Дополнительные документы', source: 'agent' },
    { id: 46, productType: 'bank_guarantee', name: 'Аукционная документация', source: 'agent' },
    { id: 47, productType: 'bank_guarantee', name: 'Проект контракта', source: 'agent' },
    { id: 48, productType: 'bank_guarantee', name: 'Протокол итогов', source: 'agent' },
    { id: 49, productType: 'bank_guarantee', name: 'Решение (протокол) о крупной сделке', source: 'agent' },
    { id: 50, productType: 'bank_guarantee', name: 'Реестр контрактов', source: 'agent' },
    { id: 51, productType: 'bank_guarantee', name: 'Пояснение по ошибочным данным в ББ по предыдущим периодам', source: 'agent' },
    { id: 52, productType: 'bank_guarantee', name: 'Пояснение по несоответствию данных ББ с Росстат', source: 'agent' },
    { id: 53, productType: 'bank_guarantee', name: 'Перевыпуск', source: 'agent' },
    { id: 54, productType: 'bank_guarantee', name: 'Опыт', source: 'agent' },
    { id: 55, productType: 'bank_guarantee', name: 'Договор в обеспечении которого запрашивается БГ', source: 'agent' },

    // Auto-generated
    { id: 56, productType: 'bank_guarantee', name: 'Коммерческая БГ', source: 'auto' },

    // Bank uploads
    { id: 60, productType: 'bank_guarantee', name: 'Выписка из реестра', source: 'bank' },

    // Agent uploads - Financial
    { id: 61, productType: 'bank_guarantee', name: 'Бухгалтерская отчетность Ф1 и Ф2 за последний завершенный год', source: 'agent' },
    { id: 62, productType: 'bank_guarantee', name: 'Бухгалтерская отчетность Ф1 и Ф2 за последний завершенный квартал', source: 'agent' },
    { id: 63, productType: 'bank_guarantee', name: 'Бухгалтерская отчетность Ф1 и Ф2 за последний завершенный год', source: 'agent' },
    { id: 64, productType: 'bank_guarantee', name: 'Бухгалтерская отчетность Ф1 и Ф2 за последний завершенный квартал', source: 'agent' },
    { id: 65, productType: 'bank_guarantee', name: 'Бухгалтерская отчетность Ф1 и Ф2 за последний завершенный квартал', source: 'agent' },
    { id: 66, productType: 'bank_guarantee', name: 'Налоговая декларация УСН за последний год', source: 'agent' },

    // Auto-generated
    { id: 124, productType: 'bank_guarantee', name: 'Индивидуальные условия', source: 'auto' },

    // Agent uploads
    { id: 135, productType: 'bank_guarantee', name: 'Правки для согласования', source: 'agent' },
    { id: 136, productType: 'bank_guarantee', name: 'Заявление об отказе клиента от сделки', source: 'agent' },

    // Surety documents (Auto-generated for ФЛ/ЮЛ)
    { id: 149, productType: 'bank_guarantee', name: 'Паспорт поручителя ФЛ', source: 'auto' },
    { id: 151, productType: 'bank_guarantee', name: 'Отчетность за последний отчетный год поручителя ЮЛ', source: 'auto' },
    { id: 153, productType: 'bank_guarantee', name: 'Отчетность за последний отчетный период поручителя ЮЛ', source: 'auto' },
    { id: 155, productType: 'bank_guarantee', name: 'Паспорт генерального директора поручителя ЮЛ', source: 'auto' },
    { id: 156, productType: 'bank_guarantee', name: 'Налоговая декларация за последний отчетный период поручителя ЮЛ', source: 'auto' },
    { id: 158, productType: 'bank_guarantee', name: 'Действующий договор аренды или свидетельство о собственности поручителя ЮЛ', source: 'auto' },
    { id: 160, productType: 'bank_guarantee', name: 'Устав поручителя ЮЛ', source: 'auto' },
    { id: 162, productType: 'bank_guarantee', name: 'Протокол или решение на генерального директора поручителя ЮЛ', source: 'auto' },
    { id: 164, productType: 'bank_guarantee', name: 'Заявление поручителя ЮЛ', source: 'auto' },

    // Agent uploads - Signatory
    { id: 169, productType: 'bank_guarantee', name: 'Доверенность на подписанта', source: 'agent' },
    { id: 171, productType: 'bank_guarantee', name: 'Паспорт подписанта', source: 'agent' },

    // Balance sheet documents with specific dates (ID 200-204) - SYNCED WITH DATABASE
    // ID 200-202 from migration 0010, ID 203-204 from migration 0012
    { id: 200, productType: 'bank_guarantee', name: 'Бухбаланс Ф1 и ОПиУ Ф2 на 30.09.2025', source: 'agent' },
    { id: 201, productType: 'bank_guarantee', name: 'Бухбаланс Ф1 и ОПиУ Ф2 на 31.12.2023 с квитанцией ИФНС', source: 'agent' },
    { id: 202, productType: 'bank_guarantee', name: 'Бухбаланс Ф1 и ОПиУ Ф2 на 31.12.2025 с квитанцией ИФНС', source: 'agent' },
    { id: 203, productType: 'bank_guarantee', name: 'Бухбаланс Ф1 и ОПиУ Ф2 на 31.12.2024 с квитанцией ИФНС', source: 'agent' },
    { id: 204, productType: 'bank_guarantee', name: 'Бухбаланс Ф1 и ОПиУ Ф2 на 30.06.2025', source: 'agent' },

    // NEW: Additional required documents
    { id: 22, productType: 'bank_guarantee', name: 'Паспорта всех учредителей (все страницы)', source: 'agent' },

    // NEW: Optional documents (ID 210-223)
    { id: 210, productType: 'bank_guarantee', name: 'Налоговая декларация на прибыль за 24 год с квитанцией ИФНС', source: 'agent' },
    { id: 211, productType: 'bank_guarantee', name: 'Налоговая декларация на прибыль за 25 год с квитанцией ИФНС', source: 'agent' },
    { id: 220, productType: 'bank_guarantee', name: 'Общая ОСВ за 1 год по всем счетам в разбивке по субсчетам', source: 'agent' },
    { id: 221, productType: 'bank_guarantee', name: 'ОСВ 60 за 1 год в разбивке по субсчетам и контрагентам (Excel)', source: 'agent' },
    { id: 222, productType: 'bank_guarantee', name: 'ОСВ 62 за 1 год в разбивке по субсчетам и контрагентам (Excel)', source: 'agent' },
    { id: 223, productType: 'bank_guarantee', name: 'Выписка в формате txt за 12 месяцев', source: 'agent' },
];

// ============================================================================
// Б.2 КРЕДИТЫ НА ИСПОЛНЕНИЕ КОНТРАКТОВ (68 types)
// ============================================================================

export const KIK_DOCUMENT_TYPES: DocumentTypeOption[] = [
    // General
    { id: 0, productType: 'contract_loan', name: 'Дополнительный документ', source: 'agent_bank' },

    // Tax documents
    { id: 30, productType: 'contract_loan', name: 'Налоговая декларация УСН за последний год', source: 'agent' },

    // Applications (Auto-generated)
    { id: 68, productType: 'contract_loan', name: 'Заявление кредит', source: 'auto' },

    // Financial Documents (Agent uploads)
    { id: 69, productType: 'contract_loan', name: 'Налоговая декларация за завершённый год', source: 'agent' },
    { id: 70, productType: 'contract_loan', name: 'Бухгалтерская отчётность за последний год', source: 'agent' },
    { id: 71, productType: 'contract_loan', name: 'Бухгалтерская отчётность за последний квартал', source: 'agent' },

    // Personal & Legal Documents (Agent uploads)
    { id: 74, productType: 'contract_loan', name: 'Паспорт генерального директора', source: 'agent' },
    { id: 75, productType: 'contract_loan', name: 'Устав + дополнения к уставу (в действующей редакции)', source: 'agent' },
    { id: 76, productType: 'contract_loan', name: 'Протокол (решение) об избрании Единоличного исполнительного органа', source: 'agent' },

    // Tender documents (Agent uploads)
    { id: 77, productType: 'contract_loan', name: 'Аукционная документация', source: 'agent' },
    { id: 78, productType: 'contract_loan', name: 'Проект контракта', source: 'agent' },
    { id: 79, productType: 'contract_loan', name: 'Протокол итогов', source: 'agent' },
    { id: 80, productType: 'contract_loan', name: 'Карточка 51 счета или Выписка по расчетному счету (за последние 6 завершенных месяцев)', source: 'agent' },
    { id: 81, productType: 'contract_loan', name: 'Договор аренды, подтверждающий фактическое местонахождение', source: 'agent' },

    // Auto-generated loan documents
    { id: 83, productType: 'contract_loan', name: 'Индивидуальные условия кредит', source: 'auto' },
    { id: 84, productType: 'contract_loan', name: 'Заявление на предоставление транша', source: 'auto' },

    // Bank uploads
    { id: 85, productType: 'contract_loan', name: 'Открытие расчётного счёта', source: 'bank' },

    // Agent uploads
    { id: 86, productType: 'contract_loan', name: 'Документы на сделку', source: 'agent' },
    { id: 87, productType: 'contract_loan', name: 'Копия лицензии (при наличии)', source: 'agent' },

    // Auto-generated
    { id: 90, productType: 'contract_loan', name: 'Счёт на оплату', source: 'auto' },
    { id: 92, productType: 'contract_loan', name: 'Договор залога прав по договору банковского счета НКЛ', source: 'auto' },
    { id: 93, productType: 'contract_loan', name: 'Договор поручительства НКЛ ФЛ', source: 'auto' },
    { id: 94, productType: 'contract_loan', name: 'Договор поручительства кредит ФЛ', source: 'auto' },
    { id: 95, productType: 'contract_loan', name: 'Индивидуальные условия НКЛ', source: 'auto' },
    { id: 96, productType: 'contract_loan', name: 'Заявление НКЛ', source: 'auto' },
    { id: 97, productType: 'contract_loan', name: 'Договор залога прав по договору банковского счета кредит', source: 'auto' },

    // Agent uploads
    { id: 102, productType: 'contract_loan', name: 'Целевое использование кредитных средств', source: 'agent' },
    { id: 103, productType: 'contract_loan', name: 'Источники погашения', source: 'agent' },
    { id: 105, productType: 'contract_loan', name: 'ПРОТОКОЛ - ОБЩЕЕ (одобрение на год)', source: 'agent' },
    { id: 106, productType: 'contract_loan', name: 'Решение - ОБЩЕЕ (одобрение на год)', source: 'agent' },
    { id: 108, productType: 'contract_loan', name: 'Бухгалтерская отчётность за последний завершенный квартал', source: 'agent' },
    { id: 109, productType: 'contract_loan', name: 'Налоговая декларация за последний отчетный период', source: 'agent' },

    // Auto-generated
    { id: 115, productType: 'contract_loan', name: 'Черновик заявления', source: 'auto' },

    // Agent uploads
    { id: 137, productType: 'contract_loan', name: 'Заявление об отказе клиента от сделки', source: 'agent' },

    // Auto-generated - Loan contracts
    { id: 138, productType: 'contract_loan', name: 'Договор поручительства НКЛ ЮЛ', source: 'auto' },
    { id: 139, productType: 'contract_loan', name: 'Договор поручительства кредит ЮЛ', source: 'auto' },
    { id: 140, productType: 'contract_loan', name: 'Уведомление о повышении % ставки', source: 'auto' },
    { id: 147, productType: 'contract_loan', name: 'Договор залога прав (требования) выручки', source: 'auto' },
    { id: 148, productType: 'contract_loan', name: 'Договор залога прав по счету', source: 'auto' },

    // Surety documents for КИК
    { id: 150, productType: 'contract_loan', name: 'Паспорт поручителя ФЛ', source: 'auto' },
    { id: 152, productType: 'contract_loan', name: 'Отчетность за последний отчетный год поручителя ЮЛ', source: 'auto' },
    { id: 154, productType: 'contract_loan', name: 'Паспорт генерального директора поручителя ЮЛ', source: 'auto' },
    { id: 157, productType: 'contract_loan', name: 'Налоговая декларация за последний отчетный период поручителя ЮЛ', source: 'auto' },
    { id: 159, productType: 'contract_loan', name: 'Действующий договор аренды или свидетельство о собственности поручителя ЮЛ', source: 'auto' },
    { id: 161, productType: 'contract_loan', name: 'Устав поручителя ЮЛ', source: 'auto' },
    { id: 163, productType: 'contract_loan', name: 'Протокол или решение на генерального директора поручителя ЮЛ', source: 'auto' },
    { id: 165, productType: 'contract_loan', name: 'Заявление поручителя ЮЛ', source: 'auto' },
    { id: 166, productType: 'contract_loan', name: 'Отчетность за последний отчетный период поручителя ЮЛ', source: 'auto' },

    // Agent uploads - Signatory
    { id: 170, productType: 'contract_loan', name: 'Доверенность на подписанта', source: 'agent' },
    { id: 172, productType: 'contract_loan', name: 'Паспорт подписанта', source: 'agent' },

    // Balance sheet documents with specific dates (ID 200-204) - SYNCED WITH DATABASE
    { id: 200, productType: 'contract_loan', name: 'Бухбаланс Ф1 и ОПиУ Ф2 на 30.09.2025', source: 'agent' },
    { id: 201, productType: 'contract_loan', name: 'Бухбаланс Ф1 и ОПиУ Ф2 на 31.12.2023 с квитанцией ИФНС', source: 'agent' },
    { id: 202, productType: 'contract_loan', name: 'Бухбаланс Ф1 и ОПиУ Ф2 на 31.12.2025 с квитанцией ИФНС', source: 'agent' },
    { id: 203, productType: 'contract_loan', name: 'Бухбаланс Ф1 и ОПиУ Ф2 на 31.12.2024 с квитанцией ИФНС', source: 'agent' },
    { id: 204, productType: 'contract_loan', name: 'Бухбаланс Ф1 и ОПиУ Ф2 на 30.06.2025', source: 'agent' },

    // NEW: Additional required documents
    { id: 22, productType: 'contract_loan', name: 'Паспорта всех учредителей (все страницы)', source: 'agent' },
    { id: 50, productType: 'contract_loan', name: 'Реестр контрактов', source: 'agent' },

    // NEW: Optional documents (ID 210-223)
    { id: 210, productType: 'contract_loan', name: 'Налоговая декларация на прибыль за 24 год с квитанцией ИФНС', source: 'agent' },
    { id: 211, productType: 'contract_loan', name: 'Налоговая декларация на прибыль за 25 год с квитанцией ИФНС', source: 'agent' },
    { id: 220, productType: 'contract_loan', name: 'Общая ОСВ за 1 год по всем счетам в разбивке по субсчетам', source: 'agent' },
    { id: 221, productType: 'contract_loan', name: 'ОСВ 60 за 1 год в разбивке по субсчетам и контрагентам (Excel)', source: 'agent' },
    { id: 222, productType: 'contract_loan', name: 'ОСВ 62 за 1 год в разбивке по субсчетам и контрагентам (Excel)', source: 'agent' },
    { id: 223, productType: 'contract_loan', name: 'Выписка в формате txt за 12 месяцев', source: 'agent' },
];

// ============================================================================
// GENERAL DOCUMENT TYPES (for other products without specific IDs)
// ============================================================================

export const GENERAL_DOCUMENT_TYPES: DocumentTypeOption[] = [
    { id: 0, productType: 'general', name: 'Дополнительный документ', source: 'agent_bank' },
    { id: 1, productType: 'general', name: 'Карточка компании', source: 'agent' },
    { id: 2, productType: 'general', name: 'Бухгалтерская отчётность', source: 'agent' },
    { id: 3, productType: 'general', name: 'Налоговая декларация', source: 'agent' },
    { id: 4, productType: 'general', name: 'Устав', source: 'agent' },
    { id: 5, productType: 'general', name: 'Выписка ЕГРЮЛ', source: 'agent' },
    { id: 6, productType: 'general', name: 'Договор аренды', source: 'agent' },
    { id: 7, productType: 'general', name: 'Протокол о назначении ЕИО', source: 'agent' },
    { id: 8, productType: 'general', name: 'Карточка 51 счета', source: 'agent' },
    { id: 9, productType: 'general', name: 'Другие документы', source: 'agent' },
    // NEW: Common required documents
    { id: 21, productType: 'general', name: 'Паспорт руководителя (все страницы)', source: 'agent' },
    { id: 22, productType: 'general', name: 'Паспорта всех учредителей (все страницы)', source: 'agent' },
    { id: 50, productType: 'general', name: 'Реестр контрактов', source: 'agent' },
    { id: 75, productType: 'general', name: 'Устав', source: 'agent' },
    { id: 76, productType: 'general', name: 'Решение/протокол о назначении руководителя', source: 'agent' },
    { id: 80, productType: 'general', name: 'Карточка 51 счета за 24 месяца', source: 'agent' },
    { id: 81, productType: 'general', name: 'Договор аренды с актом или свидетельство о праве собственности', source: 'agent' },
    // Balance sheet documents - SYNCED WITH DATABASE (migrations 0010 + 0012)
    { id: 200, productType: 'general', name: 'Бухбаланс Ф1 и ОПиУ Ф2 на 30.09.2025', source: 'agent' },
    { id: 201, productType: 'general', name: 'Бухбаланс Ф1 и ОПиУ Ф2 на 31.12.2023 с квитанцией ИФНС', source: 'agent' },
    { id: 202, productType: 'general', name: 'Бухбаланс Ф1 и ОПиУ Ф2 на 31.12.2025 с квитанцией ИФНС', source: 'agent' },
    { id: 203, productType: 'general', name: 'Бухбаланс Ф1 и ОПиУ Ф2 на 31.12.2024 с квитанцией ИФНС', source: 'agent' },
    { id: 204, productType: 'general', name: 'Бухбаланс Ф1 и ОПиУ Ф2 на 30.06.2025', source: 'agent' },
    // NEW: Optional documents
    { id: 210, productType: 'general', name: 'Налоговая декларация на прибыль за 24 год с квитанцией ИФНС', source: 'agent' },
    { id: 211, productType: 'general', name: 'Налоговая декларация на прибыль за 25 год с квитанцией ИФНС', source: 'agent' },
    { id: 220, productType: 'general', name: 'Общая ОСВ за 1 год по всем счетам в разбивке по субсчетам', source: 'agent' },
    { id: 221, productType: 'general', name: 'ОСВ 60 за 1 год в разбивке по субсчетам и контрагентам (Excel)', source: 'agent' },
    { id: 222, productType: 'general', name: 'ОСВ 62 за 1 год в разбивке по субсчетам и контрагентам (Excel)', source: 'agent' },
    { id: 223, productType: 'general', name: 'Выписка в формате txt за 12 месяцев', source: 'agent' },
    // VED и Страхование - специфичные документы
    { id: 230, productType: 'general', name: 'Инвойс', source: 'agent' },
    { id: 231, productType: 'general', name: 'Договор страхования', source: 'agent' },
];

// ============================================================================
// AGENT ACCREDITATION DOCUMENT TYPES (4 types)
// ============================================================================

export const AGENT_DOCUMENT_TYPES: DocumentTypeOption[] = [
    { id: 8, productType: 'agent', name: 'Заявление о присоединении к регламенту', source: 'agent' },
    { id: 9, productType: 'agent', name: 'Согласие на обработку персональных данных', source: 'agent' },
    { id: 10, productType: 'agent', name: 'Лист записи/Скан свидетельства ОГРНИП', source: 'agent' },
    { id: 11, productType: 'agent', name: 'Агентский договор', source: 'agent' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get document types for a specific product.
 * Falls back to GENERAL_DOCUMENT_TYPES if product not found.
 */
export function getDocumentTypesForProduct(productType: string): DocumentTypeOption[] {
    switch (productType) {
        case 'bank_guarantee':
            return BG_DOCUMENT_TYPES;
        case 'contract_loan':
        case 'tender_loan':  // Same as contract_loan per ТЗ
            return KIK_DOCUMENT_TYPES;
        case 'agent':
            return AGENT_DOCUMENT_TYPES;
        default:
            return GENERAL_DOCUMENT_TYPES;
    }
}

/**
 * Get document type by ID for a specific product.
 * Returns undefined if not found.
 */
export function getDocumentTypeById(
    documentTypeId: number,
    productType: string
): DocumentTypeOption | undefined {
    const types = getDocumentTypesForProduct(productType);
    return types.find(t => t.id === documentTypeId);
}

/**
 * Get document type name by ID.
 * Searches across ALL document type arrays.
 * Returns a fallback string if not found.
 */
export function getDocumentTypeName(
    documentTypeId: number,
    productType: string
): string {
    // First try product-specific types
    const type = getDocumentTypeById(documentTypeId, productType);
    if (type) {
        return type.name;
    }
    
    // Then search in all document types (BG, KIK, General)
    const allTypes = [...BG_DOCUMENT_TYPES, ...KIK_DOCUMENT_TYPES, ...GENERAL_DOCUMENT_TYPES];
    const foundType = allTypes.find(t => t.id === documentTypeId);
    if (foundType) {
        return foundType.name;
    }
    
    if (documentTypeId === 0) {
        return 'Дополнительный документ';
    }
    return `Документ (ID: ${documentTypeId})`;
}

/**
 * Get document source display text.
 */
export function getSourceDisplayText(source: DocumentSource): string {
    switch (source) {
        case 'auto':
            return 'Формируется автоматически';
        case 'agent':
            return 'Загружается Агентом';
        case 'bank':
            return 'Загружается Банком';
        case 'agent_bank':
            return 'Загружается Агентом/Банком';
        default:
            return 'Неизвестно';
    }
}

/**
 * Filter document types by source (who uploads them).
 */
export function getDocumentTypesBySource(
    productType: string,
    source: DocumentSource
): DocumentTypeOption[] {
    const types = getDocumentTypesForProduct(productType);
    return types.filter(t => t.source === source);
}

/**
 * Get only agent-uploadable document types for a product.
 * Excludes auto-generated and bank-only documents.
 */
export function getAgentUploadableTypes(productType: string): DocumentTypeOption[] {
    const types = getDocumentTypesForProduct(productType);
    return types.filter(t => t.source === 'agent' || t.source === 'agent_bank');
}

/**
 * Create a lookup map for quick ID -> name resolution.
 */
export function createDocumentTypeMap(productType: string): Record<number, string> {
    const types = getDocumentTypesForProduct(productType);
    return types.reduce<Record<number, string>>((acc, t) => {
        acc[t.id] = t.name;
        return acc;
    }, {});
}

// ============================================================================
// LEGACY COMPATIBILITY (for gradual migration)
// ============================================================================

/**
 * @deprecated Use getDocumentTypesForProduct() instead.
 * This maintains backward compatibility during migration.
 */
export const DOCUMENT_TYPES = GENERAL_DOCUMENT_TYPES.map(t => ({
    value: String(t.id),
    label: t.name,
    group: DOCUMENT_GROUPS.OTHER,
}));

/**
 * @deprecated Use createDocumentTypeMap() instead.
 */
export const DOCUMENT_TYPE_MAP: Record<string, string> = GENERAL_DOCUMENT_TYPES.reduce<Record<string, string>>(
    (acc, t) => {
        acc[String(t.id)] = t.name;
        return acc;
    },
    {}
);

/**
 * @deprecated Use getAgentUploadableTypes() instead.
 */
export const COMMON_DOCUMENT_TYPES = GENERAL_DOCUMENT_TYPES.slice(0, 10).map(t => ({
    value: String(t.id),
    label: t.name,
    group: DOCUMENT_GROUPS.OTHER,
}));

/**
 * @deprecated Use getDocumentTypesForProduct() with grouping logic.
 */
export const getGroupedDocumentTypes = () => {
    const groups: Record<string, { value: string; label: string; group: string }[]> = {};
    GENERAL_DOCUMENT_TYPES.forEach(t => {
        const group = DOCUMENT_GROUPS.OTHER;
        if (!groups[group]) {
            groups[group] = [];
        }
        groups[group].push({
            value: String(t.id),
            label: t.name,
            group,
        });
    });
    return groups;
};

// Required documents by product type (synchronized with application-detail-view.tsx)
// DB ID mapping (from migrations 0010 + 0012):
// - ID 200 = 30.09.2025
// - ID 201 = 31.12.2023 (с квитанцией ИФНС) - НЕОБЯЗАТЕЛЬНЫЙ
// - ID 202 = 31.12.2025 (с квитанцией ИФНС) - НЕОБЯЗАТЕЛЬНЫЙ
// - ID 203 = 31.12.2024 (с квитанцией ИФНС) - ГЛАВНЫЙ ОБЯЗАТЕЛЬНЫЙ
// - ID 204 = 30.06.2025 - НЕОБЯЗАТЕЛЬНЫЙ
// Обязательные для БГ/КИК/Кредиты/Лизинг/Факторинг: 1, 203, 200, 50, 21, 22, 75, 76, 81
export const REQUIRED_DOCUMENTS_BY_PRODUCT: Record<string, number[]> = {
    // Common required for all products - Карточка компании
    common: [1],
    
    // БГ, КИК, Кредиты, Лизинг, Факторинг - ОДИНАКОВЫЕ
    // Обязательные: Карточка, Бухбаланс 2024, Бухбаланс 30.09.2025, Реестр, Паспорта, Уставные
    // Убраны из обязательных: 201 (31.12.2023), 202 (31.12.2025), 204 (30.06.2025)
    bank_guarantee: [1, 203, 200, 50, 21, 22, 75, 76, 81],
    contract_loan: [1, 203, 200, 50, 21, 22, 75, 76, 81],
    tender_loan: [1, 203, 200, 50, 21, 22, 75, 76, 81],
    corporate_credit: [1, 203, 200, 50, 21, 22, 75, 76, 81],
    
    // Лизинг - такой же как БГ/КИК
    leasing: [1, 203, 200, 50, 21, 22, 75, 76, 81],
    
    // Факторинг - такой же как БГ/КИК
    factoring: [1, 203, 200, 50, 21, 22, 75, 76, 81],
    
    // Международные платежи (VED) - только карточка обязательна
    ved: [1],
    
    // РКО - только карточка обязательна
    rko: [1],
    special_account: [1],
    deposits: [1],
    
    // Страхование - только карточка обязательна
    insurance: [1],
    
    // Тендерное сопровождение - полный пакет как у БГ/КИК
    tender_support: [1, 203, 200, 50, 21, 22, 75, 76, 81],
};

export const getRequiredDocumentsForProduct = (productType: string): { id: number; name: string }[] => {
    const commonIds = REQUIRED_DOCUMENTS_BY_PRODUCT.common || [];
    const productIds = REQUIRED_DOCUMENTS_BY_PRODUCT[productType] || [];
    const allIds = [...new Set([...commonIds, ...productIds])];

    return allIds.map(id => ({
        id,
        name: getDocumentTypeName(id, productType),
    }));
};

export const isDocumentRequired = (documentTypeId: number, productType: string): boolean => {
    const commonIds = REQUIRED_DOCUMENTS_BY_PRODUCT.common || [];
    const productIds = REQUIRED_DOCUMENTS_BY_PRODUCT[productType] || [];
    return commonIds.includes(documentTypeId) || productIds.includes(documentTypeId);
};
