"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Bell, Shield, Key, CheckCircle2, AlertCircle, Trash2, FileKey } from "lucide-react"

interface EdsFile {
  id: string
  name: string
  expiryDate: string
  status: "active" | "expiring" | "expired"
}

export function ProfileSettingsView() {
  const [edsFiles, setEdsFiles] = useState<EdsFile[]>([
    {
      id: "1",
      name: "certificate_2024.pfx",
      expiryDate: "2025-06-15",
      status: "active",
    },
  ])

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    applicationStatus: true,
    newProducts: false,
    news: true,
  })

  const handleRemoveEds = (id: string) => {
    setEdsFiles(edsFiles.filter((f) => f.id !== id))
  }

  const getEdsStatusBadge = (status: EdsFile["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-[#3CE8D1]/10 text-[#3CE8D1] gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Активна
          </Badge>
        )
      case "expiring":
        return (
          <Badge className="bg-[#f97316]/10 text-[#f97316] gap-1">
            <AlertCircle className="h-3 w-3" />
            Истекает
          </Badge>
        )
      case "expired":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Истекла
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Настройки профиля</h1>
        <p className="text-muted-foreground">Управление учетной записью и настройками</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Профиль
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Безопасность
          </TabsTrigger>
          <TabsTrigger value="eds" className="gap-2">
            <Key className="h-4 w-4" />
            ЭЦП
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Уведомления
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Личные данные</CardTitle>
              <CardDescription>Обновите информацию о себе</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lastName">Фамилия</Label>
                  <Input id="lastName" defaultValue="Иванов" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName">Имя</Label>
                  <Input id="firstName" defaultValue="Иван" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName">Отчество</Label>
                  <Input id="middleName" defaultValue="Иванович" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input id="phone" defaultValue="+7 (999) 123-45-67" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="ivanov@company.ru" />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]">Сохранить изменения</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Смена пароля</CardTitle>
              <CardDescription>Обновите пароль для защиты аккаунта</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Текущий пароль</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Новый пароль</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <div className="flex justify-end pt-4">
                <Button className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]">Обновить пароль</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EDS Tab */}
        <TabsContent value="eds">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Электронная цифровая подпись (ЭЦП)</CardTitle>
              <CardDescription>Загрузите сертификат ЭЦП для подписания документов</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Area */}
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border-[#3CE8D1]/30 hover:border-[#3CE8D1]">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3CE8D1]/10 mb-3">
                      <FileKey className="h-7 w-7 text-[#3CE8D1]" />
                    </div>
                    <p className="mb-2 text-sm font-medium">Нажмите или перетащите файл сертификата</p>
                    <p className="text-xs text-muted-foreground">Поддерживаемые форматы: .pfx, .p12, .cer</p>
                  </div>
                  <input type="file" className="hidden" accept=".pfx,.p12,.cer" />
                </label>
              </div>

              {/* Uploaded Certificates */}
              {edsFiles.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Загруженные сертификаты</h4>
                  {edsFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3CE8D1]/10">
                          <Key className="h-5 w-5 text-[#3CE8D1]" />
                        </div>
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">Действителен до: {file.expiryDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getEdsStatusBadge(file.status)}
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveEds(file.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-[#f97316]" />
                  Важная информация
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>ЭЦП используется для подписания заявок и договоров</li>
                  <li>Убедитесь, что сертификат выдан аккредитованным УЦ</li>
                  <li>Срок действия сертификата должен быть актуальным</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Настройки уведомлений</CardTitle>
              <CardDescription>Выберите способы получения уведомлений</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Каналы уведомлений</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">Получать уведомления на почту</p>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">SMS</p>
                      <p className="text-sm text-muted-foreground">Получать SMS-уведомления</p>
                    </div>
                    <Switch
                      checked={notifications.sms}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Push-уведомления</p>
                      <p className="text-sm text-muted-foreground">Получать push в браузере</p>
                    </div>
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium">Типы уведомлений</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Статусы заявок</p>
                      <p className="text-sm text-muted-foreground">Изменения статусов ваших заявок</p>
                    </div>
                    <Switch
                      checked={notifications.applicationStatus}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, applicationStatus: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Новые продукты</p>
                      <p className="text-sm text-muted-foreground">Информация о новых финансовых продуктах</p>
                    </div>
                    <Switch
                      checked={notifications.newProducts}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, newProducts: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Новости</p>
                      <p className="text-sm text-muted-foreground">Новости и обновления платформы</p>
                    </div>
                    <Switch
                      checked={notifications.news}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, news: checked })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
