"use client"

import { useState, useRef, useEffect } from "react"
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
    Share2,
    Copy,
    Download,
    Check,
    QrCode,
    Bell,
    Shield,
    Phone,
    Lock,
    Mail,
    MessageCircle,
    ExternalLink,
    Loader2,
    Camera,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import api, { authApi } from "@/lib/api"
import { useAvatar } from "@/hooks/use-avatar"
import { useNotificationSettings } from "@/hooks/use-notification-settings"
import { formatPhoneNumber } from "@/lib/utils"

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





export function ProfileSettingsView() {
    const { user, refreshUser } = useAuth()
    const [isLinkCopied, setIsLinkCopied] = useState(false)

    // Role check - partners see Referrals tab, clients don't
    const isPartner = user?.role === "partner"
    const isClient = user?.role === "client"

    // Profile editing state
    const [isEditingProfile, setIsEditingProfile] = useState(false)
    const [profileFullName, setProfileFullName] = useState((user as any)?.full_name || user?.first_name || "")
    const [profileEmail, setProfileEmail] = useState(user?.email || "")
    const [profilePhone, setProfilePhone] = useState(user?.phone || "")
    const [isSavingProfile, setIsSavingProfile] = useState(false)
    const [isSendingVerification, setIsSendingVerification] = useState(false)

    // Form state for requisites
    const [bankBik, setBankBik] = useState("")
    const [bankName, setBankName] = useState("")
    const [bankAccount, setBankAccount] = useState("")
    const [corrAccount, setCorrAccount] = useState("")
    const [taxSystem, setTaxSystem] = useState("")
    const [vatRate, setVatRate] = useState("")

    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isSavingPassword, setIsSavingPassword] = useState(false)

    // Feedback form state
    const [feedbackTopic, setFeedbackTopic] = useState("")
    const [feedbackMessage, setFeedbackMessage] = useState("")
    const [isSendingFeedback, setIsSendingFeedback] = useState(false)

    const {
        settings: notificationSettings,
        isLoading: isNotificationsLoading,
        error: notificationsError,
        updateSettings: updateNotificationSettings,
    } = useNotificationSettings()

    const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true)
    const [emailNewApplicationsEnabled, setEmailNewApplicationsEnabled] = useState(true)
    const [emailStatusChangesEnabled, setEmailStatusChangesEnabled] = useState(true)
    const [emailChatMessagesEnabled, setEmailChatMessagesEnabled] = useState(true)
    const [emailMarketingEnabled, setEmailMarketingEnabled] = useState(false)
    const [isSavingNotifications, setIsSavingNotifications] = useState(false)


    const avatarInputRef = useRef<HTMLInputElement>(null)

    // Use global avatar hook
    const { avatar: avatarPreview, updateAvatar, getInitials } = useAvatar()
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

    // Handle avatar upload
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Пожалуйста, выберите изображение")
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Размер файла не должен превышать 5MB")
            return
        }

        setIsUploadingAvatar(true)

        try {
            // Optimistic review
            const reader = new FileReader()
            reader.onload = () => {
                const base64 = reader.result as string
                updateAvatar(base64)
            }
            reader.readAsDataURL(file)

            // Upload to backend
            await authApi.updateAvatar(file)
            toast.success("Фото профиля обновлено")

            if (refreshUser) {
                await refreshUser()
            }
        } catch (error: any) {
            toast.error(error.message || "Ошибка при загрузке фото")
            console.error(error)
        } finally {
            setIsUploadingAvatar(false)
        }
    }



    // Generate referral link
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const referralLink = `${siteUrl}/auth?ref=${user?.id || 'AGENT123'}`

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

    const isEmailVerified = Boolean(user?.email_verified)

    useEffect(() => {
        if (!notificationSettings) return
        setEmailNotificationsEnabled(notificationSettings.email_enabled)
        setEmailNewApplicationsEnabled(notificationSettings.email_new_applications)
        setEmailStatusChangesEnabled(notificationSettings.email_status_changes)
        setEmailChatMessagesEnabled(notificationSettings.email_chat_messages)
        setEmailMarketingEnabled(notificationSettings.email_marketing)
    }, [notificationSettings])

    const handleSendVerification = async () => {
        if (!user?.email) {
            toast.error("Email не указан")
            return
        }

        setIsSendingVerification(true)
        try {
            await api.post("/auth/email/send-verification/")
            toast.success("Письмо отправлено", {
                description: "Проверьте почту и подтвердите email"
            })
        } catch (error: any) {
            toast.error(error.message || "Не удалось отправить письмо")
        } finally {
            setIsSendingVerification(false)
        }
    }

    const handleSaveNotificationSettings = async () => {
        setIsSavingNotifications(true)
        try {
            const result = await updateNotificationSettings({
                email_enabled: emailNotificationsEnabled,
                email_new_applications: emailNewApplicationsEnabled,
                email_status_changes: emailStatusChangesEnabled,
                email_chat_messages: emailChatMessagesEnabled,
                email_marketing: emailMarketingEnabled,
            })
            if (result) {
                toast.success("Настройки уведомлений сохранены")
            } else {
                toast.error("Ошибка сохранения настроек")
            }
        } finally {
            setIsSavingNotifications(false)
        }
    }

    // Handle profile save
    const handleSaveProfile = async () => {
        setIsSavingProfile(true)
        try {
            // Split full name into first and last name for backend
            const nameParts = profileFullName.trim().split(' ')
            const firstName = nameParts[0] || ""
            const lastName = nameParts.slice(1).join(' ') || ""

            await authApi.updateProfile({
                first_name: firstName,
                last_name: lastName,
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

    // Handle feedback form submission via mailto
    const handleSendFeedback = () => {
        if (!feedbackTopic) {
            toast.error("Выберите тему обращения")
            return
        }
        if (!feedbackMessage.trim()) {
            toast.error("Введите сообщение")
            return
        }

        setIsSendingFeedback(true)

        const topicLabels: Record<string, string> = {
            technical: "Техническая поддержка",
            billing: "Вопросы по оплате",
            partnership: "Партнерство",
            other: "Другое"
        }

        const subject = encodeURIComponent(`[${topicLabels[feedbackTopic] || feedbackTopic}] Обращение от ${user?.email || 'пользователя'}`)
        const body = encodeURIComponent(feedbackMessage)
        const mailtoLink = `mailto:info@lidergarant.ru?subject=${subject}&body=${body}`

        window.location.href = mailtoLink

        // Show success toast and reset form
        setTimeout(() => {
            toast.success("Email-клиент открыт для отправки сообщения")
            setFeedbackTopic("")
            setFeedbackMessage("")
            setIsSendingFeedback(false)
        }, 500)
    }

    // Cancel profile editing
    const handleCancelEdit = () => {
        setProfileFullName((user as any)?.full_name || user?.first_name || "")
        setProfileEmail(user?.email || "")
        setProfilePhone(user?.phone || "")
        setIsEditingProfile(false)
    }

    const notificationsControlsDisabled = isNotificationsLoading || isSavingNotifications
    const categoryControlsDisabled = notificationsControlsDisabled || !emailNotificationsEnabled

    return (
        <div className="p-3 md:p-6 space-y-4 md:space-y-6">
            <div>
                <h1 className="text-xl md:text-2xl font-bold">Настройки</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                    Управление профилем и реквизитами партнера
                </p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                {/* Horizontal scroll for tabs on mobile */}
                <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0 scrollbar-hide">
                    <TabsList className={`inline-flex min-w-max w-full bg-muted/50 ${isClient
                        ? 'md:grid md:grid-cols-4'
                        : isPartner
                            ? 'md:grid md:grid-cols-6'
                            : 'md:grid md:grid-cols-5'
                        }`}>
                        <TabsTrigger value="profile" className="flex items-center gap-1 px-3 text-xs md:text-sm">
                            <User className="h-4 w-4" />
                            <span className="md:inline">Профиль</span>
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="flex items-center gap-1 px-3 text-xs md:text-sm">
                            <Bell className="h-4 w-4" />
                            <span className="hidden lg:inline">Уведомления</span>
                        </TabsTrigger>
                        <TabsTrigger value="security" className="flex items-center gap-1 px-3 text-xs md:text-sm">
                            <Shield className="h-4 w-4" />
                            <span className="hidden lg:inline">Безопасность</span>
                        </TabsTrigger>
                        <TabsTrigger value="contacts" className="flex items-center gap-1 px-3 text-xs md:text-sm">
                            <Phone className="h-4 w-4" />
                            <span className="hidden lg:inline">Контакты</span>
                        </TabsTrigger>
                        {isPartner && (
                            <TabsTrigger value="referrals" className="flex items-center gap-1 px-3 text-xs md:text-sm">
                                <Share2 className="h-4 w-4" />
                                <span className="hidden lg:inline">Рефералы</span>
                            </TabsTrigger>
                        )}
                    </TabsList>
                </div>

                {/* TAB 1: PROFILE */}
                <TabsContent value="profile" className="mt-4 md:mt-6">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                            <div>
                                <CardTitle className="text-base md:text-lg">Профиль пользователя</CardTitle>
                                <CardDescription className="text-xs md:text-sm">Основная информация о вашем аккаунте</CardDescription>
                            </div>
                            {!isEditingProfile && (
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditingProfile(true)}
                                    className="border-[#3CE8D1] text-[#3CE8D1] hover:bg-[#3CE8D1]/10 w-full sm:w-auto"
                                >
                                    Редактировать
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4 md:space-y-6">
                            {/* Avatar Section */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                                <div className="relative">
                                    <Avatar className="h-20 w-20 md:h-24 md:w-24">
                                        <AvatarImage src={avatarPreview || undefined} alt="Фото профиля" />
                                        <AvatarFallback className="bg-[#3CE8D1]/10 text-[#3CE8D1] text-xl md:text-2xl">
                                            {(profileFullName || user?.first_name || "U").charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <button
                                        className="absolute -bottom-1 -right-1 flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] transition-colors"
                                        onClick={() => avatarInputRef.current?.click()}
                                        disabled={isUploadingAvatar}
                                    >
                                        {isUploadingAvatar ? (
                                            <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                                        ) : (
                                            <Camera className="h-3 w-3 md:h-4 md:w-4" />
                                        )}
                                    </button>
                                    <input
                                        ref={avatarInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarUpload}
                                    />
                                </div>
                                <div className="text-center sm:text-left">
                                    <p className="font-medium text-sm md:text-base">Фото профиля</p>
                                    <p className="text-xs md:text-sm text-muted-foreground">JPG, PNG или GIF. Макс. 5MB</p>
                                </div>
                            </div>

                            {/* Profile Fields */}
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
                                        onChange={(e) => setProfilePhone(formatPhoneNumber(e.target.value))}
                                        disabled={!isEditingProfile}
                                        className={!isEditingProfile ? "bg-muted" : ""}
                                        placeholder="+7(XXX)XXX-XX-XX"
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
                                Приглашайте агентов и отслеживайте их активность
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Info Box */}
                            <div className="rounded-lg bg-[#3CE8D1]/10 border border-[#3CE8D1]/30 p-4">
                                <p className="text-sm">
                                    За агентов, пришедших и зарегистрировавшихся по вашей реферальной ссылке,
                                    вы сможете отслеживать их активность и заявки в системе.
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

                {/* TAB 4: DOCUMENTS - Moved to Banks page (agent-banks-view.tsx) */}

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
                                    <Switch
                                        checked={emailNotificationsEnabled}
                                        onCheckedChange={setEmailNotificationsEnabled}
                                        disabled={notificationsControlsDisabled}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <MessageCircle className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">SMS-уведомления</p>
                                            <p className="text-sm text-muted-foreground">Получать SMS о статусе заявок</p>
                                            <p className="text-xs text-muted-foreground">В разработке</p>
                                        </div>
                                    </div>
                                    <Switch checked={false} disabled />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <Bell className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">Push-уведомления</p>
                                            <p className="text-sm text-muted-foreground">Уведомления в браузере</p>
                                            <p className="text-xs text-muted-foreground">В разработке</p>
                                        </div>
                                    </div>
                                    <Switch checked={false} disabled />
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium">Категории email-уведомлений</h4>
                                <p className="text-xs text-muted-foreground mt-1 mb-4">
                                    Настройки применяются только к email. Уведомления в кабинете остаются активными.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Новые заявки</span>
                                        <Switch
                                            checked={emailNewApplicationsEnabled}
                                            onCheckedChange={setEmailNewApplicationsEnabled}
                                            disabled={categoryControlsDisabled}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Изменения статуса</span>
                                        <Switch
                                            checked={emailStatusChangesEnabled}
                                            onCheckedChange={setEmailStatusChangesEnabled}
                                            disabled={categoryControlsDisabled}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Сообщения в чате</span>
                                        <Switch
                                            checked={emailChatMessagesEnabled}
                                            onCheckedChange={setEmailChatMessagesEnabled}
                                            disabled={categoryControlsDisabled}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Маркетинговые рассылки</span>
                                        <Switch
                                            checked={emailMarketingEnabled}
                                            onCheckedChange={setEmailMarketingEnabled}
                                            disabled={categoryControlsDisabled}
                                        />
                                    </div>
                                </div>
                            </div>
                            {notificationsError && (
                                <p className="text-xs text-destructive">{notificationsError}</p>
                            )}
                            <Button
                                className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                                onClick={handleSaveNotificationSettings}
                                disabled={notificationsControlsDisabled}
                            >
                                {isSavingNotifications ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : null}
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
                                <h4 className="text-sm font-medium">Подтверждение email</h4>
                                <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-medium">{user?.email || "Email"}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {isEmailVerified ? "Email подтверждён" : "Email не подтверждён"}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={handleSendVerification}
                                        disabled={isSendingVerification || isEmailVerified}
                                    >
                                        {isSendingVerification ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Mail className="h-4 w-4 mr-2" />
                                        )}
                                        {isEmailVerified ? "Подтверждено" : "Отправить письмо"}
                                    </Button>
                                </div>
                            </div>
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
                                <a
                                    href="https://api.whatsapp.com/send/?phone=79652841415&text&type=phone_number&app_absent=0"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-4 rounded-lg border space-y-2 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-5 w-5 text-[#25D366]" />
                                        <span className="font-medium">WhatsApp</span>
                                    </div>
                                    <p className="text-lg font-bold">+7 (965) 284-14-15</p>
                                    <p className="text-sm text-muted-foreground">Нажмите чтобы написать</p>
                                </a>
                                <a
                                    href="mailto:info@lidergarant.ru"
                                    className="p-4 rounded-lg border space-y-2 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-5 w-5 text-[#3CE8D1]" />
                                        <span className="font-medium">Email</span>
                                    </div>
                                    <p className="text-lg font-bold">info@lidergarant.ru</p>
                                    <p className="text-sm text-muted-foreground">Ответ в течение 24 часов</p>
                                </a>
                            </div>
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium mb-4">Обратная связь</h4>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Тема обращения</Label>
                                        <Select value={feedbackTopic} onValueChange={setFeedbackTopic}>
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
                                            value={feedbackMessage}
                                            onChange={(e) => setFeedbackMessage(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                                        onClick={handleSendFeedback}
                                        disabled={isSendingFeedback}
                                    >
                                        {isSendingFeedback ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : null}
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
                                    <a href="https://t.me/lidergarant" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#3CE8D1] hover:underline">
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
