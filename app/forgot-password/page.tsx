"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react"
import api from "@/lib/api"

export default function ForgotPasswordPage() {
    const router = useRouter()

    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!email.trim()) {
            setError("Введите email")
            return
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setError("Введите корректный email")
            return
        }

        setIsLoading(true)

        try {
            await api.post("/auth/password/reset/", { email })
            setSuccess(true)
        } catch (err: unknown) {
            const apiError = err as { message?: string }
            // Don't reveal if email exists or not for security
            // Always show success message
            setSuccess(true)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-[#0a1628] p-4">
            <Card className="w-full max-w-md rounded-xl shadow-2xl border-0">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-[#3CE8D1]/10 flex items-center justify-center">
                        <Mail className="h-6 w-6 text-[#3CE8D1]" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">
                        Восстановление пароля
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        {success 
                            ? "Проверьте вашу почту"
                            : "Введите email для получения ссылки на сброс пароля"
                        }
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {success ? (
                        <div className="text-center py-4">
                            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-600/20 flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                            </div>
                            <p className="text-foreground mb-2">
                                Если аккаунт с этим email существует, мы отправили письмо с инструкциями.
                            </p>
                            <p className="text-muted-foreground text-sm">
                                Проверьте папку &quot;Спам&quot;, если письмо не пришло.
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
                                        autoFocus
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
                                        Отправка...
                                    </>
                                ) : (
                                    "Отправить ссылку"
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>

                <CardFooter className="justify-center border-t border-border pt-6">
                    <Link 
                        href="/auth" 
                        className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Вернуться к входу
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
