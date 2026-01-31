"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react"
import api from "@/lib/api"

export default function ResetPasswordPage() {
    const router = useRouter()
    const params = useParams()
    const token = params.token as string

    const [password, setPassword] = useState("")
    const [passwordConfirm, setPasswordConfirm] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Client-side validation
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
            await api.post(`/auth/password/reset/confirm/${token}/`, {
                password,
                password_confirm: passwordConfirm
            })

            setSuccess(true)

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push("/auth")
            }, 3000)

        } catch (err: unknown) {
            const apiError = err as { message?: string; status?: number }
            const normalizedMessage = apiError.message?.toLowerCase() || ""
            const isExpired = apiError.status === 410
                || normalizedMessage.includes("expired")
                || normalizedMessage.includes("invalid")
                || normalizedMessage.includes("истек")
                || normalizedMessage.includes("истёк")
                || normalizedMessage.includes("устар")

            if (isExpired) {
                setError("Ссылка для сброса пароля устарела или недействительна. Запросите новую.")
            } else {
                setError(apiError.message || "Не удалось сбросить пароль. Попробуйте снова.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-[#0a1628] p-4">
            <Card className="w-full max-w-md rounded-xl shadow-2xl border-0">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-[#3CE8D1]/10 flex items-center justify-center">
                        <Lock className="h-6 w-6 text-[#3CE8D1]" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">
                        {success ? "Пароль изменён!" : "Новый пароль"}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        {success 
                            ? "Теперь вы можете войти с новым паролем"
                            : "Придумайте новый надёжный пароль"
                        }
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {success ? (
                        <div className="text-center py-8">
                            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-600/20 flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                Пароль успешно изменён!
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                Перенаправляем на страницу входа...
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

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-foreground">
                                    Новый пароль
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Минимум 8 символов"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10"
                                        required
                                        minLength={8}
                                        disabled={isLoading}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
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
                                        type={showPasswordConfirm ? "text" : "password"}
                                        placeholder="Повторите пароль"
                                        value={passwordConfirm}
                                        onChange={(e) => setPasswordConfirm(e.target.value)}
                                        className="pl-10 pr-10"
                                        required
                                        minLength={8}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        tabIndex={-1}
                                    >
                                        {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
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
                                        Сохранение...
                                    </>
                                ) : (
                                    "Сохранить новый пароль"
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
