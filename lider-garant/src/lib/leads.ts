import api, { type ApiError } from '@/lib/api'

export interface LeadPayload {
  full_name?: string
  name?: string
  phone: string
  email?: string
  inn?: string
  product_type?: string
  guarantee_type?: string
  amount?: number
  term_months?: number
  message?: string
  source?: string
  form_name?: string
  page_url?: string
  referrer?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
}

export interface LeadResponse {
  id: number
  full_name: string
  phone: string
  email?: string
  created_at: string
}

export interface LeadSubmitResult {
  ok: boolean
  data?: LeadResponse
  error?: string
}

export const GUARANTEE_TYPE_MAP: Record<string, string> = {
  application_security: 'application_security',
  contract_execution: 'contract_execution',
  warranty_obligations: 'warranty_obligations',
  advance_return: 'advance_return',
  payment_guarantee: 'payment_guarantee',
  customs_guarantee: 'customs_guarantee',
  vat_refund: 'vat_refund',
  'Участие в тендере': 'application_security',
  'Исполнение контракта': 'contract_execution',
  'Исполнение гарантийных обязательств': 'warranty_obligations',
  'Возврат аванса': 'advance_return',
  'Гарантийные обязательства': 'warranty_obligations',
  'Гарантии оплаты товара': 'payment_guarantee',
  'Таможенные гарантии': 'customs_guarantee',
  'Возмещение НДС': 'vat_refund',
}

export const BANK_GUARANTEE_TYPE_OPTIONS = [
  { value: 'application_security', label: 'Участие в тендере' },
  { value: 'contract_execution', label: 'Исполнение контракта' },
  {
    value: 'warranty_obligations',
    label: 'Исполнение гарантийных обязательств',
  },
  { value: 'advance_return', label: 'Возврат аванса' },
] as const

export const PRODUCT_TYPE_MAP: Record<string, string> = {
  'Банковская гарантия': 'bank_guarantee',
  'Тендерный кредит': 'tender_loan',
  'Кредит на исполнение контракта': 'contract_loan',
  'Корпоративный кредит': 'corporate_credit',
  'Кредиты': 'corporate_credit',
  'Факторинг': 'factoring',
  'Лизинг': 'leasing',
  'ВЭД': 'ved',
  'Страхование': 'insurance',
  'РКО': 'rko',
  'Спецсчет': 'special_account',
  'Тендерное сопровождение': 'tender_support',
  'Депозиты': 'deposits',
}

const DEFAULT_ERROR_MESSAGE = 'Ошибка отправки заявки'

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('8') && digits.length === 11) {
    return `+7${digits.slice(1)}`
  }
  if (digits.startsWith('7') && digits.length === 11) {
    return `+${digits}`
  }
  if (digits.length === 10) {
    return `+7${digits}`
  }
  return phone
}

function normalizeInn(inn?: string): string | undefined {
  if (!inn) return undefined
  const digits = inn.replace(/\D/g, '')
  if (digits.length === 10 || digits.length === 12) {
    return digits
  }
  return undefined
}

function getUtmParams(): Partial<LeadPayload> {
  if (typeof window === 'undefined') return {}

  const params = new URLSearchParams(window.location.search)
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_term: params.get('utm_term') || undefined,
    utm_content: params.get('utm_content') || undefined,
  }
}

function getPageInfo(): Pick<LeadPayload, 'page_url' | 'referrer'> {
  if (typeof window === 'undefined') return {}

  return {
    page_url: window.location.href || undefined,
    referrer: document.referrer || undefined,
  }
}

export async function submitLead(data: LeadPayload): Promise<LeadSubmitResult> {
  const utmParams = getUtmParams()
  const pageInfo = getPageInfo()

  const payload: LeadPayload = {
    ...utmParams,
    ...pageInfo,
    ...data,
    full_name: data.full_name || data.name,
    phone: normalizePhone(data.phone),
    inn: normalizeInn(data.inn),
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key as keyof LeadPayload] === undefined) {
      delete payload[key as keyof LeadPayload]
    }
  })

  try {
    const response = await api.post<LeadResponse>('/applications/leads/', payload)
    return { ok: true, data: response }
  } catch (err) {
    const apiError = err as ApiError
    return { ok: false, error: apiError.message || DEFAULT_ERROR_MESSAGE }
  }
}
