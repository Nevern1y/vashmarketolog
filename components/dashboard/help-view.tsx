"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
    ChevronDown,
    Phone,
    Mail,
    MessageCircle,
    HelpCircle,
    Shield,
    Banknote,
    Truck,
    Building2,
    Globe,
    CreditCard,
    Briefcase,
    PiggyBank,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

// =================================================================================
// FAQ SECTIONS BY FINANCIAL PRODUCT
// Based on ТЗ documents and user screenshots
// =================================================================================

interface FAQItem {
    question: string
    answer: string
}

interface FAQSection {
    id: string
    title: string
    icon: typeof Shield
    items: FAQItem[]
}

const faqSections: FAQSection[] = [
    {
        id: "guarantees",
        title: "Гарантии",
        icon: Shield,
        items: [
            {
                question: "В чем суть банковской гарантии?",
                answer: "Банковская гарантия — это финансовый инструмент, при котором банк (гарант) обязуется выплатить бенефициару (заказчику) определённую сумму в случае неисполнения принципалом (исполнителем) своих обязательств по контракту."
            },
            {
                question: "Для чего нужна банковская гарантия?",
                answer: "Банковская гарантия необходима для обеспечения заявки на участие в тендере, исполнения контракта, возврата аванса и гарантийных обязательств. Она защищает интересы заказчика и подтверждает надёжность исполнителя."
            },
            {
                question: "Как работает банковская гарантия (БГ)?",
                answer: "Исполнитель обращается в банк за гарантией, оплачивает комиссию, банк выдаёт гарантию заказчику. При неисполнении обязательств банк выплачивает сумму заказчику, а затем взыскивает её с исполнителя."
            },
            {
                question: "Где используются банковские гарантии (БГ)?",
                answer: "В государственных закупках (44-ФЗ, 223-ФЗ), коммерческих тендерах, строительных подрядах, при импорте/экспорте товаров, для возмещения НДС и в таможенных операциях."
            },
            {
                question: "Какие есть виды банковских гарантий для юридических лиц?",
                answer: "Основные виды: обеспечение заявки, исполнение контракта, возврат аванса, гарантийные обязательства, гарантии оплаты товара, таможенные гарантии, на возмещение НДС."
            },
            {
                question: "Какие есть основные банковские гарантии?",
                answer: "Тендерная гарантия (обеспечение заявки), гарантия исполнения контракта, авансовая гарантия (возврат аванса), гарантия гарантийного периода."
            },
            {
                question: "Какие отличия есть у банковских гарантий?",
                answer: "Гарантии различаются по целевому назначению, сроку действия, сумме обеспечения, требованиям к документам и условиям выплаты. Например, гарантия на заявку составляет 0.5-5% от начальной цены, а на исполнение — 5-30%."
            },
        ],
    },
    {
        id: "credits",
        title: "Кредиты",
        icon: Banknote,
        items: [
            {
                question: "Какие виды кредитов доступны для бизнеса?",
                answer: "Доступны: тендерный кредит (на исполнение контракта), корпоративный кредит, кредит на пополнение оборотных средств, кредитные линии (возобновляемые и невозобновляемые), овердрафт."
            },
            {
                question: "Как получить кредит на исполнение контракта?",
                answer: "Необходимо подать заявку с контрактом, учредительными документами, финансовой отчётностью. Банк оценивает контракт и платёжеспособность заказчика. Срок рассмотрения — от 3 рабочих дней."
            },
            {
                question: "Какие требования к заёмщику?",
                answer: "Срок деятельности компании от 6-12 месяцев, положительная кредитная история, наличие контракта или бизнес-плана, отсутствие убытков за последний отчётный период."
            },
            {
                question: "Какие процентные ставки по бизнес-кредитам?",
                answer: "Процентные ставки зависят от срока кредита, суммы, обеспечения и финансового состояния заёмщика. Средние ставки — от ключевой ставки ЦБ + 3-8% годовых."
            },
        ],
    },
    {
        id: "international",
        title: "Международные платежи",
        icon: Globe,
        items: [
            {
                question: "Какие инструменты ВЭД доступны?",
                answer: "Для внешнеэкономической деятельности: международные переводы, аккредитивы, инкассо, валютный контроль, торговое финансирование, документарные операции."
            },
            {
                question: "Что такое аккредитив?",
                answer: "Аккредитив — обязательство банка произвести платёж поставщику при предоставлении документов, подтверждающих отгрузку товара. Защищает интересы обеих сторон сделки."
            },
            {
                question: "В каких валютах можно проводить платежи?",
                answer: "Поддерживаются основные мировые валюты: USD, EUR, CNY, GBP и другие. Банки предоставляют услуги конвертации по выгодным курсам."
            },
        ],
    },
    {
        id: "leasing",
        title: "Лизинг",
        icon: Truck,
        items: [
            {
                question: "Что такое лизинг?",
                answer: "Лизинг — это долгосрочная аренда оборудования, транспорта или недвижимости с правом последующего выкупа. Лизингодатель приобретает имущество и передаёт его в пользование за ежемесячные платежи."
            },
            {
                question: "Что можно взять в лизинг?",
                answer: "В лизинг можно взять: транспорт (легковой, грузовой, спецтехнику), оборудование (производственное, торговое, медицинское), недвижимость (коммерческую)."
            },
            {
                question: "Какие преимущества лизинга перед кредитом?",
                answer: "Лизинговые платежи относятся на себестоимость (экономия на налогах), не требуется залог, более быстрое рассмотрение заявки, амортизация с коэффициентом ускорения до 3."
            },
            {
                question: "Какой первоначальный взнос требуется?",
                answer: "Первоначальный взнос обычно составляет от 10% до 30% стоимости предмета лизинга, но некоторые программы предусматривают лизинг без первоначального взноса."
            },
        ],
    },
    {
        id: "factoring",
        title: "Факторинг",
        icon: Building2,
        items: [
            {
                question: "Что такое факторинг?",
                answer: "Факторинг — финансирование под уступку дебиторской задолженности. Компания получает до 90% суммы счёта сразу после отгрузки товара, не дожидаясь оплаты от покупателя."
            },
            {
                question: "Какие виды факторинга существуют?",
                answer: "Классический (с уведомлением дебитора), закрытый (без уведомления), закупочный (инициатор — покупатель), международный (для ВЭД операций)."
            },
            {
                question: "Какие преимущества факторинга?",
                answer: "Ускорение оборачиваемости капитала, отсутствие залога, снижение кассовых разрывов, защита от неплатежей, возможность предоставлять отсрочку покупателям без потери ликвидности."
            },
        ],
    },
    {
        id: "insurance",
        title: "Страхование",
        icon: Globe,
        items: [
            {
                question: "Какие виды бизнес-страхования доступны?",
                answer: "Категории: персонал (ДМС, НС), транспорт (КАСКО, ОСАГО), имущество (строения, оборудование), ответственность (профессиональные риски, качество продукции)."
            },
            {
                question: "Зачем страховать бизнес?",
                answer: "Страхование защищает от финансовых потерь при наступлении страховых случаев: аварий, пожаров, краж, судебных исков, производственных травм сотрудников."
            },
            {
                question: "Как рассчитывается стоимость страховки?",
                answer: "Стоимость зависит от вида страхования, страховой суммы, рисков, сферы деятельности компании и её истории убытков. Тарифы — от 0.1% до 5% от страховой суммы."
            },
        ],
    },

    {
        id: "accounts",
        title: "РКО и спецсчета",
        icon: CreditCard,
        items: [
            {
                question: "Что такое РКО?",
                answer: "Расчётно-кассовое обслуживание — комплекс банковских услуг по ведению счёта: приём/выдача наличных, безналичные переводы, зарплатный проект, эквайринг."
            },
            {
                question: "Что такое спецсчёт для госзакупок?",
                answer: "Специальный счёт для обеспечения заявок по 44-ФЗ и 223-ФЗ. Денежные средства блокируются на период участия в закупке и разблокируются после подведения итогов."
            },
            {
                question: "Как выбрать банк для РКО?",
                answer: "Критерии выбора: стоимость обслуживания, количество бесплатных платежей, лимиты на снятие наличных, качество онлайн-банка, скорость переводов, дополнительные сервисы."
            },
        ],
    },
    {
        id: "deposits",
        title: "Депозиты",
        icon: PiggyBank,
        items: [
            {
                question: "Какие депозиты доступны для бизнеса?",
                answer: "Срочные депозиты (фиксированный срок, высокая ставка), накопительные счета (гибкое снятие), депозиты с капитализацией, валютные депозиты."
            },
            {
                question: "Какие процентные ставки по депозитам?",
                answer: "Ставки зависят от суммы, срока и валюты. Для рублёвых депозитов — от ключевой ставки ЦБ минус 1-3%. Для крупных сумм доступны индивидуальные условия."
            },
            {
                question: "Застрахованы ли депозиты юридических лиц?",
                answer: "Депозиты юридических лиц в большинстве случаев не попадают под систему страхования вкладов АСВ. Рекомендуется размещать средства в надёжных системно значимых банках."
            },
        ],
    },
]

