"use client"

import { useState, useEffect } from "react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Save, X } from "lucide-react"
import { useCRMClient, useCRMClientMutations, type CreateCompanyPayload } from "@/hooks/use-companies"
import { toast } from "sonner"

interface EditClientSheetProps {
    isOpen: boolean
    clientId: number | null
    onClose: () => void
    onSaved: () => void
}

// Helper to safely get string value (convert null/undefined to "")
const safeString = (value: string | null | undefined): string => value ?? ""

// Form state interface matching API fields
interface CompanyFormData {
    inn: string
    kpp: string
    ogrn: string
    name: string
    short_name: string
    legal_address: string
    actual_address: string
    director_name: string
    director_position: string
    // Passport fields
    passport_series: string
    passport_number: string
    passport_issued_by: string
    passport_date: string
    passport_code: string
    // Bank details
    bank_name: string
    bank_bic: string
    bank_account: string
    bank_corr_account: string
    // Contact
    contact_email: string
    contact_phone: string
    contact_person: string
    website: string
}

const initialFormData: CompanyFormData = {
    inn: "",
    kpp: "",
    ogrn: "",
    name: "",
    short_name: "",
    legal_address: "",
    actual_address: "",
    director_name: "",
    director_position: "",
    passport_series: "",
    passport_number: "",
    passport_issued_by: "",
    passport_date: "",
    passport_code: "",
    bank_name: "",
    bank_bic: "",
    bank_account: "",
    bank_corr_account: "",
    contact_email: "",
    contact_phone: "",
    contact_person: "",
    website: "",
}

