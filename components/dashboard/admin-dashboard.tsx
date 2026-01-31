"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    FileText,
    Users,
    Building2,
    BarChart3,
    LogOut,
    ChevronLeft,
    Menu,
    Newspaper,
    UserCheck,
    X,
    Bell,
    Settings,
    Lock,
    User,
    PhoneIncoming,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { usePersistedView, usePersistedAppDetail } from "@/hooks/use-persisted-view"
import { PartnersTab } from "./partners-tab"
import { AdminApplicationsView } from "./admin-applications-view"
import { AdminAgentsView } from "./admin-agents-view"
import { AdminStatisticsView } from "./admin-statistics-view"
import { AdminApplicationDetail } from "./admin-application-detail"
import { AdminNewsView } from "./admin-news-view"
import { AdminCRMClientsView } from "./admin-crm-clients-view"
import { AdminLeadsView } from "./admin-leads-view"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ProfileSettingsView } from "./profile-settings-view"

// ============================================
// Sidebar Navigation Items
// ============================================

type AdminView = "applications" | "leads" | "agents" | "clients" | "partners" | "statistics" | "news" | "profile-settings"

const NAV_ITEMS: { id: AdminView; label: string; icon: typeof FileText }[] = [
    { id: "applications", label: "Заявки", icon: FileText },
    { id: "leads", label: "Лиды с сайта", icon: PhoneIncoming },
    { id: "agents", label: "Агенты", icon: Users },
    { id: "clients", label: "Клиенты", icon: UserCheck },
    { id: "news", label: "Новости", icon: Newspaper },
    { id: "partners", label: "Партнёры", icon: Building2 },
    { id: "statistics", label: "Статистика", icon: BarChart3 },
]

const ADMIN_VIEWS: AdminView[] = ["applications", "leads", "agents", "clients", "partners", "statistics", "news", "profile-settings"]

// ============================================
// Admin Sidebar Component (reusable for desktop & mobile)
// ============================================
interface AdminSidebarProps {
    activeView: AdminView
    onViewChange: (view: AdminView) => void
    collapsed?: boolean
    onToggleCollapse?: () => void
    onClose?: () => void
    isMobile?: boolean
    onRequestLogout?: () => void
}

function AdminSidebarContent({ activeView, onViewChange, collapsed = false, onToggleCollapse, onClose, isMobile = false, onRequestLogout }: AdminSidebarProps) {
    const { user } = useAuth()

    const handleLogoutClick = () => {
        if (onRequestLogout) {
            onRequestLogout()
        }
    }

    return (
        <>
            {/* Sidebar Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-border shrink-0">
                {(!collapsed || isMobile) && (
                    <div className="flex items-center">
                        <img src="/placeholder-logo.svg" alt="Лидер Гарант" className="h-10 w-auto" />
                    </div>
                )}
                {isMobile ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleCollapse}
                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                        {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon
                    const isActive = activeView === item.id
                    return (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                isActive
                                    ? "bg-[#3CE8D1]/10 text-[#3CE8D1]"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                            )}
                        >
                            <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-[#3CE8D1]")} />
                            {(!collapsed || isMobile) && <span>{item.label}</span>}
                        </button>
                    )
                })}
            </nav>

            {/* User Section */}
            <div className="p-3 border-t border-border shrink-0">
                {(!collapsed || isMobile) ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-[#4F7DF3] flex items-center justify-center text-xs font-bold text-white shrink-0">
                                {user?.email?.charAt(0).toUpperCase() || "A"}
                            </div>
                            <div className="text-xs min-w-0">
                                <p className="font-medium text-white truncate max-w-[120px]">{user?.email}</p>
                                <Badge className="bg-[#3CE8D1]/10 text-[#3CE8D1] text-[10px] px-1.5 py-0">Admin</Badge>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogoutClick}
                            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogoutClick}
                        className="w-full h-10 text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </>
    )
}