// =================================================================================
// CONTACT INFO
// =================================================================================
const contactInfo = {
    whatsapp: "+7 (965) 284-14-15",
    whatsappDescription: "Нажмите чтобы написать",
    email: "info@lidergarant.ru",
    workHours: "Служба поддержки и обратная связь",
}

export function HelpView() {
    const [activeSection, setActiveSection] = useState<string>("guarantees")
    const [showAllItems, setShowAllItems] = useState<Set<string>>(new Set())

    const currentSection = faqSections.find((s) => s.id === activeSection) || faqSections[0]

    const toggleShowAll = (sectionId: string) => {
        setShowAllItems((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId)
            } else {
                newSet.add(sectionId)
            }
            return newSet
        })
    }

    const visibleItems = showAllItems.has(activeSection)
        ? currentSection.items
        : currentSection.items.slice(0, 7)

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3CE8D1]/10">
                        <HelpCircle className="h-5 w-5 text-[#3CE8D1]" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Помощь</h1>
                </div>
                <p className="text-muted-foreground">
                    Ответы на часто задаваемые вопросы по финансовым продуктам
                </p>
            </div>

            {/* Contact Block */}
            <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-[#0a1628] to-[#1a2942] border border-border">
                <h3 className="text-lg font-semibold text-white mb-4">{contactInfo.workHours}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366]/10">
                            <MessageCircle className="h-6 w-6 text-[#25D366]" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">WhatsApp</p>
                            <a
                                href={`https://wa.me/${contactInfo.whatsapp.replace(/[\s\(\)\-\+]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-lg font-semibold text-white hover:text-[#25D366] transition-colors"
                            >
                                {contactInfo.whatsapp}
                            </a>
                            <p className="text-sm text-slate-400">{contactInfo.whatsappDescription}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3CE8D1]/10">
                            <Mail className="h-6 w-6 text-[#3CE8D1]" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Email</p>
                            <a
                                href={`mailto:${contactInfo.email}`}
                                className="text-lg font-semibold text-white hover:text-[#3CE8D1] transition-colors"
                            >
                                {contactInfo.email}
                            </a>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366]/10">
                            <Phone className="h-6 w-6 text-[#25D366]" />
                        </div>
                        <div>
                            <a
                                href={`https://wa.me/${contactInfo.whatsapp.replace(/[\s\(\)\-\+]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button
                                    variant="outline"
                                    className="border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white"
                                >
                                    Написать в WhatsApp
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAQ Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar - Product Categories */}
                <div className="lg:col-span-1">
                    <div className="sticky top-4 p-4 rounded-xl bg-card border border-border">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                            Категории
                        </h3>
                        <nav className="space-y-1">
                            {faqSections.map((section) => {
                                const Icon = section.icon
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                                            activeSection === section.id
                                                ? "bg-[#3CE8D1]/10 text-[#3CE8D1]"
                                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {section.title}
                                    </button>
                                )
                            })}
                        </nav>
                    </div>
                </div>

                {/* Main Content - FAQ Accordion */}
                <div className="lg:col-span-3">
                    <div className="rounded-xl bg-gradient-to-b from-[#0a1628] to-[#0f1d32] border border-border overflow-hidden">
                        {/* Section Header */}
                        <div className="p-6 border-b border-border">
                            <h2 className="text-xl font-semibold text-[#3CE8D1]">
                                Вопросы по {currentSection.title.toLowerCase()}
                            </h2>
                        </div>

                        {/* FAQ Items */}
                        <Accordion type="single" collapsible className="px-4 py-2">
                            {visibleItems.map((item, index) => (
                                <AccordionItem
                                    key={index}
                                    value={`item-${index}`}
                                    className="border-b border-border/30 last:border-0"
                                >
                                    <AccordionTrigger className="py-4 text-left text-white hover:text-[#3CE8D1] hover:no-underline">
                                        {item.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-slate-300 pb-4 text-left">
                                        {item.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>

                        {/* Show All Button */}
                        {currentSection.items.length > 7 && (
                            <div className="p-4 flex justify-center border-t border-border/30">
                                <Button
                                    variant="ghost"
                                    onClick={() => toggleShowAll(activeSection)}
                                    className="text-[#3CE8D1] hover:text-[#3CE8D1] hover:bg-[#3CE8D1]/10"
                                >
                                    {showAllItems.has(activeSection) ? "Свернуть" : "Показать все"}
                                    <ChevronDown
                                        className={cn(
                                            "ml-2 h-4 w-4 transition-transform",
                                            showAllItems.has(activeSection) && "rotate-180"
                                        )}
                                    />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
