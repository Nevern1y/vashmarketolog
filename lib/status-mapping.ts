/**
 * Status Mapping: Backend (Django) → Frontend (Visual TOR)
 * 
 * THE LAW (Phase 1):
 * - Backend is TRUTH: Uses text statuses (draft, pending, in_review...)
 * - Frontend is ADAPTER: Maps to visual steps from PDF
 * 
 * This file is the SINGLE SOURCE of mapping between Django and TOR visuals.
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
    color: string;         // Tailwind color class
    bgColor: string;       // Background color class
    isNegative: boolean;   // Is this a rejection/loss state?
}

/**
 * Maps Django status to visual configuration
 * Reference: PDF "Приложение А. Статусная модель"
 */
export const STATUS_CONFIG: Record<DjangoApplicationStatus, StatusConfig> = {
    // Step 1: Draft / Анкета
    draft: {
        step: 0,
        label: 'Черновик',
        stepLabel: 'Анкета',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        isNegative: false,
    },

    // Step 2: Review / Прескоринг + Проверка документов
    pending: {
        step: 1,
        label: 'На рассмотрении',
        stepLabel: 'Прескоринг',
        color: 'text-cyan-700',
        bgColor: 'bg-cyan-100',
        isNegative: false,
    },
    in_review: {
        step: 1,
        label: 'В работе',
        stepLabel: 'Проверка документов',
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
        isNegative: false,
    },
    info_requested: {
        step: 1,
        label: 'Дозаполнение',
        stepLabel: 'Запрос информации',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-100',
        isNegative: false,
    },

    // Step 3: Decision / Решение
    approved: {
        step: 2,
        label: 'Одобрено',
        stepLabel: 'Одобрено',
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        isNegative: false,
    },
    rejected: {
        step: 2,
        label: 'Отклонено',
        stepLabel: 'Отклонено',
        color: 'text-red-700',
        bgColor: 'bg-red-100',
        isNegative: true,
    },

    // Step 4: Done / Выпущена
    won: {
        step: 3,
        label: 'Выигран',
        stepLabel: 'Выпущена',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-100',
        isNegative: false,
    },
    lost: {
        step: 3,
        label: 'Проигран',
        stepLabel: 'Проигран',
        color: 'text-orange-700',
        bgColor: 'bg-orange-100',
        isNegative: true,
    },
};

// Stepper labels (fixed 4 steps)
export const STEPPER_LABELS = [
    'Черновик',      // Step 0
    'На проверке',   // Step 1
    'Решение',       // Step 2
    'Выпущена',      // Step 3
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
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
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
// DOCUMENT STATUS MAPPING
// Reference: Django DocumentStatus model
// ============================================

export type DjangoDocumentStatus = 'pending' | 'verified' | 'rejected';

export interface DocStatusConfig {
    label: string;
    color: string;
    bgColor: string;
    iconType: 'clock' | 'check' | 'x';
}

export const DOC_STATUS_CONFIG: Record<DjangoDocumentStatus, DocStatusConfig> = {
    pending: {
        label: 'На проверке',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        iconType: 'clock',
    },
    verified: {
        label: 'Принят',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        iconType: 'check',
    },
    rejected: {
        label: 'Отклонён',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        iconType: 'x',
    },
};

/**
 * Get document status configuration
 */
export function getDocStatusConfig(status: string): DocStatusConfig {
    const config = DOC_STATUS_CONFIG[status as DjangoDocumentStatus];
    if (config) return config;

    // Fallback
    return {
        label: status,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        iconType: 'clock',
    };
}
