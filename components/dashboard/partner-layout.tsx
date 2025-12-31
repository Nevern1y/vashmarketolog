"use client"

import { useState } from "react"
import type { PartnerViewType } from "@/lib/types"
import { PartnerSidebar } from "@/components/dashboard/partner-sidebar"
import { PartnerIncomingView } from "@/components/dashboard/partner-incoming-view"
import { PartnerApplicationDetail } from "@/components/dashboard/partner-application-detail"
import { PartnerBankView } from "@/components/dashboard/partner/partner-bank-view"
import { PartnerAgentsView } from "@/components/dashboard/partner/partner-agents-view"
import { PartnerClientsView } from "@/components/dashboard/partner/partner-clients-view"
import { PartnerApplicationsView } from "@/components/dashboard/partner/partner-applications-view"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { useApplications } from "@/hooks/use-applications"
import { cn } from "@/lib/utils"

/**
 * PartnerLayout - Container component for Partner Dashboard
 * 
 * Handles:
 * - Data fetching via useApplications() (respects Rules of Hooks)
 * - View state management for all partner menu items
 * - Sidebar badge count calculation
 */
export function PartnerLayout() {
    // View state - default to "my_bank" which is the first menu item
    const [activeView, setActiveView] = useState<PartnerViewType>("my_bank")
    const [selectedApplicationId, setSelectedApplicationId] = useState<string>("1")
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

    // Fetch applications - backend filters by assigned_partner automatically
    const { applications } = useApplications()

    // Calculate badge count: pending applications = "new" for partner
    const newApplicationsCount = applications.filter(
        (app) => app.status === "pending"
    ).length

    // Handle opening application detail
    const handleOpenDetail = (id: string) => {
        setSelectedApplicationId(id)
        setActiveView("application-detail")
    }

    // Handle view change with mobile sidebar close
    const handleViewChange = (view: PartnerViewType) => {
        setActiveView(view)
        setIsMobileSidebarOpen(false)
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
                return (
                    <PartnerApplicationDetail
                        applicationId={selectedApplicationId}
                        onBack={() => setActiveView("applications")}
                    />
                )

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
        <div className="flex h-screen overflow-hidden">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
                <PartnerSidebar
                    activeView={activeView}
                    onViewChange={setActiveView}
                    newApplicationsCount={newApplicationsCount}
                />
            </div>

            {/* Mobile Sidebar Drawer */}
            <div className={cn("fixed inset-0 z-50 lg:hidden", isMobileSidebarOpen ? "block" : "hidden")}>
                <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileSidebarOpen(false)} />
                <div className="absolute left-0 top-0 h-full">
                    <PartnerSidebar
                        activeView={activeView}
                        onViewChange={handleViewChange}
                        newApplicationsCount={newApplicationsCount}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <MobileHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-8">
                    {renderContent()}
                </main>
            </div>
        </div>
    )
}
