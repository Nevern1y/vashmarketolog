"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Lock, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { useAuth } from "../../lib/auth-context"
import { toast } from "sonner"

export function SeoLoginView() {
    const router = useRouter()
    const { login, logout, isLoading: authLoading, error: authError, clearError, user } = useAuth()

    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [accessError, setAccessError] = useState<string | null>(null)

    // Redirect if already logged in with correct role
    useEffect(() => {
        if (user) {
            // Check if user has SEO or admin role
            if (user.role === 'admin' || user.role === 'seo') {
                router.push("/seo-manager/dashboard")
            } else {
                // User is logged in but doesn't have access
                setAccessError("У вас нет доступа к админ-панели. Требуется роль администратора.")
            }
        }
    }, [user, router])

    // Clear auth errors when inputs change
    useEffect(() => {
        if (authError) {
            clearError()
        }
        if (accessError) {
            setAccessError(null)
        }
    }, [username, password])

    const isValid = username.trim() !== "" && password.trim() !== ""

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!isValid) return
        setAccessError(null)

        try {
            await login(username, password)
            
            // Note: The useEffect above will handle redirect or show error
            // based on the user's role after login completes
        } catch (err) {
            // Error is already displayed via authError
            const apiError = err as { message?: string };
            console.error("Login failed:", apiError.message || err)
        }
    }

    // Handle switching accounts if user doesn't have access
    const handleSwitchAccount = async () => {
        await logout()
        setAccessError(null)
        setUsername("")
        setPassword("")
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#1d194c] p-4">
            <Card className="w-full max-w-md border-[#3ce8d1]/30 bg-[#0b0b12]/50 shadow-2xl backdrop-blur-sm text-white">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#3ce8d1]/10 border border-[#3ce8d1]/20 shadow-[0_0_15px_rgba(60,232,209,0.3)]">
                        <ShieldCheck className="h-8 w-8 text-[#3ce8d1]" />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-3xl font-bold tracking-tight text-white">
                            Админка сайта
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Вход в админ-панель Лидер Гарант
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Auth Error Display */}
                    {authError && (
                        <div className="rounded-lg bg-red-900/20 border border-red-500/50 p-3 text-sm text-red-200 text-center">
                            {authError}
                        </div>
                    )}

                    {/* Access Denied Error */}
                    {accessError && (
                        <div className="rounded-lg bg-orange-900/20 border border-orange-500/50 p-4 text-sm text-orange-200 text-center space-y-3">
                            <p>{accessError}</p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleSwitchAccount}
                                className="border-orange-500/50 text-orange-200 hover:bg-orange-500/20"
                            >
                                Войти другим аккаунтом
                            </Button>
                        </div>
                    )}

                    {!accessError && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-slate-300">Email или Логин</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="name@lider-garant.ru"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="h-12 border-slate-700 bg-slate-900/50 pl-4 text-white placeholder:text-slate-600 focus:border-[#3ce8d1] focus-visible:ring-[#3ce8d1]/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-300">Пароль</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 border-slate-700 bg-slate-900/50 pl-4 pr-10 text-white placeholder:text-slate-600 focus:border-[#3ce8d1] focus-visible:ring-[#3ce8d1]/20"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-0 bottom-0 my-auto h-6 w-6 flex items-center justify-center text-slate-400 hover:text-[#3ce8d1] transition-colors"
                                        aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={!isValid || authLoading}
                                className="w-full h-12 bg-[#3ce8d1] text-[#1d194c] font-bold hover:bg-[#3ce8d1]/90 hover:shadow-[0_0_20px_rgba(60,232,209,0.4)] transition-all duration-300 text-base"
                            >
                                {authLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                                Войти в систему
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
