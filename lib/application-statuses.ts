/**
 * Application Statuses per Appendix A (Приложение А)
 * 
 * CRITICAL: Status IDs are PRODUCT-SPECIFIC!
 * The same status (e.g., "Анкета") has different IDs:
 * - ID 101 for Bank Guarantee (БГ)
 * - ID 2101 for Contract Loan (КИК)
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ApplicationStatusOption {
    id: number;              // Numeric ID from Appendix A
    productType: string;     // bank_guarantee | contract_loan
    name: string;            // Status name in Russian
    internalStatus: string;  // Mapping to internal status (draft, pending, approved, etc.)
    order: number;           // Order in the funnel
    isTerminal: boolean;     // Is this a final status?
}

// ============================================================================
// А.1 БАНКОВСКИЕ ГАРАНТИИ - Status Model
// ============================================================================

export const BG_STATUSES: ApplicationStatusOption[] = [
    // Initial stages
    { id: 101, productType: 'bank_guarantee', name: 'Анкета', internalStatus: 'draft', order: 1, isTerminal: false },
    { id: 102, productType: 'bank_guarantee', name: 'Предзаявка', internalStatus: 'draft', order: 2, isTerminal: false },
    { id: 110, productType: 'bank_guarantee', name: 'Прескоринг', internalStatus: 'pending', order: 3, isTerminal: false },
    { id: 120, productType: 'bank_guarantee', name: 'Дозаполнение заявки', internalStatus: 'info_requested', order: 4, isTerminal: false },
    { id: 210, productType: 'bank_guarantee', name: 'Проверка документов', internalStatus: 'in_review', order: 5, isTerminal: false },

    // Review stages (multiple IDs for different scenarios)
    { id: 140, productType: 'bank_guarantee', name: 'Проверка (этап 1)', internalStatus: 'in_review', order: 6, isTerminal: false },
    { id: 310, productType: 'bank_guarantee', name: 'Проверка (этап 1) - вариант', internalStatus: 'in_review', order: 6, isTerminal: false },
    { id: 150, productType: 'bank_guarantee', name: 'Проверка (этап 2)', internalStatus: 'in_review', order: 7, isTerminal: false },
    { id: 160, productType: 'bank_guarantee', name: 'Проверка (этап 2) - вариант 2', internalStatus: 'in_review', order: 7, isTerminal: false },
    { id: 170, productType: 'bank_guarantee', name: 'Проверка (этап 2) - вариант 3', internalStatus: 'in_review', order: 7, isTerminal: false },
    { id: 610, productType: 'bank_guarantee', name: 'Проверка (этап 2) - вариант 4', internalStatus: 'in_review', order: 7, isTerminal: false },
    { id: 630, productType: 'bank_guarantee', name: 'Проверка (этап 2) - вариант 5', internalStatus: 'in_review', order: 7, isTerminal: false },
    { id: 650, productType: 'bank_guarantee', name: 'Проверка (этап 2) - вариант 6', internalStatus: 'in_review', order: 7, isTerminal: false },
    { id: 690, productType: 'bank_guarantee', name: 'Проверка (этап 2) - вариант 7', internalStatus: 'in_review', order: 7, isTerminal: false },

    // Decision stages
    { id: 640, productType: 'bank_guarantee', name: 'Одобрено с замечаниями', internalStatus: 'approved', order: 8, isTerminal: false },
    { id: 707, productType: 'bank_guarantee', name: 'Решение принято', internalStatus: 'approved', order: 9, isTerminal: false },
    { id: 708, productType: 'bank_guarantee', name: 'Решение принято (вариант)', internalStatus: 'approved', order: 9, isTerminal: false },
    { id: 710, productType: 'bank_guarantee', name: 'Одобрено, ожидается согласование БГ', internalStatus: 'approved', order: 10, isTerminal: false },

    // EDS/Signing stages
    { id: 715, productType: 'bank_guarantee', name: 'Ожидается формирование ЭЦП', internalStatus: 'approved', order: 11, isTerminal: false },
    { id: 720, productType: 'bank_guarantee', name: 'Одобрено, ожидаются документы ЭЦП', internalStatus: 'approved', order: 12, isTerminal: false },
    { id: 750, productType: 'bank_guarantee', name: 'Проверка ЭЦП', internalStatus: 'approved', order: 13, isTerminal: false },

    // Payment & Issuance
    { id: 810, productType: 'bank_guarantee', name: 'Ожидается оплата', internalStatus: 'approved', order: 14, isTerminal: false },
    { id: 850, productType: 'bank_guarantee', name: 'Ожидается выпуск', internalStatus: 'approved', order: 15, isTerminal: false },
    { id: 910, productType: 'bank_guarantee', name: 'Гарантия выпущена', internalStatus: 'won', order: 16, isTerminal: false },
    { id: 1010, productType: 'bank_guarantee', name: 'Гарантия в реестре', internalStatus: 'won', order: 17, isTerminal: false },
    { id: 1090, productType: 'bank_guarantee', name: 'Гарантия закрыта', internalStatus: 'won', order: 18, isTerminal: true },

    // Rejection flow
    { id: 520, productType: 'bank_guarantee', name: 'Не актуальна', internalStatus: 'rejected', order: 100, isTerminal: true },
    { id: 530, productType: 'bank_guarantee', name: 'Отклонена', internalStatus: 'rejected', order: 101, isTerminal: false },
    { id: 533, productType: 'bank_guarantee', name: 'Формирование заявления на отказ', internalStatus: 'rejected', order: 102, isTerminal: false },
    { id: 534, productType: 'bank_guarantee', name: 'Подтверждение отказа клиента', internalStatus: 'rejected', order: 103, isTerminal: false },
    { id: 535, productType: 'bank_guarantee', name: 'Отказ клиента', internalStatus: 'lost', order: 104, isTerminal: true },
];

// ============================================================================
// А.2 КРЕДИТЫ НА ИСПОЛНЕНИЕ КОНТРАКТОВ - Status Model
// ============================================================================

export const KIK_STATUSES: ApplicationStatusOption[] = [
    // Initial stages
    { id: 2101, productType: 'contract_loan', name: 'Анкета', internalStatus: 'draft', order: 1, isTerminal: false },
    { id: 2102, productType: 'contract_loan', name: 'Предзаявка', internalStatus: 'draft', order: 2, isTerminal: false },
    { id: 2110, productType: 'contract_loan', name: 'Прескоринг', internalStatus: 'pending', order: 3, isTerminal: false },
    { id: 2120, productType: 'contract_loan', name: 'Дозаполнение заявки', internalStatus: 'info_requested', order: 4, isTerminal: false },
    { id: 2210, productType: 'contract_loan', name: 'Проверка документов', internalStatus: 'in_review', order: 5, isTerminal: false },

    // Review stages
    { id: 2140, productType: 'contract_loan', name: 'Проверка (этап 1)', internalStatus: 'in_review', order: 6, isTerminal: false },
    { id: 2310, productType: 'contract_loan', name: 'Проверка (этап 1) - вариант', internalStatus: 'in_review', order: 6, isTerminal: false },
    { id: 2150, productType: 'contract_loan', name: 'Проверка (этап 2)', internalStatus: 'in_review', order: 7, isTerminal: false },
    { id: 2170, productType: 'contract_loan', name: 'Проверка (этап 2) - вариант 2', internalStatus: 'in_review', order: 7, isTerminal: false },
    { id: 2510, productType: 'contract_loan', name: 'Проверка (этап 2) - вариант 3', internalStatus: 'in_review', order: 7, isTerminal: false },
    { id: 2630, productType: 'contract_loan', name: 'Проверка (этап 2) - вариант 4', internalStatus: 'in_review', order: 7, isTerminal: false },
    { id: 2050, productType: 'contract_loan', name: 'Проверка (этап 2) - вариант 5', internalStatus: 'in_review', order: 7, isTerminal: false },

    // Decision stages
    { id: 2540, productType: 'contract_loan', name: 'Одобрено с замечаниями', internalStatus: 'approved', order: 8, isTerminal: false },
    { id: 2707, productType: 'contract_loan', name: 'Решение принято', internalStatus: 'approved', order: 9, isTerminal: false },
    { id: 2708, productType: 'contract_loan', name: 'Решение принято (вариант)', internalStatus: 'approved', order: 9, isTerminal: false },
    { id: 2712, productType: 'contract_loan', name: 'Одобрено, ожидается согласование условий', internalStatus: 'approved', order: 10, isTerminal: false },

    // EDS/Signing stages
    { id: 2715, productType: 'contract_loan', name: 'Ожидается формирование ЭЦП', internalStatus: 'approved', order: 11, isTerminal: false },
    { id: 2720, productType: 'contract_loan', name: 'Одобрено, ожидаются документы ЭЦП', internalStatus: 'approved', order: 12, isTerminal: false },
    { id: 2750, productType: 'contract_loan', name: 'Проверка ЭЦП', internalStatus: 'approved', order: 13, isTerminal: false },

    // Payment & Issuance
    { id: 2810, productType: 'contract_loan', name: 'Ожидается оплата', internalStatus: 'approved', order: 14, isTerminal: false },
    { id: 2860, productType: 'contract_loan', name: 'Выдача кредита', internalStatus: 'approved', order: 15, isTerminal: false },
    { id: 2910, productType: 'contract_loan', name: 'Кредит выдан', internalStatus: 'won', order: 16, isTerminal: false },
    { id: 2990, productType: 'contract_loan', name: 'Кредит погашен', internalStatus: 'won', order: 17, isTerminal: true },

    // Rejection flow
    { id: 2520, productType: 'contract_loan', name: 'Не актуальна', internalStatus: 'rejected', order: 100, isTerminal: true },
    { id: 2530, productType: 'contract_loan', name: 'Отклонена', internalStatus: 'rejected', order: 101, isTerminal: false },
    { id: 2533, productType: 'contract_loan', name: 'Формирование заявления на отказ', internalStatus: 'rejected', order: 102, isTerminal: false },
    { id: 2534, productType: 'contract_loan', name: 'Подтверждение отказа клиента', internalStatus: 'rejected', order: 103, isTerminal: false },
    { id: 2535, productType: 'contract_loan', name: 'Отказ клиента', internalStatus: 'lost', order: 104, isTerminal: true },
];

// ============================================================================
// GENERAL STATUSES (for other products without specific IDs)
// ============================================================================

export const GENERAL_STATUSES: ApplicationStatusOption[] = [
    { id: 1, productType: 'general', name: 'Черновик', internalStatus: 'draft', order: 1, isTerminal: false },
    { id: 2, productType: 'general', name: 'На рассмотрении', internalStatus: 'pending', order: 2, isTerminal: false },
    { id: 3, productType: 'general', name: 'В работе', internalStatus: 'in_review', order: 3, isTerminal: false },
    { id: 4, productType: 'general', name: 'Запрошена информация', internalStatus: 'info_requested', order: 4, isTerminal: false },
    { id: 5, productType: 'general', name: 'Одобрено', internalStatus: 'approved', order: 5, isTerminal: false },
    { id: 6, productType: 'general', name: 'Выигран', internalStatus: 'won', order: 6, isTerminal: true },
    { id: 7, productType: 'general', name: 'Отклонено', internalStatus: 'rejected', order: 100, isTerminal: true },
    { id: 8, productType: 'general', name: 'Проигран', internalStatus: 'lost', order: 101, isTerminal: true },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get statuses for a specific product.
 * Falls back to GENERAL_STATUSES if product not found.
 */
