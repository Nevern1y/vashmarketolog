"use client"

import { useState } from "react"
import type { AppMode, ClientViewType, PartnerViewType, ViewType } from "@/lib/types"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ClientSidebar } from "@/components/dashboard/client-sidebar"
import { PartnerSidebar } from "@/components/dashboard/partner-sidebar"
import { MyCompanyView } from "@/components/dashboard/my-company-view"
import { MyApplicationsView } from "@/components/dashboard/my-applications-view"
import { ClientsListView } from "@/components/dashboard/clients-list-view"
import { AccreditationView } from "@/components/dashboard/accreditation-view"
import { MyDocumentsView } from "@/components/dashboard/my-documents-view"
import { MyVictoriesView } from "@/components/dashboard/my-victories-view"
import { ProfileSettingsView } from "@/components/dashboard/profile-settings-view"
import { PartnerIncomingView } from "@/components/dashboard/partner-incoming-view"
import { PartnerApplicationDetail } from "@/components/dashboard/partner-application-detail"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { ApplicationDetailView } from "@/components/dashboard/application-detail-view"
import { CreateApplicationWizard } from "@/components/dashboard/create-application-wizard"
import { AuthPage } from "@/components/auth/auth-page"
import { DevToolWidget } from "@/components/dev-tool-widget"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const [appMode, setAppMode] = useState<AppMode>("agent-dashboard")
  const [agentView, setAgentView] = useState<ViewType>("applications")
  const [clientView, setClientView] = useState<ClientViewType>("applications")
  const [partnerView, setPartnerView] = useState<PartnerViewType>("incoming")
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>("BG-2024-001")
  const [selectedPartnerApplicationId, setSelectedPartnerApplicationId] = useState<string>("1")

  // Auth mode
  if (appMode === "auth") {
    return (
      <>
        <AuthPage />
        <DevToolWidget currentMode={appMode} onModeChange={setAppMode} />
      </>
    )
  }

  // Admin mode
  if (appMode === "admin-dashboard") {
    return (
      <>
        <AdminDashboard />
        <DevToolWidget currentMode={appMode} onModeChange={setAppMode} />
      </>
    )
  }

  if (appMode === "client-dashboard") {
    return (
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <ClientSidebar
            activeView={clientView}
            onViewChange={setClientView}
            onCreateApplication={() => setIsWizardOpen(true)}
          />
        </div>

        {/* Mobile Sidebar Drawer */}
        <div className={cn("fixed inset-0 z-50 lg:hidden", isMobileSidebarOpen ? "block" : "hidden")}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <ClientSidebar
              activeView={clientView}
              onViewChange={(view) => {
                setClientView(view)
                setIsMobileSidebarOpen(false)
              }}
              onCreateApplication={() => {
                setIsWizardOpen(true)
                setIsMobileSidebarOpen(false)
              }}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <MobileHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-8">
            {clientView === "accreditation" && <AccreditationView />}
            {clientView === "company" && <MyCompanyView />}
            {clientView === "documents" && <MyDocumentsView />}
            {clientView === "applications" && (
              <MyApplicationsView
                onOpenDetail={(id) => {
                  setSelectedApplicationId(id)
                  setAppMode("agent-app-detail")
                }}
              />
            )}
            {clientView === "victories" && <MyVictoriesView />}
            {clientView === "profile-settings" && <ProfileSettingsView />}
            {(clientView === "calculator" || clientView === "news") && (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Раздел в разработке</p>
              </div>
            )}
          </main>
        </div>

        <CreateApplicationWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
        <DevToolWidget currentMode={appMode} onModeChange={setAppMode} />
      </div>
    )
  }

  if (appMode === "agent-crm") {
    return (
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar
            activeView="clients"
            onViewChange={(view) => {
              setAgentView(view)
              if (view !== "clients") setAppMode("agent-dashboard")
            }}
            onCreateApplication={() => setIsWizardOpen(true)}
          />
        </div>

        {/* Mobile Sidebar Drawer */}
        <div className={cn("fixed inset-0 z-50 lg:hidden", isMobileSidebarOpen ? "block" : "hidden")}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar
              activeView="clients"
              onViewChange={(view) => {
                setAgentView(view)
                setIsMobileSidebarOpen(false)
                if (view !== "clients") setAppMode("agent-dashboard")
              }}
              onCreateApplication={() => {
                setIsWizardOpen(true)
                setIsMobileSidebarOpen(false)
              }}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <MobileHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-8">
            <ClientsListView />
          </main>
        </div>

        <CreateApplicationWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
        <DevToolWidget currentMode={appMode} onModeChange={setAppMode} />
      </div>
    )
  }

  if (appMode === "partner-dashboard") {
    return (
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <PartnerSidebar activeView={partnerView} onViewChange={setPartnerView} />
        </div>

        {/* Mobile Sidebar Drawer */}
        <div className={cn("fixed inset-0 z-50 lg:hidden", isMobileSidebarOpen ? "block" : "hidden")}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <PartnerSidebar
              activeView={partnerView}
              onViewChange={(view) => {
                setPartnerView(view)
                setIsMobileSidebarOpen(false)
              }}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <MobileHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-8">
            {partnerView === "incoming" && (
              <PartnerIncomingView
                onOpenDetail={(id) => {
                  setSelectedPartnerApplicationId(id)
                  setPartnerView("application-detail")
                }}
              />
            )}
            {partnerView === "application-detail" && (
              <PartnerApplicationDetail
                applicationId={selectedPartnerApplicationId}
                onBack={() => setPartnerView("incoming")}
              />
            )}
            {partnerView === "archive" && (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Архив заявок в разработке</p>
              </div>
            )}
          </main>
        </div>

        <DevToolWidget currentMode={appMode} onModeChange={setAppMode} />
      </div>
    )
  }

  // Agent app detail mode
  if (appMode === "agent-app-detail") {
    return (
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar
            activeView={agentView}
            onViewChange={setAgentView}
            onCreateApplication={() => setIsWizardOpen(true)}
          />
        </div>

        {/* Mobile Sidebar Drawer */}
        <div className={cn("fixed inset-0 z-50 lg:hidden", isMobileSidebarOpen ? "block" : "hidden")}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar
              activeView={agentView}
              onViewChange={(view) => {
                setAgentView(view)
                setIsMobileSidebarOpen(false)
              }}
              onCreateApplication={() => {
                setIsWizardOpen(true)
                setIsMobileSidebarOpen(false)
              }}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <MobileHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-8">
            <ApplicationDetailView applicationId={selectedApplicationId} onBack={() => setAppMode("agent-dashboard")} />
          </main>
        </div>

        <CreateApplicationWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
        <DevToolWidget currentMode={appMode} onModeChange={setAppMode} />
      </div>
    )
  }

  // Default: Agent Dashboard mode
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          activeView={agentView}
          onViewChange={(view) => {
            setAgentView(view)
            if (view === "clients") setAppMode("agent-crm")
          }}
          onCreateApplication={() => setIsWizardOpen(true)}
        />
      </div>

      {/* Mobile Sidebar Drawer */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", isMobileSidebarOpen ? "block" : "hidden")}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileSidebarOpen(false)} />
        <div className="absolute left-0 top-0 h-full">
          <Sidebar
            activeView={agentView}
            onViewChange={(view) => {
              setAgentView(view)
              setIsMobileSidebarOpen(false)
              if (view === "clients") setAppMode("agent-crm")
            }}
            onCreateApplication={() => {
              setIsWizardOpen(true)
              setIsMobileSidebarOpen(false)
            }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-8">
          {agentView === "company" && <MyCompanyView />}
          {agentView === "applications" && (
            <MyApplicationsView
              onOpenDetail={(id) => {
                setSelectedApplicationId(id)
                setAppMode("agent-app-detail")
              }}
            />
          )}
          {agentView !== "company" && agentView !== "applications" && agentView !== "clients" && (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">Раздел в разработке</p>
            </div>
          )}
        </main>
      </div>

      <CreateApplicationWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
      <DevToolWidget currentMode={appMode} onModeChange={setAppMode} />
    </div>
  )
}
