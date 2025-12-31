"use client"

import { useState, Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { LoginView } from "@/components/auth/login-view"
import { RegisterView } from "@/components/auth/register-view"
import { Loader2 } from "lucide-react"

// Wrapper component to handle Suspense for useSearchParams
function AuthContent() {
  const searchParams = useSearchParams()
  const refParam = searchParams.get("ref")

  // If user came from a referral link, show registration form immediately
  const [view, setView] = useState<"login" | "register">(refParam ? "register" : "login")

  // Update view when ref param changes (for direct navigation)
  useEffect(() => {
    if (refParam) {
      setView("register")
    }
  }, [refParam])

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
    <div className="flex min-h-screen items-center justify-center bg-[#0a1628] p-4">
      <Suspense fallback={<AuthLoading />}>
        <AuthContent />
      </Suspense>
    </div>
  )
}
