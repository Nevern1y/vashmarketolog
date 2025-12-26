"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Loader2, Copy, Check, ExternalLink } from "lucide-react"
import { useMyCompany, type CreateCompanyPayload } from "@/hooks/use-companies"
import { useToast } from "@/hooks/use-toast"

interface Manager {
  id: string
  position: string
  fullName: string
  share: string
}

interface ContactPerson {
  id: string
  position: string
  fullName: string
  email: string
  phone: string
}

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
  // Passport fields (API-Ready for Realist Bank)
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

// Helper to safely get string value (convert null/undefined to "")
const safeString = (value: string | null | undefined): string => value ?? ""

export function MyCompanyView() {
  const { company, isLoading, isSaving, error, updateCompany, createCompany } = useMyCompany()
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState<CompanyFormData>({
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
  })

  // UI state
  const [managers, setManagers] = useState<Manager[]>([])
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([])
  const [showManagerForm, setShowManagerForm] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [addressCopied, setAddressCopied] = useState(false)

  // Reset form when company data loads
  useEffect(() => {
    if (company) {
      setFormData({
        inn: safeString(company.inn),
        kpp: safeString(company.kpp),
        ogrn: safeString(company.ogrn),
        name: safeString(company.name),
        short_name: safeString(company.short_name),
        legal_address: safeString(company.legal_address),
        actual_address: safeString(company.actual_address),
        director_name: safeString(company.director_name),
        director_position: safeString(company.director_position),
        passport_series: safeString(company.passport_series),
        passport_number: safeString(company.passport_number),
        passport_issued_by: safeString(company.passport_issued_by),
        passport_date: safeString(company.passport_date),
        passport_code: safeString(company.passport_code),
        bank_name: safeString(company.bank_name),
        bank_bic: safeString(company.bank_bic),
        bank_account: safeString(company.bank_account),
        bank_corr_account: safeString(company.bank_corr_account),
        contact_email: safeString(company.contact_email),
        contact_phone: safeString(company.contact_phone),
        contact_person: safeString(company.contact_person),
        website: safeString(company.website),
      })
    }
  }, [company])

  // Handle form field change
  const handleChange = (field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Copy legal address to actual address
  const copyLegalToActual = () => {
    setFormData(prev => ({ ...prev, actual_address: prev.legal_address }))
    setAddressCopied(true)
    setTimeout(() => setAddressCopied(false), 2000)
  }

  // Open Checko.ru verification
  const openCheckoVerification = () => {
    if (formData.inn) {
      window.open(`https://checko.ru/company/${formData.inn}`, '_blank')
    }
  }

  // Handle save
  const handleSave = async () => {
    try {
      // Prepare payload
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

      // Debug: Log payload for troubleshooting
      console.log("[DEBUG] Saving company data:", payload)

      let result
      if (company) {
        console.log("[DEBUG] Updating existing company ID:", company.id)
        result = await updateCompany(payload)
      } else {
        // Create new company - need required fields
        if (!formData.inn || !formData.name) {
          toast({
            title: "Ошибка",
            description: "ИНН и наименование компании обязательны",
            variant: "destructive",
          })
          return
        }
        console.log("[DEBUG] Creating new company...")
        result = await createCompany(payload as CreateCompanyPayload)
      }

      if (result) {
        console.log("[DEBUG] Save successful:", result)
        toast({
          title: "Успешно",
          description: "Данные компании сохранены",
        })
      } else {
        console.error("[DEBUG] Save failed, error from hook:", error)
        toast({
          title: "Ошибка",
          description: error || "Не удалось сохранить данные",
          variant: "destructive",
        })
      }
    } catch (err) {
      // Catch any unexpected errors
      console.error("[DEBUG] Unexpected error in handleSave:", err)
      const errorMessage = err instanceof Error ? err.message : "Неизвестная ошибка"
      toast({
        title: "Ошибка сохранения",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Handle cancel (reset form)
  const handleCancel = () => {
    if (company) {
      setFormData({
        inn: safeString(company.inn),
        kpp: safeString(company.kpp),
        ogrn: safeString(company.ogrn),
        name: safeString(company.name),
        short_name: safeString(company.short_name),
        legal_address: safeString(company.legal_address),
        actual_address: safeString(company.actual_address),
        director_name: safeString(company.director_name),
        director_position: safeString(company.director_position),
        passport_series: safeString(company.passport_series),
        passport_number: safeString(company.passport_number),
        passport_issued_by: safeString(company.passport_issued_by),
        passport_date: safeString(company.passport_date),
        passport_code: safeString(company.passport_code),
        bank_name: safeString(company.bank_name),
        bank_bic: safeString(company.bank_bic),
        bank_account: safeString(company.bank_account),
        bank_corr_account: safeString(company.bank_corr_account),
        contact_email: safeString(company.contact_email),
        contact_phone: safeString(company.contact_phone),
        contact_person: safeString(company.contact_person),
        website: safeString(company.website),
      })
    }
  }

  // Manager/Contact functions (local UI state only)
  const addManager = () => {
    setManagers([...managers, { id: Date.now().toString(), position: "", fullName: "", share: "" }])
    setShowManagerForm(false)
  }

  const removeManager = (id: string) => {
    setManagers(managers.filter((m) => m.id !== id))
  }

  const addContactPerson = () => {
    setContactPersons([
      ...contactPersons,
      { id: Date.now().toString(), position: "", fullName: "", email: "", phone: "" },
    ])
    setShowContactForm(false)
  }

  const removeContactPerson = (id: string) => {
    setContactPersons(contactPersons.filter((c) => c.id !== id))
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#00d4aa]" />
          <p className="text-muted-foreground">Загрузка данных компании...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Моя компания</h1>
        <p className="text-muted-foreground">Управление профилем компании</p>
      </div>

      {/* Card 1: General Info */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Общая информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="inn">ИНН *</Label>
              <div className="flex gap-2">
                <Input
                  id="inn"
                  placeholder="Введите ИНН"
                  value={formData.inn}
                  onChange={(e) => handleChange("inn", e.target.value)}
                  className="flex-1"
                />
                {formData.inn && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={openCheckoVerification}
                    title="Проверить на Checko.ru"
                    className="shrink-0 border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {formData.inn && (
                <button
                  type="button"
                  onClick={openCheckoVerification}
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Проверить на Checko.ru
                </button>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="kpp">КПП</Label>
              <Input
                id="kpp"
                placeholder="Введите КПП"
                value={formData.kpp}
                onChange={(e) => handleChange("kpp", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ogrn">ОГРН</Label>
              <Input
                id="ogrn"
                placeholder="Введите ОГРН"
                value={formData.ogrn}
                onChange={(e) => handleChange("ogrn", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Полное наименование *</Label>
              <Input
                id="fullName"
                placeholder="Полное наименование организации"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortName">Сокращенное наименование</Label>
              <Input
                id="shortName"
                placeholder="Сокращенное наименование"
                value={formData.short_name}
                onChange={(e) => handleChange("short_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opf">ОПФ</Label>
              <Select defaultValue="ooo">
                <SelectTrigger>
                  <SelectValue placeholder="Выберите ОПФ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ooo">ООО</SelectItem>
                  <SelectItem value="ip">ИП</SelectItem>
                  <SelectItem value="ao">АО</SelectItem>
                  <SelectItem value="pao">ПАО</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="resident" defaultChecked />
              <Label htmlFor="resident" className="text-sm font-normal">
                Резидент РФ
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxSystem">Система налогообложения</Label>
              <Select defaultValue="osno">
                <SelectTrigger>
                  <SelectValue placeholder="Выберите систему" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="osno">ОСНО</SelectItem>
                  <SelectItem value="usn6">УСН 6%</SelectItem>
                  <SelectItem value="usn15">УСН 15%</SelectItem>
                  <SelectItem value="patent">Патент</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="legalAddress">Юридический адрес</Label>
              <Input
                id="legalAddress"
                placeholder="Юридический адрес"
                value={formData.legal_address}
                onChange={(e) => handleChange("legal_address", e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="actualAddress">Фактический адрес</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={copyLegalToActual}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {addressCopied ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Скопировано
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Скопировать юридический
                    </>
                  )}
                </Button>
              </div>
              <Input
                id="actualAddress"
                placeholder="Фактический адрес"
                value={formData.actual_address}
                onChange={(e) => handleChange("actual_address", e.target.value)}
              />
            </div>
          </div>

          {/* Official Contacts Subsection */}
          <div className="border-t pt-6">
            <h4 className="mb-4 font-medium text-foreground">Официальные контакты</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="website">Сайт компании</Label>
                <Input
                  id="website"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@example.com"
                  value={formData.contact_email}
                  onChange={(e) => handleChange("contact_email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="officePhone">Тел. офиса</Label>
                <Input
                  id="officePhone"
                  placeholder="+7 (XXX) XXX-XX-XX"
                  value={formData.contact_phone}
                  onChange={(e) => handleChange("contact_phone", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Отменить
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
                "Сохранить"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Management */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Руководство</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Director from company profile */}
          <div className="mb-4 rounded-lg border p-4">
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

            {/* Passport fields (API-Ready for Realist Bank) */}
            <div className="mt-4 border-t pt-4">
              <h5 className="mb-3 text-sm font-medium text-muted-foreground">
                Паспортные данные руководителя
              </h5>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Серия паспорта</Label>
                  <Input
                    placeholder="0000"
                    maxLength={4}
                    value={formData.passport_series}
                    onChange={(e) => handleChange("passport_series", e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Номер паспорта</Label>
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
              <div className="mt-4 space-y-2">
                <Label>Кем выдан паспорт</Label>
                <Input
                  placeholder="ОТДЕЛОМ УФМС РОССИИ ПО Г. МОСКВЕ"
                  value={formData.passport_issued_by}
                  onChange={(e) => handleChange("passport_issued_by", e.target.value)}
                />
              </div>
            </div>
          </div>

          {managers.length > 0 && (
            <div className="mb-4 space-y-3">
              {managers.map((manager) => (
                <div key={manager.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{manager.fullName || "Новый руководитель"}</p>
                    <p className="text-sm text-muted-foreground">{manager.position || "Должность не указана"}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeManager(manager.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {showManagerForm && (
            <div className="mb-4 rounded-lg border p-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Должность</Label>
                  <Input placeholder="Генеральный директор" />
                </div>
                <div className="space-y-2">
                  <Label>ФИО</Label>
                  <Input placeholder="Иванов Иван Иванович" />
                </div>
                <div className="space-y-2">
                  <Label>Доля в капитале (%)</Label>
                  <Input placeholder="50" type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Гражданство</Label>
                  <Input placeholder="РФ" />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowManagerForm(false)}>
                  Отмена
                </Button>
                <Button className="bg-[#00d4aa] text-white hover:bg-[#00b894]" onClick={addManager}>
                  Добавить
                </Button>
              </div>
            </div>
          )}

          {!showManagerForm && (
            <Button
              variant="outline"
              className="border-[#00d4aa] text-[#00d4aa] hover:bg-[#00d4aa] hover:text-white bg-transparent"
              onClick={() => setShowManagerForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Добавить руководителя
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Card 3: Bank Details */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Банковские реквизиты</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-lg border p-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Расчетный счет (р/с)</Label>
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
                <Label>Открыт в банке</Label>
                <Input
                  placeholder="Название банка"
                  value={formData.bank_name}
                  onChange={(e) => handleChange("bank_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Кор.счет (к/с)</Label>
                <Input
                  placeholder="30101810000000000000"
                  value={formData.bank_corr_account}
                  onChange={(e) => handleChange("bank_corr_account", e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Contact Persons */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Контактные лица</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Primary contact from company profile */}
          <div className="mb-4 rounded-lg border p-4">
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
                <Label>E-mail</Label>
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
            </div>
          </div>

          {contactPersons.length > 0 && (
            <div className="mb-4 space-y-3">
              {contactPersons.map((person) => (
                <div key={person.id} className="flex items-start justify-between rounded-lg border p-4">
                  <div className="grid gap-4 flex-1 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Должность</Label>
                      <Input placeholder="Менеджер" />
                    </div>
                    <div className="space-y-2">
                      <Label>ФИО</Label>
                      <Input placeholder="Иванов Иван Иванович" />
                    </div>
                    <div className="space-y-2">
                      <Label>E-mail</Label>
                      <Input type="email" placeholder="email@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Телефон</Label>
                      <Input placeholder="+7 (XXX) XXX-XX-XX" />
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="ml-2" onClick={() => removeContactPerson(person.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {showContactForm && (
            <div className="mb-4 rounded-lg border p-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Должность</Label>
                  <Input placeholder="Менеджер" />
                </div>
                <div className="space-y-2">
                  <Label>ФИО</Label>
                  <Input placeholder="Иванов Иван Иванович" />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" placeholder="email@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Телефон</Label>
                  <Input placeholder="+7 (XXX) XXX-XX-XX" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowContactForm(false)}>
                  Отмена
                </Button>
                <Button className="bg-[#00d4aa] text-white hover:bg-[#00b894]" onClick={addContactPerson}>
                  Добавить
                </Button>
              </div>
            </div>
          )}

          {!showContactForm && (
            <Button
              variant="outline"
              className="border-[#00d4aa] text-[#00d4aa] hover:bg-[#00d4aa] hover:text-white bg-transparent"
              onClick={() => setShowContactForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Добавить контактное лицо
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
