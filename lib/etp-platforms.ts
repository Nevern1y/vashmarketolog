/**
 * ETP Platforms - Unified list of electronic trading platforms
 * 
 * Extracted from edit-client-sheet.tsx and my-company-view.tsx
 * to eliminate code duplication.
 */

export interface EtpPlatform {
    value: string
    label: string
    url?: string
}

/**
 * List of 17 ETP platforms per TS specification
 */
export const ETP_PLATFORMS: EtpPlatform[] = [
    { value: "roseltorg", label: "ЕЭТП (roseltorg.ru)", url: "roseltorg.ru" },
    { value: "rts", label: "РТС (rts-tender.ru)", url: "rts-tender.ru" },
    { value: "etp-ets", label: "ЭТП НЭП (etp-ets.ru)", url: "etp-ets.ru" },
    { value: "sberbank-ast", label: "СБЕРБАНК-АСТ (sberbank-ast.ru)", url: "sberbank-ast.ru" },
    { value: "zakazrf", label: "АГЗ РТ (etp.zakazrf.ru)", url: "etp.zakazrf.ru" },
    { value: "gazprom", label: "ГАЗПРОМ (etpgpb.ru)", url: "etpgpb.ru" },
    { value: "rad", label: "АО РАД" },
    { value: "tektorg", label: "ТЭК-Торг" },
    { value: "ats-goz", label: "АТС ГОЗ" },
    { value: "b2b-center", label: "B2BЦЕНТР (b2b-center.ru)", url: "b2b-center.ru" },
    { value: "otc", label: "ОСТЕНДЕР (otc.ru)", url: "otc.ru" },
    { value: "fabrikant", label: "FABRIKANT.RU (fabrikant.ru)", url: "fabrikant.ru" },
    { value: "etprf", label: "ЭТП (etprf.ru)", url: "etprf.ru" },
    { value: "oborontorg", label: "Оборонторг (oborontorg.ru)", url: "oborontorg.ru" },
    { value: "sstorg", label: "Спецстройторг (sstorg.ru)", url: "sstorg.ru" },
    { value: "avtodor", label: "Автодор (etp-avtodor.ru)", url: "etp-avtodor.ru" },
    { value: "estp", label: "ESTP (estp.ru)", url: "estp.ru" },
    { value: "other", label: "Другая" },
]

/**
 * Get platform label by value
 */
export const getEtpPlatformLabel = (value: string): string => {
    const platform = ETP_PLATFORMS.find(p => p.value === value)
    return platform?.label || value
}

/**
 * Get platform by value
 */
export const getEtpPlatform = (value: string): EtpPlatform | undefined => {
    return ETP_PLATFORMS.find(p => p.value === value)
}
