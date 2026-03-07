"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../ui/dialog"
import { Switch } from "../ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select"
import { Loader2, Plus, Trash2, X, HelpCircle, Search, Building2, Sparkles, FileText, Tags, Settings, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

import { api, type ApiError } from "../../lib/api"

// Types matching backend/apps/seo/models.py
export interface FaqItem {
    question: string
    answer: string
}

// Popular search item - normalized format from backend
export interface PopularSearchItem {
    text: string
    href: string
}

export interface BankOffer {
    bank_id?: number
    bank_name?: string
    custom_rate?: string  // Backend field name
    rate?: string         // UI field name (normalized to custom_rate)
    custom_text?: string
}

export interface SeoPage {
    id: number
    slug: string
    meta_title: string
    meta_description: string
    meta_keywords: string
    h1_title: string
    h2_title: string
    h3_title: string
    hero_image: string | null
    main_description: string
    hero_button_text: string
    hero_button_href: string
    best_offers_title: string
    application_form_title: string
    application_button_text: string
    page_type: 'landing' | 'product' | 'custom'
    template_name: string
    autofill_template: string
    is_published: boolean
    priority: number
    faq: FaqItem[]
    popular_searches: PopularSearchItem[]  // Fixed: was string[], now object[]
    bank_offers: BankOffer[]
}

interface AutofillTemplateResponse {
    name: string
    meta_title?: string
    meta_description?: string
    meta_keywords?: string
    h1_title?: string
    main_description?: string
    faq?: FaqItem[]
    popular_searches?: Array<PopularSearchItem | string>
}

const LAYOUT_TEMPLATES = [
    { value: 'none', label: 'Стандартный layout' },
    { value: 'create-page', label: 'Layout: create-page' },
]

const AUTOFILL_TEMPLATES = [
    { value: 'none', label: 'Без автозаполнения' },
    { value: 'factoring', label: 'Факторинг' },
    { value: 'rko', label: 'РКО и спецсчета' },
    { value: 'leasing', label: 'Лизинг' },
    { value: 'guarantees', label: 'Банковские гарантии' },
    { value: 'credits', label: 'Кредиты для бизнеса' },
    { value: 'deposits', label: 'Депозиты' },
    { value: 'ved', label: 'ВЭД (международные платежи)' },
    { value: 'insurance', label: 'Страхование' },
    { value: 'tender', label: 'Тендерное сопровождение' },
    { value: 'checking', label: 'Проверка контрагентов' },
]

const RESERVED_STATIC_SLUGS = new Set(
    [
        "bankovskie-garantii",
        "kredity-dlya-biznesa",
        "lising-dlya-urlic",
        "factoring-dlya-biznesa",
        "rko",
        "deposity",
        "strahovanie",
        "ved",
        "tendernoe-soprovozhdenie",
        "tendernoe-soprovojdenie",
        "proverka-contragentov",
    ].map((slug) => slug.toLowerCase()),
)

// Template data for auto-fill
const TEMPLATE_DATA: Record<string, { faqs: FaqItem[], searches: string[], meta_title: string, meta_description: string, h1_title: string, main_description: string }> = {
    factoring: {
        meta_title: 'Факторинг для бизнеса — лучшие условия финансирования',
        meta_description: 'Факторинг для юридических лиц и ИП. Финансирование до 100 млн ₽ под уступку права требования.',
        h1_title: 'Факторинг для бизнеса',
        main_description: 'Факторинг — это покупка права требования денежного долга. Мы предлагаем лучшие условия с минимальными ставками.',
        faqs: [
            { question: "Что такое факторинг?", answer: "Факторинг — это финансовая операция, при которой фактор покупает у поставщика право требования к дебитору." },
            { question: "Какой процент по факторингу?", answer: "Ставки от 0,1% до 3% в день (от 3% до 90% годовых)." },
            { question: "Какой максимальный лимит?", answer: "Максимальный лимит может достигать 100 млн ₽." },
            { question: "Какие документы нужны?", answer: "Уставные документы, бухгалтерская отчётность, договоры с покупателями." },
        ],
        searches: ["факторинг для бизнеса", "факторинг для юридических лиц", "условия факторинга", "факторинг без регресса", "банковский факторинг"]
    },
    rko: {
        meta_title: 'РКО и спецсчета — лучшие банки для бизнеса',
        meta_description: 'Открытие РКО и спецсчёта для участия в госзакупках. Минимальные тарифы, удобный сервис.',
        h1_title: 'РКО и спецсчета',
        main_description: 'Расчётно-кассовое обслуживание — основа работы любой компании.',
        faqs: [
            { question: "Для чего нужен спецсчёт?", answer: "Для обеспечения заявок и исполнения контрактов по 44-ФЗ и 223-ФЗ." },
            { question: "В какой банк лучше открыть?", answer: "Учитывайте тарифы, наличие отделений, скорость обработки документов." },
            { question: "Как быстро можно открыть?", answer: "Стандартный срок — 1-3 рабочих дня." },
        ],
        searches: ["открытие спецсчета", "банки для открытия спецсчетов", "рко", "рко для ип", "рко для юридических лиц"]
    },
    leasing: {
        meta_title: 'Лизинг для бизнеса — выгодное финансирование',
        meta_description: 'Лизинг оборудования, спецтехники, транспорта. До 90% от стоимости.',
        h1_title: 'Лизинг для бизнеса',
        main_description: 'Лизинг — это финансовая аренда имущества с правом выкупа.',
        faqs: [
            { question: "Что такое лизинг?", answer: "Долгосрочная аренда имущества с возможностью выкупа." },
            { question: "Какой авансовый платёж?", answer: "От 10% до 30% стоимости объекта." },
        ],
        searches: ["лизинг для бизнеса", "лизинг оборудования", "лизинг авто", "лизинг для ип"]
    },
    guarantees: {
        meta_title: 'Банковские гарантии 44-ФЗ и 223-ФЗ',
        meta_description: 'Банковские гарантии для обеспечения заявок и исполнения контрактов.',
        h1_title: 'Банковские гарантии',
        main_description: 'Банковская гарантия — письменное обязательство банка.',
        faqs: [
            { question: "Какие виды гарантий?", answer: "Обеспечение заявок, исполнение контрактов, возврат аванса." },
            { question: "Сколько стоит?", answer: "От 0,5% до 5% от суммы гарантии в год." },
        ],
        searches: ["банковская гарантия 44 фз", "обеспечение заявки", "исполнение контракта"]
    },
    credits: {
        meta_title: 'Кредиты для бизнеса — лучшие условия',
        meta_description: 'Бизнес-кредиты для юридических лиц и ИП.',
        h1_title: 'Кредиты для бизнеса',
        main_description: 'Бизнес-кредиты — финансирование текущей деятельности.',
        faqs: [
            { question: "Какие виды кредитов?", answer: "На оборотные средства, инвестиционные, овердрафты." },
            { question: "Какой процент?", answer: "От 12% до 25% годовых." },
        ],
        searches: ["кредит для бизнеса", "кредит для ип", "кредит под залог"]
    },
    deposits: {
        meta_title: 'Депозиты для юридических лиц',
        meta_description: 'Депозитные счета для бизнеса. Выгодные ставки.',
        h1_title: 'Депозиты для бизнеса',
        main_description: 'Депозиты — способ размещения свободных средств под процент.',
        faqs: [
            { question: "Какие виды депозитов?", answer: "Срочные, до востребования, накопительные." },
        ],
        searches: ["депозит для бизнеса", "депозит для юридических лиц", "вклад для ип"]
    },
    ved: {
        meta_title: 'Международные платежи — услуги для ВЭД',
        meta_description: 'Международные переводы для бизнеса. Валютные переводы, SWIFT.',
        h1_title: 'Внешнеэкономическая деятельность',
        main_description: 'Международные платежи — переводы в иностранной валюте.',
        faqs: [
            { question: "Какие виды платежей?", answer: "SWIFT-переводы, SEPA, переводы в страны СНГ." },
        ],
        searches: [
            "международные платежи",
            "оплата международных платежей",
            "платежный агент",
            "международные расчеты",
            "услуга международных платежей",
            "платформа международных платежей",
            "переводы за границу",
            "переводы за рубеж",
            "вэд платежи",
            "международные переводы",
            "перевод денег за границу",
            "международные платежи и расчеты",
            "международные банковские платежи",
            "проведение международных платежей",
            "получать международные платежи",
            "платежи в международной торговле",
            "перевод зарубеж",
            "международные платежи для бизнеса",
            "принимать международные платежи",
            "сервисы международных платежей",
            "международные трансграничные платежи",
            "международные онлайн платежи",
            "платформа трансграничных платежей",
            "трансграничная система платежей",
            "денежные переводы зарубеж",
            "валютные переводы",
            "банковский платежный агент",
            "услуги платежного агента",
            "оплата через платежного агента",
            "платежный агент перевод",
            "платежный агент поставщик",
            "платежный агент вэд",
            "платежи в китай",
            "платежи в европу",
            "платежи в турцию",
            "платежи в индию",
            "платежи в иран",
            "платежи в оаэ",
            "платежи в дубай",
            "платежи в японию",
            "платежи в корею",
            "валютные денежные переводы",
            "переводы за границу из россии",
            "денежный перевод за границу",
            "перевод валюты за границу",
            "перевод средств за рубеж",
            "международные денежные переводы",
            "валютные платежи",
            "валютные платежи за границу",
            "проведение валютных платежей",
            "международный банковский перевод",
            "проведение международных расчетов",
        ]
    },
    insurance: {
        meta_title: 'Страхование для бизнеса',
        meta_description: 'Страхование имущества, ответственности для бизнеса.',
        h1_title: 'Страхование',
        main_description: 'Страхование бизнеса — защита от рисков и убытков.',
        faqs: [
            { question: "Что можно застраховать?", answer: "Недвижимость, оборудование, транспорт." },
        ],
        searches: ["страхование бизнеса", "страхование имущества", "каско для бизнеса"]
    },
    tender: {
        meta_title: 'Тендерное сопровождение — помощь в госзакупках',
        meta_description: 'Сопровождение участия в госзакупках 44-ФЗ и 223-ФЗ.',
        h1_title: 'Тендерное сопровождение',
        main_description: 'Тендерное сопровождение — помощь в закупках.',
        faqs: [
            { question: "Что входит в сопровождение?", answer: "Поиск тендеров, подготовка документов, участие в торгах." },
        ],
        searches: ["тендерное сопровождение", "госзакупки", "участие в торгах"]
    },
    checking: {
        meta_title: 'Проверка контрагентов — анализ юридических лиц',
        meta_description: 'Проверка контрагентов перед сотрудничеством.',
        h1_title: 'Проверка контрагентов',
        main_description: 'Проверка контрагентов — анализ благонадёжности партнёров.',
        faqs: [
            { question: "Что проверяется?", answer: "Статус регистрации, учредители, финансы, суды." },
        ],
        searches: ["проверка контрагента", "проверка юридического лица", "проверка инн"]
    },
}

interface SeoPageEditorProps {
    page: SeoPage | null
    open: boolean
    onClose: () => void
    onSave: (data: Partial<SeoPage>) => Promise<boolean>
    isLoading: boolean
    availablePages?: Array<{
        slug: string
        h1_title?: string
    }>
}

const normalizePopularSearches = (
    value: Array<PopularSearchItem | string> | undefined,
): PopularSearchItem[] => {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .map((item) => {
            if (typeof item === "string") {
                const text = item.trim()
                if (!text) return null

                if (isLinkLikeValue(text)) {
                    return { text: linkToDefaultText(text), href: normalizePopularSearchHref(text) }
                }

                return { text, href: "#application" }
            }

            const href = normalizePopularSearchHref(String(item?.href || "#application"))
            const text = String(item?.text || "").trim()

            if (!text && !href) return null

            if (text && isLinkLikeValue(text) && href === "#application") {
                return { text: linkToDefaultText(text), href: text }
            }

            if (!text) {
                return { text: linkToDefaultText(href), href }
            }

            return { text, href }
        })
        .filter((item): item is PopularSearchItem => item !== null)
}

const dedupePopularSearches = (items: PopularSearchItem[]) => {
    const seen = new Set<string>()
    return items.filter((item) => {
        const key = `${item.text}|||${item.href}`
        if (seen.has(key)) {
            return false
        }
        seen.add(key)
        return true
    })
}

const isLinkLikeValue = (value: string) => /^(\/|#|https?:\/\/)/i.test(value)

const normalizePopularSearchHref = (value: string) => {
    const href = value.trim()
    if (!href) return "#application"
    if (href.startsWith("#") || href.startsWith("/") || /^https?:\/\//i.test(href)) {
        return href
    }

    // UX fallback: treat bare slug as local path
    return `/${href.replace(/^\/+/, "")}`
}

const linkToDefaultText = (value: string) => {
    const clean = value
        .trim()
        .replace(/^https?:\/\/[^/]+/i, "")
        .replace(/^\/+/, "")
        .replace(/^#/, "")
        .replace(/[\-_]+/g, " ")
        .trim()

    if (!clean) return "По ссылке"
    return clean.charAt(0).toUpperCase() + clean.slice(1)
}

const buildPopularSearchItem = (textRaw: string, hrefRaw: string): PopularSearchItem | null => {
    const text = textRaw.trim()
    const href = normalizePopularSearchHref(hrefRaw)

    if (!text && !href) {
        return null
    }

    // UX fallback: if user pasted URL/path in "Текст запроса" and did not set href,
    // treat that value as both text and href.
    if (text && isLinkLikeValue(text) && (!href || href === "#application" || href === text)) {
        return { text: linkToDefaultText(text), href: href || text }
    }

    if (!text && href) {
        return { text: linkToDefaultText(href), href }
    }

    return {
        text: text || href,
        href,
    }
}

const normalizeLayoutTemplate = (templateName?: string) => {
    return templateName === "create-page" ? "create-page" : "none"
}

const isKnownAutofillTemplate = (value?: string) => {
    if (!value) return false
    return AUTOFILL_TEMPLATES.some((template) => template.value === value && template.value !== "none")
}

const normalizeAutofillTemplate = (autofillTemplate?: string, templateName?: string) => {
    if (isKnownAutofillTemplate(autofillTemplate)) {
        return autofillTemplate
    }

    if (isKnownAutofillTemplate(templateName)) {
        // Backward compatibility for legacy entries
        return templateName
    }

    return "none"
}

export function SeoPageEditor({
    page,
    open,
    onClose,
    onSave,
    isLoading,
    availablePages = [],
}: SeoPageEditorProps) {
    const getInitialFormData = (): Partial<SeoPage> => ({
        slug: "",
        meta_title: "",
        meta_description: "",
        meta_keywords: "",
        h1_title: "",
        h2_title: "",
        h3_title: "",
        hero_image: null,
        main_description: "",
        hero_button_text: "",
        hero_button_href: "#application",
        best_offers_title: "",
        application_form_title: "",
        application_button_text: "",
        page_type: "product",
        template_name: "none",
        autofill_template: "none",
        is_published: true,
        priority: 0,
        faq: [],
        popular_searches: [],
        bank_offers: [],
    })

    const [formData, setFormData] = useState<Partial<SeoPage>>(getInitialFormData())
    const [newSearchTerm, setNewSearchTerm] = useState("")
    const [newSearchHref, setNewSearchHref] = useState("#application")
    const [activeTab, setActiveTab] = useState("main")
    const [isApplyingTemplate, setIsApplyingTemplate] = useState(false)

    const normalizedSlug = (formData.slug || "").trim().replace(/^\/+/, "")
    const normalizedSlugLower = normalizedSlug.toLowerCase()
    const isReservedStaticSlug = RESERVED_STATIC_SLUGS.has(normalizedSlugLower)

    useEffect(() => {
        if (open) {
            if (page) {
                setFormData({
                    ...page,
                    template_name: normalizeLayoutTemplate(page.template_name),
                    autofill_template: normalizeAutofillTemplate(page.autofill_template, page.template_name),
                    faq: page.faq || [],
                    popular_searches: normalizePopularSearches(page.popular_searches as Array<PopularSearchItem | string>),
                    bank_offers: page.bank_offers || [],
                })
            } else {
                setFormData(getInitialFormData())
            }
            setNewSearchTerm("")
            setNewSearchHref("#application")
            setActiveTab("main")
        }
    }, [page, open])

    const handleSubmit = async () => {
        if (!formData.slug?.trim()) return

        const pendingSearchItem = buildPopularSearchItem(newSearchTerm, newSearchHref)
        const normalizedSearches = normalizePopularSearches(formData.popular_searches as Array<PopularSearchItem | string>)
        const finalPopularSearches = dedupePopularSearches([
            ...normalizedSearches,
            ...(pendingSearchItem ? [pendingSearchItem] : []),
        ]).map((item) => ({
            text: item.text.trim(),
            href: normalizePopularSearchHref(item.href),
        }))

        const hasTemplateContent = [
            formData.hero_button_text,
            formData.best_offers_title,
            formData.application_form_title,
            formData.application_button_text,
        ].some((value) => String(value || "").trim().length > 0)

        const hasAutofillPreset = Boolean(
            formData.autofill_template && formData.autofill_template !== "none",
        )

        const selectedLayout = formData.template_name === "none" ? "" : (formData.template_name || "")
        const resolvedLayoutTemplate = selectedLayout || (hasTemplateContent || hasAutofillPreset ? "create-page" : "")

        const payload: Partial<SeoPage> = {
            ...formData,
            slug: normalizedSlug,
            template_name: resolvedLayoutTemplate,
            autofill_template:
                formData.autofill_template === "none" ? "" : (formData.autofill_template || ""),
            popular_searches: finalPopularSearches,
        }

        const success = await onSave(payload)
        if (success) {
            onClose()
        }
    }

    // FAQ Management
    const addFaq = () => {
        setFormData({
            ...formData,
            faq: [...(formData.faq || []), { question: "", answer: "" }]
        })
    }

    const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
        const newFaq = [...(formData.faq || [])]
        newFaq[index] = { ...newFaq[index], [field]: value }
        setFormData({ ...formData, faq: newFaq })
    }

    const removeFaq = (index: number) => {
        const newFaq = [...(formData.faq || [])]
        newFaq.splice(index, 1)
        setFormData({ ...formData, faq: newFaq })
    }

    // Popular Searches Management
    const addSearchTerm = () => {
        const newItem = buildPopularSearchItem(newSearchTerm, newSearchHref)
        if (!newItem) return

        const normalizedSearches = normalizePopularSearches(formData.popular_searches as Array<PopularSearchItem | string>)
        setFormData({
            ...formData,
            popular_searches: dedupePopularSearches([...normalizedSearches, newItem]),
        })
        setNewSearchTerm("")
        setNewSearchHref("#application")
    }

    const updateSearchTerm = (index: number, field: 'text' | 'href', value: string) => {
        const newSearches = [...(formData.popular_searches || [])]
        const existing = newSearches[index] || { text: "", href: "#application" }

        newSearches[index] = {
            ...existing,
            [field]: value,
            href: field === 'href' ? value : (existing.href || "#application"),
        }

        setFormData({ ...formData, popular_searches: newSearches })
    }

    const removeSearchTerm = (index: number) => {
        const newSearches = [...(formData.popular_searches || [])]
        newSearches.splice(index, 1)
        setFormData({ ...formData, popular_searches: newSearches })
    }

    // Bank Offers Management
    const addBankOffer = () => {
        if ((formData.bank_offers || []).length < 9) {
            setFormData({
                ...formData,
                bank_offers: [...(formData.bank_offers || []), { bank_name: "", rate: "", custom_text: "" }]
            })
        }
    }

    const updateBankOffer = (index: number, field: keyof BankOffer, value: string) => {
        const newOffers = [...(formData.bank_offers || [])]
        newOffers[index] = { ...newOffers[index], [field]: value }
        setFormData({ ...formData, bank_offers: newOffers })
    }

    const removeBankOffer = (index: number) => {
        const newOffers = [...(formData.bank_offers || [])]
        newOffers.splice(index, 1)
        setFormData({ ...formData, bank_offers: newOffers })
    }

    // Apply Template - заполняет ВСЕ поля из шаблона
    const applyTemplate = async () => {
        const templateName = formData.autofill_template
        if (!templateName || templateName === 'none') return

        setIsApplyingTemplate(true)

        try {
            const template = await api.get<AutofillTemplateResponse>(
                "/seo/pages/templates/",
                { name: templateName },
            )

            setFormData((prev) => {
                const resolvedLayoutTemplate =
                    prev.template_name && prev.template_name !== "none"
                        ? prev.template_name
                        : "create-page"

                return {
                    ...prev,
                    template_name: resolvedLayoutTemplate,
                    meta_title: template.meta_title || "",
                    meta_description: template.meta_description || "",
                    meta_keywords: template.meta_keywords || "",
                    h1_title: template.h1_title || "",
                    main_description: template.main_description || "",
                    faq: template.faq || [],
                    popular_searches: normalizePopularSearches(template.popular_searches),
                }
            })

            toast.success("Шаблон применен")
            return
        } catch (error) {
            const apiError = error as ApiError

            if (apiError?.status === 401 || apiError?.status === 403) {
                toast.error("Сессия истекла", {
                    description: "Обновите страницу и войдите заново.",
                })
                return
            }

            const localTemplate = TEMPLATE_DATA[templateName as keyof typeof TEMPLATE_DATA]

            if (!localTemplate) {
                toast.error(apiError?.message || "Не удалось применить шаблон")
                return
            }

            const normalizedSearches: PopularSearchItem[] = localTemplate.searches.map((search) => ({
                text: search,
                href: '#application',
            }))

            setFormData((prev) => {
                const resolvedLayoutTemplate =
                    prev.template_name && prev.template_name !== "none"
                        ? prev.template_name
                        : "create-page"

                return {
                    ...prev,
                    template_name: resolvedLayoutTemplate,
                    meta_title: localTemplate.meta_title,
                    meta_description: localTemplate.meta_description,
                    h1_title: localTemplate.h1_title,
                    main_description: localTemplate.main_description,
                    faq: localTemplate.faqs,
                    popular_searches: normalizedSearches,
                }
            })

            toast.warning("Применен локальный пресет", {
                description: "Не удалось загрузить полный шаблон с backend.",
            })
        } finally {
            setIsApplyingTemplate(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-[1120px] max-h-[calc(100vh-1rem)] max-h-[calc(100svh-1rem)] max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100vh-2rem)] sm:max-h-[calc(100svh-2rem)] sm:max-h-[calc(100dvh-2rem)] !overflow-hidden [@media(max-height:820px)]:!overflow-x-hidden [@media(max-height:820px)]:!overflow-y-auto flex min-h-0 flex-col bg-[#0f0f1a] border-[#3ce8d1]/30 text-white rounded-xl sm:rounded-2xl shadow-2xl p-0 sm:p-0">
                <DialogHeader className="flex-shrink-0 border-b border-slate-700/50 px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 [@media(max-height:820px)]:px-3 [@media(max-height:820px)]:pt-3 [@media(max-height:820px)]:pb-2">
                    <DialogTitle className="text-xl font-bold text-white [@media(max-height:820px)]:text-lg">
                        {page ? "Редактировать SEO страницу" : "Создать SEO страницу"}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 h-0 min-h-0 overflow-hidden flex flex-col px-4 py-4 sm:px-6 sm:py-5 [@media(max-height:820px)]:flex-none [@media(max-height:820px)]:h-auto [@media(max-height:820px)]:overflow-visible [@media(max-height:820px)]:px-3 [@media(max-height:820px)]:py-3">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 h-0 min-h-0 flex flex-col overflow-hidden [@media(max-height:820px)]:flex-none [@media(max-height:820px)]:h-auto [@media(max-height:820px)]:overflow-visible">
                        <TabsList className="flex-shrink-0 flex w-full bg-[#1a1a2e] border border-slate-700/50 h-auto p-1 gap-1 rounded-xl mb-4 overflow-x-auto [@media(max-height:820px)]:mb-3">
                            <TabsTrigger
                                value="main"
                                className="h-9 md:h-10 flex-none min-w-[120px] rounded-lg data-[state=active]:bg-[#3ce8d1] data-[state=active]:text-[#0f0f1a] data-[state=active]:font-semibold text-slate-400 text-xs md:text-sm transition-all flex items-center justify-center gap-1 px-2 md:px-3 whitespace-nowrap"
                            >
                                <Settings className="w-4 h-4 shrink-0" />
                                <span>Основное</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="meta"
                                className="h-9 md:h-10 flex-none min-w-[120px] rounded-lg data-[state=active]:bg-[#3ce8d1] data-[state=active]:text-[#0f0f1a] data-[state=active]:font-semibold text-slate-400 text-xs md:text-sm transition-all flex items-center justify-center gap-1 px-2 md:px-3 whitespace-nowrap"
                            >
                                <Tags className="w-4 h-4 shrink-0" />
                                <span>Мета-теги</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="content"
                                className="h-9 md:h-10 flex-none min-w-[120px] rounded-lg data-[state=active]:bg-[#3ce8d1] data-[state=active]:text-[#0f0f1a] data-[state=active]:font-semibold text-slate-400 text-xs md:text-sm transition-all flex items-center justify-center gap-1 px-2 md:px-3 whitespace-nowrap"
                            >
                                <FileText className="w-4 h-4 shrink-0" />
                                <span>Контент</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="faq"
                                className="h-9 md:h-10 flex-none min-w-[120px] rounded-lg data-[state=active]:bg-[#3ce8d1] data-[state=active]:text-[#0f0f1a] data-[state=active]:font-semibold text-slate-400 text-xs md:text-sm transition-all flex items-center justify-center gap-1 px-2 md:px-3 whitespace-nowrap"
                            >
                                <HelpCircle className="w-4 h-4 shrink-0" />
                                <span>FAQ</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="offers"
                                className="h-9 md:h-10 flex-none min-w-[136px] rounded-lg data-[state=active]:bg-[#3ce8d1] data-[state=active]:text-[#0f0f1a] data-[state=active]:font-semibold text-slate-400 text-xs md:text-sm transition-all flex items-center justify-center gap-1 px-2 md:px-3 whitespace-nowrap"
                            >
                                <Building2 className="w-4 h-4 shrink-0" />
                                <span>Предложения</span>
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex-1 h-0 min-h-0 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] pr-0 sm:pr-2 pb-5 sm:pb-3 [@media(max-height:820px)]:flex-none [@media(max-height:820px)]:h-auto [@media(max-height:820px)]:overflow-visible">
                            {/* MAIN TAB */}
                            <TabsContent value="main" className="mt-0 space-y-5 [@media(max-height:820px)]:space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300 text-sm font-medium">URL Path (Slug) *</Label>
                                        <Input
                                            value={formData.slug}
                                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                            placeholder="credit-for-business"
                                            className="bg-[#1a1a2e] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] focus-visible:ring-[#3ce8d1]/20 rounded-lg h-10"
                                        />
                                        <p className="text-xs text-slate-500">Без / в начале</p>
                                        <p className="text-xs text-slate-500">
                                            Публичный URL: {normalizedSlug ? `/${normalizedSlug}` : "—"}
                                        </p>
                                        {isReservedStaticSlug && (
                                            <p className="text-xs text-amber-300/90">
                                                Этот slug совпадает со встроенной страницей услуги. Чтобы заменить ее контентом из SEO, выберите Layout: create-page.
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-300 text-sm font-medium">Тип страницы</Label>
                                        <Select
                                            value={formData.page_type}
                                            onValueChange={(val: 'landing' | 'product' | 'custom') => setFormData({ ...formData, page_type: val })}
                                        >
                                            <SelectTrigger className="bg-[#1a1a2e] border-slate-600 text-white focus:ring-[#3ce8d1]/20 rounded-lg h-10">
                                                <SelectValue placeholder="Выберите тип" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#1a1a2e] border-slate-600 text-slate-200">
                                                <SelectItem value="landing" className="focus:bg-slate-700 focus:text-white">Landing Page</SelectItem>
                                                <SelectItem value="product" className="focus:bg-slate-700 focus:text-white">Product Page</SelectItem>
                                                <SelectItem value="custom" className="focus:bg-slate-700 focus:text-white">Custom Page</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-slate-500">Для страниц из блока «Часто ищут» рекомендуем тип: custom</p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-900/20 to-[#3ce8d1]/10 border border-purple-500/30">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles className="w-5 h-5 text-purple-400" />
                                        <Label className="text-white font-medium">Шаблоны страницы</Label>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <Label className="text-slate-300 text-sm font-medium">Layout шаблон</Label>
                                        <Select
                                            value={formData.template_name || "none"}
                                            onValueChange={(val) => setFormData({ ...formData, template_name: val })}
                                        >
                                            <SelectTrigger className="bg-[#1a1a2e] border-slate-600 text-white focus:ring-[#3ce8d1]/20 rounded-lg h-10 flex-1">
                                                <SelectValue placeholder="Выберите layout" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#1a1a2e] border-slate-600 text-slate-200">
                                                {LAYOUT_TEMPLATES.map((t) => (
                                                    <SelectItem key={t.value} value={t.value} className="focus:bg-slate-700 focus:text-white">
                                                        {t.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-slate-400">Используется для рендера страницы. Для перехвата встроенных страниц услуг выбирайте Layout: create-page.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-300 text-sm font-medium">Контентный пресет (автозаполнение)</Label>
                                        <div className="flex gap-3">
                                            <Select
                                                value={formData.autofill_template || "none"}
                                                onValueChange={(val) => {
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        autofill_template: val,
                                                        template_name:
                                                            val !== "none" && (
                                                                !prev.template_name || prev.template_name === "none"
                                                            )
                                                                ? "create-page"
                                                                : prev.template_name,
                                                    }))
                                                }}
                                            >
                                                <SelectTrigger className="bg-[#1a1a2e] border-slate-600 text-white focus:ring-[#3ce8d1]/20 rounded-lg h-10 flex-1">
                                                    <SelectValue placeholder="Выберите пресет" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#1a1a2e] border-slate-600 text-slate-200">
                                                    {AUTOFILL_TEMPLATES.map((t) => (
                                                        <SelectItem key={t.value} value={t.value} className="focus:bg-slate-700 focus:text-white">
                                                            {t.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        <Button
                                            type="button"
                                            onClick={applyTemplate}
                                            disabled={
                                                !formData.autofill_template ||
                                                formData.autofill_template === 'none' ||
                                                isApplyingTemplate
                                            }
                                            className="bg-purple-600 hover:bg-purple-700 text-white h-10 px-5 rounded-lg font-medium disabled:opacity-40"
                                        >
                                            {isApplyingTemplate ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Sparkles className="w-4 h-4 mr-2" />
                                            )}
                                            {isApplyingTemplate ? "Применение..." : "Применить"}
                                        </Button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">Пресет заполняет мета-теги, контент, FAQ и блок «Часто ищут». Даже без кнопки сохранение применит пресет на backend.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300 text-sm font-medium">Приоритет</Label>
                                        <Input
                                            type="number"
                                            value={formData.priority || 0}
                                            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                                            className="bg-[#1a1a2e] border-slate-600 text-white focus:border-[#3ce8d1] focus-visible:ring-[#3ce8d1]/20 rounded-lg h-10"
                                        />
                                    </div>

                                    <div className="flex items-end">
                                        <div className="flex items-center gap-3 h-10 px-4 rounded-lg bg-[#1a1a2e] border border-slate-600 w-full">
                                            <Switch
                                                checked={formData.is_published}
                                                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                                                className="data-[state=checked]:bg-[#3ce8d1]"
                                            />
                                            <Label className="text-slate-200 font-medium cursor-pointer" onClick={() => setFormData({ ...formData, is_published: !formData.is_published })}>
                                                Опубликовано
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* META TAB */}
                            <TabsContent value="meta" className="space-y-5 mt-0">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-slate-300 text-sm font-medium">Meta Title</Label>
                                        <span className={`text-xs ${(formData.meta_title || "").length > 60 ? 'text-red-400' : 'text-slate-500'}`}>
                                            {(formData.meta_title || "").length}/60
                                        </span>
                                    </div>
                                    <Input
                                        value={formData.meta_title || ""}
                                        onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                                        placeholder="Заголовок для поисковых систем"
                                        className="bg-[#1a1a2e] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] focus-visible:ring-[#3ce8d1]/20 rounded-lg h-10"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-slate-300 text-sm font-medium">Meta Description</Label>
                                        <span className={`text-xs ${(formData.meta_description || "").length > 160 ? 'text-red-400' : 'text-slate-500'}`}>
                                            {(formData.meta_description || "").length}/160
                                        </span>
                                    </div>
                                    <Textarea
                                        value={formData.meta_description || ""}
                                        onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                                        rows={3}
                                        placeholder="Описание для поисковых систем"
                                        className="bg-[#1a1a2e] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] focus-visible:ring-[#3ce8d1]/20 rounded-lg resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-300 text-sm font-medium">Meta Keywords</Label>
                                    <Textarea
                                        value={formData.meta_keywords || ""}
                                        onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                                        rows={2}
                                        placeholder="ключевое слово 1, ключевое слово 2, ..."
                                        className="bg-[#1a1a2e] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] focus-visible:ring-[#3ce8d1]/20 rounded-lg resize-none"
                                    />
                                </div>
                            </TabsContent>

                            {/* CONTENT TAB */}
                            <TabsContent value="content" className="space-y-5 mt-0">
                                <div className="space-y-2">
                                    <Label className="text-slate-300 text-sm font-medium">H1 Заголовок</Label>
                                    <Input
                                        value={formData.h1_title || ""}
                                        onChange={(e) => setFormData({ ...formData, h1_title: e.target.value })}
                                        placeholder="Главный заголовок страницы"
                                        className="bg-[#1a1a2e] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] focus-visible:ring-[#3ce8d1]/20 rounded-lg h-10"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300 text-sm font-medium">H2 Заголовок</Label>
                                        <Input
                                            value={formData.h2_title || ""}
                                            onChange={(e) => setFormData({ ...formData, h2_title: e.target.value })}
                                            placeholder="Вторичный заголовок"
                                            className="bg-[#1a1a2e] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] focus-visible:ring-[#3ce8d1]/20 rounded-lg h-10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300 text-sm font-medium">H3 Заголовок</Label>
                                        <Input
                                            value={formData.h3_title || ""}
                                            onChange={(e) => setFormData({ ...formData, h3_title: e.target.value })}
                                            placeholder="Третичный заголовок"
                                            className="bg-[#1a1a2e] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] focus-visible:ring-[#3ce8d1]/20 rounded-lg h-10"
                                        />
                                    </div>
                                </div>

                                {/* Hero Image */}
                                <div className="space-y-3 p-4 rounded-xl bg-[#1a1a2e]/50 border border-slate-700/50">
                                    <Label className="text-white font-medium flex items-center gap-2">
                                        🖼️ Картинка главного блока
                                    </Label>
                                    {formData.hero_image && (
                                        <div className="relative inline-block">
                                            <img
                                                src={formData.hero_image}
                                                alt="Hero preview"
                                                className="max-h-32 rounded-lg border border-slate-600"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, hero_image: null })}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                    <Input
                                        type="text"
                                        value={formData.hero_image || ""}
                                        onChange={(e) => setFormData({ ...formData, hero_image: e.target.value || null })}
                                        placeholder="URL картинки (например: /images/hero.jpg)"
                                        className="bg-[#0f0f1a] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] focus-visible:ring-[#3ce8d1]/20 rounded-lg h-10"
                                    />
                                    <p className="text-xs text-slate-500">Введите URL изображения или путь к файлу в /public</p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-300 text-sm font-medium">Основное описание</Label>
                                    <Textarea
                                        value={formData.main_description || ""}
                                        onChange={(e) => setFormData({ ...formData, main_description: e.target.value })}
                                        rows={5}
                                        placeholder="Текст для основного блока страницы..."
                                        className="bg-[#1a1a2e] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] focus-visible:ring-[#3ce8d1]/20 rounded-lg resize-y min-h-[120px]"
                                    />
                                </div>

                                <div className="space-y-3 p-4 rounded-xl bg-[#1a1a2e]/50 border border-slate-700/50">
                                    <Label className="text-white font-medium">Шаблонные блоки (create-page)</Label>
                                    <p className="text-xs text-slate-400">Оставьте поля пустыми, чтобы включился авто-режим от H1. Ручные значения всегда в приоритете.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-300 text-sm font-medium">Текст кнопки первого экрана</Label>
                                            <Input
                                                value={formData.hero_button_text || ""}
                                                onChange={(e) => setFormData({ ...formData, hero_button_text: e.target.value })}
                                                placeholder="Оставить заявку"
                                                className="bg-[#0f0f1a] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] focus-visible:ring-[#3ce8d1]/20 rounded-lg h-10"
                                            />
                                            <p className="text-xs text-slate-500">Пусто = авто (по умолчанию: Оставить заявку)</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-slate-300 text-sm font-medium">Ссылка кнопки первого экрана</Label>
                                            <Input
                                                value={formData.hero_button_href || ""}
                                                onChange={(e) => setFormData({ ...formData, hero_button_href: e.target.value })}
                                                placeholder="#application"
                                                className="bg-[#0f0f1a] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] focus-visible:ring-[#3ce8d1]/20 rounded-lg h-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-300 text-sm font-medium">Заголовок блока Лучшие предложения</Label>
                                            <Input
                                                value={formData.best_offers_title || ""}
                                                onChange={(e) => setFormData({ ...formData, best_offers_title: e.target.value })}
                                                placeholder="Лучшие предложения"
                                                className="bg-[#0f0f1a] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] focus-visible:ring-[#3ce8d1]/20 rounded-lg h-10"
                                            />
                                            <p className="text-xs text-slate-500">Пусто = авто: Лучшие предложения — H1</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-slate-300 text-sm font-medium">Заголовок блока заявки</Label>
                                            <Input
                                                value={formData.application_form_title || ""}
                                                onChange={(e) => setFormData({ ...formData, application_form_title: e.target.value })}
                                                placeholder="Оставьте заявку"
                                                className="bg-[#0f0f1a] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] focus-visible:ring-[#3ce8d1]/20 rounded-lg h-10"
                                            />
                                            <p className="text-xs text-slate-500">Пусто = авто: Оставьте заявку — H1</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-slate-300 text-sm font-medium">Текст кнопки в заявке</Label>
                                            <Input
                                                value={formData.application_button_text || ""}
                                                onChange={(e) => setFormData({ ...formData, application_button_text: e.target.value })}
                                                placeholder="Оставить заявку"
                                                className="bg-[#0f0f1a] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] focus-visible:ring-[#3ce8d1]/20 rounded-lg h-10"
                                            />
                                            <p className="text-xs text-slate-500">Пусто = авто (по умолчанию: Оставить заявку)</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Popular Searches Section */}
                                <div className={`space-y-3 p-4 rounded-xl border ${(formData.popular_searches || []).length === 0 ? "bg-amber-900/10 border-amber-500/40" : "bg-[#1a1a2e]/50 border-slate-700/50"}`}>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-white font-medium flex items-center gap-2">
                                            <Search className="w-4 h-4 text-[#3ce8d1]" />
                                            Часто ищут ({(formData.popular_searches || []).length})
                                        </Label>
                                    </div>
                                    {(formData.popular_searches || []).length === 0 && (
                                        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                                            <div className="text-xs text-amber-200/90 space-y-1">
                                                <p className="font-medium">Блок &laquo;Часто ищут&raquo; пуст</p>
                                                <p>Добавьте ключевые запросы и укажите ссылки на существующие SEO-страницы (например <code className="bg-amber-800/40 px-1 rounded">/bankovskie-garantii-na-ispolnenie-kontrakta</code>). Без ссылок кнопки будут вести на форму заявки.</p>
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-xs text-slate-400">Для каждого элемента можно задать ссылку: #якорь, /seo-slug или https://...</p>
                                    <p className="text-xs text-slate-500">Заполните поля и нажмите +. Если забыли, введённый элемент добавится автоматически при сохранении.</p>

                                    <datalist id="seo-page-links">
                                        {availablePages
                                            .filter((item) => item.slug && item.slug !== normalizedSlug)
                                            .map((item) => (
                                                <option key={item.slug} value={`/${item.slug}`}>
                                                    {item.h1_title || item.slug}
                                                </option>
                                            ))}
                                    </datalist>

                                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
                                        <Input
                                            value={newSearchTerm}
                                            onChange={(e) => setNewSearchTerm(e.target.value)}
                                            onBlur={(e) => {
                                                const value = e.target.value.trim()
                                                if (isLinkLikeValue(value) && (!newSearchHref.trim() || newSearchHref.trim() === "#application")) {
                                                    setNewSearchHref(value)
                                                }
                                            }}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSearchTerm())}
                                            placeholder="Текст запроса (что видит пользователь)"
                                            className="bg-[#0f0f1a] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] focus-visible:ring-[#3ce8d1]/20 rounded-lg h-9"
                                        />
                                        <Input
                                            value={newSearchHref}
                                            onChange={(e) => setNewSearchHref(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSearchTerm())}
                                            list="seo-page-links"
                                            placeholder="Ссылка: /slug, #application или https://..."
                                            className="bg-[#0f0f1a] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] focus-visible:ring-[#3ce8d1]/20 rounded-lg h-9"
                                        />
                                        <Button type="button" onClick={addSearchTerm} size="sm" className="bg-[#3ce8d1] text-[#0f0f1a] hover:bg-[#3ce8d1]/90 h-9 px-3 rounded-lg">
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2 min-h-[32px]">
                                        {(formData.popular_searches || []).length === 0 ? (
                                            <span className="text-slate-500 text-sm">Нет поисковых запросов</span>
                                        ) : (
                                            (formData.popular_searches || []).map((term, idx) => (
                                                <div key={idx} className="space-y-1">
                                                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-center">
                                                        <Input
                                                            value={term.text}
                                                            onChange={(e) => updateSearchTerm(idx, 'text', e.target.value)}
                                                            placeholder="Текст запроса"
                                                            className="bg-[#0f0f1a] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] focus-visible:ring-[#3ce8d1]/20 rounded-lg h-9"
                                                        />
                                                        <Input
                                                            value={term.href || "#application"}
                                                            onChange={(e) => updateSearchTerm(idx, 'href', e.target.value)}
                                                            list="seo-page-links"
                                                            placeholder="/slug или #application"
                                                            className="bg-[#0f0f1a] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] focus-visible:ring-[#3ce8d1]/20 rounded-lg h-9"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            onClick={() => removeSearchTerm(idx)}
                                                            className="h-9 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-1" />
                                                            Удалить
                                                        </Button>
                                                    </div>
                                                    {normalizedSlug &&
                                                        normalizePopularSearchHref(term.href || "")
                                                            .replace(/\/+$/, "") === `/${normalizedSlug}` && (
                                                            <p className="text-xs text-amber-300/80">
                                                                Ссылка ведет на эту же страницу. Для перехода нужен другой slug.
                                                            </p>
                                                        )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* FAQ TAB */}
                            <TabsContent value="faq" className="space-y-4 mt-0">
                                <div className="flex items-center justify-between">
                                    <Label className="text-white font-medium flex items-center gap-2">
                                        <HelpCircle className="w-5 h-5 text-[#3ce8d1]" />
                                        Вопросы и ответы ({(formData.faq || []).length})
                                    </Label>
                                    <Button
                                        type="button"
                                        onClick={addFaq}
                                        size="sm"
                                        className="bg-[#3ce8d1] text-[#0f0f1a] hover:bg-[#3ce8d1]/90 rounded-lg font-medium"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Добавить
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {(formData.faq || []).length === 0 ? (
                                        <div className="text-center py-8 text-slate-500 bg-[#1a1a2e]/50 rounded-xl border border-dashed border-slate-700">
                                            <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                            <p className="text-sm">Нет вопросов. Нажмите Добавить или примените шаблон.</p>
                                        </div>
                                    ) : (
                                        (formData.faq || []).map((item, idx) => (
                                            <div key={idx} className="p-4 rounded-xl bg-[#1a1a2e] border border-slate-700/50 space-y-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-6 h-6 rounded-full bg-[#3ce8d1]/20 text-[#3ce8d1] text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                                                            <Label className="text-slate-400 text-xs">Вопрос</Label>
                                                        </div>
                                                        <Input
                                                            value={item.question}
                                                            onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                                                            placeholder="Введите вопрос..."
                                                            className="bg-[#0f0f1a] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] rounded-lg h-9"
                                                        />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeFaq(idx)}
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8 mt-5"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                <div className="space-y-1 pl-8">
                                                    <Label className="text-slate-400 text-xs">Ответ</Label>
                                                    <Textarea
                                                        value={item.answer}
                                                        onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                                                        placeholder="Введите ответ..."
                                                        rows={2}
                                                        className="bg-[#0f0f1a] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] rounded-lg resize-none"
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </TabsContent>

                            {/* BANK OFFERS TAB */}
                            <TabsContent value="offers" className="space-y-4 mt-0">
                                <div className="flex items-center justify-between">
                                    <Label className="text-white font-medium flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-[#3ce8d1]" />
                                        Предложения банков ({(formData.bank_offers || []).length}/9)
                                    </Label>
                                    <Button
                                        type="button"
                                        onClick={addBankOffer}
                                        disabled={(formData.bank_offers || []).length >= 9}
                                        size="sm"
                                        className="bg-[#3ce8d1] text-[#0f0f1a] hover:bg-[#3ce8d1]/90 rounded-lg font-medium disabled:opacity-40"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Добавить
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {(formData.bank_offers || []).length === 0 ? (
                                        <div className="col-span-3 text-center py-8 text-slate-500 bg-[#1a1a2e]/50 rounded-xl border border-dashed border-slate-700">
                                            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                            <p className="text-sm">Нет предложений. Добавьте до 9 банковских предложений.</p>
                                        </div>
                                    ) : (
                                        (formData.bank_offers || []).map((offer, idx) => (
                                            <div key={idx} className="p-3 rounded-xl bg-[#1a1a2e] border border-slate-700/50 space-y-2 relative group">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeBankOffer(idx)}
                                                    className="absolute -top-2 -right-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 h-6 w-6 rounded-full bg-[#0f0f1a] border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>

                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="w-5 h-5 rounded bg-[#3ce8d1]/20 text-[#3ce8d1] text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                                                    <span className="text-slate-400 text-xs">Банк</span>
                                                </div>

                                                <Input
                                                    value={offer.bank_name}
                                                    onChange={(e) => updateBankOffer(idx, 'bank_name', e.target.value)}
                                                    placeholder="Название банка"
                                                    className="bg-[#0f0f1a] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] rounded-lg h-8 text-sm"
                                                />
                                                <Input
                                                    value={offer.rate || ""}
                                                    onChange={(e) => updateBankOffer(idx, 'rate', e.target.value)}
                                                    placeholder="от 5% годовых"
                                                    className="bg-[#0f0f1a] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] rounded-lg h-8 text-sm"
                                                />
                                                <Input
                                                    value={offer.custom_text || ""}
                                                    onChange={(e) => updateBankOffer(idx, 'custom_text', e.target.value)}
                                                    placeholder="Доп. информация"
                                                    className="bg-[#0f0f1a] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] rounded-lg h-8 text-sm"
                                                />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <DialogFooter className="flex-shrink-0 gap-3 sm:justify-end border-t border-slate-700/50 px-4 py-3 sm:px-6 sm:py-4 [@media(max-height:820px)]:gap-2 [@media(max-height:820px)]:px-3 [@media(max-height:820px)]:py-2.5">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="w-full sm:w-auto border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white h-10 px-5 rounded-xl hover:border-slate-500 [@media(max-height:820px)]:h-9"
                    >
                        Отмена
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!formData.slug?.trim() || isLoading || isApplyingTemplate}
                        className="w-full sm:w-auto bg-[#3ce8d1] text-[#0f0f1a] font-bold hover:bg-[#3ce8d1]/90 shadow-[0_0_15px_rgba(60,232,209,0.3)] h-10 px-6 rounded-xl border-none [@media(max-height:820px)]:h-9"
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Сохранить
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
