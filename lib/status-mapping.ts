/**
 * Status Mapping: Backend (Django) → Frontend (Visual TOR)
 * 
 * THE LAW (Phase 1):
 * - Backend is TRUTH: Uses text statuses (draft, pending, in_review...)
 * - Frontend is ADAPTER: Maps to visual steps from PDF
 * 
 * This file is the SINGLE SOURCE of mapping between Django and TOR visuals.
 * 
 * 🎨 DARK THEME UPDATE:
 * Colors updated for Cyan Cyberpunk theme with neon-style badges
 * on dark backgrounds.
 */

// Django Application Status values (from backend/apps/applications/models.py)
export type DjangoApplicationStatus =
    | 'draft'
    | 'pending'
    | 'in_review'
    | 'info_requested'
    | 'approved'
    | 'rejected'
    | 'won'
    | 'lost';

// Visual stepper step indices (0-3)
export type StepIndex = 0 | 1 | 2 | 3;

// Status configuration for UI display
export interface StatusConfig {
    step: StepIndex;
    label: string;         // TOR label (Russian)
    stepLabel: string;     // Step name for stepper
    color: string;         // Tailwind text color class
    bgColor: string;       // Background color class
    isNegative: boolean;   // Is this a rejection/loss state?
}

/**
 * Maps Django status to visual configuration
 * Reference: PDF "Приложение А. Статусная модель"
 * 
 * Customer-requested labels (2026-01):
 * - Создание заявки, Отправка на скоринг, На рассмотрении в банке, 
 * - Возвращение на доработку, Отказано, Одобрен, Выдан
 * 
 * 🎨 DARK THEME COLORS:
 * - Use bright neon text colors for visibility
 * - Use 10-20% opacity backgrounds for glow effect
 * - Colors: Cyan (#3CE8D1), Yellow (#FFD93D), Magenta (#E03E9D), Orange (#FF521D)
 */
export const STATUS_CONFIG: Record<DjangoApplicationStatus, StatusConfig> = {
    // Step 1: Draft / Создание заявки
    draft: {
        step: 0,
        label: 'Создание заявки',
        stepLabel: 'Создание',
        color: 'text-slate-400',
        bgColor: 'bg-slate-700/50',
        isNegative: false,
    },

    // Step 2: Review / Прескоринг + На рассмотрении
    pending: {
        step: 1,
        label: 'Отправка на скоринг',
        stepLabel: 'Скоринг',
        color: 'text-[#F59E0B]',
        bgColor: 'bg-[#F59E0B]/10',
        isNegative: false,
    },
    in_review: {
        step: 1,
        label: 'На рассмотрении в банке',
        stepLabel: 'На рассмотрении',
        color: 'text-[#4F7DF3]',
        bgColor: 'bg-[#4F7DF3]/10',
        isNegative: false,
    },
    info_requested: {
        step: 1,
        label: 'Возвращение на доработку',
        stepLabel: 'На доработке',
        color: 'text-[#FFD93D]',
        bgColor: 'bg-[#FFD93D]/10',
        isNegative: false,
    },

    // Step 3: Decision / Решение
    approved: {
        step: 2,
        label: 'Одобрен',
        stepLabel: 'Одобрен',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/15',
        isNegative: false,
    },
    rejected: {
        step: 2,
        label: 'Отказано',
        stepLabel: 'Отказано',
        color: 'text-[#E03E9D]',
        bgColor: 'bg-[#E03E9D]/10',
        isNegative: true,
    },

    // Step 4: Done / Выдан
    won: {
        step: 3,
        label: 'Выдан',
        stepLabel: 'Выдан',
        color: 'text-[#3CE8D1]',
        bgColor: 'bg-[#3CE8D1]/20',
        isNegative: false,
    },
    lost: {
        step: 3,
        label: 'Не выдан',
        stepLabel: 'Не выдан',
        color: 'text-[#FF521D]',
        bgColor: 'bg-[#FF521D]/10',
        isNegative: true,
    },
};

