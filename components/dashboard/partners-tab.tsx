"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Building2,
    UserPlus,
    Copy,
    Check,
    Loader2,
    Mail,
    User,
    RefreshCw,
    CheckCircle2,
    Clock,
} from "lucide-react"
import { usePartners, type InvitePartnerPayload } from "@/hooks/use-partners"
import { cn } from "@/lib/utils"

export function PartnersTab() {
    const { partners, isLoading, error, refetch, invitePartner } = usePartners()

    // Invite dialog state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [inviteForm, setInviteForm] = useState<InvitePartnerPayload>({
        email: "",
        first_name: "",
        last_name: "",
        company_name: "",
    })
    const [inviteLink, setInviteLink] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [isInviting, setIsInviting] = useState(false)
    const [inviteError, setInviteError] = useState<string | null>(null)

    const handleInputChange = (field: keyof InvitePartnerPayload, value: string) => {
        setInviteForm(prev => ({ ...prev, [field]: value }))
    }

    const handleInvite = async () => {
        if (!inviteForm.email || !inviteForm.company_name) return

        setIsInviting(true)
        setInviteError(null)
        const result = await invitePartner(inviteForm)
        setIsInviting(false)

        if (result) {
            // Build full invite URL
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
            const fullLink = `${baseUrl}${result.invite_url}`
            setInviteLink(fullLink)
            setInviteError(null)
        } else if (error) {
            // Show the error from the hook
            setInviteError(error)
        }
    }

    const handleCopy = async () => {
        if (!inviteLink) return

        try {
            await navigator.clipboard.writeText(inviteLink)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy:", err)
        }
    }

    const handleCloseDialog = () => {
        setDialogOpen(false)
        setInviteForm({ email: "", first_name: "", last_name: "", company_name: "" })
        setInviteLink(null)
        setCopied(false)
        setInviteError(null)
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        })
    }

    return (
        <Card className="shadow-sm border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                    <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-[#3CE8D1]" />
                        Партнёры (Банки)
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Управление банками-партнёрами
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isLoading}
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                        Обновить
                    </Button>

                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2 bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]">
                                <UserPlus className="h-4 w-4" />
                                Пригласить партнёра
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-[#3CE8D1]" />
                                    Пригласить партнёра
                                </DialogTitle>
                                <DialogDescription>
                                    Заполните данные банка. После создания скопируйте ссылку и отправьте партнёру.
                                </DialogDescription>
                            </DialogHeader>

                            {!inviteLink ? (
                                <>
                                    {/* Error Display */}
                                    {inviteError && (
                                        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                                            {inviteError}
                                        </div>
                                    )}
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="company_name" className="text-sm font-medium">
                                                Название Банка *
                                            </Label>
                                            <div className="relative">
                                                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    id="company_name"
                                                    placeholder="Например: Сбербанк"
                                                    value={inviteForm.company_name}
                                                    onChange={(e) => handleInputChange("company_name", e.target.value)}
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-sm font-medium">
                                                Email менеджера *
                                            </Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="manager@bank.ru"
                                                    value={inviteForm.email}
                                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="first_name" className="text-sm font-medium">
                                                    Имя
                                                </Label>
                                                <Input
                                                    id="first_name"
                                                    placeholder="Иван"
                                                    value={inviteForm.first_name}
                                                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="last_name" className="text-sm font-medium">
                                                    Фамилия
                                                </Label>
                                                <Input
                                                    id="last_name"
                                                    placeholder="Петров"
                                                    value={inviteForm.last_name}
                                                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button variant="outline" onClick={handleCloseDialog}>
                                            Отмена
                                        </Button>
                                        <Button
                                            onClick={handleInvite}
                                            disabled={isInviting || !inviteForm.email || !inviteForm.company_name}
                                            className="gap-2 bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                                        >
                                            {isInviting ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <UserPlus className="h-4 w-4" />
                                            )}
                                            Создать приглашение
                                        </Button>
                                    </DialogFooter>
                                </>
                            ) : (
                                <>
                                    <div className="py-4 space-y-4">
                                        <div className="flex items-center justify-center">
                                            <div className="h-12 w-12 rounded-full bg-[#3CE8D1]/10 flex items-center justify-center">
                                                <CheckCircle2 className="h-6 w-6 text-[#3CE8D1]" />
                                            </div>
                                        </div>
                                        <p className="text-center text-sm text-muted-foreground">
                                            Приглашение успешно создано! Скопируйте ссылку и отправьте партнёру.
                                        </p>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Ссылка-приглашение</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    readOnly
                                                    value={inviteLink}
                                                    className="font-mono text-xs bg-accent"
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={handleCopy}
                                                    className={cn(
                                                        "shrink-0 transition-colors",
                                                        copied && "bg-[#3CE8D1]/10 border-[#3CE8D1]/30 text-[#3CE8D1]"
                                                    )}
                                                >
                                                    {copied ? (
                                                        <Check className="h-4 w-4" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                            {copied && (
                                                <p className="text-xs text-[#3CE8D1]">✓ Скопировано в буфер обмена</p>
                                            )}
                                        </div>

                                        <div className="bg-[#FFD93D]/10 border border-[#FFD93D]/30 rounded-lg p-3">
                                            <p className="text-xs text-[#FFD93D]">
                                                <strong>Важно:</strong> Отправьте эту ссылку партнёру в WhatsApp, Telegram или по Email.
                                                После перехода он сможет создать пароль и войти в систему.
                                            </p>
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button onClick={handleCloseDialog} className="w-full">
                                            Готово
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>

            <CardContent>
                {/* Loading */}
                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="text-center py-8 text-[#E03E9D]">
                        {error}
                    </div>
                )}

                {/* Table */}
                {!isLoading && !error && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-accent/50 border-b border-border">
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Банк / Менеджер
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Email
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Дата приглашения
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Статус
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {partners.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Building2 className="h-10 w-10 text-muted-foreground" />
                                                <p className="text-muted-foreground">Нет партнёров</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Нажмите "Пригласить партнёра" чтобы добавить банк
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    partners.map((partner) => {
                                        // Bank name is stored in last_name with format "Last (BankName)"
                                        // Extract bank name from last_name if it contains parentheses
                                        const lastNameParts = partner.last_name?.match(/(.+?)\s*\((.+)\)/)
                                        const bankName = lastNameParts ? lastNameParts[2] : partner.last_name
                                        const managerLastName = lastNameParts ? lastNameParts[1].trim() : ''
                                        const fullManagerName = `${partner.first_name || ''} ${managerLastName}`.trim() || '—'

                                        return (
                                            <tr key={partner.id} className="hover:bg-[#3CE8D1]/5">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-[#4F7DF3]/10 flex items-center justify-center">
                                                            <Building2 className="h-4 w-4 text-[#4F7DF3]" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-foreground">
                                                                {bankName || "—"}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {fullManagerName}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm text-muted-foreground">{partner.email}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm text-muted-foreground">
                                                        {formatDate(partner.date_joined)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {partner.is_active ? (
                                                        <Badge className="bg-[#3CE8D1]/10 text-[#3CE8D1] border border-[#3CE8D1]/30 gap-1">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Активирован
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-[#FFD93D]/10 text-[#FFD93D] border border-[#FFD93D]/30 gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            Ожидает
                                                        </Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
