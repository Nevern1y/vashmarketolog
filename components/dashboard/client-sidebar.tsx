"use client"

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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

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

const toolsNavItems = [
  { id: "calculator" as ClientViewType, label: "Калькулятор", icon: Calculator },
  { id: "news" as ClientViewType, label: "Новости", icon: Newspaper },
]

export function ClientSidebar({ activeView, onViewChange, onCreateApplication }: ClientSidebarProps) {
  return (
    <aside className="flex h-screen w-[260px] flex-col bg-[#0a1628] text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00d4aa]">
          <span className="text-lg font-bold text-white">ФМ</span>
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">ФИНАНСОВЫЙ</p>
          <p className="text-xs text-[#94a3b8]">МАРКЕТПЛЕЙС</p>
        </div>
      </div>

      {/* Main CTA */}
      <div className="px-4 pb-4">
        <Button
          onClick={onCreateApplication}
          className="w-full bg-[#00d4aa] text-white hover:bg-[#00b894] font-semibold"
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
                    ? "bg-white/10 text-white"
                    : "text-[#94a3b8] hover:bg-white/5 hover:text-white",
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
                    ? "bg-white/10 text-white"
                    : "text-[#94a3b8] hover:bg-white/5 hover:text-white",
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
              ? "bg-white/10 text-white"
              : "text-[#94a3b8] hover:bg-white/5 hover:text-white",
          )}
        >
          <Settings className="h-5 w-5" />
          Настройки профиля
        </button>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        {/* Manager Info */}
        <div className="mb-4 flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-[#00d4aa]">
            <AvatarFallback className="bg-[#00d4aa] text-white text-sm">ДС</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs text-[#94a3b8]">Ваш менеджер</p>
            <p className="text-sm font-medium">Д. Сергеев</p>
          </div>
        </div>

        {/* Support */}
        <div className="mb-4">
          <p className="mb-1 text-xs text-[#94a3b8]">Служба поддержки</p>
          <p className="mb-2 text-sm font-medium">8-800-800-00-00</p>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-[#f97316] bg-transparent text-[#f97316] hover:bg-[#f97316] hover:text-white"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Заказать звонок
          </Button>
        </div>

        {/* Logout */}
        <button className="flex w-full items-center gap-2 text-sm text-[#94a3b8] hover:text-white transition-colors">
          <LogOut className="h-4 w-4" />
          Выйти
        </button>
      </div>
    </aside>
  )
}
