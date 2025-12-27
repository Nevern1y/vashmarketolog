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

    const handleInputChange = (field: keyof InvitePartnerPayload, value: string) => {
        setInviteForm(prev => ({ ...prev, [field]: value }))
    }

    const handleInvite = async () => {
        if (!inviteForm.email || !inviteForm.company_name) return

        setIsInviting(true)
        const result = await invitePartner(inviteForm)
        setIsInviting(false)

        if (result) {
            // Build full invite URL
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
            const fullLink = `${baseUrl}${result.invite_url}`
            setInviteLink(fullLink)
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
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        })
    }

    return (
        <Card className="shadow-sm border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        Партнёры (Банки)
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
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
                            <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                                <UserPlus className="h-4 w-4" />
                                Пригласить партнёра
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-blue-600" />
                                    Пригласить партнёра
                                </DialogTitle>
                                <DialogDescription>
                                    Заполните данные банка. После создания скопируйте ссылку и отправьте партнёру.
                                </DialogDescription>
                            </DialogHeader>

                            {!inviteLink ? (
                                <>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="company_name" className="text-sm font-medium">
                                                Название Банка *
                                            </Label>
                                            <div className="relative">
                                                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
                                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
                                            className="gap-2 bg-blue-600 hover:bg-blue-700"
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
                                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                                            </div>
                                        </div>
                                        <p className="text-center text-sm text-gray-600">
                                            Приглашение успешно создано! Скопируйте ссылку и отправьте партнёру.
                                        </p>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Ссылка-приглашение</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    readOnly
                                                    value={inviteLink}
                                                    className="font-mono text-xs bg-gray-50"
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={handleCopy}
                                                    className={cn(
                                                        "shrink-0 transition-colors",
                                                        copied && "bg-green-50 border-green-300 text-green-600"
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
                                                <p className="text-xs text-green-600">✓ Скопировано в буфер обмена</p>
                                            )}
                                        </div>

                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                            <p className="text-xs text-amber-800">
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
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="text-center py-8 text-red-600">
                        {error}
                    </div>
                )}

                {/* Table */}
                {!isLoading && !error && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                                        Банк / Менеджер
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                                        Email
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                                        Дата приглашения
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                                        Статус
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {partners.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Building2 className="h-10 w-10 text-gray-300" />
                                                <p className="text-gray-500">Нет партнёров</p>
                                                <p className="text-sm text-gray-400">
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
                                            <tr key={partner.id} className="hover:bg-gray-50/50">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <Building2 className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {bankName || "—"}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                {fullManagerName}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm text-gray-600">{partner.email}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm text-gray-500">
                                                        {formatDate(partner.date_joined)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {partner.is_active ? (
                                                        <Badge className="bg-green-50 text-green-700 border border-green-200 gap-1">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Активирован
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-amber-50 text-amber-700 border border-amber-200 gap-1">
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
