"use client"

import { useState } from "react"
import type { AppMode } from "@/lib/types"
import { Settings, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DevToolWidgetProps {
  currentMode: AppMode
  onModeChange: (mode: AppMode) => void
}

const modes: { id: AppMode; label: string; description: string }[] = [
  { id: "auth", label: "Авторизация", description: "Вход / Регистрация" },
  { id: "agent-dashboard", label: "Агент: Дашборд", description: "Главный экран агента" },
  { id: "agent-app-detail", label: "Агент: Заявка", description: "Детали заявки + чат" },
  { id: "agent-crm", label: "Агент: CRM", description: "Управление клиентами" },
  { id: "client-dashboard", label: "Клиент: Дашборд", description: "Личный кабинет клиента" },
  { id: "partner-dashboard", label: "Партнер: Дашборд", description: "Входящие заявки партнера" },
  { id: "admin-dashboard", label: "Админ", description: "Модерация заявок" },
]

export function DevToolWidget({ currentMode, onModeChange }: DevToolWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      {/* Panel */}
      {isOpen && (
        <div className="mb-3 w-64 rounded-xl border bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b bg-[#0a1628] px-4 py-2">
            <span className="text-sm font-semibold text-white">Demo Switcher</span>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-2 max-h-80 overflow-y-auto">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  onModeChange(mode.id)
                  setIsOpen(false)
                }}
                className={cn(
                  "flex w-full flex-col items-start rounded-lg px-3 py-2 text-left transition-colors",
                  currentMode === mode.id ? "bg-[#3CE8D1]/10 text-[#3CE8D1]" : "hover:bg-muted",
                )}
              >
                <span className="text-sm font-medium">{mode.label}</span>
                <span className="text-xs text-muted-foreground">{mode.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all",
          isOpen ? "bg-[#0a1628] text-white" : "bg-[#f97316] text-white hover:bg-[#ea580c]",
        )}
      >
        <Settings className={cn("h-5 w-5 transition-transform", isOpen && "rotate-90")} />
      </button>
    </div>
  )
}
