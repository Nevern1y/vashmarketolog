"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import {
    User,
    Building2,
    FileText,
    Share2,
    Copy,
    Download,
    Check,
    QrCode,
    CreditCard,
    Percent,
    Bell,
    Shield,
    Phone,
    Lock,
    Mail,
    MessageCircle,
    ExternalLink,
    Loader2,
    FileCheck,
    ChevronDown,
    ChevronUp,
    Upload,
    CheckCircle2
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { authApi } from "@/lib/api"
import { useDocumentMutations, useDocuments } from "@/hooks/use-documents"

// Tax system options per ТЗ
const TAX_SYSTEMS = [
    { value: "osn", label: "ОСН (Общая система налогообложения)" },
    { value: "usn_income", label: "УСН (Доходы)" },
    { value: "usn_income_expense", label: "УСН (Доходы минус расходы)" },
    { value: "esn", label: "ЕСХН (Единый сельскохозяйственный налог)" },
    { value: "patent", label: "ПСН (Патент)" },
]

// VAT rates per ТЗ
const VAT_RATES = [
    { value: "0", label: "Без НДС" },
    { value: "0%", label: "0% (экспорт)" },
    { value: "5%", label: "5%" },
    { value: "7%", label: "7%" },
    { value: "10%", label: "10%" },
    { value: "20%", label: "20%" },
]

// Agent documents for upload - documents that agent must provide
// Using numeric document_type_id for backend API
const AGENT_DOCUMENTS = [
    { id: "zayavlenie", document_type_id: 8, name: "Заявление о присоединении к регламенту", acceptFormat: ".sig", description: "Подписанное заявление в формате SIG" },
    { id: "soglasie", document_type_id: 9, name: "Согласие на обработку персональных данных", acceptFormat: ".sig", description: "Подписанное согласие в формате SIG" },
    { id: "list_zapisi", document_type_id: 10, name: "Лист записи/Скан свидетельства ОГРНИП", acceptFormat: ".pdf,.jpg,.jpeg,.png", description: "Скан документа в формате PDF или изображение" },
    { id: "contract", document_type_id: 11, name: "Агентский договор", acceptFormat: ".sig", description: "Подписанный договор в формате SIG" },
]

