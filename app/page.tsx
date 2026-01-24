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
import { CalculationSessionView } from "@/components/dashboard/calculation-session-view"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"

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

  // UI states (these don't need to persist)
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [wizardClientId, setWizardClientId] = useState<number | null>(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [selectedCalculationSessionId, setSelectedCalculationSessionId] = useState<number | null>(null)

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

  // Navigation to calculation session (root application)
  const openCalculationSession = (sessionId: number) => {
    setSelectedCalculationSessionId(sessionId)
    closeDetail() // Close application detail when navigating to session
  }

  const closeCalculationSession = () => {
    setSelectedCalculationSessionId(null)
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

  switch (role) {
    // =====================================
    // ADMIN ROLE
    // =====================================
    case "admin":
      return <AdminDashboard />

    // =====================================
    // AGENT ROLE
    // =====================================
    case "agent":
      // Agent Calculation Session View (root application - bank selection results)
      if (selectedCalculationSessionId) {
        return (
          <div className="flex h-screen overflow-hidden">
            <div className="hidden lg:block">
              <Sidebar
                activeView={agentView}
                onViewChange={(view) => {
                  setAgentView(view)
                  closeCalculationSession()
                }}
                onCreateApplication={() => openWizard()}
              />
            </div>

            <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
              <SheetContent side="left" className="p-0 border-none w-[260px] bg-[#0a1628]">
                <SheetHeader className="sr-only">
                  <SheetTitle>Навигация</SheetTitle>
                  <SheetDescription>Меню разделов агента</SheetDescription>
                </SheetHeader>
                <Sidebar
                  activeView={agentView}
                  onViewChange={(view) => {
                    setAgentView(view)
                    setIsMobileSidebarOpen(false)
                    closeCalculationSession()
                  }}
                  onCreateApplication={() => {
                    openWizard()
                    setIsMobileSidebarOpen(false)
                  }}
                />
              </SheetContent>
            </Sheet>

            <div className="flex flex-1 flex-col overflow-hidden">
              <MobileHeader
                onMenuClick={() => setIsMobileSidebarOpen(true)}
                onSettingsClick={() => setAgentView("profile-settings")}
              />
              <DashboardHeader onNotificationClick={(n) => n.details.applicationId && openDetail(String(n.details.applicationId))} onNavigateToSettings={() => setAgentView("profile-settings")} />
              <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-6 2xl:p-8 [@media(max-height:820px)]:p-4">
                <CalculationSessionView
                  sessionId={selectedCalculationSessionId}
                  onBack={closeCalculationSession}
                  onNavigateToApplications={() => {
                    closeCalculationSession()
                    setAgentView("applications")
                  }}
                />
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

            <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
              <SheetContent side="left" className="p-0 border-none w-[260px] bg-[#0a1628]">
                <SheetHeader className="sr-only">
                  <SheetTitle>Навигация</SheetTitle>
                  <SheetDescription>Меню разделов для агента</SheetDescription>
                </SheetHeader>
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
              </SheetContent>
            </Sheet>

            <div className="flex flex-1 flex-col overflow-hidden">
              <MobileHeader
                onMenuClick={() => setIsMobileSidebarOpen(true)}
                onSettingsClick={() => setAgentView("profile-settings")}
              />
              <DashboardHeader onNotificationClick={(n) => n.details.applicationId && openDetail(String(n.details.applicationId))} onNavigateToSettings={() => setAgentView("profile-settings")} />
              <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-6 2xl:p-8 [@media(max-height:820px)]:p-4">
                <ApplicationDetailView applicationId={selectedApplicationId!} onBack={closeDetail} onNavigateToCalculationSession={openCalculationSession} />
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

          {/* Mobile Sidebar Drawer */}
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetContent side="left" className="p-0 border-none w-[260px] bg-[#0a1628]">
              <SheetHeader className="sr-only">
                <SheetTitle>Навигация</SheetTitle>
                <SheetDescription>Меню разделов</SheetDescription>
              </SheetHeader>
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
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 flex-col overflow-hidden">
            <MobileHeader
              onMenuClick={() => setIsMobileSidebarOpen(true)}
              onSettingsClick={() => setAgentView("profile-settings")}
            />
            <DashboardHeader onNotificationClick={(n) => n.details.applicationId && openDetail(String(n.details.applicationId))} onNavigateToSettings={() => setAgentView("profile-settings")} />
            <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-6 2xl:p-8 [@media(max-height:820px)]:p-4">
              {agentView === "company" && <AgentMyCompanyView />}
              {agentView === "accreditation" && <AgentAccreditationView />}
              {agentView === "applications" && (
                <MyApplicationsView
                  onOpenDetail={(id: string) => openDetail(id)}
                  userRole="agent"
                />
              )}
              {/* Agent CRM - Clients List */}
              {agentView === "clients" && (
                <ClientsListView onCreateApplication={(clientId) => openWizard(clientId)} />
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
              {!["company", "accreditation", "applications", "clients", "banks", "profile-settings", "victories", "calculator", "check_counterparty", "acts", "news", "help", "documents", "contract", "bank_conditions"].includes(agentView) && (
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
    // CLIENT ROLE
    // =====================================
    case "client":
      // Client Calculation Session View (bank selection results)
      if (selectedCalculationSessionId) {
        return (
          <div className="flex h-screen overflow-hidden">
            <div className="hidden lg:block">
              <ClientSidebar
                activeView={clientView}
                onViewChange={(view) => {
                  setClientView(view)
                  closeCalculationSession()
                }}
                onCreateApplication={() => openWizard()}
              />
            </div>

            <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
              <SheetContent side="left" className="p-0 border-none w-[260px] bg-[#0a1628]">
                <SheetHeader className="sr-only">
                  <SheetTitle>Навигация</SheetTitle>
                  <SheetDescription>Главное меню личного кабинета</SheetDescription>
                </SheetHeader>
                <ClientSidebar
                  activeView={clientView}
                  onViewChange={(view) => {
                    setClientView(view)
                    setIsMobileSidebarOpen(false)
                    closeCalculationSession()
                  }}
                  onCreateApplication={() => {
                    openWizard()
                    setIsMobileSidebarOpen(false)
                  }}
                />
              </SheetContent>
            </Sheet>

            <div className="flex flex-1 flex-col overflow-hidden">
              <MobileHeader
                onMenuClick={() => setIsMobileSidebarOpen(true)}
                onSettingsClick={() => setClientView("profile-settings")}
              />
              <DashboardHeader onNotificationClick={(n) => n.details.applicationId && openDetail(String(n.details.applicationId))} onNavigateToSettings={() => setClientView("profile-settings")} />
              <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-6 2xl:p-8 [@media(max-height:820px)]:p-4">
                <CalculationSessionView
                  sessionId={selectedCalculationSessionId}
                  onBack={closeCalculationSession}
                  onNavigateToApplications={() => {
                    closeCalculationSession()
                    setClientView("applications")
                  }}
                />
              </main>
            </div>

            <CreateApplicationWizard isOpen={isWizardOpen} onClose={closeWizard} initialClientId={wizardClientId} />
          </div>
        )
      }

      // Client Application Detail View
      if (showingAppDetail) {
        return (
          <div className="flex h-screen overflow-hidden">
            <div className="hidden lg:block">
              <ClientSidebar
                activeView={clientView}
                onViewChange={setClientView}
                onCreateApplication={() => openWizard()}
              />
            </div>

            <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
              <SheetContent side="left" className="p-0 border-none w-[260px] bg-[#0a1628]">
                <SheetHeader className="sr-only">
                  <SheetTitle>Навигация</SheetTitle>
                  <SheetDescription>Меню разделов для клиента</SheetDescription>
                </SheetHeader>
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
              </SheetContent>
            </Sheet>

            <div className="flex flex-1 flex-col overflow-hidden">
              <MobileHeader
                onMenuClick={() => setIsMobileSidebarOpen(true)}
                onSettingsClick={() => setClientView("profile-settings")}
              />
              <DashboardHeader onNotificationClick={(n) => n.details.applicationId && openDetail(String(n.details.applicationId))} onNavigateToSettings={() => setClientView("profile-settings")} />
              <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-6 2xl:p-8 [@media(max-height:820px)]:p-4">
                <ApplicationDetailView applicationId={selectedApplicationId!} onBack={closeDetail} onNavigateToCalculationSession={openCalculationSession} />
              </main>
            </div>

            <CreateApplicationWizard isOpen={isWizardOpen} onClose={closeWizard} initialClientId={wizardClientId} />
          </div>
        )
      }

      // Default Client Dashboard
      return (
        <div className="flex h-screen overflow-hidden">
          <div className="hidden lg:block">
            <ClientSidebar
              activeView={clientView}
              onViewChange={(view) => {
                setClientView(view)
              }}
              onCreateApplication={() => openWizard()}
            />
          </div>

          {/* Mobile Sidebar Drawer */}
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetContent side="left" className="p-0 border-none w-[260px] bg-[#0a1628]">
              <SheetHeader className="sr-only">
                <SheetTitle>Навигация</SheetTitle>
                <SheetDescription>Меню разделов</SheetDescription>
              </SheetHeader>
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
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 flex-col overflow-hidden">
            <MobileHeader
              onMenuClick={() => setIsMobileSidebarOpen(true)}
              onSettingsClick={() => setClientView("profile-settings")}
            />
            <DashboardHeader onNotificationClick={(n) => n.details.applicationId && openDetail(String(n.details.applicationId))} onNavigateToSettings={() => setClientView("profile-settings")} />
            <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-6 2xl:p-8 [@media(max-height:820px)]:p-4">
              {clientView === "accreditation" && <AccreditationView />}
              {clientView === "company" && <MyCompanyView />}
              {clientView === "documents" && <MyDocumentsView />}
              {clientView === "applications" && (
                <MyApplicationsView
                  onOpenDetail={(id: string) => openDetail(id)}
                  userRole="client"
                />
              )}
              {clientView === "victories" && <MyVictoriesView />}
              {clientView === "tender_support" && <ClientTenderSupportView />}
              {clientView === "calculator" && <ClientCalculatorView />}
              {clientView === "news" && <NewsView />}
              {clientView === "help" && <HelpView />}
              {clientView === "profile-settings" && <ProfileSettingsView />}
              {!["accreditation", "company", "documents", "applications", "victories", "tender_support", "calculator", "news", "help", "profile-settings"].includes(clientView) && (
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
