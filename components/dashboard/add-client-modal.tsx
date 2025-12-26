"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, User, Loader2 } from "lucide-react"
import type { Client } from "@/lib/types"

interface AddClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (client: Omit<Client, "id" | "createdAt" | "applicationsCount">) => void
}

export function AddClientModal({ isOpen, onClose, onSubmit }: AddClientModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("company")
  const [formData, setFormData] = useState({
    inn: "",
    companyName: "",
    shortName: "",
    legalAddress: "",
    actualAddress: "",
    phone: "",
    email: "",
    website: "",
    contactPerson: "",
    contactPosition: "",
    contactPhone: "",
    contactEmail: "",
  })

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleInnLookup = async () => {
    if (formData.inn.length < 10) return
    setIsLoading(true)
    // Simulate API call to lookup company by INN
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setFormData((prev) => ({
      ...prev,
      companyName: 'ООО "Новая Компания"',
      shortName: 'ООО "НК"',
      legalAddress: "г. Москва, ул. Новая, д. 1",
      actualAddress: "г. Москва, ул. Новая, д. 1",
    }))
    setIsLoading(false)
  }

  const handleSubmit = () => {
    onSubmit(formData)
    setFormData({
      inn: "",
      companyName: "",
      shortName: "",
      legalAddress: "",
      actualAddress: "",
      phone: "",
      email: "",
      website: "",
      contactPerson: "",
      contactPosition: "",
      contactPhone: "",
      contactEmail: "",
    })
    setActiveTab("company")
  }

  const isCompanyValid = formData.inn && formData.companyName && formData.shortName
  const isContactValid = formData.contactPerson && formData.contactPhone && formData.contactEmail

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
            {/* INN with lookup */}
            <div className="space-y-2">
              <Label htmlFor="inn">ИНН *</Label>
              <div className="flex gap-2">
                <Input
                  id="inn"
                  placeholder="Введите ИНН (10 или 12 цифр)"
                  value={formData.inn}
                  onChange={(e) => handleChange("inn", e.target.value)}
                  maxLength={12}
                />
                <Button
                  variant="outline"
                  onClick={handleInnLookup}
                  disabled={formData.inn.length < 10 || isLoading}
                  className="shrink-0 bg-transparent"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Найти"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Введите ИНН для автоматического заполнения данных</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="companyName">Полное наименование *</Label>
                <Input
                  id="companyName"
                  placeholder="Полное наименование организации"
                  value={formData.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortName">Сокращенное наименование *</Label>
                <Input
                  id="shortName"
                  placeholder='ООО "Компания"'
                  value={formData.shortName}
                  onChange={(e) => handleChange("shortName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон офиса</Label>
                <Input
                  id="phone"
                  placeholder="+7 (XXX) XXX-XX-XX"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@company.ru"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
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
                <Label htmlFor="legalAddress">Юридический адрес</Label>
                <Input
                  id="legalAddress"
                  placeholder="г. Москва, ул. ..."
                  value={formData.legalAddress}
                  onChange={(e) => handleChange("legalAddress", e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="actualAddress">Фактический адрес</Label>
                <Input
                  id="actualAddress"
                  placeholder="г. Москва, ул. ..."
                  value={formData.actualAddress}
                  onChange={(e) => handleChange("actualAddress", e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setActiveTab("contact")}
                disabled={!isCompanyValid}
                className="bg-[#00d4aa] text-white hover:bg-[#00b894]"
              >
                Далее
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="contactPerson">ФИО контактного лица *</Label>
                <Input
                  id="contactPerson"
                  placeholder="Иванов Иван Иванович"
                  value={formData.contactPerson}
                  onChange={(e) => handleChange("contactPerson", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPosition">Должность</Label>
                <Input
                  id="contactPosition"
                  placeholder="Генеральный директор"
                  value={formData.contactPosition}
                  onChange={(e) => handleChange("contactPosition", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Телефон *</Label>
                <Input
                  id="contactPhone"
                  placeholder="+7 (XXX) XXX-XX-XX"
                  value={formData.contactPhone}
                  onChange={(e) => handleChange("contactPhone", e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="contactEmail">Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="contact@company.ru"
                  value={formData.contactEmail}
                  onChange={(e) => handleChange("contactEmail", e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setActiveTab("company")}>
                Назад
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>
                  Отмена
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!isCompanyValid || !isContactValid}
                  className="bg-[#00d4aa] text-white hover:bg-[#00b894]"
                >
                  Добавить клиента
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
