"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Building2, Eye, EyeOff } from "lucide-react"
import { type CreateCompanyPayload } from "@/hooks/use-companies"

// Extended payload with password for TEST MODE
interface AddClientPayload extends CreateCompanyPayload {
    password?: string
}

interface AddClientModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (client: AddClientPayload) => Promise<void>
}

export function AddClientModal({ isOpen, onClose, onSubmit }: AddClientModalProps) {
    const [inn, setInn] = useState("")
    const [contactPerson, setContactPerson] = useState("")
    const [companyName, setCompanyName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {}

        // Validate INN (10 or 12 digits)
        const cleanInn = inn.replace(/\D/g, "")
        if (!cleanInn) {
            newErrors.inn = "ИНН обязателен"
        } else if (cleanInn.length !== 10 && cleanInn.length !== 12) {
            newErrors.inn = "ИНН должен содержать 10 или 12 цифр"
        }

        // Validate contact person
        if (!contactPerson.trim()) {
            newErrors.contactPerson = "ФИО контактного лица обязательно"
        }

        // Validate company name
        if (!companyName.trim()) {
            newErrors.companyName = "Наименование компании обязательно"
        }

        // Validate email
        if (!email.trim()) {
            newErrors.email = "Email обязателен"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = "Введите корректный email"
        }

        // Validate password (optional but if provided must be strong)
        if (password && password.length < 6) {
            newErrors.password = "Пароль должен быть минимум 6 символов"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validateForm()) return

        setIsSubmitting(true)
        try {
            await onSubmit({
                inn: inn.replace(/\D/g, ""),
                name: companyName.trim(),
                short_name: companyName.trim(),
                contact_person: contactPerson.trim(),
                contact_email: email.trim(),  // Backend expects contact_email
                ...(password && { password: password }),
            })
            resetForm()
        } catch (error) {
            console.error("Failed to add client:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = () => {
        setInn("")
        setContactPerson("")
        setCompanyName("")
        setEmail("")
        setPassword("")
        setShowPassword(false)
        setErrors({})
    }

    const handleClose = () => {
        resetForm()
        onClose()
    }

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            handleClose()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3CE8D1]/10">
                            <Building2 className="h-5 w-5 text-[#3CE8D1]" />
                        </div>
                        <div>
                            <DialogTitle>ДОБАВЛЕНИЕ НОВОГО КЛИЕНТА</DialogTitle>
                            <DialogDescription>
                                Заполните данные для добавления клиента в CRM
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Invitation Info Block */}
                <div className="rounded-lg bg-[#3CE8D1]/10 border border-[#3CE8D1]/30 p-3 text-sm">
                    <p className="text-foreground">
                        {password ? (
                            <><strong>Тестовый режим:</strong> Пользователь будет создан сразу с указанным паролем. Статус клиента — <strong>«Закреплен»</strong>.</>
                        ) : (
                            <>После добавления клиент получит <strong>письмо с приглашением</strong> на портал Лидер Гарант. После регистрации и прохождения аккредитации статус изменится на <strong>«Закреплен»</strong>.</>
                        )}
                    </p>
                </div>

                <div className="space-y-4 py-4">
                    {/* ИНН */}
                    <div className="space-y-2">
                        <Label htmlFor="inn">ИНН *</Label>
                        <Input
                            id="inn"
                            placeholder="1234567890"
                            value={inn}
                            onChange={(e) => setInn(e.target.value)}
                            className={errors.inn ? "border-red-500" : ""}
                            maxLength={12}
                        />
                        {errors.inn && (
                            <p className="text-xs text-red-500">{errors.inn}</p>
                        )}
                    </div>

                    {/* ФИО контактного лица */}
                    <div className="space-y-2">
                        <Label htmlFor="contactPerson">ФИО контактного лица *</Label>
                        <Input
                            id="contactPerson"
                            placeholder="Иванов Иван Иванович"
                            value={contactPerson}
                            onChange={(e) => setContactPerson(e.target.value)}
                            className={errors.contactPerson ? "border-red-500" : ""}
                        />
                        {errors.contactPerson && (
                            <p className="text-xs text-red-500">{errors.contactPerson}</p>
                        )}
                    </div>

                    {/* Наименование компании */}
                    <div className="space-y-2">
                        <Label htmlFor="companyName">Наименование компании *</Label>
                        <Input
                            id="companyName"
                            placeholder="ООО «Ромашка»"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className={errors.companyName ? "border-red-500" : ""}
                        />
                        {errors.companyName && (
                            <p className="text-xs text-red-500">{errors.companyName}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="client@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500">{errors.email}</p>
                        )}
                    </div>

                    {/* Password - Optional for TEST MODE */}
                    <div className="space-y-2">
                        <Label htmlFor="password">Пароль (тестовый режим)</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Оставьте пустым для отправки приглашения"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Если указать пароль, пользователь будет создан сразу без приглашения</p>
                        {errors.password && (
                            <p className="text-xs text-red-500">{errors.password}</p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Отмена
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Добавление...
                            </>
                        ) : (
                            "ДОБАВИТЬ КЛИЕНТА"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
