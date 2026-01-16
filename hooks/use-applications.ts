/**
 * API Hooks for Applications
 * 
 * Custom hooks for fetching and managing applications data.
 */
"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import api, { type ApiError } from '@/lib/api';

// Types matching backend (updated for numeric IDs per Appendix B)
export interface ApplicationDocument {
    id: number;
    name: string;
    file_url: string;
    document_type_id: number;    // NEW: Numeric ID from Appendix B
    product_type?: string;        // NEW: Product context
    type_display: string;
    status: string;
    status_display: string;
    created_at?: string;
}


// Nested company data for Partner/Bank view
export interface CompanyDataForPartner {
    id: number;
    inn: string;
    kpp: string;
    ogrn: string;
    name: string;
    short_name: string;
    legal_address: string;
    actual_address: string;
    director_name: string;
    director_position: string;
    // Passport fields
    passport_series: string | null;
    passport_number: string | null;
    passport_issued_by: string | null;
    passport_date: string | null;
    passport_code: string | null;
    // JSON data
    founders_data: Array<{ name: string; inn?: string; share?: number }>;
    bank_accounts_data: Array<{ account: string; bic: string; bank_name: string }>;
    // Bank details
    bank_name: string;
    bank_bic: string;
    bank_account: string;
    bank_corr_account: string;
    // Contact
    contact_person: string;
    contact_phone: string;
    contact_email: string;
}