// ============================================
// Mobile Header for Admin
// ============================================
interface AdminMobileHeaderProps {
    onMenuClick: () => void
    onSettingsClick?: () => void
    onProfileClick?: () => void
    activeView: AdminView
    onRequestLogout?: () => void
}

function AdminMobileHeader({ onMenuClick, onSettingsClick, onProfileClick, activeView, onRequestLogout }: AdminMobileHeaderProps) {
    const viewLabel = NAV_ITEMS.find(item => item.id === activeView)?.label || (activeView === "profile-settings" ? "Настройки" : "Админ")
    const { user } = useAuth()

    return (
        <header className="flex items-center justify-between border-b border-border bg-slate-900 px-4 py-3 lg:hidden sticky top-0 z-40">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMenuClick}
                    className="text-white hover:bg-slate-800"
                >
                    <Menu className="h-6 w-6" />
                </Button>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{viewLabel}</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    size="icon"
                    variant="ghost"
                    className="text-[#94a3b8] hover:text-white"
                    onClick={() => { }}
                >
                    <Bell className="h-5 w-5" />
                </Button>

                {onSettingsClick && (
                    <Button
                        size="icon"
                        variant="ghost"
                        className="text-[#94a3b8] hover:text-white"
                        onClick={onSettingsClick}
                        title="Статистика"
                    >
                        <BarChart3 className="h-5 w-5" />
                    </Button>
                )}

                {/* User Menu Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="p-0">
                            <Avatar className="h-8 w-8 bg-[#3CE8D1]">
                                <AvatarFallback className="bg-[#3CE8D1] text-slate-900 text-xs font-bold">
                                    {user?.email?.charAt(0).toUpperCase() || "A"}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={onProfileClick}>
                            <User className="h-4 w-4 mr-2" />
                            Настройки аккаунта
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onProfileClick}>
                            <Lock className="h-4 w-4 mr-2" />
                            Сменить пароль
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onRequestLogout} className="text-red-400 focus:text-red-400">
                            <LogOut className="h-4 w-4 mr-2" />
                            Выйти
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}

// ============================================
// Main Admin Dashboard Component
// ============================================

export function AdminDashboard() {
    // URL-based view state (persists across page reloads)
    const [activeView, setActiveView] = usePersistedView<AdminView>("view", "applications", ADMIN_VIEWS)
    const { appId: selectedAppId, openDetail: setSelectedAppId, closeDetail: handleBackFromDetail } = usePersistedAppDetail()
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
    const [showLogoutDialog, setShowLogoutDialog] = useState(false)
    const { user, logout } = useAuth()

    const handleRequestLogout = () => {
        setShowLogoutDialog(true)
    }

    const handleConfirmLogout = async () => {
        setShowLogoutDialog(false)
        await logout()
    }

    // Handlers
    const handleSelectApplication = (appId: string) => {
        setSelectedAppId(appId)
    }

    const handleViewChange = (view: AdminView) => {
        setActiveView(view)
        handleBackFromDetail()
        setIsMobileSidebarOpen(false)
    }

    // Render Content
    const renderContent = () => {
        // Application Detail View (when app selected)
        if (activeView === "applications" && selectedAppId) {
            return (
                <AdminApplicationDetail
                    applicationId={selectedAppId}
                    onBack={handleBackFromDetail}
                />
            )
        }

        // Tab Content
        switch (activeView) {
            case "applications":
                return <AdminApplicationsView onSelectApplication={handleSelectApplication} />
            case "leads":
                return <AdminLeadsView />
            case "agents":
                return <AdminAgentsView />
            case "clients":
                return <AdminCRMClientsView />
            case "news":
                return <AdminNewsView />
            case "partners":
                return <PartnersTab />
            case "statistics":
                return <AdminStatisticsView />
            case "profile-settings":
                return <ProfileSettingsView />
            default:
                return <AdminApplicationsView onSelectApplication={handleSelectApplication} />
        }
    }

    return (
        <div className="relative min-h-screen bg-background">
            {/* ============================================ */}
            {/* DESKTOP SIDEBAR (FIXED POSITION) */}
            {/* ============================================ */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col",
                    "h-dvh border-r border-border bg-slate-900",
                    "transition-[width] duration-300 ease-in-out",
                    sidebarCollapsed ? "w-14 xl:w-16" : "w-56 xl:w-60"
                )}
            >
                <AdminSidebarContent
                    activeView={activeView}
                    onViewChange={handleViewChange}
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                    onRequestLogout={handleRequestLogout}
                />
            </aside>

            {/* ============================================ */}
            {/* MOBILE SIDEBAR DRAWER */}
            {/* ============================================ */}
            <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
                <SheetContent side="left" className="p-0 border-none w-[260px] bg-slate-900">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Панель администратора</SheetTitle>
                        <SheetDescription>Навигация по разделам управления</SheetDescription>
                    </SheetHeader>
                    <AdminSidebarContent
                        activeView={activeView}
                        onViewChange={handleViewChange}
                        isMobile={true}
                        onClose={() => setIsMobileSidebarOpen(false)}
                        onRequestLogout={handleRequestLogout}
                    />
                </SheetContent>
            </Sheet>

            {/* ============================================ */}
            {/* MAIN CONTENT AREA */}
            {/* ============================================ */}
            <div className={cn(
                "flex min-h-screen flex-col transition-[padding] duration-300 ease-in-out",
                "lg:pl-56 xl:pl-60",
                sidebarCollapsed && "lg:pl-14 xl:pl-16"
            )}>
                {/* Mobile Header */}
                <AdminMobileHeader
                    onMenuClick={() => setIsMobileSidebarOpen(true)}
                    onSettingsClick={() => handleViewChange("statistics")}
                    onProfileClick={() => handleViewChange("profile-settings")}
                    activeView={activeView}
                    onRequestLogout={handleRequestLogout}
                />

                {/* Desktop Header */}
                <header className="hidden lg:flex items-center justify-between border-b border-border bg-slate-900/50 backdrop-blur-sm px-4 xl:px-6 2xl:px-8 py-3 sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-semibold text-white">
                            {NAV_ITEMS.find(item => item.id === activeView)?.label || (activeView === "profile-settings" ? "Настройки аккаунта" : "Админ")}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="text-[#94a3b8] hover:text-white"
                            onClick={() => { }}
                        >
                            <Bell className="h-5 w-5" />
                        </Button>

                        <Button
                            size="icon"
                            variant="ghost"
                            className="text-[#94a3b8] hover:text-white"
                            onClick={() => handleViewChange("statistics")}
                            title="Статистика"
                        >
                            <BarChart3 className="h-5 w-5" />
                        </Button>

                        {/* User Menu Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-2 px-2">
                                    <Avatar className="h-8 w-8 bg-[#3CE8D1]">
                                        <AvatarFallback className="bg-[#3CE8D1] text-slate-900 text-xs font-bold">
                                            {user?.email?.charAt(0).toUpperCase() || "A"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm text-white hidden xl:inline">{user?.email}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => handleViewChange("profile-settings")}>
                                    <User className="h-4 w-4 mr-2" />
                                    Настройки аккаунта
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewChange("profile-settings")}>
                                    <Lock className="h-4 w-4 mr-2" />
                                    Сменить пароль
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleRequestLogout} className="text-red-400 focus:text-red-400">
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Выйти
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-y-auto bg-background min-w-0">
                    <div className="p-4 lg:p-5 xl:p-6 2xl:p-8">
                        {renderContent()}
                    </div>
                </main>
            </div>
            <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Выйти из аккаунта?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            Вы уверены, что хотите выйти из админ-панели?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-slate-700 text-white hover:bg-slate-800">
                            Отмена
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmLogout}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            Выйти
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
