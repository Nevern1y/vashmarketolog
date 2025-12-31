"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { ClientViewType, ViewType } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ClientSidebar } from "@/components/dashboard/client-sidebar"
import { PartnerLayout } from "@/components/dashboard/partner-layout"
import { MyCompanyView } from "@/components/dashboard/my-company-view"
import { MyApplicationsView } from "@/components/dashboard/my-applications-view"
import { ClientsListView } from "@/components/dashboard/clients-list-view"
import { AccreditationView } from "@/components/dashboard/accreditation-view"
import { AgentAccreditationView } from "@/components/dashboard/agent-accreditation-view"
import { MyDocumentsView } from "@/components/dashboard/my-documents-view"
import { MyVictoriesView } from "@/components/dashboard/my-victories-view"
import { ProfileSettingsView } from "@/components/dashboard/profile-settings-view"
import { IndividualReviewView } from "@/components/dashboard/individual-review-view"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { ApplicationDetailView } from "@/components/dashboard/application-detail-view"
import { CreateApplicationWizard } from "@/components/dashboard/create-application-wizard"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  // Authentication state from context
  const { user, isLoading, isAuthenticated } = useAuth()

  // View states for each role
  const [agentView, setAgentView] = useState<ViewType>("applications")
  const [clientView, setClientView] = useState<ClientViewType>("applications")

  // UI states
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [wizardClientId, setWizardClientId] = useState<number | null>(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>("BG-2024-001")
  const [showingAgentCRM, setShowingAgentCRM] = useState(false)
  const [showingAppDetail, setShowingAppDetail] = useState(false)

  // Open wizard with optional pre-selected client
  const openWizard = (clientId?: number) => {
    setWizardClientId(clientId || null)
    setIsWizardOpen(true)
  }

  // Close wizard and reset client
  const closeWizard = () => {
    setIsWizardOpen(false)
    setWizardClientId(null)
  }

  // ========================================
  // AUTH GUARD: Not authenticated → redirect to /auth
  // Must be called before any conditional returns (Rules of Hooks)
  // ========================================
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.replace('/auth')
    }
  }, [isLoading, isAuthenticated, user, router])

  // Loading state - show spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#00d4aa]" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#00d4aa]" />
          <p className="text-muted-foreground">Перенаправление...</p>
        </div>
      </div>
    )
  }

  // ========================================
  // ROLE-BASED DASHBOARD ROUTING
  // ========================================
  const role = user.role

  // DEBUG: Log current user role for troubleshooting
  console.log("[DEBUG] Current User:", { id: user.id, email: user.email, role: user.role })

  switch (role) {
    // =====================================
    // ADMIN ROLE
    // =====================================
    case "admin":
      return <AdminDashboard />

    // =====================================
    // CLIENT ROLE
    // =====================================
    case "client":
      return (
        <div className="flex h-screen overflow-hidden">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <ClientSidebar
              activeView={clientView}
              onViewChange={setClientView}
              onCreateApplication={() => openWizard()}
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
                  openWizard()
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
                    setShowingAppDetail(true)
                  }}
                  onCreateApplication={() => openWizard()}
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

          <CreateApplicationWizard isOpen={isWizardOpen} onClose={closeWizard} initialClientId={wizardClientId} />
        </div>
      )

    // =====================================
    // PARTNER ROLE
    // =====================================
    case "partner":
      return <PartnerLayout />

    // =====================================
    // AGENT ROLE (Default for agents)
    // =====================================
    case "agent":
      // Agent CRM View (Clients list)
      if (showingAgentCRM) {
        return (
          <div className="flex h-screen overflow-hidden">
            <div className="hidden lg:block">
              <Sidebar
                activeView="clients"
                onViewChange={(view) => {
                  setAgentView(view)
                  if (view !== "clients") setShowingAgentCRM(false)
                }}
                onCreateApplication={() => openWizard()}
              />
            </div>

            <div className={cn("fixed inset-0 z-50 lg:hidden", isMobileSidebarOpen ? "block" : "hidden")}>
              <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileSidebarOpen(false)} />
              <div className="absolute left-0 top-0 h-full">
                <Sidebar
                  activeView="clients"
                  onViewChange={(view) => {
                    setAgentView(view)
                    setIsMobileSidebarOpen(false)
                    if (view !== "clients") setShowingAgentCRM(false)
                  }}
                  onCreateApplication={() => {
                    openWizard()
                    setIsMobileSidebarOpen(false)
                  }}
                />
              </div>
            </div>

            <div className="flex flex-1 flex-col overflow-hidden">
              <MobileHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />
              <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-8">
                <ClientsListView onCreateApplication={(clientId) => openWizard(clientId)} />
              </main>
            </div>

            <CreateApplicationWizard isOpen={isWizardOpen} onClose={closeWizard} initialClientId={wizardClientId} />
          </div>
        )
      }

      // Agent Application Detail View
      if (showingAppDetail) {
        return (
          <div className="flex h-screen overflow-hidden">
            <div className="hidden lg:block">
              <Sidebar
                activeView={agentView}
                onViewChange={setAgentView}
                onCreateApplication={() => openWizard()}
              />
            </div>

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
                    openWizard()
                    setIsMobileSidebarOpen(false)
                  }}
                />
              </div>
            </div>

            <div className="flex flex-1 flex-col overflow-hidden">
              <MobileHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />
              <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-8">
                <ApplicationDetailView applicationId={selectedApplicationId} onBack={() => setShowingAppDetail(false)} />
              </main>
            </div>

            <CreateApplicationWizard isOpen={isWizardOpen} onClose={closeWizard} initialClientId={wizardClientId} />
          </div>
        )
      }

      // Default Agent Dashboard
      return (
        <div className="flex h-screen overflow-hidden">
          <div className="hidden lg:block">
            <Sidebar
              activeView={agentView}
              onViewChange={(view) => {
                setAgentView(view)
                if (view === "clients") setShowingAgentCRM(true)
              }}
              onCreateApplication={() => openWizard()}
            />
          </div>

          <div className={cn("fixed inset-0 z-50 lg:hidden", isMobileSidebarOpen ? "block" : "hidden")}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileSidebarOpen(false)} />
            <div className="absolute left-0 top-0 h-full">
              <Sidebar
                activeView={agentView}
                onViewChange={(view) => {
                  setAgentView(view)
                  setIsMobileSidebarOpen(false)
                  if (view === "clients") setShowingAgentCRM(true)
                }}
                onCreateApplication={() => {
                  openWizard()
                  setIsMobileSidebarOpen(false)
                }}
              />
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <MobileHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />
            <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-8">
              {agentView === "company" && <MyCompanyView />}
              {agentView === "accreditation" && <AgentAccreditationView />}
              {agentView === "applications" && (
                <MyApplicationsView
                  onOpenDetail={(id) => {
                    setSelectedApplicationId(id)
                    setShowingAppDetail(true)
                  }}
                  onCreateApplication={() => openWizard()}
                />
              )}
              {agentView === "individual_terms" && <IndividualReviewView />}
              {agentView === "profile-settings" && <ProfileSettingsView />}
              {agentView === "documents" && <MyDocumentsView />}
              {agentView === "victories" && <MyVictoriesView />}
              {agentView !== "company" && agentView !== "accreditation" && agentView !== "applications" && agentView !== "clients" && agentView !== "individual_terms" && agentView !== "profile-settings" && agentView !== "documents" && agentView !== "victories" && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">Раздел в разработке</p>
                </div>
              )}
            </main>
          </div>

          <CreateApplicationWizard isOpen={isWizardOpen} onClose={closeWizard} initialClientId={wizardClientId} />
        </div>
      )

    // =====================================
    // UNKNOWN ROLE - Show error message
    // =====================================
    default:
      console.error(`Unknown user role: ${role}`)
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background gap-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Ошибка доступа</h1>
            <p className="text-muted-foreground mt-2">Неизвестная роль пользователя: {role}</p>
            <p className="text-sm text-muted-foreground mt-1">Обратитесь в службу поддержки</p>
          </div>
        </div>
      )
  }
}