export interface Application {
    id: number;
    created_by: number;
    created_by_email: string;
    created_by_name?: string;
    company: number;
    company_name: string;
    company_inn: string;
    company_data?: CompanyDataForPartner; // Full company info for Partner/Bank
    product_type: 'bank_guarantee' | 'tender_loan' | 'factoring' | 'leasing' | 'ved' | 'contract_loan' | 'corporate_credit' | 'insurance' | 'rko' | 'special_account' | 'tender_support';
    product_type_display: string;
    amount: string;
    term_months: number;
    target_bank_name: string; // For Admin routing
    // Bank Guarantee specific fields
    guarantee_type?: string;
    tender_law?: string;
    // Credit specific fields
    credit_sub_type?: string;
    financing_term_days?: number;
    pledge_description?: string;
    // Insurance specific fields
    insurance_category?: string;
    insurance_product_type?: string;
    // Factoring specific fields
    factoring_type?: string;
    contractor_inn?: string;
    // VED specific fields
    ved_currency?: string;
    ved_country?: string;
    // Tender support specific fields
    tender_support_type?: string;
    purchase_category?: string;
    industry?: string;
    // RKO/SpecAccount specific
    account_type?: string;
    // Tender info
    tender_number: string;
    tender_platform: string;
    tender_deadline: string | null;
    // Structured JSON data for product-specific fields
    goscontract_data?: {
        // BG / Contract Loan fields
        purchase_number?: string;
        lot_number?: string;  // № лота
        subject?: string;
        law?: string; // 44-ФЗ, 223-ФЗ, etc.
        contract_number?: string;
        is_close_auction?: boolean;
        beneficiary_inn?: string;
        beneficiary_name?: string;  // Наименование заказчика
        initial_price?: string;
        offered_price?: string;
        // BG Checkboxes per ТЗ
        has_advance?: boolean;        // Наличие аванса (legacy)
        has_prepayment?: boolean;     // Наличие авансирования
        advance_percent?: number;     // Процент аванса
        is_resecuring?: boolean;      // Является переобеспечением
        is_single_supplier?: boolean; // Единственный поставщик
        no_eis_placement?: boolean;   // Без размещения в ЕИС
        tender_not_held?: boolean;    // Торги ещё не проведены
        needs_credit?: boolean;       // Клиенту нужен кредит (кросс-продажа)
        has_customer_template?: boolean; // Шаблон заказчика
        executed_contracts_count?: number; // Количество исполненных контрактов (legacy)
        contracts_44fz_count?: number;  // Количество исполненных контрактов 44-ФЗ
        contracts_223fz_count?: number; // Количество исполненных контрактов 223-ФЗ
        // BG Date fields
        guarantee_start_date?: string; // Срок БГ с
        guarantee_end_date?: string;   // Срок БГ по
        bg_type?: string;              // Тип БГ (для калькулятора)
        // КИК specific fields
        contract_loan_type?: string;   // Тип продукта (credit_execution / loan)
        contract_price?: string;       // Цена контракта
        contract_start_date?: string;  // Срок контракта с
        contract_end_date?: string;    // Срок контракта по
        credit_amount?: string;        // Сумма кредита
        credit_start_date?: string;    // Срок кредита с
        credit_end_date?: string;      // Срок кредита по
        contract_execution_percent?: number; // Процент выполнения контракта
        ignore_execution_percent?: boolean;  // Не учитывать процент выполнения
        // Factoring fields
        contractor_inn?: string;
        factoring_type?: string;         // Тип факторинга (классический/закрытый/закупочный)
        customer_inn?: string;           // ИНН заказчика
        contract_type?: string;          // Тип контракта (gov/other)
        nmc?: string;                    // НМЦ
        shipment_volume?: string;        // Объём отгрузки
        payment_delay?: number;          // Отсрочка платежа (дни)
        financing_amount?: string;       // Сумма финансирования
        financing_date?: string;         // Дата финансирования
        // VED fields
        currency?: string;
        country?: string;
        // Leasing fields
        equipment_type?: string;
        leasing_credit_type?: string;    // Тип предмета лизинга
        leasing_amount?: string;         // Сумма лизинга
        leasing_end_date?: string;       // Дата окончания
        // Insurance fields
        insurance_category?: string;     // Категория страхования
        insurance_product?: string;      // Страховой продукт
        insurance_amount?: string;       // Страховая сумма
        insurance_term_months?: number;  // Срок договора (мес.)
        // Credit/Express fields
        credit_type?: string;            // Тип кредита (Express)
    };
    status: 'draft' | 'pending' | 'in_review' | 'info_requested' | 'approved' | 'rejected' | 'won' | 'lost';
    status_display: string;
    status_id: number | null;     // NEW: Numeric status ID from Appendix A
    status_id_display?: string;   // NEW: Status name from bank reference table
    assigned_partner: number | null;
    partner_email: string | null;
    document_ids: number[];
    documents?: ApplicationDocument[];
    has_signature: boolean;
    notes: string;
    decisions_count: number;
    // Bank integration fields (Phase 7)
    external_id: string | null;
    bank_status: string;
    signing_url: string | null;  // URL from bank's get_ticket_token
    commission_data: {           // Commission breakdown from add_ticket response
        total?: number;
        bank?: number;
        agent?: number;
        default?: number;
    } | null;
    // Link to calculation session (root application)
    calculation_session: number | null;
    created_at: string;
    updated_at: string;
    submitted_at: string | null;
}

// CalculationSession - stores calculation results for "Результат отбора" page
export interface CalculationSession {
    id: number;
    created_by: number;
    created_by_email: string;
    company: number;
    company_name: string;
    product_type: string;
    product_type_display: string;
    form_data: Record<string, unknown>;
    approved_banks: Array<{
        name: string;
        bgRate: number;
        creditRate: number;
        speed: string;
        individual?: boolean;
    }>;
    rejected_banks: Array<{
        bank: string;
        reason: string;
    }>;
    submitted_banks: string[];
    title: string;
    remaining_banks_count: number;
    applications_count: number;
    created_at: string;
    updated_at: string;
}


export interface ApplicationListItem {
    id: number;
    company_name: string;
    company_inn?: string;
    product_type: string;
    product_type_display: string;
    amount: string;
    term_months: number;
    target_bank_name: string;
    status: string;
    status_display: string;
    // Tender info
    tender_number?: string;
    tender_law?: string;
    tender_platform?: string;
    // Goscontract data for law info
    goscontract_data?: {
        law?: string;
        purchase_number?: string;
        beneficiary_name?: string;
    };
    // Creator info for partner agent stats
    created_by_email?: string;
    created_by_name?: string;
    // Bank integration fields (Phase 7)
    external_id: string | null;
    bank_status: string;
    created_at: string;
}

