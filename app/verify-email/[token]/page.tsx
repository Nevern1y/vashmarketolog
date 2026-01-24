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
                return <Loader2 className="h-8 w-8 text-[#3CE8D1] animate-spin" />
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
                return "bg-[#3CE8D1]/10"
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
        <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-[#0a1628] p-4">
            <Card className="w-full max-w-md rounded-xl shadow-2xl border-0">
                <CardHeader className="text-center pb-2">
                    <div className={`mx-auto mb-4 h-16 w-16 rounded-full ${getStatusBgColor()} flex items-center justify-center`}>
                        {getStatusIcon()}
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">
                        {getStatusTitle()}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        {message}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {status === "success" && (
                        <Button
                            onClick={() => router.push("/")}
                            className="w-full bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] font-medium py-2.5"
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
                                className="w-full"
                            >
                                Попробовать снова
                            </Button>
                            <Button
                                onClick={() => router.push("/auth")}
                                className="w-full bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] font-medium py-2.5"
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
