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
import { Loader2, Save, X, Edit } from "lucide-react"
import { useCRMClient, useCRMClientMutations, type CreateCompanyPayload } from "@/hooks/use-companies"
import { toast } from "sonner"

interface EditClientSheetProps {
    isOpen: boolean
    clientId: number | null
    onClose: () => void
    onSaved: () => void
    mode?: 'view' | 'edit' // NEW: view = read-only, edit = editable
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

export function EditClientSheet({ isOpen, clientId, onClose, onSaved, mode = 'edit' }: EditClientSheetProps) {
    const { client, isLoading, error: loadError } = useCRMClient(clientId)
    const { updateClient, isLoading: isSaving, error: saveError } = useCRMClientMutations()

    const [formData, setFormData] = useState<CompanyFormData>(initialFormData)

    // Determine if read-only mode
    const isReadOnly = mode === 'view'

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
        if (isReadOnly) return // Prevent changes in view mode
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    // Handle save
    const handleSave = async () => {
        if (!clientId || isReadOnly) return

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

    // Input component with read-only support
    const FormInput = ({
        label,
        field,
        placeholder = "",
        type = "text",
        maxLength,
        required = false,
        colSpan = 1
    }: {
        label: string
        field: keyof CompanyFormData
        placeholder?: string
        type?: string
        maxLength?: number
        required?: boolean
        colSpan?: number
    }) => (
        <div className={`space-y-2 ${colSpan === 2 ? 'md:col-span-2' : colSpan === 3 ? 'md:col-span-3' : colSpan === 4 ? 'md:col-span-4' : ''}`}>
            <Label className={isReadOnly ? "text-muted-foreground" : ""}>
                {label}{required && !isReadOnly && " *"}
            </Label>
            <Input
                type={type}
                placeholder={isReadOnly ? "—" : placeholder}
                value={formData[field]}
                onChange={(e) => handleChange(field, field.includes("passport_series") || field.includes("passport_number")
                    ? e.target.value.replace(/\D/g, "")
                    : e.target.value
                )}
                maxLength={maxLength}
                readOnly={isReadOnly}
                className={isReadOnly ? "bg-muted cursor-default" : ""}
            />
        </div>
    )

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col h-full">
                {/* Fixed Header */}
                <SheetHeader className="px-6 py-4 border-b bg-background shrink-0">
                    <SheetTitle>
                        {isReadOnly ? "Карточка клиента" : "Редактирование клиента"}
                    </SheetTitle>
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
                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            <div className="space-y-6 pb-4">
                                {/* General Info Section */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Общая информация
                                    </h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormInput label="ИНН" field="inn" placeholder="Введите ИНН" required />
                                        <FormInput label="КПП" field="kpp" placeholder="Введите КПП" />
                                        <FormInput label="ОГРН" field="ogrn" placeholder="Введите ОГРН" />
                                        <FormInput label="Полное наименование" field="name" placeholder="Полное наименование организации" required />
                                        <FormInput label="Сокращенное наименование" field="short_name" placeholder="Сокращенное наименование" colSpan={2} />
                                        <FormInput label="Юридический адрес" field="legal_address" placeholder="Юридический адрес" colSpan={2} />
                                        <FormInput label="Фактический адрес" field="actual_address" placeholder="Фактический адрес" colSpan={2} />
                                    </div>
                                </div>

                                {/* Director Section */}
                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Руководство
                                    </h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormInput label="Должность руководителя" field="director_position" placeholder="Генеральный директор" />
                                        <FormInput label="ФИО руководителя" field="director_name" placeholder="Иванов Иван Иванович" />
                                    </div>
                                </div>

                                {/* Passport Section */}
                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Паспортные данные руководителя
                                    </h3>
                                    <div className="grid gap-4 md:grid-cols-4">
                                        <FormInput label="Серия" field="passport_series" placeholder="0000" maxLength={4} />
                                        <FormInput label="Номер" field="passport_number" placeholder="000000" maxLength={6} />
                                        <FormInput label="Дата выдачи" field="passport_date" type="date" />
                                        <FormInput label="Код подразделения" field="passport_code" placeholder="000-000" maxLength={7} />
                                    </div>
                                    <FormInput label="Кем выдан" field="passport_issued_by" placeholder="ОТДЕЛОМ УФМС РОССИИ ПО Г. МОСКВЕ" />
                                </div>

                                {/* Bank Section */}
                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Банковские реквизиты
                                    </h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormInput label="Расчетный счет" field="bank_account" placeholder="40702810000000000000" />
                                        <FormInput label="БИК" field="bank_bic" placeholder="044525000" />
                                        <FormInput label="Банк" field="bank_name" placeholder="Название банка" />
                                        <FormInput label="Корр. счет" field="bank_corr_account" placeholder="30101810000000000000" />
                                    </div>
                                </div>

                                {/* Contact Section */}
                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Контактная информация
                                    </h3>
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <FormInput label="Контактное лицо" field="contact_person" placeholder="Иванов Иван Иванович" />
                                        <FormInput label="Email" field="contact_email" type="email" placeholder="email@example.com" />
                                        <FormInput label="Телефон" field="contact_phone" placeholder="+7 (XXX) XXX-XX-XX" />
                                        <FormInput label="Сайт" field="website" placeholder="https://example.com" colSpan={3} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fixed Footer */}
                        <SheetFooter className="px-6 py-4 border-t bg-muted/30 gap-2 sm:gap-2 shrink-0">
                            <Button variant="outline" onClick={onClose} disabled={isSaving}>
                                <X className="h-4 w-4 mr-2" />
                                {isReadOnly ? "Закрыть" : "Отмена"}
                            </Button>
                            {!isReadOnly && (
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
                            )}
                        </SheetFooter>
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}
