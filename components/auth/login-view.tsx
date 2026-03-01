"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface LoginViewProps {
  onSwitchToRegister: () => void
}

export function LoginView({ onSwitchToRegister }: LoginViewProps) {
  const router = useRouter()
  const { login, isLoading: authLoading, error: authError, clearError } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: boolean; password?: boolean }>({})

  // Clear auth errors when inputs change
  useEffect(() => {
    if (authError) {
      clearError()
    }
  }, [email, password])

  const isValid = email.trim() !== "" && password.trim() !== ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = {
      email: email.trim() === "",
      password: password.trim() === "",
    }
    setErrors(newErrors)

    if (!isValid) return

    try {
      await login(email, password)
      toast.success("Вход выполнен успешно!")
      router.replace("/")
    } catch (err) {
      // Error is already displayed via authError
    }
  }

  return (
    <Card className="rounded-xl shadow-2xl border-0">
      <CardHeader className="space-y-4 pb-6">
        <div className="flex justify-center">
          <img src="/placeholder-logo.svg" alt="Лидер Гарант" className="h-14 w-auto" />
        </div>
        <h1 className="text-center text-2xl font-semibold text-foreground">Вход в систему</h1>
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
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-0 bottom-0 my-auto h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
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
            <Label htmlFor="password">Пароль</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-0 bottom-0 my-auto h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
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

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
              Забыли пароль?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={!isValid || authLoading}
            className="w-full bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] disabled:opacity-50"
          >
            {authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            ВОЙТИ
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t pt-6">
        <p className="text-sm text-muted-foreground">
          Нет аккаунта?{" "}
          <button onClick={onSwitchToRegister} className="font-medium text-[#3CE8D1] hover:underline">
            Зарегистрироваться
          </button>
        </p>
      </CardFooter>
    </Card>
  )
}