// Stepper labels (fixed 4 steps) - Customer-requested labels
export const STEPPER_LABELS = [
    'Создание',      // Step 0
    'Рассмотрение',  // Step 1
    'Решение',       // Step 2
    'Выдан',         // Step 3
] as const;

/**
 * Get status configuration for a Django status
 */
export function getStatusConfig(status: string): StatusConfig {
    const config = STATUS_CONFIG[status as DjangoApplicationStatus];
    if (config) return config;

    // Fallback for unknown statuses
    return {
        step: 0,
        label: status,
        stepLabel: status,
        color: 'text-slate-400',
        bgColor: 'bg-slate-700/50',
        isNegative: false,
    };
}

/**
 * Get visual step index (0-3) from Django status
 */
export function getStepFromStatus(status: string): StepIndex {
    return getStatusConfig(status).step;
}

/**
 * Check if status is a negative/rejection state
 */
export function isNegativeStatus(status: string): boolean {
    return getStatusConfig(status).isNegative;
}


// ============================================
// DOCUMENT TYPE MAPPING
// Reference: PDF page 57 "Типы документов"
// ============================================

// Map product_document_id (from Bank API) to readable label
// This is for Phase 2 preparation, but we define it now
export const DOCUMENT_TYPE_LABELS: Record<number, string> = {
    17: 'Заявление',
    20: 'Бухгалтерская отчетность (Ф1, Ф2)',
    21: 'Паспорт генерального директора',
    30: 'Налоговая декларация',
    75: 'Устав',
    76: 'Решение/Протокол о назначении',
    77: 'Карточка предприятия',
    78: 'Доверенность',
    80: 'Приказ о назначении директора',
    81: 'Справка из банка',
    82: 'Лицензия',
    83: 'Свидетельство СРО',
};

/**
 * Get document type label from product_document_id
 * Falls back to provided name if ID is unknown
 */
export function getDocumentTypeLabel(productDocumentId: number | undefined, fallbackName: string): string {
    if (productDocumentId && DOCUMENT_TYPE_LABELS[productDocumentId]) {
        return DOCUMENT_TYPE_LABELS[productDocumentId];
    }
    return fallbackName;
}


// ============================================
// BANK STATUS MAPPING (Приложение А PDF)
// Строго по ТЗ: ID статусов банковской системы
// ============================================

export interface BankStatusConfig {
    label: string;
    color: string;
    bgColor: string;
}

/**
 * Bank API Status IDs → Visual Config
 * СТРОГО по Приложению А PDF
 * 
 * Updated: Added all BG (101-1090) and KIK (2101-2990) statuses
 */