export function getStatusesForProduct(productType: string): ApplicationStatusOption[] {
    switch (productType) {
        case 'bank_guarantee':
            return BG_STATUSES;
        case 'contract_loan':
        case 'tender_loan':
            return KIK_STATUSES;
        default:
            return GENERAL_STATUSES;
    }
}

/**
 * Get status by ID for a specific product.
 */
export function getStatusById(statusId: number, productType: string): ApplicationStatusOption | undefined {
    const statuses = getStatusesForProduct(productType);
    return statuses.find(s => s.id === statusId);
}

/**
 * Get status name by ID.
 */
export function getStatusName(statusId: number, productType: string): string {
    const status = getStatusById(statusId, productType);
    if (status) {
        return status.name;
    }
    return `Статус (ID: ${statusId})`;
}

/**
 * Get all non-terminal statuses for a product (for status progression).
 */
export function getActiveStatuses(productType: string): ApplicationStatusOption[] {
    const statuses = getStatusesForProduct(productType);
    return statuses
        .filter(s => !s.isTerminal)
        .sort((a, b) => a.order - b.order);
}

/**
 * Get terminal statuses for a product.
 */
export function getTerminalStatuses(productType: string): ApplicationStatusOption[] {
    const statuses = getStatusesForProduct(productType);
    return statuses.filter(s => s.isTerminal);
}

