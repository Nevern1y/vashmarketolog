"use client"

import type { ViewType } from "@/lib/types"
import {
  Building2,
  FileText,
  Users,
  Calculator,
  Newspaper,
  LogOut,
  Plus,
  HelpCircle,
  Search,
  FileCheck,
  Settings,
  Landmark,
  FileSearch,
  PhoneCall,
  Phone,
  ScrollText,
  Folder,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { useAvatar } from "@/hooks/use-avatar"
import { NotificationDropdown } from "@/components/ui/notification-dropdown"
import type { Notification } from "@/hooks/use-notifications"

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
    { id: "my_contract" as ViewType, label: "Мой договор", icon: ScrollText },
    { id: "applications" as ViewType, label: "Мои заявки", icon: FileText },
    { id: "clients" as ViewType, label: "Клиенты", icon: Users },
    { id: "calculator" as ViewType, label: "Калькулятор", icon: Calculator },
    { id: "individual_terms" as ViewType, label: "Индивид. рассмотрение", icon: FileSearch },
    { id: "check_counterparty" as ViewType, label: "Проверка контрагента", icon: Search },
    { id: "acts" as ViewType, label: "Акты", icon: FileCheck },
    { id: "profile-settings" as ViewType, label: "Настройки", icon: Settings },
  ]

  const toolsNavItems = [
    { id: "documents" as ViewType, label: "Мои документы", icon: Folder },
    { id: "news" as ViewType, label: "Новости", icon: Newspaper },
    { id: "call_database" as ViewType, label: "База для прозвона", icon: PhoneCall },
    { id: "help" as ViewType, label: "Помощь", icon: HelpCircle },
  ]

  return (
    <aside className="flex h-screen w-[260px] flex-col bg-[#0a1628] text-white">
      {/* Logo + Notifications */}
      <div className="flex items-center justify-between px-5 py-6">
        <img src="/placeholder-logo.svg" alt="Лидер Гарант" className="h-12 w-auto" />
        <NotificationDropdown
          onNotificationClick={(notification: Notification) => {
            if (notification.details.applicationId) {
              onViewChange("applications")
            }
          }}
        />
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
        <div className="mb-3 flex items-center gap-3">
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

        {/* Support */}
        <div className="mb-3">
          <p className="text-xs text-[#94a3b8]">Поддержка</p>
          <p className="text-sm font-medium">+7 (965) 284-14-15</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = 'tel:+79652841415'}
            className="w-full mt-1.5 border-[#FF521D] bg-transparent text-[#FF521D] hover:bg-[#FF521D] hover:text-white"
          >
            <Phone className="mr-2 h-4 w-4" />
            Заказать звонок
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