export const BANK_STATUS_CONFIG: Record<number, BankStatusConfig> = {
    // ========================================
    // БГ (Bank Guarantee) Statuses: 101-1090
    // ========================================
    
    // Initial stages
    101: { label: 'Анкета', color: 'text-slate-400', bgColor: 'bg-slate-700/50' },
    102: { label: 'Предзаявка', color: 'text-[#4F7DF3]', bgColor: 'bg-[#4F7DF3]/10' },
    110: { label: 'Прескоринг', color: 'text-indigo-400', bgColor: 'bg-indigo-400/10' },
    120: { label: 'Дозаполнение заявки', color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
    
    // Review stages
    140: { label: 'Проверка (этап 1)', color: 'text-[#4F7DF3]', bgColor: 'bg-[#4F7DF3]/10' },
    150: { label: 'Проверка (этап 2)', color: 'text-[#4F7DF3]', bgColor: 'bg-[#4F7DF3]/10' },
    160: { label: 'Проверка (этап 2)', color: 'text-[#4F7DF3]', bgColor: 'bg-[#4F7DF3]/10' },
    170: { label: 'Проверка (этап 2)', color: 'text-[#4F7DF3]', bgColor: 'bg-[#4F7DF3]/10' },
    210: { label: 'Проверка документов', color: 'text-[#FFD93D]', bgColor: 'bg-[#FFD93D]/10' },
    310: { label: 'Проверка (этап 1)', color: 'text-[#4F7DF3]', bgColor: 'bg-[#4F7DF3]/10' },
    
    // Rejection flow
    520: { label: 'Не актуальна', color: 'text-slate-500', bgColor: 'bg-slate-500/10' },
    530: { label: 'Отклонена', color: 'text-[#E03E9D]', bgColor: 'bg-[#E03E9D]/10' },
    533: { label: 'Формирование заявления на отказ', color: 'text-[#E03E9D]', bgColor: 'bg-[#E03E9D]/10' },
    534: { label: 'Подтверждение отказа клиента', color: 'text-[#E03E9D]', bgColor: 'bg-[#E03E9D]/10' },
    535: { label: 'Отказ клиента', color: 'text-[#E03E9D]', bgColor: 'bg-[#E03E9D]/10' },
    
    // Additional review stages
    610: { label: 'Проверка (этап 2)', color: 'text-[#4F7DF3]', bgColor: 'bg-[#4F7DF3]/10' },
    630: { label: 'Проверка (этап 2)', color: 'text-[#4F7DF3]', bgColor: 'bg-[#4F7DF3]/10' },
    640: { label: 'Одобрено с замечаниями', color: 'text-[#FFD93D]', bgColor: 'bg-[#FFD93D]/10' },
    650: { label: 'Проверка (этап 2)', color: 'text-[#4F7DF3]', bgColor: 'bg-[#4F7DF3]/10' },
    690: { label: 'Проверка (этап 2)', color: 'text-[#4F7DF3]', bgColor: 'bg-[#4F7DF3]/10' },
    
    // Decision stages
    707: { label: 'Решение принято', color: 'text-[#3CE8D1]', bgColor: 'bg-[#3CE8D1]/10' },
    708: { label: 'Решение принято', color: 'text-[#3CE8D1]', bgColor: 'bg-[#3CE8D1]/10' },
    710: { label: 'Одобрено, ожидается согласование БГ', color: 'text-[#3CE8D1]', bgColor: 'bg-[#3CE8D1]/10' },
    715: { label: 'Ожидается формирование ЭЦП', color: 'text-[#3CE8D1]', bgColor: 'bg-[#3CE8D1]/10' },
    720: { label: 'Ожидаются документы ЭЦП', color: 'text-[#3CE8D1]', bgColor: 'bg-[#3CE8D1]/10' },
    750: { label: 'Проверка ЭЦП', color: 'text-[#3CE8D1]', bgColor: 'bg-[#3CE8D1]/10' },
    
    // Payment & Issuance
    810: { label: 'Ожидается оплата', color: 'text-amber-400', bgColor: 'bg-amber-400/10' },
    850: { label: 'Ожидается выпуск', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
    910: { label: 'Гарантия выпущена', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
    1010: { label: 'Гарантия в реестре', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    1090: { label: 'Гарантия закрыта', color: 'text-emerald-600', bgColor: 'bg-emerald-600/10' },
    
    // ========================================
    // КИК (Contract Loan) Statuses: 2101-2990
    // ========================================
    
    // Initial stages
    2101: { label: 'Анкета (КИК)', color: 'text-slate-400', bgColor: 'bg-slate-700/50' },
    2102: { label: 'Предзаявка (КИК)', color: 'text-[#4F7DF3]', bgColor: 'bg-[#4F7DF3]/10' },
    2110: { label: 'Прескоринг (КИК)', color: 'text-indigo-400', bgColor: 'bg-indigo-400/10' },
    2120: { label: 'Дозаполнение заявки (КИК)', color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
    
    // Review stages
    2050: { label: 'Проверка (этап 2)', color: 'text-[#4F7DF3]', bgColor: 'bg-[#4F7DF3]/10' },
    2140: { label: 'Проверка (этап 1)', color: 'text-[#4F7DF3]', bgColor: 'bg-[#4F7DF3]/10' },
    2150: { label: 'Проверка (этап 2)', color: 'text-[#4F7DF3]', bgColor: 'bg-[#4F7DF3]/10' },
    2170: { label: 'Проверка (этап 2)', color: 'text-[#4F7DF3]', bgColor: 'bg-[#4F7DF3]/10' },
    2210: { label: 'Проверка документов (КИК)', color: 'text-[#FFD93D]', bgColor: 'bg-[#FFD93D]/10' },
    2310: { label: 'Проверка (этап 1)', color: 'text-[#4F7DF3]', bgColor: 'bg-[#4F7DF3]/10' },
    2510: { label: 'Проверка (этап 2)', color: 'text-[#4F7DF3]', bgColor: 'bg-[#4F7DF3]/10' },
    
    // Rejection flow
    2520: { label: 'Не актуальна (КИК)', color: 'text-slate-500', bgColor: 'bg-slate-500/10' },
    2530: { label: 'Отклонена (КИК)', color: 'text-[#E03E9D]', bgColor: 'bg-[#E03E9D]/10' },
    2533: { label: 'Формирование заявления на отказ', color: 'text-[#E03E9D]', bgColor: 'bg-[#E03E9D]/10' },
    2534: { label: 'Подтверждение отказа клиента', color: 'text-[#E03E9D]', bgColor: 'bg-[#E03E9D]/10' },
    2535: { label: 'Отказ клиента (КИК)', color: 'text-[#E03E9D]', bgColor: 'bg-[#E03E9D]/10' },
    2540: { label: 'Одобрено с замечаниями (КИК)', color: 'text-[#FFD93D]', bgColor: 'bg-[#FFD93D]/10' },
    2630: { label: 'Проверка (этап 2)', color: 'text-[#4F7DF3]', bgColor: 'bg-[#4F7DF3]/10' },
    
    // Decision stages
    2707: { label: 'Решение принято (КИК)', color: 'text-[#3CE8D1]', bgColor: 'bg-[#3CE8D1]/10' },
    2708: { label: 'Решение принято (КИК)', color: 'text-[#3CE8D1]', bgColor: 'bg-[#3CE8D1]/10' },
    2712: { label: 'Ожидается согласование условий', color: 'text-[#3CE8D1]', bgColor: 'bg-[#3CE8D1]/10' },
    2715: { label: 'Ожидается формирование ЭЦП (КИК)', color: 'text-[#3CE8D1]', bgColor: 'bg-[#3CE8D1]/10' },
    2720: { label: 'Ожидаются документы ЭЦП (КИК)', color: 'text-[#3CE8D1]', bgColor: 'bg-[#3CE8D1]/10' },
    2750: { label: 'Проверка ЭЦП (КИК)', color: 'text-[#3CE8D1]', bgColor: 'bg-[#3CE8D1]/10' },
    
    // Payment & Issuance
    2810: { label: 'Ожидается оплата (КИК)', color: 'text-amber-400', bgColor: 'bg-amber-400/10' },
    2860: { label: 'Выдача кредита', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
    2910: { label: 'Кредит выдан', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
    2990: { label: 'Кредит погашен', color: 'text-emerald-600', bgColor: 'bg-emerald-600/10' },
};

/**
 * Get bank status configuration by ID
 * Falls back to generic config if ID is unknown
 */
export function getBankStatusConfig(statusId: number): BankStatusConfig {
    return BANK_STATUS_CONFIG[statusId] || {
        label: `Статус ${statusId}`,
        color: 'text-slate-400',
        bgColor: 'bg-slate-700/50',
    };
}

/**
 * Parse bank status from string (handles both numeric IDs and text)
 */
export function parseBankStatus(status: string | number | null): BankStatusConfig {
    if (status === null || status === undefined || status === '') {
        return { label: '—', color: 'text-slate-400', bgColor: 'bg-slate-700/50' };
    }

    // If it's a number or numeric string, use the config
    const statusId = typeof status === 'number' ? status : parseInt(status, 10);
    if (!isNaN(statusId)) {
        return getBankStatusConfig(statusId);
    }

    // If it's a text status, return as-is with neutral styling
    return {
        label: String(status),
        color: 'text-slate-400',
        bgColor: 'bg-slate-700/50',
    };
}

