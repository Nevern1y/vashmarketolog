/**
 * API Hooks for Companies (including CRM)
 * 
 * Custom hooks for company profile and CRM client management.
 * 
 * API-Ready Architecture: Includes types for future Bank API integrations
 * (founders_data, bank_accounts_data, passport fields from Realist Bank specs).
 */
"use client"

import { useState, useEffect, useCallback } from 'react';
import api, { type ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

// =============================================================================
// Founder data structure (Phase 2 Ready - Postman API 1.1)
// Reference: client[founders][n][...] - API_1.1.postman_collection lines 1603-1697
// All fields optional for MVP - user fills when ready
// =============================================================================
export interface FounderDocument {
    series?: string;      // Серия паспорта
    number?: string;      // Номер паспорта
    issued_at?: string;   // Дата выдачи (YYYY-MM-DD)
    authority_name?: string; // Наименование подразделения
    authority_code?: string; // Код подразделения (XXX-XXX)
}

export interface FounderAddress {
    value: string;       // Адрес
    postal_code: string; // Почтовый индекс
}

export interface FounderData {
    full_name?: string;           // ФИО учредителя
    inn?: string;                 // ИНН учредителя
    share_relative?: number;      // Доля в капитале (%)
    document?: FounderDocument;   // Паспортные данные
    birth_place?: string;         // Место рождения
    birth_date?: string;          // Дата рождения (YYYY-MM-DD)
    gender?: 1 | 2;               // 1 = муж, 2 = жен
    citizen?: string;             // Гражданство
    legal_address?: FounderAddress;  // Адрес регистрации
    actual_address?: FounderAddress; // Фактический адрес
    is_resident?: boolean;       // Резидент РФ
}

// =============================================================================
// Bank account data structure (Phase 2 Ready - Postman API 1.1)
// Reference: client[checking_accounts][n][...] - lines 1699-1708
// All fields optional for MVP - user fills when ready
// =============================================================================
export interface BankAccountData {
    bank_name?: string;   // Наименование банка
    bank_bik?: string;    // БИК банка
    account?: string;     // Расчётный счёт
}

// =============================================================================
// ETP Account data structure
// =============================================================================
export interface EtpAccountData {
    platform?: string;      // Площадка (ЕЭТП, РТС и т.д.)
    account?: string;       // Расчётный счёт
    bik?: string;           // БИК
    bank_name?: string;     // Наименование банка
    corr_account?: string;  // Корр. счёт
}

// =============================================================================
// Contact Person data structure
// =============================================================================
export interface ContactPersonData {
    position?: string;      // Должность
    last_name?: string;     // Фамилия
    first_name?: string;    // Имя
    middle_name?: string;   // Отчество
    email?: string;         // Email
    phone?: string;         // Телефон
}

// =============================================================================
// Legal Founder data structure
// =============================================================================
export interface LegalFounderData {
    share_relative?: number;
    inn?: string;
    ogrn?: string;
    name?: string;
    registration_date?: string;
    first_registration_date?: string;
    is_resident?: boolean;
    bank_name?: string;
    website?: string;
    email?: string;
    phone?: string;
    director_position?: string;
    director_name?: string;
}

// =============================================================================
// Leadership/Management data structure
// =============================================================================
export interface LeaderData {
    position?: string;
    full_name?: string;
    share_percent?: number;
    citizenship?: string;
    birth_date?: string;
    birth_place?: string;
    email?: string;
    phone?: string;
    registration_address?: string;
    passport?: {
        series?: string;
        number?: string;
        issued_date?: string;
        issued_by?: string;
        department_code?: string;
    };
}

// =============================================================================
// Activity data structure (Деятельность и лицензии)
// =============================================================================
export interface ActivityData {
    // New format fields (edit-client-sheet)
    okved_code?: string;           // Код ОКВЭД
    okved_name?: string;           // Наименование ОКВЭД
    is_primary?: boolean;          // Основной вид деятельности
    // Old format fields (my-company-view - for backward compatibility)
    primary_okved?: string;        // Основной ОКВЭД
    additional_okved?: string;     // Дополнительный ОКВЭД
    revenue_share?: number;        // Доля выручки %
    activity_years?: number;       // Лет ведения деятельности
    license_number?: string;       // Номер лицензии
    license_date?: string;         // Дата выдачи лицензии
    license_issuer?: string;       // Кем выдана лицензия
    license_valid_until?: string;  // Срок действия лицензии
}

// License data structure
export interface LicenseData {
    license_type: string;         // Тип лицензии
    license_number?: string;      // Номер лицензии
    issue_date?: string;          // Дата выдачи
    expiry_date?: string;         // Дата окончания
    issuing_authority?: string;   // Орган выдачи
}

export interface Company {
    id: number;
    owner: number;
    owner_email: string;
    is_crm_client: boolean;
    inn: string;
    kpp: string;
    ogrn: string;
    name: string;
    short_name: string;
    // Phase 1: New company info fields
    foreign_name?: string;                // Name in foreign language
    legal_form?: string;                  // Organizational form (ООО, АО, etc.)
    is_resident?: boolean;                // Russian resident
    legal_address: string;
    legal_address_postal_code?: string;  // Postal code for legal address
    actual_address: string;
    actual_address_postal_code?: string;  // Postal code for actual address
    post_address?: string;               // Mailing address
    post_address_postal_code?: string;   // Postal code for mailing address
    region: string;
    // Company details
    employee_count?: number;             // Number of employees
    contracts_count?: number;            // Contract counts
    contracts_44fz_count?: number;       // 44-FZ contracts
    contracts_223fz_count?: number;      // 223-FZ contracts
    // Official contacts
    company_website?: string;            // Company website
    company_email?: string;              // Company email
    office_phone?: string;               // Office phone
    // State Registration (Section 2)
    okato?: string;
    oktmo?: string;
    oktmo_date?: string;
    okpo?: string;
    okfs?: string;
    okogu?: string;                      // ОКОГУ
    registration_date?: string;
    registration_authority?: string;  // registrar_name -> registration_authority
    authorized_capital_declared?: string;  // stated_capital -> authorized_capital_declared
    authorized_capital_paid?: string;  // paid_capital -> authorized_capital_paid
    authorized_capital_paid_date?: string;  // paid_capital_date -> authorized_capital_paid_date
    okved?: string;
    // Director / Management
    director_name: string;
    director_position: string;
    director_birth_date?: string;
    director_birth_place?: string;
    director_email?: string;
    director_phone?: string;
    director_registration_address?: string;
    // Passport fields (API-Ready for Realist Bank)
    passport_series: string | null;
    passport_number: string | null;
    passport_issued_by: string | null;
    passport_date: string | null;
    passport_code: string | null;
    // Signatory fields (MCHD)
    signatory_basis?: 'charter' | 'power_of_attorney'; // Basis for signing
    // MCHD (Machine-Readable Power of Attorney) fields
    is_mchd?: boolean;                   // Whether using MCHD
    mchd_number?: string;                // MCHD registration number
    mchd_issue_date?: string;            // MCHD issue date
    mchd_expiry_date?: string;           // MCHD expiry date
    mchd_principal_inn?: string;         // Principal's INN
    mchd_file?: string;                  // MCHD file URL
    mchd_full_name?: string;             // MCHD representative full name
    mchd_inn?: string;                   // MCHD representative INN
    mchd_date?: string;                  // MCHD date (alias for issue_date)
    // JSONField data (API-Ready for future integrations)
    founders_data: FounderData[];
    legal_founders_data: LegalFounderData[];
    leadership_data: LeaderData[];
    bank_accounts_data: BankAccountData[];
    etp_accounts_data: EtpAccountData[];
    contact_persons_data: ContactPersonData[];
    activities_data: ActivityData[];
    licenses_data?: LicenseData[];       // Licenses data
    // Primary bank details
    bank_name: string;
    bank_bic: string;
    bank_account: string;
    bank_corr_account: string;
    // Contact info
    contact_person: string;
    contact_phone: string;
    contact_email: string;
    website: string;
    // Timestamps
    created_at: string;
    updated_at: string;
    // Client status for CRM (per PDF agent_add_client spec)
    client_status: 'pending' | 'confirmed' | null;  // pending = "На рассмотрении", confirmed = "Закреплен"
}

export interface CompanyListItem {
    id: number;
    inn: string;
    kpp?: string;                 // КПП for info panel
    ogrn?: string;                // ОГРН per ТЗ
    name: string;
    short_name: string;
    region: string;
    contact_person: string;
    email?: string;              // Contact email for table display
    phone?: string;              // Contact phone for table display  
    applications_count?: number; // Active applications count
    is_crm_client: boolean;
    created_at: string;
    // Client status for CRM (per PDF agent_add_client spec)
    client_status: 'pending' | 'confirmed' | null;  // pending = "На рассмотрении", confirmed = "Закреплен"
    owner?: number;  // If owner exists, client has registered
}

export interface CreateCompanyPayload {
    inn: string;
    name: string;
    kpp?: string;
    ogrn?: string;
    short_name?: string;
    legal_address?: string;
    actual_address?: string;
    region?: string;
    // State Registration (Section 2)
    okato?: string;
    oktmo?: string;
    oktmo_date?: string;
    okpo?: string;
    okfs?: string;
    registration_date?: string;
    registration_authority?: string;
    authorized_capital_declared?: string;
    authorized_capital_paid?: string;
    authorized_capital_paid_date?: string;
    okved?: string;
    // Director / Management
    director_name?: string;
    director_position?: string;
    director_birth_date?: string;
    director_birth_place?: string;
    director_email?: string;
    director_phone?: string;
    director_registration_address?: string;
    // Passport fields
    passport_series?: string;
    passport_number?: string;
    passport_issued_by?: string;
    passport_date?: string;
    passport_code?: string;
    // JSONField data
    founders_data?: FounderData[];
    legal_founders_data?: LegalFounderData[];
    leadership_data?: LeaderData[];
    bank_accounts_data?: BankAccountData[];
    etp_accounts_data?: EtpAccountData[];
    contact_persons_data?: ContactPersonData[];
    activities_data?: ActivityData[];
    // Bank details
    bank_name?: string;
    bank_bic?: string;
    bank_account?: string;
    bank_corr_account?: string;
    // Contact info
    contact_person?: string;
    contact_phone?: string;
    contact_email?: string;
    website?: string;
    email?: string;  // Added for accreditation form
    acts_on_basis?: string;  // "Устава" / "Доверенности"
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// Hook for current user's company
export function useMyCompany() {
    const { logout, user } = useAuth();
    const [company, setCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCompany = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.get<Company>('/companies/me/');
            setCompany(response);
        } catch (err) {
            const apiError = err as ApiError;
            // 404 is expected when company doesn't exist yet
            if (apiError.status === 404) {
                setCompany(null);
            } else {
                setError(apiError.message || 'Ошибка загрузки профиля компании');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchCompanyWithRoleCheck = useCallback(async () => {
        if (!user || (user.role !== 'client' && user.role !== 'agent')) {
            setCompany(null);
            setIsLoading(false);
            return;
        }
        fetchCompany();
    }, [user, fetchCompany]);

    const updateCompany = useCallback(async (data: Partial<CreateCompanyPayload>): Promise<Company | null> => {
        setIsSaving(true);
        setError(null);

        try {
            console.log("[DEBUG] updateCompany payload:", data);
            const response = await api.patch<Company>('/companies/me/', data);
            console.log("[DEBUG] updateCompany success:", response);
            setCompany(response);
            return response;
        } catch (err) {
            console.error("[DEBUG] updateCompany error:", err);
            const apiError = err as ApiError;

            // Handle 401 Unauthorized - logout user
            if (apiError.status === 401) {
                logout();
                return null;
            }

            // Extract detailed error message
            let errorMessage = 'Ошибка обновления профиля компании';

            if (apiError.message && apiError.message !== 'An error occurred') {
                errorMessage = apiError.message;
            }

            // Check for field-specific validation errors
            if (apiError.errors && typeof apiError.errors === 'object') {
                const fieldErrors = Object.entries(apiError.errors)
                    .filter(([key]) => key !== 'detail' && key !== 'error' && key !== 'message' && key !== 'status')
                    .map(([field, messages]) => {
                        const fieldName = field.replace(/_/g, ' ');
                        const msg = Array.isArray(messages) ? messages.join(', ') : String(messages);
                        return `${fieldName}: ${msg}`;
                    })
                    .join('; ');

                if (fieldErrors) {
                    errorMessage = fieldErrors;
                }
            }

            console.error("[DEBUG] Parsed error message:", errorMessage);
            setError(errorMessage);
            return null;
        } finally {
            setIsSaving(false);
        }
    }, []);


    // Note: Backend uses get_or_create, so we always use PATCH (not POST)
    // The /companies/me/ endpoint auto-creates company on first access
    const createCompany = useCallback(async (data: CreateCompanyPayload): Promise<Company | null> => {
        setIsSaving(true);
        setError(null);

        try {
            console.log("[DEBUG] createCompany (using PATCH) payload:", data);
            // Use PATCH instead of POST - backend auto-creates via get_or_create
            const response = await api.patch<Company>('/companies/me/', data);
            console.log("[DEBUG] createCompany success:", response);
            setCompany(response);
            return response;
        } catch (err) {
            console.error("[DEBUG] createCompany error:", err);
            const apiError = err as ApiError;

            // Handle 401 Unauthorized - logout user
            if (apiError.status === 401) {
                logout();
                return null;
            }

            // Extract detailed error message
            let errorMessage = 'Ошибка создания профиля компании';

            if (apiError.message && apiError.message !== 'An error occurred') {
                errorMessage = apiError.message;
            }

            // Check for field-specific validation errors
            if (apiError.errors && typeof apiError.errors === 'object') {
                const fieldErrors = Object.entries(apiError.errors)
                    .filter(([key]) => key !== 'detail' && key !== 'error' && key !== 'message' && key !== 'status')
                    .map(([field, messages]) => {
                        const fieldName = field.replace(/_/g, ' ');
                        const msg = Array.isArray(messages) ? messages.join(', ') : String(messages);
                        return `${fieldName}: ${msg}`;
                    })
                    .join('; ');

                if (fieldErrors) {
                    errorMessage = fieldErrors;
                }
            }

            setError(errorMessage);
            return null;
        } finally {
            setIsSaving(false);
        }
    }, []);

    useEffect(() => {
        fetchCompanyWithRoleCheck();
    }, [fetchCompanyWithRoleCheck]);

    return {
        company,
        isLoading,
        isSaving,
        error,
        refetch: fetchCompany,
        updateCompany,
        createCompany,
    };
}

// Hook for listing CRM clients (Agent only)
// 🛡️ ROLE GUARD: Only agents can access CRM clients
export function useCRMClients() {
    const { user } = useAuth();
    const [clients, setClients] = useState<CompanyListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isAgent = user?.role === 'agent';

    const fetchClients = useCallback(async () => {
        // 🛑 STOP if not agent - prevents 403 Forbidden error
        if (!isAgent) {
            setClients([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await api.get<PaginatedResponse<CompanyListItem>>('/companies/crm/');
            setClients(response.results);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка загрузки клиентов');
        } finally {
            setIsLoading(false);
        }
    }, [isAgent]);

    useEffect(() => {
        // Only fetch if user is an agent
        if (isAgent) {
            fetchClients();
        }
    }, [isAgent, fetchClients]);

    return {
        clients,
        isLoading,
        error,
        refetch: fetchClients,
    };
}

// Hook for single CRM client
export function useCRMClient(id: number | null) {
    const [client, setClient] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchClient = useCallback(async () => {
        if (!id) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await api.get<Company>(`/companies/crm/${id}/`);
            setClient(response);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка загрузки клиента');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchClient();
    }, [fetchClient]);

    return {
        client,
        isLoading,
        error,
        refetch: fetchClient,
    };
}

// Hook for CRM client mutations
export function useCRMClientMutations() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createClient = useCallback(async (data: CreateCompanyPayload): Promise<Company | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post<Company>('/companies/crm/', data);
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка создания клиента');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateClient = useCallback(async (id: number, data: Partial<CreateCompanyPayload>): Promise<Company | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.patch<Company>(`/companies/crm/${id}/`, data);
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка обновления клиента');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const deleteClient = useCallback(async (id: number): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            await api.delete(`/companies/crm/${id}/`);
            return true;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка удаления клиента');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        createClient,
        updateClient,
        deleteClient,
        clearError: () => setError(null),
    };
}
