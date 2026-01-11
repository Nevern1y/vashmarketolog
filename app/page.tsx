"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { ClientViewType, ViewType } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { usePersistedView, usePersistedAppDetail } from "@/hooks/use-persisted-view"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ClientSidebar } from "@/components/dashboard/client-sidebar"
import { PartnerLayout } from "@/components/dashboard/partner-layout"
import { MyCompanyView } from "@/components/dashboard/my-company-view"
import { AgentMyCompanyView } from "@/components/dashboard/agent-my-company-view"
import { PartnerApplicationsView as MyApplicationsView } from "@/components/dashboard/partner/partner-applications-view"
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
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { HelpView } from "@/components/dashboard/help-view"
import { ClientCalculatorView } from "@/components/dashboard/client-calculator-view"
import { AgentCalculatorView } from "@/components/dashboard/agent-calculator-view"
import { NewsView } from "@/components/dashboard/news-view"
import { AgentDocumentsView } from "@/components/dashboard/agent-documents-view"
import { AgentBanksView } from "@/components/dashboard/agent-banks-view"
import { AgentCheckCounterpartyView } from "@/components/dashboard/agent-check-counterparty-view"
import { AgentActsView } from "@/components/dashboard/agent-acts-view"
import { ClientTenderSupportView } from "@/components/dashboard/client-tender-support-view"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

// Valid view values for type safety
const AGENT_VIEWS: ViewType[] = ["company", "applications", "clients", "banks", "calculator", "check_counterparty", "call_database", "acts", "profile-settings", "news", "help", "documents", "contract", "bank_conditions"]
const CLIENT_VIEWS: ClientViewType[] = ["accreditation", "company", "documents", "applications", "victories", "tender_support", "calculator", "news", "help", "profile-settings"]

export default function DashboardPage() {
  const router = useRouter()
  // Authentication state from context
  const { user, isLoading, isAuthenticated } = useAuth()

  // URL-based view states for each role (persists across page reloads)
  const [agentView, setAgentView] = usePersistedView<ViewType>("view", "applications", AGENT_VIEWS)
  const [clientView, setClientView] = usePersistedView<ClientViewType>("view", "applications", CLIENT_VIEWS)

  // URL-based application detail state
  const { appId: selectedApplicationId, openDetail, closeDetail } = usePersistedAppDetail()
  const showingAppDetail = !!selectedApplicationId
  const showingAgentCRM = agentView === "clients"

  // UI states (these don't need to persist)
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [wizardClientId, setWizardClientId] = useState<number | null>(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

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
      // Client Application Detail View
      if (showingAppDetail) {
        return (
          <div className="flex h-screen overflow-hidden">
            <div className="hidden lg:block">
              <ClientSidebar
                activeView={clientView}
                onViewChange={(view) => {
                  setClientView(view)
                  closeDetail()
                }}
                onCreateApplication={() => openWizard()}
              />
            </div>

            <div className={cn("fixed inset-0 z-50 lg:hidden", isMobileSidebarOpen ? "block" : "hidden")}>
              <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileSidebarOpen(false)} />
              <div className="absolute left-0 top-0 h-full">
                <ClientSidebar
                  activeView={clientView}
                  onViewChange={(view) => {
                    setClientView(view)
                    setIsMobileSidebarOpen(false)
                    closeDetail()
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
              <DashboardHeader onNotificationClick={(n) => n.details.applicationId && openDetail(String(n.details.applicationId))} onNavigateToSettings={() => setClientView("profile-settings")} />
              <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-8">
                <ApplicationDetailView applicationId={selectedApplicationId!} onBack={closeDetail} />
              </main>
            </div>

            <CreateApplicationWizard isOpen={isWizardOpen} onClose={closeWizard} initialClientId={wizardClientId} />
          </div>
        )
      }

      // Default Client Dashboard
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
            <DashboardHeader onNotificationClick={(n) => n.details.applicationId && openDetail(String(n.details.applicationId))} onNavigateToSettings={() => setClientView("profile-settings")} />
            <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-8">
              {clientView === "accreditation" && <AccreditationView />}
              {clientView === "company" && <MyCompanyView />}
              {clientView === "documents" && <MyDocumentsView />}
              {clientView === "applications" && (
                <MyApplicationsView
                  onOpenDetail={(id: string) => openDetail(id)}
                />
              )}
              {clientView === "victories" && <MyVictoriesView />}
              {clientView === "tender_support" && <ClientTenderSupportView />}
              {clientView === "profile-settings" && <ProfileSettingsView />}
              {clientView === "calculator" && <ClientCalculatorView />}
              {clientView === "news" && <NewsView />}
              {clientView === "help" && <HelpView />}
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
              <DashboardHeader onNotificationClick={(n) => n.details.applicationId && openDetail(String(n.details.applicationId))} onNavigateToSettings={() => setAgentView("profile-settings")} />
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
              <DashboardHeader onNotificationClick={(n) => n.details.applicationId && openDetail(String(n.details.applicationId))} onNavigateToSettings={() => setAgentView("profile-settings")} />
              <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-8">
                <ApplicationDetailView applicationId={selectedApplicationId!} onBack={closeDetail} />
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
            <DashboardHeader onNotificationClick={(n) => n.details.applicationId && openDetail(String(n.details.applicationId))} onNavigateToSettings={() => setAgentView("profile-settings")} />
            <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-8">
              {agentView === "company" && <AgentMyCompanyView />}
              {agentView === "accreditation" && <AgentAccreditationView />}
              {agentView === "applications" && (
                <MyApplicationsView
                  onOpenDetail={(id: string) => openDetail(id)}
                />
              )}
              {agentView === "banks" && <AgentBanksView />}
              {agentView === "profile-settings" && <ProfileSettingsView />}
              {agentView === "victories" && <MyVictoriesView />}
              {agentView === "calculator" && <AgentCalculatorView />}
              {agentView === "check_counterparty" && <AgentCheckCounterpartyView />}
              {agentView === "acts" && <AgentActsView />}
              {agentView === "news" && <NewsView />}
              {agentView === "help" && <HelpView />}
              {agentView === "documents" && <AgentDocumentsView />}
              {agentView === "contract" && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">Раздел "Мой договор" в разработке</p>
                </div>
              )}
              {agentView === "bank_conditions" && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">Раздел "Условия банков" в разработке</p>
                </div>
              )}
              {!["company", "applications", "clients", "banks", "profile-settings", "calculator", "news", "help", "check_counterparty", "acts", "call_database", "documents", "contract", "bank_conditions"].includes(agentView) && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">Раздел в разработке</p>
                </div>
              )}
            </main>
          </div >

          <CreateApplicationWizard isOpen={isWizardOpen} onClose={closeWizard} initialClientId={wizardClientId} />
        </div >
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
