"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../../lib/auth-context"
import { SeoDashboard } from "../../../components/seo/seo-dashboard"
import { Loader2, ShieldX } from "lucide-react"
import { toast } from "sonner"

export default function SeoDashboardPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                // Not authenticated - redirect to login
                router.push("/seo-manager/login")
            } else if (user.role !== 'admin' && user.role !== 'seo') {
                // Authenticated but no access - show error and redirect
                toast.error("Доступ запрещён", {
                    description: "Требуется роль SEO-менеджера или администратора."
                })
                router.push("/")
            }
        }
    }, [user, isLoading, router])

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // Not authenticated
    if (!user) return null

    // Check role access
    if (user.role !== 'admin' && user.role !== 'seo') {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-[#1d194c] text-white">
                <ShieldX className="h-16 w-16 text-red-400" />
                <h1 className="text-2xl font-bold">Доступ запрещён</h1>
                <p className="text-slate-400">Требуется роль SEO-менеджера или администратора</p>
            </div>
        )
    }

    return <SeoDashboard />
}
