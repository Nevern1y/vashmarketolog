"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Phone, Mail, Send, MessageCircle, ChevronDown, User, Settings, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationDropdown } from "@/components/ui/notification-dropdown"
import { useAuth } from "@/lib/auth-context"
import { useMyCompany } from "@/hooks/use-companies"
import { useAvatar } from "@/hooks/use-avatar"
import { type Notification } from "@/hooks/use-notifications"
import { SUPPORT_CONTACTS } from "@/lib/support-contacts"
import { SupportMessageModal } from "./support-message-modal"

interface DashboardHeaderProps {
    onNotificationClick?: (notification: Notification) => void
    onNavigateToSettings?: () => void
}

/**
 * DashboardHeader - Header component matching the reference design
 */
export function DashboardHeader({ onNotificationClick, onNavigateToSettings }: DashboardHeaderProps) {
    const router = useRouter()
    const { user, logout } = useAuth()
    const { avatar, getInitials } = useAvatar()
    const { company, isLoading: companyLoading } = useMyCompany()
    const [showContactPopup, setShowContactPopup] = useState(false)
    const [showSupportModal, setShowSupportModal] = useState(false)
    const [showLogoutDialog, setShowLogoutDialog] = useState(false)

    // Role label for display
    const roleLabel = user?.role === "client" ? "Клиент" :
        user?.role === "agent" ? "Агент" :
            user?.role === "partner" ? "Партнер" : "Пользователь"

    // Company name for display
    const companyName = company?.short_name || company?.name || "Личный кабинет"

    // Handle logout
    const handleLogout = async () => {
        setShowLogoutDialog(false)
        await logout()
    }

    // Handle settings navigation
    const handleSettings = () => {
        if (onNavigateToSettings) {
            onNavigateToSettings()
        }
    }

    return (
        <>
            {/* Header - with explicit z-index for proper layering */}
            <header
                className="hidden lg:flex h-12 items-center justify-between bg-[#0a1628] px-6 border-b border-white/10 relative z-40"
            >
                {/* Left: Curator button */}
                <button
                    type="button"
                    onClick={() => setShowContactPopup(true)}
                    className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
                >
                    <span className="text-[#94a3b8]">Ваш куратор:</span>
                    <span className="flex items-center gap-1.5 text-[#3CE8D1] font-medium">
                        <User className="h-4 w-4" />
                        Георгий
                        <ChevronDown className="h-4 w-4" />
                    </span>
                </button>

                {/* Right: Notifications + Account */}
                <div className="flex items-center gap-4">
                    {/* Support Message Button */}
                    <button
                        type="button"
                        onClick={() => setShowSupportModal(true)}
                        className="text-[#94a3b8] hover:text-white transition-colors"
                        title="Написать в поддержку"
                    >
                        <MessageCircle className="h-5 w-5" />
                    </button>

                    {/* Notification Dropdown */}
                    <NotificationDropdown onNotificationClick={onNotificationClick} />

                    {/* Account Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                            >
                                <Avatar className="h-8 w-8 border border-[#3CE8D1]/50">
                                    <AvatarImage src={avatar || undefined} alt="Фото" />
                                    <AvatarFallback className="bg-[#3CE8D1] text-[#0a1628] text-xs font-semibold">
                                        {getInitials()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-right leading-tight">
                                    <p className="text-sm font-medium text-white max-w-[160px] truncate">
                                        {companyLoading ? "..." : companyName}
                                    </p>
                                </div>
                                <ChevronDown className="h-4 w-4 text-[#94a3b8]" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-56 bg-[#1a2537] border-[#2a3547] text-white"
                            sideOffset={8}
                        >
                            <DropdownMenuLabel className="text-[#94a3b8]">
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm font-medium text-white">
                                        {user?.first_name || user?.email || "Пользователь"}
                                    </p>
                                    <p className="text-xs text-[#94a3b8]">{user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-[#2a3547]" />
                            <DropdownMenuItem
                                onClick={handleSettings}
                                className="cursor-pointer hover:bg-[#2a3547] focus:bg-[#2a3547]"
                            >
                                <Settings className="mr-2 h-4 w-4 text-[#94a3b8]" />
                                <span>Настройки профиля</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#2a3547]" />
                            <DropdownMenuItem
                                onClick={() => setShowLogoutDialog(true)}
                                className="cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-400"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Выйти</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Support Message Modal */}
            <SupportMessageModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} />

            {/* Contact Popup */}
            <Dialog open={showContactPopup} onOpenChange={setShowContactPopup}>
                <DialogContent className="sm:max-w-md bg-[#1a2537] border-[#2a3547] text-white p-0 max-h-[calc(100vh-1rem)] max-h-[calc(100dvh-1rem)] overflow-y-auto">
                    <div className="sr-only">
                        <DialogTitle>Связаться с нами</DialogTitle>
                        <DialogDescription>Способы связи с куратором и поддержкой</DialogDescription>
                    </div>
                    <div className="p-5">
                        <DialogHeader className="mb-5">
                            <DialogTitle className="text-lg font-semibold text-white">Связаться с нами</DialogTitle>
                        </DialogHeader>

                        {/* Contact Options */}
                        <div className="space-y-2.5">
                            {/* Call - Teal icon */}
                            <a
                                href={`tel:${SUPPORT_CONTACTS.phoneRaw}`}
                                className="flex items-center gap-3 p-3.5 rounded-lg bg-[#0d1829] hover:bg-[#162033] transition-colors"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3CE8D1]">
                                    <Phone className="h-4 w-4 text-[#0a1628]" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-[#94a3b8] uppercase tracking-wide mb-0.5">Позвонить</p>
                                    <p className="text-sm font-medium text-white">{SUPPORT_CONTACTS.phoneDisplay}</p>
                                </div>
                            </a>

                            {/* Email - Teal icon */}
                            <a
                                href={`mailto:${SUPPORT_CONTACTS.email}`}
                                className="flex items-center gap-3 p-3.5 rounded-lg bg-[#0d1829] hover:bg-[#162033] transition-colors"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3CE8D1]">
                                    <Mail className="h-4 w-4 text-[#0a1628]" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-[#94a3b8] uppercase tracking-wide mb-0.5">Написать на почту</p>
                                    <p className="text-sm font-medium text-white">{SUPPORT_CONTACTS.email}</p>
                                </div>
                            </a>

                            {/* Telegram - Teal icon */}
                            <a
                                href={SUPPORT_CONTACTS.telegramUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3.5 rounded-lg bg-[#0d1829] hover:bg-[#162033] transition-colors"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3CE8D1]">
                                    <Send className="h-4 w-4 text-[#0a1628]" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-[#94a3b8] uppercase tracking-wide mb-0.5">Telegram</p>
                                    <p className="text-sm font-medium text-white">{SUPPORT_CONTACTS.telegramHandle}</p>
                                </div>
                            </a>

                            {/* Chat */}
                            <button
                                type="button"
                                onClick={() => {
                                    setShowContactPopup(false)
                                    setShowSupportModal(true)
                                }}
                                className="flex w-full items-center gap-3 p-3.5 rounded-lg bg-[#0d1829] hover:bg-[#162033] transition-colors"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f97316]">
                                    <MessageCircle className="h-4 w-4 text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] text-[#94a3b8] uppercase tracking-wide mb-0.5">Чат</p>
                                    <p className="text-sm font-medium text-white">Написать в поддержку</p>
                                </div>
                            </button>
                        </div>

                        {/* Manager Section */}
                        <div className="mt-5 pt-4 border-t border-[#2a3547]">
                            <p className="text-[10px] text-[#94a3b8] uppercase tracking-wide mb-3">Ваш персональный менеджер</p>
                            <div className="flex items-center gap-3 mb-3">
                                <Avatar className="h-10 w-10 bg-[#3CE8D1]">
                                    <AvatarFallback className="bg-[#3CE8D1] text-[#0a1628] text-sm font-semibold">Г</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium text-white">Георгий</p>
                                    <p className="text-[11px] text-[#94a3b8]">Персональный менеджер</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 text-sm">
                                <a href={`tel:${SUPPORT_CONTACTS.phoneRaw}`} className="flex items-center gap-2 text-[#3CE8D1] hover:underline">
                                    <Phone className="h-3.5 w-3.5" />
                                    {SUPPORT_CONTACTS.phoneDisplay}
                                </a>
                                <a href={`mailto:${SUPPORT_CONTACTS.email}`} className="flex items-center gap-2 text-[#3CE8D1] hover:underline">
                                    <Mail className="h-3.5 w-3.5" />
                                    {SUPPORT_CONTACTS.email}
                                </a>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
