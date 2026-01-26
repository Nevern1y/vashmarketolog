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
            21,  // Паспорт генерального директора
            20,  // Бухгалтерская отчетность Ф1 и Ф2
            24,  // Налоговая декларация
            46,  // Аукционная документация
            47,  // Проект контракта
            48,  // Протокол итогов
        ],
        optionalDocumentTypeIds: [
            49,  // Решение (протокол) о крупной сделке
            54,  // Опыт
            31,  // Пролонгация по договору Аренды
        ],
    },
    // VTB
    {
        bankId: "vtb",
        bankName: "ВТБ",
        productType: "bank_guarantee",
        requiredDocumentTypeIds: [
            21,  // Паспорт генерального директора
            20,  // Бухгалтерская отчетность Ф1 и Ф2
            46,  // Аукционная документация
            47,  // Проект контракта
        ],
        optionalDocumentTypeIds: [
            24,  // Налоговая декларация
            48,  // Протокол итогов
        ],
    },
    // Alfa-Bank
    {
        bankId: "alfa",
        bankName: "Альфа-Банк",
        productType: "bank_guarantee",
        requiredDocumentTypeIds: [
            21,  // Паспорт генерального директора
            20,  // Бухгалтерская отчетность Ф1 и Ф2
        ],
        optionalDocumentTypeIds: [
            46,  // Аукционная документация
            47,  // Проект контракта
            24,  // Налоговая декларация
        ],
    },
    // Gazprombank
    {
        bankId: "gazprom",
        bankName: "Газпромбанк",
        productType: "bank_guarantee",
        requiredDocumentTypeIds: [
            21,  // Паспорт генерального директора
            20,  // Бухгалтерская отчетность Ф1 и Ф2
            24,  // Налоговая декларация
            46,  // Аукционная документация
        ],
        optionalDocumentTypeIds: [
            47,  // Проект контракта
            48,  // Протокол итогов
            49,  // Решение о крупной сделке
        ],
    },
    // Sovkombank - minimal requirements
    {
        bankId: "sovkom",
        bankName: "Совкомбанк",
        productType: "bank_guarantee",
        requiredDocumentTypeIds: [
            21,  // Паспорт генерального директора
        ],
        optionalDocumentTypeIds: [
            20,  // Бухгалтерская отчетность
            46,  // Аукционная документация
        ],
    },
    // Rosbank
    {
        bankId: "rosbank",
        bankName: "Росбанк",
        productType: "bank_guarantee",
        requiredDocumentTypeIds: [
            21,  // Паспорт генерального директора
            20,  // Бухгалтерская отчетность Ф1 и Ф2
            24,  // Налоговая декларация
        ],
        optionalDocumentTypeIds: [
            46,  // Аукционная документация
            47,  // Проект контракта
        ],
    },
    // Lider-Garant (special - minimal requirements)
    {
        bankId: "lider_garant",
        bankName: "Лидер-Гарант",
        productType: "bank_guarantee",
        requiredDocumentTypeIds: [],  // No strict requirements
        optionalDocumentTypeIds: [
            21,  // Паспорт генерального директора
            20,  // Бухгалтерская отчетность
        ],
    },
    // Contract Loan (КИК) requirements
    {
        bankId: "sber",
        bankName: "Сбербанк",
        productType: "contract_loan",
        requiredDocumentTypeIds: [
            74,  // Паспорт генерального директора (КИК ID)
            70,  // Бухгалтерская отчётность за последний год
            71,  // Бухгалтерская отчётность за последний квартал
            75,  // Устав
            76,  // Протокол об избрании директора
            77,  // Аукционная документация
            78,  // Проект контракта
            79,  // Протокол итогов
            80,  // Карточка 51 счета / Выписка
            81,  // Договор аренды
        ],
        optionalDocumentTypeIds: [
            69,  // Налоговая декларация за завершённый год
            87,  // Копия лицензии
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