// Contract conditions - commission rates for banking partners
const CONTRACT_CONDITIONS = {
    bankGuarantee: {
        title: "Получение Банковской гарантии",
        partners: [
            {
                partner: "АК Барс", conditions: [
                    { rate: "15% от комиссии, уплаченной на банк при сумме продукта до 50 000 000,00 ₽, +40% от превышения тарифа", startDate: null, endDate: null },
                    { rate: "10% от комиссии, уплаченной на банк при сумме продукта от 50 000 000,01 ₽, +40% от превышения тарифа", startDate: null, endDate: null },
                ]
            },
            {
                partner: "Абсолют", conditions: [
                    { rate: "15% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: null, endDate: null },
                    { rate: "20% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "27.07.2025", endDate: null },
                ]
            },
            {
                partner: "Альфа-Банк", conditions: [
                    { rate: "25% от комиссии, уплаченной на банк", startDate: null, endDate: null },
                ]
            },
            {
                partner: "Банк Казани", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: null, endDate: null },
                ]
            },
            {
                partner: "Банк Левобережный", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "17.06.2024", endDate: null },
                ]
            },
            {
                partner: "Газпромбанк", conditions: [
                    { rate: "25% от комиссии, уплаченной на банк", startDate: null, endDate: null },
                ]
            },
            {
                partner: "Держава", conditions: [
                    { rate: "25% от комиссии, уплаченной на банк при сумме продукта до 40 000 000,00 ₽, +50% от превышения тарифа", startDate: "15.02.2022", endDate: null },
                    { rate: "15% от комиссии, уплаченной на банк при сумме продукта от 40 000 000,01 ₽, +50% от превышения тарифа", startDate: "15.02.2021", endDate: null },
                ]
            },
            {
                partner: "Зенит", conditions: [
                    { rate: "25% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: null, endDate: null },
                ]
            },
            {
                partner: "Ингосстрах Банк (ранее Союз)", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: null, endDate: null },
                ]
            },
            {
                partner: "КБ Соколовский", conditions: [
                    { rate: "30% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "15.10.2025", endDate: null },
                ]
            },
            {
                partner: "Камкомбанк", conditions: [
                    { rate: "30% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "15.10.2025", endDate: null },
                ]
            },
            {
                partner: "Локо", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "01.09.2020", endDate: null },
                ]
            },
            {
                partner: "МКБ", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк", startDate: null, endDate: null },
                ]
            },
            {
                partner: "МСП", conditions: [
                    { rate: "15% от комиссии, уплаченной на банк", startDate: null, endDate: null },
                ]
            },
            {
                partner: "МСП (Экспресс)", conditions: [
                    { rate: "15% от комиссии, уплаченной на банк", startDate: null, endDate: null },
                ]
            },
            {
                partner: "МТС", conditions: [
                    { rate: "25% от комиссии, уплаченной на банк", startDate: null, endDate: null },
                ]
            },
            {
                partner: "МетКомБанк", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк при сумме продукта до 50 000 000,00 ₽", startDate: null, endDate: null },
                    { rate: "15% от комиссии, уплаченной на банк при сумме продукта от 50 000 000,01 ₽", startDate: null, endDate: null },
                ]
            },
            {
                partner: "МеталлинвестБанк", conditions: [
                    { rate: "25% от комиссии, уплаченной на банк при сумме продукта до 10 000 000,00 ₽, +50% от превышения тарифа", startDate: null, endDate: null },
                    { rate: "20% от комиссии, уплаченной на банк при сумме продукта от 10 000 000,01 ₽ до 30 000 000,00 ₽, +50% от превышения тарифа", startDate: null, endDate: null },
                    { rate: "15% от комиссии, уплаченной на банк при сумме продукта от 30 000 000,01 ₽ до 50 000 000,00 ₽, +50% от превышения тарифа", startDate: null, endDate: null },
                    { rate: "10% от комиссии, уплаченной на банк при сумме продукта от 50 000 000,01 ₽ до 100 000 000,00 ₽, +50% от превышения тарифа", startDate: null, endDate: null },
                ]
            },
            {
                partner: "Примсоцбанк", conditions: [
                    { rate: "25% от комиссии, уплаченной на банк", startDate: "02.08.2022", endDate: null },
                ]
            },
            {
                partner: "Промсвязьбанк", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "06.12.2021", endDate: null },
                    { rate: "25% от комиссии, уплаченной на банк при количестве закрытых сделок от 6 шт., +50% от превышения тарифа", startDate: "25.02.2021", endDate: null, note: "до 25.02.2021 - 30% по всем сделкам" },
                ]
            },
            {
                partner: "Реалист Банк", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: null, endDate: null },
                ]
            },
            {
                partner: "РусНарБанк", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк при сумме продукта до 14 600 000,00 ₽, +50% от превышения тарифа", startDate: null, endDate: null },
                    { rate: "15% от комиссии, уплаченной на банк при сумме продукта от 14 600 000,01 ₽, +50% от превышения тарифа", startDate: null, endDate: null },
                ]
            },
            {
                partner: "СГБ", conditions: [
                    { rate: "25% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "01.03.2024", endDate: null },
                ]
            },
            {
                partner: "СДМ Банк", conditions: [
                    { rate: "25% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "01.07.2024", endDate: null },
                ]
            },
            {
                partner: "Санкт-Петербург", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "01.12.2022", endDate: null },
                ]
            },
            {
                partner: "Сбербанк", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк", startDate: "01.11.2022", endDate: null, note: "20% от комиссии (44/223/615 ФЗ, открытые закупки). Остальные закупки, в т.ч. КБГ - 15%, превышение запрещено" },
                ]
            },
            {
                partner: "Совкомбанк", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "01.12.2022", endDate: null, note: "Перевыпуск, изменение и продление БГ 15%" },
                    { rate: "10% от комиссии, уплаченной на банк при сумме продукта от 10 000 000,01 ₽, +50% от превышения тарифа", startDate: "08.04.2020", endDate: null, note: "Перевыпуск, изменение и продление БГ 15%" },
                ]
            },
            {
                partner: "Солид", conditions: [
                    { rate: "15% от комиссии, уплаченной на банк, +35% от превышения тарифа", startDate: null, endDate: null },
                ]
            },
            {
                partner: "ТКБ", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк", startDate: "01.02.2022", endDate: null },
                ]
            },
            {
                partner: "Трансстройбанк", conditions: [
                    { rate: "30% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "15.10.2025", endDate: null },
                ]
            },
            {
                partner: "Урал ФД", conditions: [
                    { rate: "25% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "10.04.2024", endDate: null },
                ]
            },
            {
                partner: "Уралсиб", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк при сумме продукта до 30 000 000,00 ₽", startDate: "01.12.2020", endDate: null },
                    { rate: "15% от комиссии, уплаченной на банк при сумме продукта от 30 000 000,00 ₽", startDate: "01.12.2020", endDate: null },
                ]
            },
        ]
    },
    tenderLoan: {
        title: "Получение Тендерного займа или Тендерного кредита",
        partners: [
            {
                partner: "Прочие партнёры", conditions: [
                    { rate: "10% от комиссии, уплаченной на банк", startDate: null, endDate: null },
                ]
            },
            {
                partner: "Финтендер", conditions: [
                    { rate: "10% от комиссии, уплаченной на банк", startDate: null, endDate: null, note: "Комиссия за гарантийное обеспечение уплаты процентов - вознаграждение агента не предусмотрено" },
                ]
            },
        ]
    },
    stateContractCredit: {
        title: "Получение кредита на исполнение госконтракта",
        partners: [
            {
                partner: "Альфа-Банк", conditions: [
                    { rate: "0.70% от суммы выданного кредита, +50% от превышения тарифа", startDate: null, endDate: null },
                ]
            },
            {
                partner: "Держава", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк", startDate: null, endDate: null },
                ]
            },
            {
                partner: "МеталлИнвестБанк", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк", startDate: null, endDate: null },
                ]
            },
            {
                partner: "Промсвязьбанк", conditions: [
                    { rate: "0.70% от суммы выданного кредита", startDate: null, endDate: null },
                ]
            },
            {
                partner: "Реалист Банк", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк", startDate: "07.06.2023", endDate: null },
                ]
            },
        ]
    },
    settlementAccount: {
        title: "Открытие расчетного счета",
        partners: [
            {
                partner: "Прочие партнёры", conditions: [
                    { rate: "1 500,00 ₽ (фиксированное)", startDate: null, endDate: null },
                ]
            },
        ]
    }
}

