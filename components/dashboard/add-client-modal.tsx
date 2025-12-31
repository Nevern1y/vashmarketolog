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
import { Loader2, Building2 } from "lucide-react"
import { type CreateCompanyPayload } from "@/hooks/use-companies"

interface AddClientModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (client: CreateCompanyPayload) => Promise<void>
}

export function AddClientModal({ isOpen, onClose, onSubmit }: AddClientModalProps) {
    const [inn, setInn] = useState("")
    const [contactPerson, setContactPerson] = useState("")
    const [companyName, setCompanyName] = useState("")
    const [email, setEmail] = useState("")
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
                email: email.trim(),
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
        setErrors({})
    }

    const handleClose = () => {
        resetForm()
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3CE8D1]/10">
                            <Building2 className="h-5 w-5 text-[#3CE8D1]" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg">ДОБАВЛЕНИЕ НОВОГО КЛИЕНТА</DialogTitle>
                            <DialogDescription>
                                Заполните данные для добавления клиента в CRM
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

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
