"use client"

import { useState } from "react"
import type { ClientViewType } from "@/lib/types"
import {
  ShieldCheck,
  Building2,
  FileText,
  FolderOpen,
  Trophy,
  Calculator,
  Newspaper,
  LogOut,
  Plus,
  HelpCircle,
  Settings,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/lib/auth-context"
import { useMyCompany } from "@/hooks/use-companies"

interface ClientSidebarProps {
  activeView: ClientViewType
  onViewChange: (view: ClientViewType) => void
  onCreateApplication: () => void
}

const mainNavItems = [
  { id: "accreditation" as ClientViewType, label: "Аккредитация", icon: ShieldCheck },
  { id: "company" as ClientViewType, label: "Моя компания", icon: Building2 },
  { id: "documents" as ClientViewType, label: "Мои документы", icon: FolderOpen },
  { id: "applications" as ClientViewType, label: "Мои заявки", icon: FileText },
  { id: "victories" as ClientViewType, label: "Мои победы", icon: Trophy },
]

// Client menu items per CSV specification (ЛК Клиента Меню)
const toolsNavItems = [
  { id: "calculator" as ClientViewType, label: "Калькулятор", icon: Calculator },
  { id: "news" as ClientViewType, label: "Новости", icon: Newspaper },
  { id: "help" as ClientViewType, label: "Помощь", icon: HelpCircle },
]

export function ClientSidebar({ activeView, onViewChange, onCreateApplication }: ClientSidebarProps) {
  const { logout, user } = useAuth()
  const { company, isLoading: companyLoading } = useMyCompany()

  // 🛡️ Accreditation Guard State
  const [showGuardAlert, setShowGuardAlert] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  // 🛡️ Guard Check: Can user create application?
  const handleCreateClick = () => {
    // Wait for company data to load
    if (companyLoading) return

    // Check if company exists and has required data (at least INN)
    if (!company || !company.inn) {
      setShowGuardAlert(true)
      return
    }

    // Company exists - proceed to wizard
    onCreateApplication()
  }

  // Navigate to company profile and close dialog
  const handleGoToProfile = () => {
    setShowGuardAlert(false)
    onViewChange("company")
  }

  return (
    <>
      <aside className="flex h-screen w-[260px] flex-col bg-[#0a1628] text-white">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3CE8D1]">
            <span className="text-lg font-bold text-[#0a1628]">ФМ</span>
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">ФИНАНСОВЫЙ</p>
            <p className="text-xs text-[#94a3b8]">МАРКЕТПЛЕЙС</p>
          </div>
        </div>

        {/* Main CTA */}
        <div className="px-4 pb-4">
          <Button
            onClick={handleCreateClick}
            disabled={companyLoading}
            className="w-full bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] font-semibold"
          >
            <Plus className="mr-2 h-4 w-4" />
            СОЗДАТЬ ЗАЯВКУ
          </Button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3">
          <ul className="space-y-1">
            {mainNavItems.map((item) => (
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

          {/* Separator */}
          <div className="my-4 border-t border-white/10" />

          {/* Profile Settings */}
          <button
            onClick={() => onViewChange("profile-settings")}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              activeView === "profile-settings"
                ? "bg-[#3CE8D1]/10 text-[#3CE8D1]"
                : "text-[#94a3b8] hover:bg-[#3CE8D1]/5 hover:text-white",
            )}
          >
            <Settings className="h-5 w-5" />
            Настройки профиля
          </button>
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-4">
          {/* User Info */}
          <div className="mb-4 flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-[#3CE8D1]">
              <AvatarFallback className="bg-[#3CE8D1] text-[#0a1628] text-sm">
                {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || "К"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-[#94a3b8]">Клиент</p>
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

      {/* 🛡️ Accreditation Guard Alert Dialog */}
      <AlertDialog open={showGuardAlert} onOpenChange={setShowGuardAlert}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E03E9D]/10">
                <AlertTriangle className="h-5 w-5 text-[#E03E9D]" />
              </div>
              <AlertDialogTitle className="text-foreground">
                Требуется аккредитация
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground">
              Для создания заявки необходимо заполнить профиль компании.
              Пожалуйста, укажите ИНН и основные данные вашей организации.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border bg-transparent">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleGoToProfile}
              className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
            >
              <Building2 className="mr-2 h-4 w-4" />
              Перейти к профилю
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
