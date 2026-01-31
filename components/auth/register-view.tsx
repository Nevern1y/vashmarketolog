"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Mail, Lock, Eye, EyeOff, Phone, User, Loader2, UserPlus, ArrowLeft, Check } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { authApi } from "@/lib/api"

interface RegisterViewProps {
  onSwitchToLogin: () => void
}

type RoleType = "client" | "agent"
type Step = "email" | "code" | "details"

export function RegisterView({ onSwitchToLogin }: RegisterViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register, isLoading: authLoading, error: authError, clearError } = useAuth()

  // Get referral ID from URL (?ref=123)
  const referralId = searchParams.get("ref")

  // Step management
  const [step, setStep] = useState<Step>("email")
  
  // Form state
  const [role, setRole] = useState<RoleType>("client")
  const [email, setEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  
  // Loading states
  const [sendingCode, setSendingCode] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  
  // Code input refs
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([])

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
  }, [email, password, phone, verificationCode])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Step 1: Send verification code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setErrors({ email: true })
      return
    }

    setSendingCode(true)
    try {
      await authApi.sendRegistrationCode(email.trim())
      toast.success("Код отправлен!", {
        description: `Проверьте почту ${email}`,
      })
      setStep("code")
      setResendCooldown(60)
      // Focus first code input
      setTimeout(() => codeInputRefs.current[0]?.focus(), 100)
    } catch (err) {
      const apiError = err as { message?: string }
      toast.error(apiError.message || "Ошибка отправки кода")
    } finally {
      setSendingCode(false)
    }
  }

  // Handle code input
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // Only digits
    
    const newCode = [...verificationCode]
    newCode[index] = value.slice(-1) // Only last digit
    setVerificationCode(newCode)
    
    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus()
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus()
    }
  }

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    const newCode = [...verificationCode]
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i]
    }
    setVerificationCode(newCode)
    // Focus last filled input or first empty
    const focusIndex = Math.min(pastedData.length, 5)
    codeInputRefs.current[focusIndex]?.focus()
  }

  // Step 2: Verify code and proceed to details
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault()
    const code = verificationCode.join("")
    if (code.length !== 6) {
      toast.error("Введите 6-значный код")
      return
    }
    setStep("details")
  }

  // Step 3: Complete registration
  const isDetailsValid =
    phone.trim() !== "" &&
    password.trim() !== "" &&
    confirmPassword.trim() !== "" &&
    password === confirmPassword &&
    password.length >= 8 &&
    agreedToTerms

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors = {
      phone: phone.trim() === "",
      password: password.trim() === "" || password.length < 8,
      confirmPassword: confirmPassword.trim() === "" || password !== confirmPassword,
      terms: !agreedToTerms,
    }
    setErrors(newErrors)

    if (!isDetailsValid) return

    try {
      await register({
        email,
        phone: phone.replace(/\D/g, ""),
        password,
        password_confirm: confirmPassword,
        role,
        referral_id: referralId ? parseInt(referralId, 10) : null,
        verification_code: verificationCode.join(""),
      })

      toast.success("Регистрация успешна!", {
        description: referralId
          ? "Вы зарегистрированы как агент партнёра"
          : "Добро пожаловать в Лидер Гарант!",
      })

      router.replace("/")
    } catch (err) {
      const apiError = err as { message?: string; status?: number }
      console.error("Registration failed:", apiError.message || 'Unknown error', apiError)
      // If code is invalid, go back to code step
      if (apiError.message?.includes("код")) {
        setStep("code")
      }
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

  // Render step indicator
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-4">
      {["email", "code", "details"].map((s, i) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step === s
                ? "bg-[#3CE8D1] text-[#0a1628]"
                : ["email", "code", "details"].indexOf(step) > i
                ? "bg-[#3CE8D1]/30 text-[#3CE8D1]"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {["email", "code", "details"].indexOf(step) > i ? (
              <Check className="h-4 w-4" />
            ) : (
              i + 1
            )}
          </div>
          {i < 2 && (
            <div
              className={`w-8 h-0.5 ${
                ["email", "code", "details"].indexOf(step) > i
                  ? "bg-[#3CE8D1]"
                  : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )

  return (
    <Card className="rounded-xl shadow-2xl border-0">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex justify-center">
          <img src="/placeholder-logo.svg" alt="Лидер Гарант" className="h-14 w-auto" />
        </div>
        <h1 className="text-center text-2xl font-semibold text-foreground">Регистрация</h1>

        {renderStepIndicator()}

        {/* Referral Banner */}
        {referralId && (
          <div className="flex items-center gap-2 rounded-lg border border-[#3CE8D1]/30 bg-[#0f2042] p-3 text-sm text-white">
            <UserPlus className="h-5 w-5 text-[#3CE8D1]" />
            <span>Вы регистрируетесь по приглашению партнёра</span>
          </div>
        )}

        {/* Role Selector - only on first step */}
        {step === "email" && !referralId && (
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
        )}
      </CardHeader>

      <CardContent>
        {/* Auth Error Display */}
        {authError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {authError}
          </div>
        )}

        {/* Step 1: Email */}
        {step === "email" && (
          <form onSubmit={handleSendCode} className="space-y-4">
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
              <p className="text-xs text-muted-foreground">
                На этот email будет отправлен код подтверждения
              </p>
            </div>

            <Button
              type="submit"
              disabled={!email.trim() || sendingCode}
              className="w-full bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] disabled:opacity-50"
            >
              {sendingCode ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              ПОЛУЧИТЬ КОД
            </Button>
          </form>
        )}

        {/* Step 2: Verification Code */}
        {step === "code" && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <button
              type="button"
              onClick={() => setStep("email")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Изменить email
            </button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Код отправлен на <span className="font-medium text-foreground">{email}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Код действителен 10 минут
              </p>
            </div>

            <div className="flex justify-center gap-2">
              {verificationCode.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => { codeInputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  onPaste={handleCodePaste}
                  className="w-12 h-12 text-center text-xl font-semibold"
                />
              ))}
            </div>

            <div className="text-center">
              <button
                type="button"
                disabled={resendCooldown > 0 || sendingCode}
                onClick={handleSendCode}
                className="text-sm text-[#3CE8D1] hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {resendCooldown > 0
                  ? `Отправить повторно (${resendCooldown}с)`
                  : "Отправить код повторно"}
              </button>
            </div>

            <Button
              type="submit"
              disabled={verificationCode.join("").length !== 6}
              className="w-full bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] disabled:opacity-50"
            >
              ПОДТВЕРДИТЬ
            </Button>
          </form>
        )}

        {/* Step 3: Details */}
        {step === "details" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <button
              type="button"
              onClick={() => setStep("code")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </button>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-700">Email подтверждён: {email}</span>
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
              {password && password.length < 8 && (
                <p className="text-xs text-red-500">Минимум 8 символов</p>
              )}
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
              disabled={!isDetailsValid || authLoading}
              className="w-full bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] disabled:opacity-50"
            >
              {authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              ЗАРЕГИСТРИРОВАТЬСЯ
            </Button>
          </form>
        )}
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