export function EditClientSheet({ isOpen, clientId, onClose, onSaved }: EditClientSheetProps) {
    const { client, isLoading, error: loadError } = useCRMClient(clientId)
    const { updateClient, isLoading: isSaving, error: saveError } = useCRMClientMutations()

    const [formData, setFormData] = useState<CompanyFormData>(initialFormData)

    // Reset form when client data loads
    useEffect(() => {
        if (client) {
            setFormData({
                inn: safeString(client.inn),
                kpp: safeString(client.kpp),
                ogrn: safeString(client.ogrn),
                name: safeString(client.name),
                short_name: safeString(client.short_name),
                legal_address: safeString(client.legal_address),
                actual_address: safeString(client.actual_address),
                director_name: safeString(client.director_name),
                director_position: safeString(client.director_position),
                passport_series: safeString(client.passport_series),
                passport_number: safeString(client.passport_number),
                passport_issued_by: safeString(client.passport_issued_by),
                passport_date: safeString(client.passport_date),
                passport_code: safeString(client.passport_code),
                bank_name: safeString(client.bank_name),
                bank_bic: safeString(client.bank_bic),
                bank_account: safeString(client.bank_account),
                bank_corr_account: safeString(client.bank_corr_account),
                contact_email: safeString(client.contact_email),
                contact_phone: safeString(client.contact_phone),
                contact_person: safeString(client.contact_person),
                website: safeString(client.website),
            })
        }
    }, [client])

    // Reset form when sheet closes
    useEffect(() => {
        if (!isOpen) {
            setFormData(initialFormData)
        }
    }, [isOpen])

    // Handle form field change
    const handleChange = (field: keyof CompanyFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    // Handle save
    const handleSave = async () => {
        if (!clientId) return

        const payload: Partial<CreateCompanyPayload> = {
            inn: formData.inn,
            kpp: formData.kpp,
            ogrn: formData.ogrn,
            name: formData.name,
            short_name: formData.short_name,
            legal_address: formData.legal_address,
            actual_address: formData.actual_address,
            director_name: formData.director_name,
            director_position: formData.director_position,
            passport_series: formData.passport_series || undefined,
            passport_number: formData.passport_number || undefined,
            passport_issued_by: formData.passport_issued_by || undefined,
            passport_date: formData.passport_date || undefined,
            passport_code: formData.passport_code || undefined,
            bank_name: formData.bank_name,
            bank_bic: formData.bank_bic,
            bank_account: formData.bank_account,
            bank_corr_account: formData.bank_corr_account,
            contact_email: formData.contact_email,
            contact_phone: formData.contact_phone,
            contact_person: formData.contact_person,
            website: formData.website,
        }

        const result = await updateClient(clientId, payload)

        if (result) {
            toast.success("Данные клиента сохранены")
            onSaved()
            onClose()
        } else {
            toast.error(saveError || "Ошибка сохранения данных")
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
                <SheetHeader className="px-6 py-4 border-b">
                    <SheetTitle>Редактирование клиента</SheetTitle>
                    <SheetDescription>
                        {client?.name || client?.short_name || "Загрузка..."}
                    </SheetDescription>
                </SheetHeader>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-[#00d4aa]" />
                            <p className="text-muted-foreground">Загрузка данных клиента...</p>
                        </div>
                    </div>
                ) : loadError ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-red-500">
                            <p>Ошибка загрузки: {loadError}</p>
                            <Button variant="outline" className="mt-4" onClick={onClose}>
                                Закрыть
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="flex-1 px-6 py-4">
                            <div className="space-y-6">
                                {/* General Info Section */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Общая информация
                                    </h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>ИНН *</Label>
                                            <Input
                                                placeholder="Введите ИНН"
                                                value={formData.inn}
                                                onChange={(e) => handleChange("inn", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>КПП</Label>
                                            <Input
                                                placeholder="Введите КПП"
                                                value={formData.kpp}
                                                onChange={(e) => handleChange("kpp", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>ОГРН</Label>
                                            <Input
                                                placeholder="Введите ОГРН"
                                                value={formData.ogrn}
                                                onChange={(e) => handleChange("ogrn", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Полное наименование *</Label>
                                            <Input
                                                placeholder="Полное наименование организации"
                                                value={formData.name}
                                                onChange={(e) => handleChange("name", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Сокращенное наименование</Label>
                                            <Input
                                                placeholder="Сокращенное наименование"
                                                value={formData.short_name}
                                                onChange={(e) => handleChange("short_name", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Юридический адрес</Label>
                                            <Input
                                                placeholder="Юридический адрес"
                                                value={formData.legal_address}
                                                onChange={(e) => handleChange("legal_address", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Фактический адрес</Label>
                                            <Input
                                                placeholder="Фактический адрес"
                                                value={formData.actual_address}
                                                onChange={(e) => handleChange("actual_address", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Director Section */}
                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Руководство
                                    </h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Должность руководителя</Label>
                                            <Input
                                                placeholder="Генеральный директор"
                                                value={formData.director_position}
                                                onChange={(e) => handleChange("director_position", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>ФИО руководителя</Label>
                                            <Input
                                                placeholder="Иванов Иван Иванович"
                                                value={formData.director_name}
                                                onChange={(e) => handleChange("director_name", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Passport Section */}
                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Паспортные данные руководителя
                                    </h3>
                                    <div className="grid gap-4 md:grid-cols-4">
                                        <div className="space-y-2">
                                            <Label>Серия</Label>
                                            <Input
                                                placeholder="0000"
                                                maxLength={4}
                                                value={formData.passport_series}
                                                onChange={(e) => handleChange("passport_series", e.target.value.replace(/\D/g, ""))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Номер</Label>
                                            <Input
                                                placeholder="000000"
                                                maxLength={6}
                                                value={formData.passport_number}
                                                onChange={(e) => handleChange("passport_number", e.target.value.replace(/\D/g, ""))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Дата выдачи</Label>
                                            <Input
                                                type="date"
                                                value={formData.passport_date}
                                                onChange={(e) => handleChange("passport_date", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Код подразделения</Label>
                                            <Input
                                                placeholder="000-000"
                                                maxLength={7}
                                                value={formData.passport_code}
                                                onChange={(e) => handleChange("passport_code", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Кем выдан</Label>
                                        <Input
                                            placeholder="ОТДЕЛОМ УФМС РОССИИ ПО Г. МОСКВЕ"
                                            value={formData.passport_issued_by}
                                            onChange={(e) => handleChange("passport_issued_by", e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Bank Section */}
                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Банковские реквизиты
                                    </h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Расчетный счет</Label>
                                            <Input
                                                placeholder="40702810000000000000"
                                                value={formData.bank_account}
                                                onChange={(e) => handleChange("bank_account", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>БИК</Label>
                                            <Input
                                                placeholder="044525000"
                                                value={formData.bank_bic}
                                                onChange={(e) => handleChange("bank_bic", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Банк</Label>
                                            <Input
                                                placeholder="Название банка"
                                                value={formData.bank_name}
                                                onChange={(e) => handleChange("bank_name", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Корр. счет</Label>
                                            <Input
                                                placeholder="30101810000000000000"
                                                value={formData.bank_corr_account}
                                                onChange={(e) => handleChange("bank_corr_account", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Section */}
                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Контактная информация
                                    </h3>
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label>Контактное лицо</Label>
                                            <Input
                                                placeholder="Иванов Иван Иванович"
                                                value={formData.contact_person}
                                                onChange={(e) => handleChange("contact_person", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input
                                                type="email"
                                                placeholder="email@example.com"
                                                value={formData.contact_email}
                                                onChange={(e) => handleChange("contact_email", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Телефон</Label>
                                            <Input
                                                placeholder="+7 (XXX) XXX-XX-XX"
                                                value={formData.contact_phone}
                                                onChange={(e) => handleChange("contact_phone", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-3">
                                            <Label>Сайт</Label>
                                            <Input
                                                placeholder="https://example.com"
                                                value={formData.website}
                                                onChange={(e) => handleChange("website", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>

                        <SheetFooter className="px-6 py-4 border-t gap-2 sm:gap-2">
                            <Button variant="outline" onClick={onClose} disabled={isSaving}>
                                <X className="h-4 w-4 mr-2" />
                                Отмена
                            </Button>
                            <Button
                                className="bg-[#00d4aa] text-white hover:bg-[#00b894]"
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Сохранение...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Сохранить
                                    </>
                                )}
                            </Button>
                        </SheetFooter>
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}
