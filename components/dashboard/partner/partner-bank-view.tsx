"use client"

import { useState, useEffect } from "react"
import { Landmark, Building2, FileText, Settings, Loader2, Save, X, Edit, Mail, Phone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { useApplications } from "@/hooks/use-applications"
import { usePartnerBankProfile, type PartnerBankProfileUpdate } from "@/hooks/use-bank-conditions"
import { toast } from "sonner"

/**
 * PartnerBankView - Partner's Bank/MFO profile with real API stats
 */
export function PartnerBankView() {
    // Fetch real applications data - backend filters for partner automatically
    const { applications, isLoading } = useApplications()
    
    // Fetch partner's bank profile
    const { profile, isLoading: isLoadingProfile, isSaving, updateProfile, refetch: refetchProfile } = usePartnerBankProfile()
    
    // Edit mode state
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState<PartnerBankProfileUpdate>({
        short_name: "",
        logo_url: "",
        contact_email: "",
        contact_phone: "",
        description: "",
    })

    // Sync form data with profile
    useEffect(() => {
        if (profile) {
            setFormData({
                short_name: profile.short_name || "",
                logo_url: profile.logo_url || "",
                contact_email: profile.contact_email || "",
                contact_phone: profile.contact_phone || "",
                description: profile.description || "",
            })
        }
    }, [profile])

    // Calculate stats from real data
    const stats = {
        // Active products = unique product types in approved applications
        activeProducts: isLoading ? null : new Set(
            applications.filter(a => a.status === 'approved').map(a => a.product_type)
        ).size,
        // Applications in review
        inReview: isLoading ? null : applications.filter(
            a => a.status === 'pending' || a.status === 'in_review'
        ).length,
        // Approval rate
        approvalRate: isLoading ? null : (() => {
            const decided = applications.filter(a => a.status === 'approved' || a.status === 'rejected')
            if (decided.length === 0) return 0
            const approved = decided.filter(a => a.status === 'approved').length
            return Math.round((approved / decided.length) * 100)
        })(),
    }

    const handleSave = async () => {
        const result = await updateProfile(formData)
        if (result) {
            toast.success("Профиль успешно сохранён")
            setIsEditing(false)
        } else {
            toast.error("Ошибка сохранения профиля")
        }
    }

    const handleCancel = () => {
        // Reset form to original values
        if (profile) {
            setFormData({
                short_name: profile.short_name || "",
                logo_url: profile.logo_url || "",
                contact_email: profile.contact_email || "",
                contact_phone: profile.contact_phone || "",
                description: profile.description || "",
            })
        }
        setIsEditing(false)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Мой банк / МФО</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Управление профилем финансовой организации
                    </p>
                </div>
            </div>

            {/* Stats Cards with Real Data */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#94a3b8]">
                            Типы продуктов
                        </CardTitle>
                        <FileText className="h-5 w-5 text-[#3CE8D1]" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-12 bg-[#1e3a5f]" />
                        ) : (
                            <div className="text-2xl font-bold text-white">{stats.activeProducts}</div>
                        )}
                        <p className="text-xs text-[#94a3b8]">с одобренными заявками</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#94a3b8]">
                            Заявок в работе
                        </CardTitle>
                        <Landmark className="h-5 w-5 text-[#3CE8D1]" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-12 bg-[#1e3a5f]" />
                        ) : (
                            <div className="text-2xl font-bold text-white">{stats.inReview}</div>
                        )}
                        <p className="text-xs text-[#94a3b8]">на рассмотрении</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#94a3b8]">
                            Одобрено
                        </CardTitle>
                        <Building2 className="h-5 w-5 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-12 bg-[#1e3a5f]" />
                        ) : (
                            <div className="text-2xl font-bold text-white">{stats.approvalRate}%</div>
                        )}
                        <p className="text-xs text-[#94a3b8]">коэффициент одобрения</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#94a3b8]">
                            Всего заявок
                        </CardTitle>
                        <Settings className="h-5 w-5 text-[#3CE8D1]" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-12 bg-[#1e3a5f]" />
                        ) : (
                            <div className="text-2xl font-bold text-white">{applications.length}</div>
                        )}
                        <p className="text-xs text-[#94a3b8]">за всё время</p>
                    </CardContent>
                </Card>
            </div>

            {/* Profile Card */}
            <Card className="bg-[#0f2042] border-[#1e3a5f]">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-white">Профиль организации</CardTitle>
                        <CardDescription className="text-[#94a3b8]">
                            Информация о вашей финансовой организации
                        </CardDescription>
                    </div>
                    {!isEditing && profile && (
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="border-[#3CE8D1]/30 text-[#3CE8D1] hover:bg-[#3CE8D1]/10"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Редактировать
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {isLoadingProfile ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
                        </div>
                    ) : !profile ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Landmark className="h-16 w-16 text-[#3CE8D1] mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Профиль не настроен
                            </h3>
                            <p className="text-sm text-[#94a3b8] text-center max-w-md">
                                Ваш профиль банка ещё не создан. Обратитесь к администратору
                                для привязки вашего аккаунта к банку.
                            </p>
                        </div>
                    ) : isEditing ? (
                        /* Edit Mode */
                        <div className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-[#94a3b8]">Наименование банка</Label>
                                    <Input
                                        value={profile.name}
                                        disabled
                                        className="bg-[#0a1628] border-[#1e3a5f] text-white/50"
                                    />
                                    <p className="text-xs text-[#94a3b8]">Изменение через администратора</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#94a3b8]">Краткое название</Label>
                                    <Input
                                        value={formData.short_name}
                                        onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                                        placeholder="Сбер, ВТБ и т.д."
                                        className="bg-[#0a1628] border-[#1e3a5f] text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-[#94a3b8]">
                                        <Mail className="h-4 w-4 inline mr-2" />
                                        Контактный email
                                    </Label>
                                    <Input
                                        type="email"
                                        value={formData.contact_email}
                                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                        placeholder="partner@bank.ru"
                                        className="bg-[#0a1628] border-[#1e3a5f] text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#94a3b8]">
                                        <Phone className="h-4 w-4 inline mr-2" />
                                        Контактный телефон
                                    </Label>
                                    <Input
                                        value={formData.contact_phone}
                                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                        placeholder="+7 (999) 123-45-67"
                                        className="bg-[#0a1628] border-[#1e3a5f] text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[#94a3b8]">URL логотипа</Label>
                                <Input
                                    value={formData.logo_url}
                                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                                    placeholder="https://example.com/logo.png"
                                    className="bg-[#0a1628] border-[#1e3a5f] text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[#94a3b8]">Описание</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Краткое описание вашей организации..."
                                    rows={4}
                                    className="bg-[#0a1628] border-[#1e3a5f] text-white resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                    className="border-[#1e3a5f] text-[#94a3b8] hover:bg-[#1e3a5f]/50"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Отмена
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#3CE8D1]/90"
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    Сохранить
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* View Mode */
                        <div className="space-y-6">
                            <div className="flex items-start gap-6">
                                {profile.logo_url ? (
                                    <img 
                                        src={profile.logo_url} 
                                        alt={profile.name}
                                        className="h-20 w-20 rounded-xl object-contain bg-white/5 p-2"
                                    />
                                ) : (
                                    <div className="h-20 w-20 rounded-xl bg-[#3CE8D1]/10 flex items-center justify-center">
                                        <Landmark className="h-10 w-10 text-[#3CE8D1]" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white">{profile.name}</h3>
                                    {profile.short_name && (
                                        <p className="text-[#94a3b8]">{profile.short_name}</p>
                                    )}
                                    <div className="flex items-center gap-4 mt-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            profile.is_active 
                                                ? 'bg-green-500/20 text-green-400' 
                                                : 'bg-red-500/20 text-red-400'
                                        }`}>
                                            {profile.is_active ? 'Активен' : 'Неактивен'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {profile.contact_email && (
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0a1628]">
                                        <Mail className="h-5 w-5 text-[#3CE8D1]" />
                                        <div>
                                            <p className="text-xs text-[#94a3b8]">Email</p>
                                            <p className="text-white">{profile.contact_email}</p>
                                        </div>
                                    </div>
                                )}
                                {profile.contact_phone && (
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0a1628]">
                                        <Phone className="h-5 w-5 text-[#3CE8D1]" />
                                        <div>
                                            <p className="text-xs text-[#94a3b8]">Телефон</p>
                                            <p className="text-white">{profile.contact_phone}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {profile.description && (
                                <div className="p-4 rounded-lg bg-[#0a1628]">
                                    <p className="text-xs text-[#94a3b8] mb-2">Описание</p>
                                    <p className="text-white whitespace-pre-wrap">{profile.description}</p>
                                </div>
                            )}

                            <div className="text-xs text-[#94a3b8]">
                                Обновлено: {new Date(profile.updated_at).toLocaleDateString('ru-RU', {
                                    day: '2-digit',
                                    month: '2-digit', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
