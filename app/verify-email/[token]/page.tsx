"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Loader2, CheckCircle2, AlertCircle, XCircle } from "lucide-react"
import api from "@/lib/api"

type VerificationStatus = "loading" | "success" | "error" | "expired"

export default function VerifyEmailPage() {
    const router = useRouter()
    const params = useParams()
    const token = params.token as string

    const [status, setStatus] = useState<VerificationStatus>("loading")
    const [message, setMessage] = useState("")

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await api.post<{ message: string }>(`/auth/email/verify/${token}/`)
                setStatus("success")
                setMessage(response.message || "Email успешно подтверждён!")
            } catch (err: unknown) {
                const apiError = err as { message?: string; status?: number }
                if (apiError.status === 410 || apiError.message?.includes("expired")) {
                    setStatus("expired")
                    setMessage("Ссылка для подтверждения устарела. Запросите новое письмо.")
                } else {
                    setStatus("error")
                    setMessage(apiError.message || "Не удалось подтвердить email. Попробуйте снова.")
                }
            }
        }

        if (token) {
            verifyEmail()
        }
    }, [token])

    const getStatusIcon = () => {
        switch (status) {
            case "loading":
                return <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            case "success":
                return <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            case "expired":
                return <AlertCircle className="h-8 w-8 text-amber-400" />
            case "error":
                return <XCircle className="h-8 w-8 text-red-400" />
        }
    }

    const getStatusBgColor = () => {
        switch (status) {
            case "loading":
                return "bg-blue-600/20"
            case "success":
                return "bg-emerald-600/20"
            case "expired":
                return "bg-amber-600/20"
            case "error":
                return "bg-red-600/20"
        }
    }

    const getStatusTitle = () => {
        switch (status) {
            case "loading":
                return "Подтверждение email..."
            case "success":
                return "Email подтверждён!"
            case "expired":
                return "Ссылка устарела"
            case "error":
                return "Ошибка подтверждения"
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <Card className="w-full max-w-md shadow-2xl border-slate-700 bg-slate-800/50 backdrop-blur">
                <CardHeader className="text-center pb-2">
                    <div className={`mx-auto mb-4 h-16 w-16 rounded-full ${getStatusBgColor()} flex items-center justify-center`}>
                        {getStatusIcon()}
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">
                        {getStatusTitle()}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        {message}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {status === "success" && (
                        <Button
                            onClick={() => router.push("/")}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5"
                        >
                            Перейти в личный кабинет
                        </Button>
                    )}

                    {status === "expired" && (
                        <Button
                            onClick={() => router.push("/auth")}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5"
                        >
                            <Mail className="mr-2 h-4 w-4" />
                            Войти и запросить новое письмо
                        </Button>
                    )}

                    {status === "error" && (
                        <div className="space-y-2">
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                                Попробовать снова
                            </Button>
                            <Button
                                onClick={() => router.push("/auth")}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                            >
                                Вернуться к входу
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
