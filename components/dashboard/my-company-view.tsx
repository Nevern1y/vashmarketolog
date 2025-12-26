"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"

interface Manager {
  id: string
  position: string
  fullName: string
  share: string
}

interface BankAccount {
  id: string
  accountNumber: string
  bik: string
  bankName: string
  corrAccount: string
}

interface ContactPerson {
  id: string
  position: string
  fullName: string
  email: string
  phone: string
}

export function MyCompanyView() {
  const [managers, setManagers] = useState<Manager[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    {
      id: "1",
      accountNumber: "40702810000000000001",
      bik: "044525225",
      bankName: "ПАО Сбербанк",
      corrAccount: "30101810400000000225",
    },
  ])
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([])
  const [showManagerForm, setShowManagerForm] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)

  const addManager = () => {
    setManagers([...managers, { id: Date.now().toString(), position: "", fullName: "", share: "" }])
    setShowManagerForm(false)
  }

  const removeManager = (id: string) => {
    setManagers(managers.filter((m) => m.id !== id))
  }

  const addBankAccount = () => {
    setBankAccounts([
      ...bankAccounts,
      { id: Date.now().toString(), accountNumber: "", bik: "", bankName: "", corrAccount: "" },
    ])
  }

  const removeBankAccount = (id: string) => {
    setBankAccounts(bankAccounts.filter((b) => b.id !== id))
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
              <Label htmlFor="inn">ИНН</Label>
              <Input id="inn" placeholder="Введите ИНН" defaultValue="7707083893" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Полное наименование</Label>
              <Input
                id="fullName"
                placeholder="Полное наименование организации"
                defaultValue='ООО "Технологии Будущего"'
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortName">Сокращенное наименование</Label>
              <Input id="shortName" placeholder="Сокращенное наименование" defaultValue='ООО "ТехБуд"' />
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
                defaultValue="г. Москва, ул. Примерная, д. 1, офис 100"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="actualAddress">Фактический адрес</Label>
              <Input
                id="actualAddress"
                placeholder="Фактический адрес"
                defaultValue="г. Москва, ул. Примерная, д. 1, офис 100"
              />
            </div>
          </div>

          {/* Official Contacts Subsection */}
          <div className="border-t pt-6">
            <h4 className="mb-4 font-medium text-foreground">Официальные контакты</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="website">Сайт компании</Label>
                <Input id="website" placeholder="https://example.com" defaultValue="https://techbud.ru" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="info@example.com" defaultValue="info@techbud.ru" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="officePhone">Тел. офиса</Label>
                <Input id="officePhone" placeholder="+7 (XXX) XXX-XX-XX" defaultValue="+7 (495) 123-45-67" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="outline">Отменить</Button>
            <Button className="bg-[#00d4aa] text-white hover:bg-[#00b894]">Сохранить</Button>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Management */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Руководство</CardTitle>
        </CardHeader>
        <CardContent>
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
                <div className="space-y-2">
                  <Label>Дата рождения</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Место рождения</Label>
                  <Input placeholder="г. Москва" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="email@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Телефон</Label>
                  <Input placeholder="+7 (XXX) XXX-XX-XX" />
                </div>
              </div>

              <div className="border-t pt-4">
                <h5 className="mb-3 text-sm font-medium">Документ</h5>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Тип документа</Label>
                    <Select defaultValue="passport">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passport">Паспорт РФ</SelectItem>
                        <SelectItem value="foreign">Загранпаспорт</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Серия / Номер</Label>
                    <Input placeholder="00 00 000000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Дата выдачи</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Кем выдан</Label>
                    <Input placeholder="ГУ МВД России" />
                  </div>
                  <div className="space-y-2">
                    <Label>Код подразделения</Label>
                    <Input placeholder="000-000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Адрес регистрации</Label>
                    <Input placeholder="г. Москва, ул. Примерная, д. 1" />
                  </div>
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
          {bankAccounts.length > 0 && (
            <div className="mb-4 space-y-3">
              {bankAccounts.map((account) => (
                <div key={account.id} className="flex items-start justify-between rounded-lg border p-4">
                  <div className="grid gap-4 flex-1 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Расчетный счет (р/с)</Label>
                      <Input defaultValue={account.accountNumber} placeholder="40702810000000000000" />
                    </div>
                    <div className="space-y-2">
                      <Label>БИК</Label>
                      <Input defaultValue={account.bik} placeholder="044525000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Открыт в банке</Label>
                      <Input defaultValue={account.bankName} placeholder="Название банка" />
                    </div>
                    <div className="space-y-2">
                      <Label>Кор.счет (к/с)</Label>
                      <Input defaultValue={account.corrAccount} placeholder="30101810000000000000" />
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="ml-2" onClick={() => removeBankAccount(account.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            className="border-[#00d4aa] text-[#00d4aa] hover:bg-[#00d4aa] hover:text-white bg-transparent"
            onClick={addBankAccount}
          >
            <Plus className="mr-2 h-4 w-4" />
            Добавить реквизиты
          </Button>
        </CardContent>
      </Card>

      {/* Card 4: Contact Persons */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Контактные лица</CardTitle>
        </CardHeader>
        <CardContent>
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
