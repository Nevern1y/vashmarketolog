"use client"

import { useState } from "react"
import { LoginView } from "@/components/auth/login-view"
import { RegisterView } from "@/components/auth/register-view"

export default function AuthPage() {
  const [view, setView] = useState<"login" | "register">("login")

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a1628] p-4">
      <div className="w-full max-w-md">
        {view === "login" ? (
          <LoginView onSwitchToRegister={() => setView("register")} />
        ) : (
          <RegisterView onSwitchToLogin={() => setView("login")} />
        )}
      </div>
    </div>
  )
}
