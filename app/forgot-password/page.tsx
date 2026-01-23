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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <Card className="w-full max-w-md shadow-2xl border-slate-700 bg-slate-800/50 backdrop-blur">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-600/20 flex items-center justify-center">
                        <Mail className="h-6 w-6 text-blue-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">
                        Восстановление пароля
                    </CardTitle>
                    <CardDescription className="text-slate-400">
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
                            <p className="text-slate-300 mb-2">
                                Если аккаунт с этим email существует, мы отправили письмо с инструкциями.
                            </p>
                            <p className="text-slate-400 text-sm">
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
                                <Label htmlFor="email" className="text-slate-300">
                                    Email
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="example@mail.ru"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                                        required
                                        disabled={isLoading}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
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

                <CardFooter className="justify-center border-t border-slate-700 pt-6">
                    <Link 
                        href="/auth" 
                        className="flex items-center text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Вернуться к входу
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
