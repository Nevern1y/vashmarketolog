"use client"

import type React from "react"

import { useState } from "react"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface LoginViewProps {
  onSwitchToRegister: () => void
}

export function LoginView({ onSwitchToRegister }: LoginViewProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: boolean; password?: boolean }>({})

  const isValid = email.trim() !== "" && password.trim() !== ""

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = {
      email: email.trim() === "",
      password: password.trim() === "",
    }
    setErrors(newErrors)
    if (isValid) {
      // Handle login
      console.log("Login submitted", { email })
    }
  }

  return (
    <Card className="rounded-xl shadow-2xl border-0">
      <CardHeader className="space-y-4 pb-6">
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center">
              <svg viewBox="0 0 40 40" className="h-10 w-10">
                <path d="M8 32 L20 8 L32 32 Z" fill="#00d4aa" />
                <path d="M14 32 L20 20 L26 32 Z" fill="#0a1628" />
              </svg>
            </div>
            <span className="text-xl font-bold text-[#0a1628]">ЛИДЕР ГАРАНТ</span>
          </div>
        </div>
        <h1 className="text-center text-2xl font-semibold text-foreground">Вход в систему</h1>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="example@mail.ru"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setErrors((prev) => ({ ...prev, email: false }))
                }}
                className={`pl-10 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setErrors((prev) => ({ ...prev, password: false }))
                }}
                className={`pl-10 pr-10 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
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

          <div className="flex justify-end">
            <button type="button" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
              Забыли пароль?
            </button>
          </div>

          <Button
            type="submit"
            disabled={!isValid}
            className="w-full bg-[#00d4aa] text-white hover:bg-[#00b894] disabled:opacity-50"
          >
            ВОЙТИ
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t pt-6">
        <p className="text-sm text-muted-foreground">
          Нет аккаунта?{" "}
          <button onClick={onSwitchToRegister} className="font-medium text-[#00d4aa] hover:underline">
            Зарегистрироваться
          </button>
        </p>
      </CardFooter>
    </Card>
  )
}
