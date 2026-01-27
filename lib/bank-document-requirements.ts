/**
 * Bank Document Requirements
 * 
 * Defines which documents are required by each bank for different product types.
 * Used for auto-populating documents in applications.
 */

import type { DocumentListItem } from '@/hooks/use-documents'

// =============================================================================
// TYPES
// =============================================================================

export interface BankDocumentRequirement {
    bankId: string
    bankName: string
    productType: string
    /** Required document type IDs (from Appendix B) */
    requiredDocumentTypeIds: number[]
    /** Optional but recommended document type IDs */
    optionalDocumentTypeIds: number[]
}

export interface DocumentMatchResult {
    /** Documents from company library that match requirements */
    matched: DocumentListItem[]
    /** Required document type IDs that are missing */
    missingRequired: number[]
    /** Optional document type IDs that are missing */
    missingOptional: number[]
    /** Total coverage percentage (required docs) */
    coveragePercent: number
}

// =============================================================================
// BANK DOCUMENT REQUIREMENTS DATA
// Per bank specifications for Bank Guarantee (БГ) product
// =============================================================================

export const BANK_DOCUMENT_REQUIREMENTS: BankDocumentRequirement[] = [
    // Sberbank - requires most documents
    {
        bankId: "sber",
        bankName: "Сбербанк",
        productType: "bank_guarantee",
        requiredDocumentTypeIds: [
            1,   // Карточка компании
            203, // Бухбаланс Ф1 и ОПиУ Ф2 на 31.12.2024 с квитанцией ИФНС
            202, // Бухбаланс Ф1 и ОПиУ Ф2 на 31.12.2023 с квитанцией ИФНС
            200, // Бухбаланс Ф1 и ОПиУ Ф2 на 30.06.2025
            201, // Бухбаланс Ф1 и ОПиУ Ф2 на 30.09.2025
            50,  // Реестр контрактов
            21,  // Паспорт руководителя
            22,  // Паспорта всех учредителей
            75,  // Устав
            76,  // Решение/протокол о назначении руководителя
            81,  // Договор аренды
        ],
        optionalDocumentTypeIds: [
            80,  // Карточка 51 счета за 24 месяца
            210, // Налоговая декларация за 24 год
            211, // Налоговая декларация за 25 год
            220, // Общая ОСВ
            221, // ОСВ 60
            222, // ОСВ 62
            223, // Выписка txt
        ],
    },
    // VTB
    {
        bankId: "vtb",
        bankName: "ВТБ",
        productType: "bank_guarantee",
        requiredDocumentTypeIds: [
            1,   // Карточка компании
            203, // Бухбаланс на 31.12.2024
            202, // Бухбаланс на 31.12.2023
            200, // Бухбаланс на 30.06.2025
            201, // Бухбаланс на 30.09.2025
            50,  // Реестр контрактов
            21,  // Паспорт руководителя
            75,  // Устав
            76,  // Протокол
            81,  // Договор аренды
        ],
        optionalDocumentTypeIds: [
            22,  // Паспорта учредителей
            80,  // Карточка 51
            210, // Налоговая декларация за 24 год
        ],
    },
    // Alfa-Bank
    {
        bankId: "alfa",
        bankName: "Альфа-Банк",
        productType: "bank_guarantee",
        requiredDocumentTypeIds: [
            1,   // Карточка компании
            203, // Бухбаланс на 31.12.2024
            202, // Бухбаланс на 31.12.2023
            21,  // Паспорт руководителя
            75,  // Устав
        ],
        optionalDocumentTypeIds: [
            200, // Бухбаланс на 30.06.2025
            201, // Бухбаланс на 30.09.2025
            50,  // Реестр контрактов
            22,  // Паспорта учредителей
            76,  // Протокол
            81,  // Договор аренды
        ],
    },
    // Gazprombank
    {
        bankId: "gazprom",
        bankName: "Газпромбанк",
        productType: "bank_guarantee",
        requiredDocumentTypeIds: [
            1,   // Карточка компании
            203, // Бухбаланс на 31.12.2024
            200, // Бухбаланс на 30.06.2025
            201, // Бухбаланс на 30.09.2025
            50,  // Реестр контрактов
            21,  // Паспорт руководителя
            75,  // Устав
        ],
        optionalDocumentTypeIds: [
            202, // Бухбаланс на 31.12.2023
            22,  // Паспорта учредителей
            76,  // Протокол
            81,  // Договор аренды
        ],
    },
    // Sovkombank - minimal requirements
    {
        bankId: "sovkom",
        bankName: "Совкомбанк",
        productType: "bank_guarantee",
        requiredDocumentTypeIds: [
            1,   // Карточка компании
            21,  // Паспорт руководителя
            203, // Бухбаланс на 31.12.2024
        ],
        optionalDocumentTypeIds: [
            200, // Бухбаланс на 30.06.2025
            50,  // Реестр контрактов
            75,  // Устав
        ],
    },
    // Rosbank
    {
        bankId: "rosbank",
        bankName: "Росбанк",
        productType: "bank_guarantee",
        requiredDocumentTypeIds: [
            1,   // Карточка компании
            203, // Бухбаланс на 31.12.2024
            202, // Бухбаланс на 31.12.2023
            21,  // Паспорт руководителя
            75,  // Устав
        ],
        optionalDocumentTypeIds: [
            200, // Бухбаланс на 30.06.2025
            201, // Бухбаланс на 30.09.2025
            50,  // Реестр контрактов
            22,  // Паспорта учредителей
        ],
    },
    // Lider-Garant (special - minimal requirements)
    {
        bankId: "lider_garant",
        bankName: "Лидер-Гарант",
        productType: "bank_guarantee",
        requiredDocumentTypeIds: [],  // No strict requirements
        optionalDocumentTypeIds: [
            1,   // Карточка компании
            21,  // Паспорт руководителя
            203, // Бухбаланс на 31.12.2024
        ],
    },
    // Contract Loan (КИК) requirements
    {
        bankId: "sber",
        bankName: "Сбербанк",
        productType: "contract_loan",
        requiredDocumentTypeIds: [
            1,   // Карточка компании
            203, // Бухбаланс на 31.12.2024
            202, // Бухбаланс на 31.12.2023
            200, // Бухбаланс на 30.06.2025
            201, // Бухбаланс на 30.09.2025
            50,  // Реестр контрактов
            21,  // Паспорт руководителя (74 -> 21 для совместимости)
            22,  // Паспорта учредителей
            75,  // Устав
            76,  // Протокол об избрании директора
            80,  // Карточка 51 счета / Выписка
            81,  // Договор аренды
        ],
        optionalDocumentTypeIds: [
            210, // Налоговая декларация за 24 год
            211, // Налоговая декларация за 25 год
            220, // ОСВ
        ],
    },
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get document requirements for a specific bank and product
 */
export function getBankRequirements(
    bankId: string,
    productType: string
): BankDocumentRequirement | undefined {
    return BANK_DOCUMENT_REQUIREMENTS.find(
        req => req.bankId === bankId && req.productType === productType
    )
}

/**
 * Get all bank requirements for a product type
 */
export function getAllBankRequirementsForProduct(
    productType: string
): BankDocumentRequirement[] {
    return BANK_DOCUMENT_REQUIREMENTS.filter(
        req => req.productType === productType
    )
}

/**
 * Match company documents against bank requirements
 */
export function matchDocumentsToRequirements(
    companyDocuments: DocumentListItem[],
    bankId: string,
    productType: string
): DocumentMatchResult {
    const requirements = getBankRequirements(bankId, productType)
    
    if (!requirements) {
        return {
            matched: [],
            missingRequired: [],
            missingOptional: [],
            coveragePercent: 100, // No requirements = 100% coverage
        }
    }
    
    const matched: DocumentListItem[] = []
    const missingRequired: number[] = []
    const missingOptional: number[] = []
    
    // Check required documents
    for (const typeId of requirements.requiredDocumentTypeIds) {
        const doc = companyDocuments.find(d => d.document_type_id === typeId)
        if (doc) {
            matched.push(doc)
        } else {
            missingRequired.push(typeId)
        }
    }
    
    // Check optional documents
    for (const typeId of requirements.optionalDocumentTypeIds) {
        const doc = companyDocuments.find(d => d.document_type_id === typeId)
        if (doc) {
            matched.push(doc)
        } else {
            missingOptional.push(typeId)
        }
    }
    
    // Calculate coverage
    const totalRequired = requirements.requiredDocumentTypeIds.length
    const matchedRequired = totalRequired - missingRequired.length
    const coveragePercent = totalRequired > 0 
        ? Math.round((matchedRequired / totalRequired) * 100)
        : 100
    
    return {
        matched,
        missingRequired,
        missingOptional,
        coveragePercent,
    }
}

/**
 * Auto-select documents for multiple banks
 * Returns unique list of matched documents across all selected banks
 */
export function autoSelectDocumentsForBanks(
    companyDocuments: DocumentListItem[],
    bankIds: string[],
    productType: string
): {
    selectedDocuments: DocumentListItem[]
    bankCoverage: Map<string, DocumentMatchResult>
} {
    const bankCoverage = new Map<string, DocumentMatchResult>()
    const selectedDocIds = new Set<number>()
    const selectedDocuments: DocumentListItem[] = []
    
    for (const bankId of bankIds) {
        const result = matchDocumentsToRequirements(companyDocuments, bankId, productType)
        bankCoverage.set(bankId, result)
        
        // Add matched documents (avoiding duplicates)
        for (const doc of result.matched) {
            if (!selectedDocIds.has(doc.id)) {
                selectedDocIds.add(doc.id)
                selectedDocuments.push(doc)
            }
        }
    }
    
    return { selectedDocuments, bankCoverage }
}

/**
 * Get minimum required documents across all banks for a product
 * (Documents that are required by at least one bank)
 */
export function getMinimumRequiredDocuments(productType: string): number[] {
    const allRequirements = getAllBankRequirementsForProduct(productType)
    const requiredIds = new Set<number>()
    
    for (const req of allRequirements) {
        for (const typeId of req.requiredDocumentTypeIds) {
            requiredIds.add(typeId)
        }
    }
    
    return Array.from(requiredIds)
}

/**
 * Get universally required documents (required by ALL banks)
 */
export function getUniversallyRequiredDocuments(productType: string): number[] {
    const allRequirements = getAllBankRequirementsForProduct(productType)
    
    if (allRequirements.length === 0) return []
    
    // Start with first bank's requirements
    let universal = new Set(allRequirements[0].requiredDocumentTypeIds)
    
    // Intersect with other banks
    for (let i = 1; i < allRequirements.length; i++) {
        const bankRequired = new Set(allRequirements[i].requiredDocumentTypeIds)
        universal = new Set([...universal].filter(id => bankRequired.has(id)))
    }
    
    return Array.from(universal)
}
