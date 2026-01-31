"use client"

import type { FormEvent } from "react"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Loader2, Lock, Mail, Phone, User } from "lucide-react"
import api, { tokenStorage } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { formatPhoneNumber } from "@/lib/utils"
import { toast } from "sonner"

type InviteRegisterResponse = {
    message: string
    user: {
        id: number
        email: string
        role: string
    }
    access: string
    refresh: string
    company_id?: number
}

export default function InvitedRegisterPage() {
    const router = useRouter()
    const params = useParams()
    const { refreshUser } = useAuth()

    const token = params.token as string

    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [password, setPassword] = useState("")
    const [passwordConfirm, setPasswordConfirm] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()
        setError(null)

        if (!email.trim()) {
            setError("Введите email")
            return
        }

        if (password.length < 8) {
            setError("Пароль должен быть не менее 8 символов")
            return
        }

        if (password !== passwordConfirm) {
            setError("Пароли не совпадают")
            return
        }

        setIsLoading(true)
        try {
            const response = await api.post<InviteRegisterResponse>(`/auth/register/invited/${token}/`, {
                email: email.trim().toLowerCase(),
                password,
                password_confirm: passwordConfirm,
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                phone: phone ? phone.replace(/\D/g, "") : "",
            })

            if (response.access && response.refresh) {
                tokenStorage.setTokens({ access: response.access, refresh: response.refresh })
            }

            if (refreshUser) {
                await refreshUser()
            }

            setSuccess(true)
            toast.success("Регистрация завершена", {
                description: "Вы можете начать работу в личном кабинете"
            })

            setTimeout(() => {
                router.replace("/")
            }, 2000)
        } catch (err: unknown) {
            const apiError = err as { message?: string }
            setError(apiError.message || "Не удалось завершить регистрацию")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-[#0a1628] p-4">
            <Card className="w-full max-w-lg rounded-xl shadow-2xl border-0">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-[#3CE8D1]/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-[#3CE8D1]" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">
                        Регистрация по приглашению
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Заполните данные для активации аккаунта клиента
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {success ? (
                        <div className="text-center py-8">
                            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-600/20 flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                Аккаунт активирован!
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                Перенаправляем вас в личный кабинет...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-foreground">
                                        Имя
                                    </Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="firstName"
                                            type="text"
                                            placeholder="Иван"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-foreground">
                                        Фамилия
                                    </Label>
                                    <Input
                                        id="lastName"
                                        type="text"
                                        placeholder="Иванов"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-foreground">
                                    Email
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="example@mail.ru"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-foreground">
                                    Телефон (необязательно)
                                </Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+7 (900) 000-00-00"
                                        value={phone}
                                        onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                                        className="pl-10"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-foreground">
                                    Пароль
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Минимум 8 символов"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                        minLength={8}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="passwordConfirm" className="text-foreground">
                                    Подтвердите пароль
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="passwordConfirm"
                                        type="password"
                                        placeholder="Повторите пароль"
                                        value={passwordConfirm}
                                        onChange={(e) => setPasswordConfirm(e.target.value)}
                                        className="pl-10"
                                        required
                                        minLength={8}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] font-medium py-2.5"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Регистрация...
                                    </>
                                ) : (
                                    "Завершить регистрацию"
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