export interface CreateApplicationPayload {
    company: number;
    product_type: string;
    amount: string;
    term_months: number;
    target_bank_name?: string; // For Admin routing
    tender_number?: string;
    tender_platform?: string;
    tender_deadline?: string;
    notes?: string;
    document_ids?: number[];
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// Hook for listing applications
export function useApplications(statusFilter?: string) {
    const [applications, setApplications] = useState<ApplicationListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchApplications = useCallback(async (params?: Record<string, string>) => {
        setIsLoading(true);
        setError(null);

        try {
            const queryParams = { ...params };
            if (statusFilter) {
                queryParams.status = statusFilter;
            }
            const response = await api.get<PaginatedResponse<ApplicationListItem>>('/applications/', queryParams);
            setApplications(response.results);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка загрузки заявок');
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    return {
        applications,
        isLoading,
        error,
        refetch: fetchApplications,
    };
}

// Client dashboard stats interface
export interface ClientStats {
    active_applications_count: number;
    won_applications_count: number;
    documents_count: number;
    accreditation_status: 'active' | 'not_accredited' | 'pending';
}

// Hook for client dashboard stats
export function useClientStats() {
    const [stats, setStats] = useState<ClientStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.get<ClientStats>('/applications/stats/client/');
            setStats(response);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка загрузки статистики');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return {
        stats,
        isLoading,
        error,
        refetch: fetchStats,
    };
}

// Hook for won applications (victories)
export function useWonApplications() {
    const [victories, setVictories] = useState<ApplicationListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchVictories = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Fetch both approved and won applications
            const response = await api.get<PaginatedResponse<ApplicationListItem>>('/applications/');
            // Filter locally for approved or won status
            const wonApplications = response.results.filter(
                app => app.status === 'approved' || app.status === 'won'
            );
            setVictories(wonApplications);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка загрузки побед');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVictories();
    }, [fetchVictories]);

    return {
        victories,
        isLoading,
        error,
        refetch: fetchVictories,
    };
}

// Hook for single application with polling for real-time updates
export function useApplication(id: number | string | null, pollingInterval: number = 5000) {
    const [application, setApplication] = useState<Application | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Start/stop polling
    const startPolling = useCallback((callback?: () => void) => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
        }

        pollingRef.current = setInterval(() => {
            callback?.();
        }, pollingInterval);
    }, [pollingInterval]);

    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    const fetchApplication = useCallback(async (showLoading: boolean = false) => {
        if (!id) return;

        if (showLoading) {
            setIsLoading(true);
        }
        setError(null);

        try {
            const response = await api.get<Application>(`/applications/${id}/`);
            setApplication(response);
        } catch (err) {
            const apiError = err as ApiError;
            // If 404 (not found), it likely means it was deleted. Stop polling and don't show error.
            if (apiError.status === 404) {
                stopPolling();
                return;
            }
            setError(apiError.message || 'Ошибка загрузки заявки');
        } finally {
            setIsLoading(false);
        }
    }, [id, stopPolling]);

    // Initialize on mount and when id changes
    useEffect(() => {
        if (id) {
            fetchApplication(true); // Initial load with loading state
            // Start polling with the fetch callback
            startPolling(() => fetchApplication(false));
        }

        return () => {
            stopPolling();
        };
    }, [id, fetchApplication, startPolling, stopPolling]);

    // Manual refetch
    const refetch = useCallback(() => {
        fetchApplication(true);
    }, [fetchApplication]);

    return {
        application,
        isLoading,
        error,
        refetch,
        startPolling,
        stopPolling,
    };
}

