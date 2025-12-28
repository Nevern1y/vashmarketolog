"use client"

import { Menu, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MobileHeaderProps {
  onMenuClick: () => void
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b bg-[#0a1628] px-4 py-3 lg:hidden">
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="text-white hover:bg-white/10">
        <Menu className="h-6 w-6" />
      </Button>

      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3CE8D1]">
          <span className="text-sm font-bold text-white">ФМ</span>
        </div>
        <span className="text-sm font-semibold text-white">ФИНАНСОВЫЙ МАРКЕТПЛЕЙС</span>
      </div>

      <Button size="icon" className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]">
        <Plus className="h-5 w-5" />
      </Button>
    </header>
  )
}
