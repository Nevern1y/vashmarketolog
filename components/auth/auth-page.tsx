"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, Phone } from "lucide-react"

type AuthTab = "login" | "register"
type UserRole = "client" | "agent"

export function AuthPage() {
  const [activeTab, setActiveTab] = useState<AuthTab>("login")
  const [role, setRole] = useState<UserRole>("agent")
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a1628] p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4 pb-2">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00d4aa]">
              <span className="text-xl font-bold text-white">ФМ</span>
            </div>
            <div>
              <p className="text-lg font-bold">ФИНАНСОВЫЙ</p>
              <p className="text-xs text-muted-foreground">МАРКЕТПЛЕЙС</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex rounded-lg bg-muted p-1">
            <button
              onClick={() => setActiveTab("login")}
              className={cn(
                "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
                activeTab === "login"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Вход
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={cn(
                "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
                activeTab === "register"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Регистрация
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {activeTab === "login" ? (
            <>
              <div className="space-y-2">
                <Label>Email или телефон</Label>
                <Input placeholder="example@mail.ru" />
              </div>
              <div className="space-y-2">
                <Label>Пароль</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="••••••••" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button className="w-full bg-[#00d4aa] text-white hover:bg-[#00b894]">Войти</Button>
              <p className="text-center text-sm text-muted-foreground">
                Забыли пароль?{" "}
                <a href="#" className="text-[#00d4aa] hover:underline">
                  Восстановить
                </a>
              </p>
            </>
          ) : (
            <>
              {/* Role Toggle */}
              <div className="space-y-2">
                <Label>Тип аккаунта</Label>
                <div className="flex rounded-lg border p-1">
                  <button
                    onClick={() => setRole("client")}
                    className={cn(
                      "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
                      role === "client" ? "bg-[#00d4aa] text-white" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Клиент
                  </button>
                  <button
                    onClick={() => setRole("agent")}
                    className={cn(
                      "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
                      role === "agent" ? "bg-[#00d4aa] text-white" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Агент
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Имя</Label>
                  <Input placeholder="Иван" />
                </div>
                <div className="space-y-2">
                  <Label>Фамилия</Label>
                  <Input placeholder="Иванов" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Телефон</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="+7 (___) ___-__-__" className="pl-9" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input placeholder="example@mail.ru" type="email" />
              </div>

              <div className="space-y-2">
                <Label>Пароль</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="Минимум 8 символов" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button className="w-full bg-[#00d4aa] text-white hover:bg-[#00b894]">Зарегистрироваться</Button>

              <p className="text-center text-xs text-muted-foreground">
                Нажимая кнопку, вы соглашаетесь с{" "}
                <a href="#" className="text-[#00d4aa] hover:underline">
                  условиями использования
                </a>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
