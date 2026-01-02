"use client"

import { useState, useEffect } from "react"
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
    Loader2
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { authApi } from "@/lib/api"

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

// Agent documents for download
const AGENT_DOCUMENTS = [
    { id: "contract", name: "Агентский договор", extension: "pdf" },
    { id: "privacy_policy", name: "Политика обработки персональных данных", extension: "pdf" },
    { id: "offer", name: "Публичная оферта", extension: "pdf" },
    { id: "tariffs", name: "Тарифы на услуги", extension: "pdf" },
]

export function ProfileSettingsView() {
    const { user } = useAuth()
    const [isLinkCopied, setIsLinkCopied] = useState(false)

    // Role check - agents see Referrals tab, clients don't
    const isAgent = user?.role === "agent" || user?.role === "partner"

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

    const handleDownloadDocument = (docId: string, docName: string) => {
        // In production, this would trigger actual file download
        toast.info(`Скачивание: ${docName}`)
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

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Настройки</h1>
                <p className="text-muted-foreground">
                    Управление профилем и реквизитами партнера
                </p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className={`grid w-full bg-muted/50 ${isAgent ? 'grid-cols-4 md:grid-cols-8' : 'grid-cols-4 md:grid-cols-7'}`}>
                    <TabsTrigger value="profile" className="flex items-center gap-1 px-2">
                        <User className="h-4 w-4" />
                        <span className="hidden lg:inline text-xs">Профиль</span>
                    </TabsTrigger>
                    <TabsTrigger value="organization" className="flex items-center gap-1 px-2">
                        <Building2 className="h-4 w-4" />
                        <span className="hidden lg:inline text-xs">Организация</span>
                    </TabsTrigger>
                    <TabsTrigger value="requisites" className="flex items-center gap-1 px-2">
                        <CreditCard className="h-4 w-4" />
                        <span className="hidden lg:inline text-xs">Реквизиты</span>
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex items-center gap-1 px-2">
                        <FileText className="h-4 w-4" />
                        <span className="hidden lg:inline text-xs">Документы</span>
                    </TabsTrigger>
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
                </TabsList>

                {/* TAB 1: PROFILE */}
                <TabsContent value="profile" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Профиль пользователя</CardTitle>
                            <CardDescription>Основная информация о вашем аккаунте</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>ФИО</Label>
                                    <Input
                                        value={(user as any)?.full_name || user?.first_name || ""}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        value={user?.email || ""}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Телефон</Label>
                                    <Input
                                        value={user?.phone || "+7 (XXX) XXX-XX-XX"}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Роль</Label>
                                    <Input
                                        value={user?.role === "agent" ? "Агент" : user?.role === "partner" ? "Партнер" : user?.role || ""}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: REQUISITES (WAVE 3) */}
                <TabsContent value="requisites" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Банковские реквизиты
                            </CardTitle>
                            <CardDescription>
                                Реквизиты для получения комиссионных выплат
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="bankBik">БИК банка *</Label>
                                    <Input
                                        id="bankBik"
                                        placeholder="9 цифр"
                                        maxLength={9}
                                        value={bankBik}
                                        onChange={(e) => setBankBik(e.target.value.replace(/\D/g, ""))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bankName">Название банка</Label>
                                    <Input
                                        id="bankName"
                                        placeholder="ПАО Сбербанк"
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bankAccount">Расчётный счёт *</Label>
                                    <Input
                                        id="bankAccount"
                                        placeholder="20 цифр"
                                        maxLength={20}
                                        value={bankAccount}
                                        onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ""))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="corrAccount">Корр. счёт</Label>
                                    <Input
                                        id="corrAccount"
                                        placeholder="20 цифр"
                                        maxLength={20}
                                        value={corrAccount}
                                        onChange={(e) => setCorrAccount(e.target.value.replace(/\D/g, ""))}
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                                    <Percent className="h-4 w-4" />
                                    Налоговые сведения
                                </h4>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Система налогообложения *</Label>
                                        <Select value={taxSystem} onValueChange={setTaxSystem}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Выберите систему" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TAX_SYSTEMS.map((tax) => (
                                                    <SelectItem key={tax.value} value={tax.value}>
                                                        {tax.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ставка НДС *</Label>
                                        <Select value={vatRate} onValueChange={setVatRate}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Выберите ставку" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {VAT_RATES.map((rate) => (
                                                    <SelectItem key={rate.value} value={rate.value}>
                                                        {rate.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <Button className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]">
                                Сохранить реквизиты
                            </Button>
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
                                Скачайте необходимые документы для работы
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {AGENT_DOCUMENTS.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{doc.name}</p>
                                                <p className="text-xs text-muted-foreground uppercase">{doc.extension}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDownloadDocument(doc.id, doc.name)}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Скачать
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: ORGANIZATION (ТЗ Настройки) */}
                <TabsContent value="organization" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Данные организации
                            </CardTitle>
                            <CardDescription>
                                Информация о вашей компании
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>ИНН</Label>
                                    <Input placeholder="10 или 12 цифр" />
                                </div>
                                <div className="space-y-2">
                                    <Label>КПП</Label>
                                    <Input placeholder="9 цифр" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Наименование организации</Label>
                                    <Input placeholder="ООО «Название»" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Полное наименование</Label>
                                    <Input placeholder="Общество с ограниченной ответственностью" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Юридический адрес</Label>
                                    <Input placeholder="123456, г. Москва, ул. Примерная, д. 1" />
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium mb-4">Руководитель</h4>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>ФИО руководителя</Label>
                                        <Input placeholder="Иванов Иван Иванович" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Должность</Label>
                                        <Input placeholder="Генеральный директор" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Действует на основании</Label>
                                        <Select defaultValue="charter">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="charter">Устава</SelectItem>
                                                <SelectItem value="power_of_attorney">Доверенности</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <Button className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]">
                                Сохранить организацию
                            </Button>
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
            </Tabs>
        </div>
    )
}
