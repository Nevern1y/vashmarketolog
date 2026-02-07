"use client"

import { useState, Suspense, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { LoginView } from "@/components/auth/login-view"
import { RegisterView } from "@/components/auth/register-view"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

// Wrapper component to handle Suspense for useSearchParams
function AuthContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const refParam = searchParams.get("ref")
  const registerParam = searchParams.get("register")
  const shouldShowRegister =
    Boolean(refParam) || registerParam === "1" || registerParam === "true"

  // If user came from a referral link or direct registration link, show registration form immediately
  const [view, setView] = useState<"login" | "register">(
    shouldShowRegister ? "register" : "login",
  )

  // Update view when query params change (for direct navigation)
  useEffect(() => {
    if (shouldShowRegister) {
      setView("register")
    }
  }, [shouldShowRegister])

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return <AuthLoading />
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="w-full max-w-md">
      {view === "login" ? (
        <LoginView onSwitchToRegister={() => setView("register")} />
      ) : (
        <RegisterView onSwitchToLogin={() => setView("login")} />
      )}
    </div>
  )
}

// Loading fallback
function AuthLoading() {
  return (
    <div className="w-full max-w-md flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
    </div>
  )
}

export default function AuthPage() {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-[#0a1628] p-4">
      <Suspense fallback={<AuthLoading />}>
        <AuthContent />
      </Suspense>
    </div>
  )
}
