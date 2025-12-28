"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, User, Loader2 } from "lucide-react"
import type { CreateCompanyPayload } from "@/hooks/use-companies"

interface AddClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (client: CreateCompanyPayload) => void | Promise<void>
}

export function AddClientModal({ isOpen, onClose, onSubmit }: AddClientModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("company")
  const [formData, setFormData] = useState({
    inn: "",
    name: "",
    short_name: "",
    kpp: "",
    ogrn: "",
    legal_address: "",
    actual_address: "",
    region: "",
    director_name: "",
    director_position: "",
    contact_phone: "",
    contact_email: "",
    contact_person: "",
    website: "",
  })

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Phase 1: Manual mode - no DaData lookup
  // In Phase 2, this is where we'd integrate DaData API for auto-fill by INN

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      await onSubmit(formData)
      // Reset form
      setFormData({
        inn: "",
        name: "",
        short_name: "",
        kpp: "",
        ogrn: "",
        legal_address: "",
        actual_address: "",
        region: "",
        director_name: "",
        director_position: "",
        contact_phone: "",
        contact_email: "",
        contact_person: "",
        website: "",
      })
      setActiveTab("company")
    } finally {
      setIsLoading(false)
    }
  }

  const isCompanyValid = formData.inn && formData.name
  const isContactValid = formData.director_name || (formData.contact_phone && formData.contact_email)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Добавить клиента</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="h-4 w-4" />
              Компания
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-2">
              <User className="h-4 w-4" />
              Контактное лицо
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="space-y-4 pt-4">
            {/* INN - Manual Entry (Phase 1) */}
            <div className="space-y-2">
              <Label htmlFor="inn">ИНН *</Label>
              <Input
                id="inn"
                placeholder="Введите ИНН (10 или 12 цифр)"
                value={formData.inn}
                onChange={(e) => handleChange("inn", e.target.value)}
                maxLength={12}
              />
              <p className="text-xs text-muted-foreground">Автозаполнение по ИНН будет доступно в Фазе 2</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Полное наименование *</Label>
                <Input
                  id="name"
                  placeholder="Полное наименование организации"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="short_name">Сокращенное наименование</Label>
                <Input
                  id="short_name"
                  placeholder='ООО "Компания"'
                  value={formData.short_name}
                  onChange={(e) => handleChange("short_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kpp">КПП</Label>
                <Input
                  id="kpp"
                  placeholder="123456789"
                  value={formData.kpp}
                  onChange={(e) => handleChange("kpp", e.target.value)}
                  maxLength={9}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ogrn">ОГРН</Label>
                <Input
                  id="ogrn"
                  placeholder="1234567890123"
                  value={formData.ogrn}
                  onChange={(e) => handleChange("ogrn", e.target.value)}
                  maxLength={15}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Сайт</Label>
                <Input
                  id="website"
                  placeholder="https://company.ru"
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="legal_address">Юридический адрес</Label>
                <Input
                  id="legal_address"
                  placeholder="г. Москва, ул. ..."
                  value={formData.legal_address}
                  onChange={(e) => handleChange("legal_address", e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="actual_address">Фактический адрес</Label>
                <Input
                  id="actual_address"
                  placeholder="г. Москва, ул. ..."
                  value={formData.actual_address}
                  onChange={(e) => handleChange("actual_address", e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="region">Регион</Label>
                <Input
                  id="region"
                  placeholder="Московская область"
                  value={formData.region}
                  onChange={(e) => handleChange("region", e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setActiveTab("contact")}
                disabled={!isCompanyValid}
                className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
              >
                Далее
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="director_name">ФИО руководителя</Label>
                <Input
                  id="director_name"
                  placeholder="Иванов Иван Иванович"
                  value={formData.director_name}
                  onChange={(e) => handleChange("director_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="director_position">Должность</Label>
                <Input
                  id="director_position"
                  placeholder="Генеральный директор"
                  value={formData.director_position}
                  onChange={(e) => handleChange("director_position", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Телефон</Label>
                <Input
                  id="contact_phone"
                  placeholder="+7 (XXX) XXX-XX-XX"
                  value={formData.contact_phone}
                  onChange={(e) => handleChange("contact_phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  placeholder="contact@company.ru"
                  value={formData.contact_email}
                  onChange={(e) => handleChange("contact_email", e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="contact_person">ФИО контактного лица</Label>
                <Input
                  id="contact_person"
                  placeholder="Петров Петр Петрович"
                  value={formData.contact_person}
                  onChange={(e) => handleChange("contact_person", e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setActiveTab("company")} disabled={isLoading}>
                Назад
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} disabled={isLoading}>
                  Отмена
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!isCompanyValid || isLoading}
                  className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    "Добавить клиента"
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