// Hook for creating/updating applications
export function useApplicationMutations() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createApplication = useCallback(async (payload: CreateApplicationPayload): Promise<Application | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post<Application>('/applications/', payload);
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка создания заявки');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateApplication = useCallback(async (id: number, payload: Partial<CreateApplicationPayload>): Promise<Application | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.patch<Application>(`/applications/${id}/`, payload);
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка обновления заявки');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const submitApplication = useCallback(async (id: number): Promise<Application | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post<Application>(`/applications/${id}/submit/`);
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка отправки заявки');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const deleteApplication = useCallback(async (id: number): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            await api.delete(`/applications/${id}/`);
            return true;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка удаления заявки');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        createApplication,
        updateApplication,
        submitApplication,
        deleteApplication,
        clearError: () => setError(null),
    };
}

// Hook for partner actions
export function usePartnerActions() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const assignPartner = useCallback(async (applicationId: number, partnerId: number): Promise<Application | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post<Application>(`/applications/${applicationId}/assign/`, {
                partner_id: partnerId,
            });
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка назначения партнёра');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const submitDecision = useCallback(async (
        applicationId: number,
        payload: {
            decision: 'approved' | 'rejected' | 'info_requested';
            comment?: string;
            offered_rate?: number;
            offered_amount?: number;
        }
    ): Promise<Application | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post<Application>(`/applications/${applicationId}/decision/`, {
                decision: payload.decision,
                comment: payload.comment || '',
                offered_rate: payload.offered_rate,
                offered_amount: payload.offered_amount,
            });
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка отправки решения');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const requestInfo = useCallback(async (applicationId: number): Promise<Application | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post<Application>(`/applications/${applicationId}/request_info/`);
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка запроса информации');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const approveApplication = useCallback(async (applicationId: number): Promise<Application | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post<Application>(`/applications/${applicationId}/approve/`);
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка одобрения заявки');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const rejectApplication = useCallback(async (applicationId: number): Promise<Application | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post<Application>(`/applications/${applicationId}/reject/`);
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка отклонения заявки');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveNotes = useCallback(async (applicationId: number, notes: string): Promise<Application | null> => {
        setIsLoading(true);
        setError(null);

        try {
            // Use dedicated save_notes endpoint to bypass draft-only restriction
            const response = await api.patch<Application>(`/applications/${applicationId}/save_notes/`, { notes });
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка сохранения заметок');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const restoreApplication = useCallback(async (applicationId: number): Promise<Application | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post<Application>(`/applications/${applicationId}/restore/`);
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка восстановления заявки');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        assignPartner,
        submitDecision,
        requestInfo,
        approveApplication,
        rejectApplication,
        restoreApplication,
        saveNotes,
        clearError: () => setError(null),
    };
}

// Hook for fetching a single CalculationSession
export function useCalculationSession(id: number | string | null) {
    const [session, setSession] = useState<CalculationSession | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSession = useCallback(async () => {
        if (!id) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await api.get<CalculationSession>(`/applications/calculation-sessions/${id}/`);
            setSession(response);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка загрузки сессии калькуляции');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchSession();
        }
    }, [id, fetchSession]);

    return {
        session,
        isLoading,
        error,
        refetch: fetchSession,
    };
}

// Hook for CalculationSession mutations
export function useCalculationSessionMutations() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createSession = useCallback(async (payload: {
        company: number;
        product_type: string;
        form_data: Record<string, unknown>;
        approved_banks: Array<{ name: string; bgRate: number; creditRate: number; speed: string; individual?: boolean }>;
        rejected_banks: Array<{ bank: string; reason: string }>;
        title: string;
    }): Promise<CalculationSession | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post<CalculationSession>('/applications/calculation-sessions/', payload);
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка создания сессии калькуляции');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateSubmittedBanks = useCallback(async (sessionId: number, bankNames: string[]): Promise<CalculationSession | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post<CalculationSession>(
                `/applications/calculation-sessions/${sessionId}/update_submitted/`,
                { bank_names: bankNames }
            );
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка обновления сессии');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        createSession,
        updateSubmittedBanks,
        clearError: () => setError(null),
    };
}
