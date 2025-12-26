"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, Phone, Loader2, KeyRound } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import type { RegisterPayload } from "@/lib/api"
import { toast } from "sonner"

type AuthTab = "login" | "register"
type UserRole = "client" | "agent"

interface AuthPageProps {
  onAuthSuccess?: () => void
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>("login")
  const [role, setRole] = useState<UserRole>("client")
  const [showPassword, setShowPassword] = useState(false)

  // Form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  const [registerFirstName, setRegisterFirstName] = useState("")
  const [registerLastName, setRegisterLastName] = useState("")
  const [registerPhone, setRegisterPhone] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("")

  // Auth context
  const { login, register, isLoading, error, clearError } = useAuth()

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await login(loginEmail, loginPassword)
      onAuthSuccess?.()
    } catch {
      // Error is handled in context
    }
  }

  // Handle register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (registerPassword !== registerPasswordConfirm) {
      return
    }

    // Strip phone to digits only (remove formatting)
    const cleanPhone = registerPhone.replace(/\D/g, "")

    const payload: RegisterPayload = {
      email: registerEmail,
      phone: cleanPhone,
      password: registerPassword,
      password_confirm: registerPasswordConfirm,
      role: role,
      first_name: registerFirstName,
      last_name: registerLastName,
    }

    try {
      await register(payload)
      onAuthSuccess?.()
    } catch {
      // Error is handled in context
    }
  }

  // Handle EDS login (stub)
  const handleEDSLogin = () => {
    toast.info("Вход по ЭЦП будет доступен в ближайшее время", {
      description: "Функционал находится в разработке",
      duration: 4000,
    })
  }

  // Format phone number
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "")
    if (digits.length === 0) return ""
    if (digits.length <= 1) return `+7 (${digits}`
    if (digits.length <= 4) return `+7 (${digits.slice(1)}`
    if (digits.length <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`
    if (digits.length <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterPhone(formatPhone(e.target.value))
  }

  // Clear error when switching tabs
  const handleTabChange = (tab: AuthTab) => {
    setActiveTab(tab)
    clearError()
  }

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
              onClick={() => handleTabChange("login")}
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
              onClick={() => handleTabChange("register")}
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
          {/* Error message */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {activeTab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="example@mail.ru"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label>Пароль</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-[#00d4aa] text-white hover:bg-[#00b894]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Вход...
                  </>
                ) : (
                  "Войти"
                )}
              </Button>

              {/* EDS Login Button (Stub) */}
              <Button
                type="button"
                variant="outline"
                className="w-full border-[#00d4aa] text-[#00d4aa] hover:bg-[#00d4aa]/10"
                onClick={handleEDSLogin}
                disabled={isLoading}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Вход по ЭЦП
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Забыли пароль?{" "}
                <a href="#" className="text-[#00d4aa] hover:underline">
                  Восстановить
                </a>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Role Toggle */}
              <div className="space-y-2">
                <Label>Тип аккаунта</Label>
                <div className="flex rounded-lg border p-1">
                  <button
                    type="button"
                    onClick={() => setRole("client")}
                    className={cn(
                      "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
                      role === "client" ? "bg-[#00d4aa] text-white" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Клиент
                  </button>
                  <button
                    type="button"
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
                  <Input
                    placeholder="Иван"
                    value={registerFirstName}
                    onChange={(e) => setRegisterFirstName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Фамилия</Label>
                  <Input
                    placeholder="Иванов"
                    value={registerLastName}
                    onChange={(e) => setRegisterLastName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Телефон</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="+7 (___) ___-__-__"
                    className="pl-9"
                    value={registerPhone}
                    onChange={handlePhoneChange}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="example@mail.ru"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label>Пароль</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Минимум 8 символов"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Подтвердите пароль</Label>
                <Input
                  type="password"
                  placeholder="Повторите пароль"
                  value={registerPasswordConfirm}
                  onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                  required
                  disabled={isLoading}
                />
                {registerPasswordConfirm && registerPassword !== registerPasswordConfirm && (
                  <p className="text-xs text-red-500">Пароли не совпадают</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-[#00d4aa] text-white hover:bg-[#00b894]"
                disabled={isLoading || (registerPassword !== registerPasswordConfirm)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Регистрация...
                  </>
                ) : (
                  "Зарегистрироваться"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Нажимая кнопку, вы соглашаетесь с{" "}
                <a href="#" className="text-[#00d4aa] hover:underline">
                  условиями использования
                </a>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
