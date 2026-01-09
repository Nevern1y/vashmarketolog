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
    Shield,
    ChevronLeft,
    Menu,
    FileCheck,
    Newspaper,
    UserCheck,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { usePersistedView, usePersistedAppDetail } from "@/hooks/use-persisted-view"
import { PartnersTab } from "./partners-tab"
import { AdminApplicationsView } from "./admin-applications-view"
import { AdminAgentsView } from "./admin-agents-view"
import { AdminStatisticsView } from "./admin-statistics-view"
import { AdminApplicationDetail } from "./admin-application-detail"
import { AdminDocumentsView } from "./admin-documents-view"
import { AdminNewsView } from "./admin-news-view"
import { AdminCRMClientsView } from "./admin-crm-clients-view"

// ============================================
// Sidebar Navigation Items
// ============================================

type AdminView = "applications" | "agents" | "clients" | "documents" | "partners" | "statistics" | "news"

const NAV_ITEMS: { id: AdminView; label: string; icon: typeof FileText }[] = [
    { id: "applications", label: "Заявки", icon: FileText },
    { id: "agents", label: "Агенты", icon: Users },
    { id: "clients", label: "Клиенты", icon: UserCheck },
    { id: "documents", label: "Документы", icon: FileCheck },
    { id: "news", label: "Новости", icon: Newspaper },
    { id: "partners", label: "Партнёры", icon: Building2 },
    { id: "statistics", label: "Статистика", icon: BarChart3 },
]

const ADMIN_VIEWS: AdminView[] = ["applications", "agents", "clients", "documents", "partners", "statistics", "news"]

// ============================================
// Main Admin Dashboard Component
// ============================================

export function AdminDashboard() {
    const { user, logout } = useAuth()
    // URL-based view state (persists across page reloads)
    const [activeView, setActiveView] = usePersistedView<AdminView>("view", "applications", ADMIN_VIEWS)
    const { appId: selectedAppId, openDetail: setSelectedAppId, closeDetail: handleBackFromDetail } = usePersistedAppDetail()
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

    // Handlers
    const handleSelectApplication = (appId: string) => {
        setSelectedAppId(appId)
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
            case "agents":
                return <AdminAgentsView />
            case "clients":
                return <AdminCRMClientsView />
            case "documents":
                return <AdminDocumentsView />
            case "news":
                return <AdminNewsView />
            case "partners":
                return <PartnersTab />
            case "statistics":
                return <AdminStatisticsView />
            default:
                return <AdminApplicationsView onSelectApplication={handleSelectApplication} />
        }
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* ============================================ */}
            {/* SIDEBAR */}
            {/* ============================================ */}
            <aside
                className={cn(
                    "flex flex-col h-full border-r border-border bg-slate-900 transition-all duration-300",
                    sidebarCollapsed ? "w-16" : "w-60"
                )}
            >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-border">
                    {!sidebarCollapsed && (
                        <div className="flex items-center">
                            <img src="/placeholder-logo.svg" alt="Лидер Гарант" className="h-10 w-auto" />
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                        {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon
                        const isActive = activeView === item.id
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveView(item.id)
                                    handleBackFromDetail()
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-[#3CE8D1]/10 text-[#3CE8D1]"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                                )}
                            >
                                <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-[#3CE8D1]")} />
                                {!sidebarCollapsed && <span>{item.label}</span>}
                            </button>
                        )
                    })}
                </nav>

                {/* User Section */}
                <div className="p-3 border-t border-border">
                    {!sidebarCollapsed ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-[#4F7DF3] flex items-center justify-center text-xs font-bold text-white">
                                    {user?.email?.charAt(0).toUpperCase() || "A"}
                                </div>
                                <div className="text-xs">
                                    <p className="font-medium text-white truncate max-w-[120px]">{user?.email}</p>
                                    <Badge className="bg-[#3CE8D1]/10 text-[#3CE8D1] text-[10px] px-1.5 py-0">Admin</Badge>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => logout()}
                                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => logout()}
                            className="w-full h-10 text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </aside>

            {/* ============================================ */}
            {/* MAIN CONTENT */}
            {/* ============================================ */}
            <main className="flex-1 overflow-y-auto bg-background">
                <div className="p-6">
                    {renderContent()}
                </div>
            </main>
        </div>
    )
}
