"use client"

import type { ViewType } from "@/lib/types"
import {
  Building2,
  FileText,
  Users,
  Calculator,
  Newspaper,
  Plus,
  HelpCircle,
  Search,
  FileCheck,
  Settings,
  Landmark,
  FileSearch,
  PhoneCall,
  ScrollText,
  Folder,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { useAvatar } from "@/hooks/use-avatar"


interface SidebarProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  onCreateApplication: () => void
}

export function Sidebar({ activeView, onViewChange, onCreateApplication }: SidebarProps) {
  const { logout, user } = useAuth()
  const { avatar, getInitials } = useAvatar()

  const handleLogout = async () => {
    await logout()
  }

  // Handle create application - redirect to calculator
  const handleCreateApplication = () => {
    onViewChange("calculator")
  }

  // Agent menu items - new structure without accreditation
  const mainNavItems = [
    { id: "company" as ViewType, label: "Моя компания", icon: Building2 },
    { id: "applications" as ViewType, label: "Мои заявки", icon: FileText },
    { id: "clients" as ViewType, label: "Клиенты", icon: Users },
    { id: "calculator" as ViewType, label: "Калькулятор", icon: Calculator },
    { id: "banks" as ViewType, label: "Банки", icon: Landmark },
    { id: "acts" as ViewType, label: "Акты", icon: FileCheck },
    { id: "check_counterparty" as ViewType, label: "Проверка контрагента", icon: Search },
  ]

  const toolsNavItems = [
    { id: "news" as ViewType, label: "Новости", icon: Newspaper },
    { id: "call_database" as ViewType, label: "База для прозвона", icon: PhoneCall },
    { id: "help" as ViewType, label: "Помощь", icon: HelpCircle },
  ]

  return (
    <aside className="flex h-screen w-[260px] flex-col bg-[#0a1628] text-white">
      {/* Logo */}
      <div className="flex items-center px-5 py-6">
        <img src="/placeholder-logo.svg" alt="Лидер Гарант" className="h-12 w-auto" />
      </div>

      {/* Main CTA */}
      <div className="px-4 pb-4">
        <Button
          onClick={handleCreateApplication}
          className="w-full font-semibold bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
        >
          <Plus className="mr-2 h-4 w-4" />
          СОЗДАТЬ ЗАЯВКУ
        </Button>
      </div>

      {/* Main Navigation - with scroll */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {mainNavItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  activeView === item.id
                    ? "bg-[#3CE8D1]/10 text-[#3CE8D1]"
                    : "text-[#94a3b8] hover:bg-[#3CE8D1]/5 hover:text-white",
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Separator */}
        <div className="my-2 border-t border-white/10" />

        {/* Tools Navigation */}
        <ul className="space-y-0.5">
          {toolsNavItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  activeView === item.id
                    ? "bg-[#3CE8D1]/10 text-[#3CE8D1]"
                    : "text-[#94a3b8] hover:bg-[#3CE8D1]/5 hover:text-white",
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-3">
        {/* User Info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border-2 border-[#3CE8D1]">
            <AvatarImage src={avatar || undefined} alt="Фото профиля" />
            <AvatarFallback className="bg-[#3CE8D1] text-[#0a1628] text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs text-[#94a3b8]">Агент</p>
            <p className="text-sm font-medium">{user?.first_name || user?.email || "Пользователь"}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

