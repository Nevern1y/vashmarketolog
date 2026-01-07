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
  Shield,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { NotificationDropdown } from "@/components/ui/notification-dropdown"
import type { Notification } from "@/hooks/use-notifications"

interface SidebarProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  onCreateApplication: () => void
}

// Menu items that require accreditation
const ACCREDITATION_REQUIRED_VIEWS: ViewType[] = ["applications", "clients"]

export function Sidebar({ activeView, onViewChange, onCreateApplication }: SidebarProps) {
  const { logout, user } = useAuth()

  // Phase 4: Check accreditation status for agents
  const isAgent = user?.role === "agent"
  const isAccredited = (user as any)?.accreditation_status === "approved"
  const needsAccreditation = isAgent && !isAccredited

  const handleLogout = async () => {
    await logout()
  }

  // Handle navigation with accreditation check
  const handleNavClick = (viewId: ViewType) => {
    if (needsAccreditation && ACCREDITATION_REQUIRED_VIEWS.includes(viewId)) {
      toast.error("Доступ ограничен", {
        description: "Для доступа к этому разделу необходимо пройти аккредитацию",
        action: {
          label: "Пройти",
          onClick: () => onViewChange("accreditation"),
        },
      })
      return
    }
    onViewChange(viewId)
  }

  // Handle create application with accreditation check
  // Agent: redirect to Calculator (per ТЗ - agents create via calculator)
  // Client: open wizard directly
  const handleCreateApplication = () => {
    if (needsAccreditation) {
      toast.error("Доступ ограничен", {
        description: "Для создания заявок необходимо пройти аккредитацию",
        action: {
          label: "Пройти аккредитацию",
          onClick: () => onViewChange("accreditation"),
        },
      })
      return
    }

    // Agent: redirect to calculator view
    if (isAgent) {
      onViewChange("calculator")
      return
    }

    // Client: open wizard directly
    onCreateApplication()
  }

  // Agent menu items per CSV specification (ЛК Агента Меню)
  const mainNavItems = [
    { id: "company" as ViewType, label: "Моя компания", icon: Building2 },
    { id: "accreditation" as ViewType, label: "Аккредитация", icon: Shield },
    { id: "applications" as ViewType, label: "Мои заявки", icon: FileText, requiresAccreditation: true },
    { id: "calculator" as ViewType, label: "Калькулятор", icon: Calculator },
    { id: "clients" as ViewType, label: "Мои клиенты", icon: Users, requiresAccreditation: true },
    { id: "check_counterparty" as ViewType, label: "Проверка контрагента", icon: Search },
    { id: "acts" as ViewType, label: "Акты", icon: FileCheck },
    { id: "profile-settings" as ViewType, label: "Настройки", icon: Settings },
  ]

  const toolsNavItems = [
    { id: "bank_conditions" as ViewType, label: "Условия банков", icon: Landmark },
    { id: "individual_terms" as ViewType, label: "Индивид. рассмотрение", icon: FileSearch },
    { id: "news" as ViewType, label: "Новости", icon: Newspaper },
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

      {/* Main CTA - with accreditation guard */}
      <div className="px-4 pb-4">
        <Button
          onClick={handleCreateApplication}
          className={cn(
            "w-full font-semibold",
            needsAccreditation
              ? "bg-[#94a3b8]/30 text-[#94a3b8] cursor-not-allowed hover:bg-[#94a3b8]/30"
              : "bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
          )}
        >
          {needsAccreditation ? (
            <>
              <Lock className="mr-2 h-4 w-4" />
              СОЗДАТЬ ЗАЯВКУ
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              СОЗДАТЬ ЗАЯВКУ
            </>
          )}
        </Button>
        {needsAccreditation && (
          <p className="mt-1 text-xs text-[#f97316] text-center">Требуется аккредитация</p>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {mainNavItems.map((item) => {
            const isLocked = needsAccreditation && item.requiresAccreditation
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isLocked
                      ? "text-[#94a3b8]/50 cursor-not-allowed"
                      : activeView === item.id
                        ? "bg-[#3CE8D1]/10 text-[#3CE8D1]"
                        : "text-[#94a3b8] hover:bg-[#3CE8D1]/5 hover:text-white",
                  )}
                >
                  {isLocked ? (
                    <Lock className="h-5 w-5 text-[#94a3b8]/50" />
                  ) : (
                    <item.icon className="h-5 w-5" />
                  )}
                  {item.label}
                  {isLocked && (
                    <span className="ml-auto text-[10px] text-[#f97316]">🔒</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        {/* Separator */}
        <div className="my-4 border-t border-white/10" />

        {/* Tools Navigation */}
        <ul className="space-y-1">
          {toolsNavItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  activeView === item.id
                    ? "bg-[#3CE8D1]/10 text-[#3CE8D1]"
                    : "text-[#94a3b8] hover:bg-[#3CE8D1]/5 hover:text-white",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
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
              {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || "А"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs text-[#94a3b8]">Агент</p>
            <p className="text-sm font-medium">{user?.first_name || user?.email || "Пользователь"}</p>
          </div>
        </div>

        {/* Support */}
        <div className="mb-4">
          <p className="mb-1 text-xs text-[#94a3b8]">Служба поддержки</p>
          <p className="mb-2 text-sm font-medium">8-800-800-00-00</p>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-[#FF521D] bg-transparent text-[#FF521D] hover:bg-[#FF521D] hover:text-white"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
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

