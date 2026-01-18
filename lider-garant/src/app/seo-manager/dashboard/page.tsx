"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../../lib/auth-context"
import { SeoDashboard } from "../../../components/seo/seo-dashboard"
import { Loader2 } from "lucide-react"

export default function SeoDashboardPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/seo-manager/login")
        }
    }, [user, isLoading, router])

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!user) return null

    return <SeoDashboard />
}
