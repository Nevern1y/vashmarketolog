"use client"

import type { PartnerViewType } from "@/lib/types"
import { Landmark, Users, UserCheck, FileText, LogOut, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"

interface PartnerSidebarProps {
  activeView: PartnerViewType
  onViewChange: (view: PartnerViewType) => void
  newApplicationsCount?: number
}

// Partner menu items per CSV specification (ЛК Партнера Меню)
const navItems = [
  { id: "my_bank" as PartnerViewType, label: "Мой банк/МФО", icon: Landmark },
  { id: "clients" as PartnerViewType, label: "Мои клиенты", icon: Users },
  { id: "agents" as PartnerViewType, label: "Мои агенты", icon: UserCheck },
  { id: "applications" as PartnerViewType, label: "Мои заявки", icon: FileText },
]

export function PartnerSidebar({ activeView, onViewChange, newApplicationsCount }: PartnerSidebarProps) {
  const { logout, user } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <aside className="flex h-screen w-[260px] flex-col bg-[#0a1628] text-white">
      {/* Logo */}
      <div className="flex items-center px-5 py-6">
        <img src="/placeholder-logo.svg" alt="Лидер Гарант" className="h-12 w-auto" />
      </div>

      {/* Partner Badge */}
      <div className="mx-4 mb-4 rounded-lg bg-[#3CE8D1]/10 px-4 py-3">
        <p className="text-xs text-[#3CE8D1]">Партнер</p>
        <p className="text-sm font-semibold">Финансовая организация</p>
      </div>

      {/* Navigation - NO Create Application Button for Partners */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  activeView === item.id || (activeView === "application-detail" && item.id === "applications")
                    ? "bg-[#3CE8D1]/10 text-[#3CE8D1]"
                    : "text-[#94a3b8] hover:bg-[#3CE8D1]/5 hover:text-white",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {item.id === "applications" && newApplicationsCount !== undefined && newApplicationsCount > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#3CE8D1] text-[#0a1628] text-xs font-semibold">
                    {newApplicationsCount}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        {/* User Info */}
        <div className="mb-4 flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-[#3CE8D1]">
            <AvatarFallback className="bg-[#3CE8D1] text-[#0a1628] text-sm">
              {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || "П"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs text-[#94a3b8]">Партнер</p>
            <p className="text-sm font-medium">{user?.first_name || user?.email || "Пользователь"}</p>
          </div>
        </div>

        {/* Support */}
        <div className="mb-4">
          <p className="mb-1 text-xs text-[#94a3b8]">Техподдержка</p>
          <p className="mb-2 text-sm font-medium">8-800-800-00-00</p>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-[#FF521D] bg-transparent text-[#FF521D] hover:bg-[#FF521D] hover:text-white"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Связаться
          </Button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 text-sm text-[#94a3b8] hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </button>
      </div>
    </aside>
  )
}
