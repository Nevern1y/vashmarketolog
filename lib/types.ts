// View types for different dashboards
export type AgentViewType =
  | "company"
  | "contract"
  | "applications"
  | "clients"
  | "client_detail"  // NEW: Full-page client detail with tabs
  | "documents"
  | "calculator"
  | "banks"
  | "check_counterparty"
  | "call_database"
  | "acts"
  | "profile-settings"
  | "bank_conditions"
  | "individual_terms"
  | "news"
  | "help"

// Tab types for client detail page
export type ClientDetailTab = "applications" | "info" | "documents"

export type ClientViewType =
  | "accreditation"
  | "company"
  | "documents"
  | "applications"
  | "victories"
  | "tender_support"
  | "calculator"
  | "news"
  | "help"
  | "profile-settings"

export type PartnerViewType =
  | "my_bank"
  | "clients"
  | "agents"
  | "applications"
  | "application-detail"
  | "help"
  | "incoming"  // Legacy: keep for backward compatibility
  | "archive"   // Legacy: keep for backward compatibility

export type ViewType = AgentViewType | ClientViewType | PartnerViewType

// Application modes
export type AppMode =
  | "auth"
  | "agent-dashboard"
  | "agent-app-detail"
  | "admin-dashboard"
  | "client-dashboard"
  | "agent-crm"
  | "partner-dashboard"

// Application status
export type ApplicationStatus = "draft" | "pending" | "in_review" | "approved" | "rejected" | "won" | "lost"

// Client data for Agent CRM
export interface Client {
  id: string
  inn: string
  companyName: string
  shortName: string
  legalAddress: string
  actualAddress: string
  phone: string
  email: string
  website?: string
  contactPerson: string
  contactPosition: string
  contactPhone: string
  contactEmail: string
  createdAt: string
  applicationsCount: number
}

// Document data for Client Dashboard
export interface Document {
  id: string
  name: string
  type: string
  uploadedAt: string
  fileUrl?: string
}

// Partner application for Partner Dashboard
export interface PartnerApplication {
  id: string
  clientCompany: string
  productType: string
  amount: number
  status: "new" | "in_review" | "approved" | "rejected" | "info_requested"
  receivedAt: string
  deadline?: string
}