export function ProfileSettingsView() {
    const { user, refreshUser } = useAuth()
    const [isLinkCopied, setIsLinkCopied] = useState(false)

    // Role check - agents see Referrals tab, clients don't
    const isAgent = user?.role === "agent" || user?.role === "partner"
    const isClient = user?.role === "client"

    // Profile editing state
    const [isEditingProfile, setIsEditingProfile] = useState(false)
    const [profileFullName, setProfileFullName] = useState((user as any)?.full_name || user?.first_name || "")
    const [profileEmail, setProfileEmail] = useState(user?.email || "")
    const [profilePhone, setProfilePhone] = useState(user?.phone || "")
    const [isSavingProfile, setIsSavingProfile] = useState(false)

    // Form state for requisites
    const [bankBik, setBankBik] = useState("")
    const [bankName, setBankName] = useState("")
    const [bankAccount, setBankAccount] = useState("")
    const [corrAccount, setCorrAccount] = useState("")
    const [taxSystem, setTaxSystem] = useState("")
    const [vatRate, setVatRate] = useState("")

    // Password change state
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isSavingPassword, setIsSavingPassword] = useState(false)

    // Contract sections expanded state
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        bankGuarantee: true,
        tenderLoan: false,
        stateContractCredit: false,
        settlementAccount: false
    })

    // Agent documents - fetch from backend and track uploads
    const { documents: agentDocuments, refetch: refetchAgentDocs } = useDocuments({
        product_type: 'agent'
    })
    const { uploadDocument, isLoading: isUploading } = useDocumentMutations()
    const agentDocInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

    // Check if a document type is already uploaded
    const isAgentDocUploaded = (documentTypeId: number) => {
        return agentDocuments.some(d => d.document_type_id === documentTypeId)
    }

    // Get uploaded document info by type
    const getUploadedAgentDoc = (documentTypeId: number) => {
        return agentDocuments.find(d => d.document_type_id === documentTypeId)
    }

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
    }

    // Handle agent document upload - now uses real API
    const handleAgentDocUpload = async (docId: string, documentTypeId: number, file: File, docName: string) => {
        try {
            const result = await uploadDocument({
                name: file.name,
                file: file,
                document_type_id: documentTypeId,
                product_type: 'agent'
            })

            if (result) {
                toast.success(`Документ "${docName}" успешно загружен`)
                refetchAgentDocs() // Refresh documents list
            }
        } catch (error) {
            toast.error(`Ошибка загрузки документа "${docName}"`)
        }
    }

    // Generate referral link
    const referralLink = `https://vashmarketolog.ru/register?ref=${user?.id || 'AGENT123'}`

    const copyReferralLink = async () => {
        try {
            await navigator.clipboard.writeText(referralLink)
            setIsLinkCopied(true)
            toast.success("Ссылка скопирована в буфер обмена")
            setTimeout(() => setIsLinkCopied(false), 3000)
        } catch (err) {
            toast.error("Не удалось скопировать ссылку")
        }
    }


    // Handle password change
    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error("Заполните все поля")
            return
        }
        if (newPassword !== confirmPassword) {
            toast.error("Пароли не совпадают")
            return
        }
        if (newPassword.length < 8) {
            toast.error("Пароль должен быть минимум 8 символов")
            return
        }

        setIsSavingPassword(true)
        try {
            await authApi.changePassword(currentPassword, newPassword, confirmPassword)
            toast.success("Пароль успешно изменён")
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
        } catch (error: any) {
            toast.error(error.message || "Ошибка при смене пароля")
        } finally {
            setIsSavingPassword(false)
        }
    }

    // Handle profile save
    const handleSaveProfile = async () => {
        setIsSavingProfile(true)
        try {
            await authApi.updateProfile({
                full_name: profileFullName,
                email: profileEmail,
                phone: profilePhone
            })
            toast.success("Профиль успешно обновлён")
            setIsEditingProfile(false)
            if (refreshUser) {
                await refreshUser()
            }
        } catch (error: any) {
            toast.error(error.message || "Ошибка при сохранении профиля")
        } finally {
            setIsSavingProfile(false)
        }
    }

    // Cancel profile editing
    const handleCancelEdit = () => {
        setProfileFullName((user as any)?.full_name || user?.first_name || "")
        setProfileEmail(user?.email || "")
        setProfilePhone(user?.phone || "")
        setIsEditingProfile(false)
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Настройки</h1>
                <p className="text-muted-foreground">
                    Управление профилем и реквизитами партнера
                </p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className={`grid w-full bg-muted/50 ${isClient
                    ? 'grid-cols-4'
                    : isAgent
                        ? 'grid-cols-4 md:grid-cols-7'
                        : 'grid-cols-4 md:grid-cols-5'
                    }`}>
                    <TabsTrigger value="profile" className="flex items-center gap-1 px-2">
                        <User className="h-4 w-4" />
                        <span className="hidden lg:inline text-xs">Профиль</span>
                    </TabsTrigger>
                    {!isClient && (
                        <TabsTrigger value="documents" className="flex items-center gap-1 px-2">
                            <FileText className="h-4 w-4" />
                            <span className="hidden lg:inline text-xs">Документы</span>
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="notifications" className="flex items-center gap-1 px-2">
                        <Bell className="h-4 w-4" />
                        <span className="hidden lg:inline text-xs">Уведомления</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-1 px-2">
                        <Shield className="h-4 w-4" />
                        <span className="hidden lg:inline text-xs">Безопасность</span>
                    </TabsTrigger>
                    <TabsTrigger value="contacts" className="flex items-center gap-1 px-2">
                        <Phone className="h-4 w-4" />
                        <span className="hidden lg:inline text-xs">Контакты</span>
                    </TabsTrigger>
                    {isAgent && (
                        <TabsTrigger value="referrals" className="flex items-center gap-1 px-2">
                            <Share2 className="h-4 w-4" />
                            <span className="hidden lg:inline text-xs">Рефералы</span>
                        </TabsTrigger>
                    )}
                    {isAgent && (
                        <TabsTrigger value="contract" className="flex items-center gap-1 px-2">
                            <FileCheck className="h-4 w-4" />
                            <span className="hidden lg:inline text-xs">Мой договор</span>
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* TAB 1: PROFILE */}
                <TabsContent value="profile" className="mt-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Профиль пользователя</CardTitle>
                                <CardDescription>Основная информация о вашем аккаунте</CardDescription>
                            </div>
                            {!isEditingProfile && (
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditingProfile(true)}
                                    className="border-[#3CE8D1] text-[#3CE8D1] hover:bg-[#3CE8D1]/10"
                                >
                                    Редактировать
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>ФИО</Label>
                                    <Input
                                        value={isEditingProfile ? profileFullName : ((user as any)?.full_name || user?.first_name || "")}
                                        onChange={(e) => setProfileFullName(e.target.value)}
                                        disabled={!isEditingProfile}
                                        className={!isEditingProfile ? "bg-muted" : ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={isEditingProfile ? profileEmail : (user?.email || "")}
                                        onChange={(e) => setProfileEmail(e.target.value)}
                                        disabled={!isEditingProfile}
                                        className={!isEditingProfile ? "bg-muted" : ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Телефон</Label>
                                    <Input
                                        value={isEditingProfile ? profilePhone : (user?.phone || "+7 (XXX) XXX-XX-XX")}
                                        onChange={(e) => setProfilePhone(e.target.value)}
                                        disabled={!isEditingProfile}
                                        className={!isEditingProfile ? "bg-muted" : ""}
                                        placeholder="+7 (XXX) XXX-XX-XX"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Роль</Label>
                                    <Input
                                        value={user?.role === "agent" ? "Агент" : user?.role === "partner" ? "Партнер" : user?.role === "client" ? "Клиент" : user?.role || ""}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>
                            </div>
                            {isEditingProfile && (
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                                        onClick={handleSaveProfile}
                                        disabled={isSavingProfile}
                                    >
                                        {isSavingProfile ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : null}
                                        Сохранить
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleCancelEdit}
                                        disabled={isSavingProfile}
                                    >
                                        Отмена
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 3: REFERRALS (WAVE 3) */}
                <TabsContent value="referrals" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Share2 className="h-5 w-5" />
                                Реферальная программа
                            </CardTitle>
                            <CardDescription>
                                Приглашайте клиентов и получайте вознаграждение
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Info Box */}
                            <div className="rounded-lg bg-[#3CE8D1]/10 border border-[#3CE8D1]/30 p-4">
                                <p className="text-sm">
                                    За клиентов, пришедших и зарегистрировавшихся по вашей реферальной ссылке,
                                    вы будете получать <span className="font-semibold text-[#3CE8D1]">комиссионное вознаграждение</span> с каждой их сделки.
                                </p>
                            </div>

                            {/* Referral Link */}
                            <div className="space-y-2">
                                <Label>Ваша реферальная ссылка</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={referralLink}
                                        readOnly
                                        className="bg-muted font-mono text-sm"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={copyReferralLink}
                                        className={isLinkCopied ? "border-green-500 text-green-500" : "border-[#3CE8D1] text-[#3CE8D1]"}
                                    >
                                        {isLinkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>

                            {/* QR Code Placeholder */}
                            <div className="space-y-2">
                                <Label>QR-код для печати</Label>
                                <div className="flex items-center gap-4">
                                    <div className="w-48 h-48 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center bg-muted/30">
                                        <QrCode className="h-16 w-16 text-muted-foreground mb-2" />
                                        <p className="text-xs text-muted-foreground text-center px-4">
                                            QR-код будет сгенерирован автоматически
                                        </p>
                                    </div>
                                    <div className="space-y-3">
                                        <Button variant="outline" className="w-full">
                                            <Download className="h-4 w-4 mr-2" />
                                            Скачать PNG
                                        </Button>
                                        <Button variant="outline" className="w-full">
                                            <Download className="h-4 w-4 mr-2" />
                                            Скачать SVG
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Stats placeholder */}
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium mb-3">Статистика рефералов</h4>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                                        <p className="text-2xl font-bold text-[#3CE8D1]">0</p>
                                        <p className="text-xs text-muted-foreground">Переходов по ссылке</p>
                                    </div>
                                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                                        <p className="text-2xl font-bold text-[#3CE8D1]">0</p>
                                        <p className="text-xs text-muted-foreground">Зарегистрировано</p>
                                    </div>
                                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                                        <p className="text-2xl font-bold text-[#3CE8D1]">0 ₽</p>
                                        <p className="text-xs text-muted-foreground">Заработано</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 4: DOCUMENTS (WAVE 3) */}
                <TabsContent value="documents" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Документы
                            </CardTitle>
                            <CardDescription>
                                Загрузите необходимые документы для работы на платформе
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {AGENT_DOCUMENTS.map((doc) => {
                                    const isUploaded = isAgentDocUploaded(doc.document_type_id)
                                    const uploadedDoc = getUploadedAgentDoc(doc.document_type_id)
                                    return (
                                        <div
                                            key={doc.id}
                                            className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                {isUploaded ? (
                                                    <CheckCircle2 className="h-5 w-5 text-[#3CE8D1]" />
                                                ) : (
                                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                                )}
                                                <div>
                                                    <p className="font-medium text-sm">{doc.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {isUploaded && uploadedDoc
                                                            ? `${uploadedDoc.name} • ${new Date(uploadedDoc.uploaded_at).toLocaleDateString('ru-RU')}`
                                                            : doc.description
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isUploaded ? (
                                                    <span className="text-xs bg-[#3CE8D1]/10 text-[#3CE8D1] px-2 py-1 rounded">
                                                        Загружен
                                                    </span>
                                                ) : (
                                                    <>
                                                        <input
                                                            type="file"
                                                            ref={(el) => { agentDocInputRefs.current[doc.id] = el }}
                                                            className="hidden"
                                                            accept={doc.acceptFormat}
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0]
                                                                if (file) handleAgentDocUpload(doc.id, doc.document_type_id, file, doc.name)
                                                            }}
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-2"
                                                            disabled={isUploading}
                                                            onClick={() => agentDocInputRefs.current[doc.id]?.click()}
                                                        >
                                                            <Upload className="h-4 w-4" />
                                                            {isUploading ? 'Загрузка...' : 'Загрузить'}
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: NOTIFICATIONS (ТЗ Настройки) */}
                <TabsContent value="notifications" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Уведомления
                            </CardTitle>
                            <CardDescription>
                                Настройте способы получения уведомлений
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">Email-уведомления</p>
                                            <p className="text-sm text-muted-foreground">Получать уведомления на почту</p>
                                        </div>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <MessageCircle className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">SMS-уведомления</p>
                                            <p className="text-sm text-muted-foreground">Получать SMS о статусе заявок</p>
                                        </div>
                                    </div>
                                    <Switch />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <Bell className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">Push-уведомления</p>
                                            <p className="text-sm text-muted-foreground">Уведомления в браузере</p>
                                        </div>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium mb-4">Категории уведомлений</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Новые заявки</span>
                                        <Switch defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Изменения статуса</span>
                                        <Switch defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Сообщения в чате</span>
                                        <Switch defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Маркетинговые рассылки</span>
                                        <Switch />
                                    </div>
                                </div>
                            </div>
                            <Button className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]">
                                Сохранить настройки
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: SECURITY (ТЗ Настройки) */}
                <TabsContent value="security" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Безопасность
                            </CardTitle>
                            <CardDescription>
                                Управление безопасностью аккаунта
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium">Смена пароля</h4>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Текущий пароль</Label>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                        />
                                    </div>
                                    <div></div>
                                    <div className="space-y-2">
                                        <Label>Новый пароль</Label>
                                        <Input
                                            type="password"
                                            placeholder="Минимум 8 символов"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Подтвердите пароль</Label>
                                        <Input
                                            type="password"
                                            placeholder="Повторите новый пароль"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={handleChangePassword}
                                    disabled={isSavingPassword}
                                >
                                    {isSavingPassword ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Lock className="h-4 w-4 mr-2" />
                                    )}
                                    Изменить пароль
                                </Button>
                            </div>
                            <div className="border-t pt-4 space-y-4">
                                <h4 className="text-sm font-medium">Двухфакторная аутентификация</h4>
                                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                                    <div>
                                        <p className="font-medium">2FA через SMS</p>
                                        <p className="text-sm text-muted-foreground">Дополнительная защита через SMS-код</p>
                                    </div>
                                    <Switch />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                                    <div>
                                        <p className="font-medium">2FA через приложение</p>
                                        <p className="text-sm text-muted-foreground">Google Authenticator или аналог</p>
                                    </div>
                                    <Switch />
                                </div>
                            </div>
                            <div className="border-t pt-4 space-y-4">
                                <h4 className="text-sm font-medium">Активные сессии</h4>
                                <div className="p-4 rounded-lg border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Текущая сессия</p>
                                            <p className="text-xs text-muted-foreground">Windows • Chrome • Москва</p>
                                        </div>
                                        <span className="text-xs text-green-500">Активна</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: CONTACTS (ТЗ Настройки) */}
                <TabsContent value="contacts" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Phone className="h-5 w-5" />
                                Контакты
                            </CardTitle>
                            <CardDescription>
                                Служба поддержки и обратная связь
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="p-4 rounded-lg border space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-5 w-5 text-[#3CE8D1]" />
                                        <span className="font-medium">Телефон поддержки</span>
                                    </div>
                                    <p className="text-lg font-bold">8 (800) 555-35-35</p>
                                    <p className="text-sm text-muted-foreground">Бесплатно по России</p>
                                </div>
                                <div className="p-4 rounded-lg border space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-5 w-5 text-[#3CE8D1]" />
                                        <span className="font-medium">Email</span>
                                    </div>
                                    <p className="text-lg font-bold">support@vashmarketolog.ru</p>
                                    <p className="text-sm text-muted-foreground">Ответ в течение 24 часов</p>
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium mb-4">Обратная связь</h4>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Тема обращения</Label>
                                        <Select>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Выберите тему" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="technical">Техническая поддержка</SelectItem>
                                                <SelectItem value="billing">Вопросы по оплате</SelectItem>
                                                <SelectItem value="partnership">Партнерство</SelectItem>
                                                <SelectItem value="other">Другое</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Сообщение</Label>
                                        <textarea
                                            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder="Опишите ваш вопрос..."
                                        />
                                    </div>
                                    <Button className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]">
                                        Отправить сообщение
                                    </Button>
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium mb-3">Полезные ссылки</h4>
                                <div className="space-y-2">
                                    <a href="#" className="flex items-center gap-2 text-sm text-[#3CE8D1] hover:underline">
                                        <ExternalLink className="h-4 w-4" />
                                        База знаний
                                    </a>
                                    <a href="#" className="flex items-center gap-2 text-sm text-[#3CE8D1] hover:underline">
                                        <ExternalLink className="h-4 w-4" />
                                        Видеоинструкции
                                    </a>
                                    <a href="#" className="flex items-center gap-2 text-sm text-[#3CE8D1] hover:underline">
                                        <ExternalLink className="h-4 w-4" />
                                        Telegram-канал
                                    </a>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: CONTRACT (Мой договор) */}
                <TabsContent value="contract" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileCheck className="h-5 w-5" />
                                Мой договор
                            </CardTitle>
                            <CardDescription>
                                Текущие условия вознаграждения агента по партнёрам сервиса
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Bank Guarantee Section */}
                            <div className="rounded-lg border">
                                <button
                                    onClick={() => toggleSection('bankGuarantee')}
                                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3CE8D1]/20 text-[#3CE8D1]">
                                            <FileCheck className="h-4 w-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium">{CONTRACT_CONDITIONS.bankGuarantee.title}</p>
                                            <p className="text-xs text-muted-foreground">{CONTRACT_CONDITIONS.bankGuarantee.partners.length} партнёров</p>
                                        </div>
                                    </div>
                                    {expandedSections.bankGuarantee ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                </button>
                                {expandedSections.bankGuarantee && (
                                    <div className="border-t max-h-[400px] overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50 sticky top-0">
                                                <tr>
                                                    <th className="text-left p-3 font-medium">Партнёр</th>
                                                    <th className="text-left p-3 font-medium">Вознаграждение</th>
                                                    <th className="text-left p-3 font-medium hidden md:table-cell">Дата начала</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {CONTRACT_CONDITIONS.bankGuarantee.partners.map((item, idx) => (
                                                    item.conditions.map((cond, condIdx) => (
                                                        <tr key={`${idx}-${condIdx}`} className="border-t hover:bg-muted/30">
                                                            {condIdx === 0 && (
                                                                <td className="p-3 font-medium align-top" rowSpan={item.conditions.length}>
                                                                    {item.partner}
                                                                </td>
                                                            )}
                                                            <td className="p-3">
                                                                <span className="text-[#3CE8D1]">{cond.rate}</span>
                                                                {(cond as any).note && (
                                                                    <p className="text-xs text-muted-foreground mt-1">({(cond as any).note})</p>
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-muted-foreground hidden md:table-cell">
                                                                {cond.startDate || '—'}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Tender Loan Section */}
                            <div className="rounded-lg border">
                                <button
                                    onClick={() => toggleSection('tenderLoan')}
                                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4F7DF3]/20 text-[#4F7DF3]">
                                            <CreditCard className="h-4 w-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium">{CONTRACT_CONDITIONS.tenderLoan.title}</p>
                                            <p className="text-xs text-muted-foreground">{CONTRACT_CONDITIONS.tenderLoan.partners.length} партнёров</p>
                                        </div>
                                    </div>
                                    {expandedSections.tenderLoan ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                </button>
                                {expandedSections.tenderLoan && (
                                    <div className="border-t">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50">
                                                <tr>
                                                    <th className="text-left p-3 font-medium">Партнёр</th>
                                                    <th className="text-left p-3 font-medium">Вознаграждение</th>
                                                    <th className="text-left p-3 font-medium hidden md:table-cell">Дата начала</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {CONTRACT_CONDITIONS.tenderLoan.partners.map((item, idx) => (
                                                    item.conditions.map((cond, condIdx) => (
                                                        <tr key={`${idx}-${condIdx}`} className="border-t hover:bg-muted/30">
                                                            {condIdx === 0 && (
                                                                <td className="p-3 font-medium align-top" rowSpan={item.conditions.length}>
                                                                    {item.partner}
                                                                </td>
                                                            )}
                                                            <td className="p-3">
                                                                <span className="text-[#4F7DF3]">{cond.rate}</span>
                                                                {(cond as any).note && (
                                                                    <p className="text-xs text-muted-foreground mt-1">({(cond as any).note})</p>
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-muted-foreground hidden md:table-cell">
                                                                {cond.startDate || '—'}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* State Contract Credit Section */}
                            <div className="rounded-lg border">
                                <button
                                    onClick={() => toggleSection('stateContractCredit')}
                                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFA726]/20 text-[#FFA726]">
                                            <Building2 className="h-4 w-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium">{CONTRACT_CONDITIONS.stateContractCredit.title}</p>
                                            <p className="text-xs text-muted-foreground">{CONTRACT_CONDITIONS.stateContractCredit.partners.length} партнёров</p>
                                        </div>
                                    </div>
                                    {expandedSections.stateContractCredit ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                </button>
                                {expandedSections.stateContractCredit && (
                                    <div className="border-t">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50">
                                                <tr>
                                                    <th className="text-left p-3 font-medium">Партнёр</th>
                                                    <th className="text-left p-3 font-medium">Вознаграждение</th>
                                                    <th className="text-left p-3 font-medium hidden md:table-cell">Дата начала</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {CONTRACT_CONDITIONS.stateContractCredit.partners.map((item, idx) => (
                                                    item.conditions.map((cond, condIdx) => (
                                                        <tr key={`${idx}-${condIdx}`} className="border-t hover:bg-muted/30">
                                                            {condIdx === 0 && (
                                                                <td className="p-3 font-medium align-top" rowSpan={item.conditions.length}>
                                                                    {item.partner}
                                                                </td>
                                                            )}
                                                            <td className="p-3">
                                                                <span className="text-[#FFA726]">{cond.rate}</span>
                                                                {(cond as any).note && (
                                                                    <p className="text-xs text-muted-foreground mt-1">({(cond as any).note})</p>
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-muted-foreground hidden md:table-cell">
                                                                {cond.startDate || '—'}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Settlement Account Section */}
                            <div className="rounded-lg border">
                                <button
                                    onClick={() => toggleSection('settlementAccount')}
                                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9C27B0]/20 text-[#9C27B0]">
                                            <CreditCard className="h-4 w-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium">{CONTRACT_CONDITIONS.settlementAccount.title}</p>
                                            <p className="text-xs text-muted-foreground">{CONTRACT_CONDITIONS.settlementAccount.partners.length} партнёров</p>
                                        </div>
                                    </div>
                                    {expandedSections.settlementAccount ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                </button>
                                {expandedSections.settlementAccount && (
                                    <div className="border-t">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50">
                                                <tr>
                                                    <th className="text-left p-3 font-medium">Партнёр</th>
                                                    <th className="text-left p-3 font-medium">Вознаграждение</th>
                                                    <th className="text-left p-3 font-medium hidden md:table-cell">Дата начала</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {CONTRACT_CONDITIONS.settlementAccount.partners.map((item, idx) => (
                                                    item.conditions.map((cond, condIdx) => (
                                                        <tr key={`${idx}-${condIdx}`} className="border-t hover:bg-muted/30">
                                                            {condIdx === 0 && (
                                                                <td className="p-3 font-medium align-top" rowSpan={item.conditions.length}>
                                                                    {item.partner}
                                                                </td>
                                                            )}
                                                            <td className="p-3">
                                                                <span className="text-[#9C27B0]">{cond.rate}</span>
                                                                {(cond as any).note && (
                                                                    <p className="text-xs text-muted-foreground mt-1">({(cond as any).note})</p>
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-muted-foreground hidden md:table-cell">
                                                                {cond.startDate || '—'}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
