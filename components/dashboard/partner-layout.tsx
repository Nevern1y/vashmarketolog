"use client"

import { useState } from "react"
import type { PartnerViewType } from "@/lib/types"
import { PartnerSidebarContent } from "@/components/dashboard/partner-sidebar"
import { PartnerIncomingView } from "@/components/dashboard/partner-incoming-view"
import { PartnerApplicationDetail } from "@/components/dashboard/partner-application-detail"
import { PartnerBankView } from "@/components/dashboard/partner/partner-bank-view"
import { PartnerAgentsView } from "@/components/dashboard/partner/partner-agents-view"
import { PartnerClientsView } from "@/components/dashboard/partner/partner-clients-view"
import { PartnerApplicationsView } from "@/components/dashboard/partner/partner-applications-view"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { useApplications } from "@/hooks/use-applications"
import { usePersistedView, usePersistedAppDetail } from "@/hooks/use-persisted-view"

import { cn } from "@/lib/utils"
import { HelpView } from "@/components/dashboard/help-view"

// Valid partner view values for URL validation
const PARTNER_VIEWS: PartnerViewType[] = ["my_bank", "clients", "agents", "applications", "application-detail", "help", "incoming", "archive"]

/**
 * PartnerLayout - Container component for Partner Dashboard
 * Uses URL-based state management for persistence
 */
export function PartnerLayout() {
    // URL-based view state (persists across page reloads)
    const [activeView, setActiveView] = usePersistedView<PartnerViewType>("view", "my_bank", PARTNER_VIEWS)
    const { appId: selectedApplicationId, openDetail, closeDetail } = usePersistedAppDetail()
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)


    // Fetch applications - backend filters by assigned_partner automatically
    const { applications } = useApplications()

    // Calculate badge count: pending applications = "new" for partner
    const newApplicationsCount = applications.filter(
        (app) => app.status === "pending"
    ).length

    // Handle opening application detail
    const handleOpenDetail = (id: string) => {
        openDetail(id)
        setActiveView("application-detail")
    }

    // Handle view change with mobile sidebar close
    const handleViewChange = (view: PartnerViewType) => {
        setActiveView(view)
        setIsMobileSidebarOpen(false)
        // Close detail when navigating away from application-detail
        if (view !== "application-detail") {
            closeDetail()
        }
    }

    // Render the appropriate view based on activeView state
    const renderContent = () => {
        switch (activeView) {
            case "my_bank":
                return <PartnerBankView />

            case "clients":
                return <PartnerClientsView />

            case "agents":
                return <PartnerAgentsView />

            case "applications":
                return <PartnerApplicationsView onOpenDetail={handleOpenDetail} />

            case "application-detail":
                if (!selectedApplicationId) {
                    // If no app ID in URL, go back to applications
                    setActiveView("applications")
                    return null
                }
                return (
                    <PartnerApplicationDetail
                        applicationId={selectedApplicationId}
                        onBack={() => {
                            closeDetail()
                            setActiveView("applications")
                        }}
                    />
                )

            case "help":
                return <HelpView />

            // Legacy views for backward compatibility
            case "incoming":
                return <PartnerIncomingView onOpenDetail={handleOpenDetail} />

            case "archive":
                return (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">Архив заявок в разработке</p>
                    </div>
                )

            default:
                // Fallback for any unhandled view
                return (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">Раздел в разработке</p>
                    </div>
                )
        }
    }

    return (
        <div className="relative min-h-screen bg-background">
            {/* ============================================ */}
            {/* DESKTOP SIDEBAR (FIXED POSITION) */}
            {/* ============================================ */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden lg:flex h-dvh w-[260px] flex-col bg-[#0a1628] text-white">
                <PartnerSidebarContent
                    activeView={activeView}
                    onViewChange={handleViewChange}
                    newApplicationsCount={newApplicationsCount}
                />
            </aside>

            {/* ============================================ */}
            {/* MOBILE SIDEBAR DRAWER */}
            {/* ============================================ */}
            <div className={cn("fixed inset-0 z-50 lg:hidden", isMobileSidebarOpen ? "block" : "hidden")}>
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileSidebarOpen(false)} />
                {/* Mobile Sidebar */}
                <aside className="absolute left-0 top-0 h-full w-[260px] flex flex-col bg-[#0a1628] text-white shadow-2xl">
                    <PartnerSidebarContent
                        activeView={activeView}
                        onViewChange={handleViewChange}
                        newApplicationsCount={newApplicationsCount}
                    />
                </aside>
            </div>

            {/* ============================================ */}
            {/* MAIN CONTENT AREA */}
            {/* ============================================ */}
            <div className="flex min-h-screen flex-col lg:pl-[260px]">
                <MobileHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />
                <DashboardHeader onNotificationClick={(n) => n.details.applicationId && handleOpenDetail(String(n.details.applicationId))} onNavigateToSettings={() => setActiveView("help")} />
                <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-8">
                    {renderContent()}
                </main>
            </div>
        </div>
    )
}
