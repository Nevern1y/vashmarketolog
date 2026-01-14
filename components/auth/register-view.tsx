"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Mail, Lock, Eye, EyeOff, Phone, User, Loader2, UserPlus } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

interface RegisterViewProps {
  onSwitchToLogin: () => void
}

type RoleType = "client" | "agent"

export function RegisterView({ onSwitchToLogin }: RegisterViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register, isLoading: authLoading, error: authError, clearError } = useAuth()

  // Get referral ID from URL (?ref=123)
  const referralId = searchParams.get("ref")

  const [role, setRole] = useState<RoleType>("client")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  // If user came from a referral link, default to "agent" role
  useEffect(() => {
    if (referralId) {
      setRole("agent")
    }
  }, [referralId])

  // Clear auth error when inputs change
  useEffect(() => {
    if (authError) {
      clearError()
    }
  }, [email, password, phone])

  const isValid =
    email.trim() !== "" &&
    phone.trim() !== "" &&
    password.trim() !== "" &&
    confirmPassword.trim() !== "" &&
    password === confirmPassword &&
    agreedToTerms

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors = {
      email: email.trim() === "",
      phone: phone.trim() === "",
      password: password.trim() === "",
      confirmPassword: confirmPassword.trim() === "" || password !== confirmPassword,
      terms: !agreedToTerms,
    }
    setErrors(newErrors)

    if (!isValid) return

    try {
      await register({
        email,
        phone: phone.replace(/\D/g, ""), // Send only digits
        password,
        password_confirm: confirmPassword,
        role,
        referral_id: referralId ? parseInt(referralId, 10) : null,
      })

      // Success - user is now logged in
      toast.success("Регистрация успешна!", {
        description: referralId
          ? "Вы зарегистрированы как агент партнёра"
          : "Добро пожаловать в Лидер Гарант!",
      })

      // Redirect to home (main dashboard)
      router.push("/")
    } catch (err) {
      // Error is already handled by useAuth and displayed via authError
      console.error("Registration failed:", err)
    }
  }

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
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
    setErrors((prev) => ({ ...prev, phone: false }))
  }

  return (
    <Card className="rounded-xl shadow-2xl border-0">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex justify-center">
          <img src="/placeholder-logo.svg" alt="Лидер Гарант" className="h-14 w-auto" />
        </div>
        <h1 className="text-center text-2xl font-semibold text-foreground">Регистрация</h1>

        {/* Referral Banner */}
        {referralId && (
          <div className="flex items-center gap-2 rounded-lg bg-[#3CE8D1]/10 p-3 text-sm text-[#0a1628]">
            <UserPlus className="h-5 w-5 text-[#3CE8D1]" />
            <span>Вы регистрируетесь по приглашению партнёра</span>
          </div>
        )}

        {/* Role Selector */}
        <div className="flex rounded-lg border border-border p-1">
          <button
            type="button"
            onClick={() => setRole("client")}
            aria-pressed={role === "client"}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-colors ${role === "client" ? "bg-[#3CE8D1] text-[#0a1628]" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <User className="h-4 w-4" />Я КЛИЕНТ
          </button>
          <button
            type="button"
            onClick={() => setRole("agent")}
            aria-pressed={role === "agent"}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-colors ${role === "agent" ? "bg-[#3CE8D1] text-[#0a1628]" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <User className="h-4 w-4" />Я АГЕНТ
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Auth Error Display */}
        {authError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reg-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-0 bottom-0 my-auto h-4 w-4 text-muted-foreground" />
              <Input
                id="reg-email"
                type="email"
                placeholder="example@mail.ru"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setErrors((prev) => ({ ...prev, email: false }))
                }}
                aria-invalid={!!errors.email}
                className={`pl-10 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Телефон</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-0 bottom-0 my-auto h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+7 (___) ___-__-__"
                value={phone}
                onChange={handlePhoneChange}
                aria-invalid={!!errors.phone}
                className={`pl-10 ${errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-password">Пароль</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-0 bottom-0 my-auto h-4 w-4 text-muted-foreground" />
              <Input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setErrors((prev) => ({ ...prev, password: false }))
                }}
                aria-invalid={!!errors.password}
                className={`pl-10 pr-10 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-0 bottom-0 my-auto h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Подтвердите пароль</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-0 bottom-0 my-auto h-4 w-4 text-muted-foreground" />
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setErrors((prev) => ({ ...prev, confirmPassword: false }))
                }}
                aria-invalid={!!errors.confirmPassword}
                className={`pl-10 pr-10 ${errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-0 bottom-0 my-auto h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label={showConfirmPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && password !== confirmPassword && confirmPassword !== "" && (
              <p className="text-xs text-red-500">Пароли не совпадают</p>
            )}
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => {
                setAgreedToTerms(checked as boolean)
                setErrors((prev) => ({ ...prev, terms: false }))
              }}
              className={errors.terms ? "border-red-500" : ""}
            />
            <Label
              htmlFor="terms"
              className={`text-sm leading-tight ${errors.terms ? "text-red-500" : "text-muted-foreground"}`}
            >
              Я согласен с условиями обработки персональных данных
            </Label>
          </div>

          <Button
            type="submit"
            disabled={!isValid || authLoading}
            className="w-full bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] disabled:opacity-50"
          >
            {authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            ЗАРЕГИСТРИРОВАТЬСЯ
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t pt-6">
        <p className="text-sm text-muted-foreground">
          Уже есть аккаунт?{" "}
          <button onClick={onSwitchToLogin} className="font-medium text-[#3CE8D1] hover:underline">
            Войти
          </button>
        </p>
      </CardFooter>
    </Card>
  )
}