/**
 * Get statuses by internal status.
 */
export function getStatusesByInternalStatus(
    productType: string,
    internalStatus: string
): ApplicationStatusOption[] {
    const statuses = getStatusesForProduct(productType);
    return statuses.filter(s => s.internalStatus === internalStatus);
}

/**
 * Map internal status to bank status ID.
 * Returns the first matching status ID.
 */
export function getDefaultStatusIdForInternal(productType: string, internalStatus: string): number | null {
    const statuses = getStatusesByInternalStatus(productType, internalStatus);
    if (statuses.length > 0) {
        // Return the one with lowest order (most common case)
        const sorted = statuses.sort((a, b) => a.order - b.order);
        return sorted[0].id;
    }
    return null;
}

/**
 * Check if a status ID represents an approved state.
 */
export function isApprovedStatus(statusId: number, productType: string): boolean {
    const status = getStatusById(statusId, productType);
    if (!status) return false;
    return ['approved', 'won'].includes(status.internalStatus);
}

/**
 * Check if a status ID represents a rejected state.
 */
export function isRejectedStatus(statusId: number, productType: string): boolean {
    const status = getStatusById(statusId, productType);
    if (!status) return false;
    return ['rejected', 'lost'].includes(status.internalStatus);
}

/**
 * Get color for status (for UI).
 */
export function getStatusColor(statusId: number, productType: string): string {
    const status = getStatusById(statusId, productType);
    if (!status) return 'gray';

    switch (status.internalStatus) {
        case 'draft':
            return 'gray';
        case 'pending':
            return 'yellow';
        case 'in_review':
            return 'blue';
        case 'info_requested':
            return 'orange';
        case 'approved':
            return 'green';
        case 'won':
            return 'emerald';
        case 'rejected':
            return 'red';
        case 'lost':
            return 'red';
        default:
            return 'gray';
    }
}

// ============================================================================
// STATUS DISPLAY MAPPING (for legacy compatibility)
// ============================================================================

export const INTERNAL_STATUS_LABELS: Record<string, string> = {
    draft: 'Черновик',
    pending: 'На рассмотрении',
    in_review: 'В работе',
    info_requested: 'Запрошена информация',
    approved: 'Одобрено',
    rejected: 'Отклонено',
    won: 'Выигран',
    lost: 'Проигран',
};

export const INTERNAL_STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-500',
    pending: 'bg-yellow-500',
    in_review: 'bg-blue-500',
    info_requested: 'bg-orange-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    won: 'bg-emerald-600',
    lost: 'bg-red-600',
};
