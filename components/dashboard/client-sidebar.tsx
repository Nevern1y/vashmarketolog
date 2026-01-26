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
  Plus,
  HelpCircle,
  Settings,
  AlertTriangle,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useAuth } from "@/lib/auth-context"
import { useMyCompany } from "@/hooks/use-companies"
import { getMissingCompanyBasics } from "@/lib/company-basics"



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
  { id: "tender_support" as ClientViewType, label: "Сопровождение", icon: Briefcase },
]

const toolsNavItems = [
  { id: "calculator" as ClientViewType, label: "Калькулятор", icon: Calculator },
  { id: "news" as ClientViewType, label: "Новости", icon: Newspaper },
  { id: "help" as ClientViewType, label: "Помощь", icon: HelpCircle },
]

export function ClientSidebar({ activeView, onViewChange, onCreateApplication }: ClientSidebarProps) {
  const { logout } = useAuth()
  const { company, isLoading: companyLoading } = useMyCompany()

  const [showGuardAlert, setShowGuardAlert] = useState(false)
  const missingBasics = getMissingCompanyBasics(company ? { inn: company.inn, name: company.name } : null)
  const missingBasicsText = missingBasics.join(" и ")

  const handleLogout = async () => {
    await logout()
  }

  const handleCreateClick = () => {
    if (companyLoading) return

    if (missingBasics.length > 0) {
      setShowGuardAlert(true)
      return
    }

    onViewChange("calculator")
    onCreateApplication()
  }

  const handleGoToProfile = () => {
    setShowGuardAlert(false)
    onViewChange("company")
  }

  return (
    <>
      <aside 
        data-sidebar="sidebar"
        className="flex h-[100dvh] min-h-screen w-[260px] flex-col bg-[#0a1628] text-white overflow-y-auto"
      >
        {/* Logo */}
        <div className="flex items-center px-5 py-6">
          <img src="/placeholder-logo.svg" alt="Лидер Гарант" className="h-12 w-auto" />
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
              <li key={item.id} className={item.id === "profile-settings" ? "lg:hidden" : ""}>
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

          {/* Logout button removed - moved to Header */}
        </nav>


      </aside>

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
              Пожалуйста, укажите {missingBasicsText || "ИНН и полное наименование"}.
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
