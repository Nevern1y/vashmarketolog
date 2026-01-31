"use client"

import { useState } from "react"
import { Menu, Plus, Bell, LogOut, Settings } from "lucide-react"
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
import { useAuth } from "@/lib/auth-context"

interface MobileHeaderProps {
  onMenuClick: () => void
  onSettingsClick?: () => void
}

export function MobileHeader({ onMenuClick, onSettingsClick }: MobileHeaderProps) {
  const { logout } = useAuth()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const handleLogout = async () => {
    setShowLogoutDialog(false)
    await logout()
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-white/5 bg-[#0a1628]/95 backdrop-blur-md px-4 py-2 lg:hidden sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="text-white hover:bg-white/10 h-10 w-10">
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex items-center gap-2">
            {/* Logo removed from header as per user request, will only be in sidebar */}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="text-[#94a3b8] hover:text-white"
            onClick={() => {}}
          >
            <Bell className="h-5 w-5" />
          </Button>

          {onSettingsClick && (
            <Button
              size="icon"
              variant="ghost"
              className="text-[#94a3b8] hover:text-white"
              onClick={onSettingsClick}
              title="Настройки"
            >
              <Settings className="h-5 w-5" />
            </Button>
          )}
          
          <Button
            size="icon"
            variant="ghost"
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={() => setShowLogoutDialog(true)}
            title="Выйти"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-[#0f2042] border-[#1e3a5f] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Выйти из аккаунта?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#94a3b8]">
              Вы уверены, что хотите выйти из личного кабинета?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[#1e3a5f] text-white hover:bg-[#1e3a5f]">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Выйти
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
