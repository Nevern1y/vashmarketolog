// View types for different dashboards
export type AgentViewType =
  | "company"
  | "applications"
  | "clients"
  | "reports"
  | "statistics"
  | "calculator"
  | "news"
  | "calls"

export type ClientViewType =
  | "accreditation"
  | "company"
  | "documents"
  | "applications"
  | "victories"
  | "calculator"
  | "news"
  | "profile-settings"

export type PartnerViewType = "incoming" | "archive" | "application-detail"

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

// Document status for client documents
export type DocumentStatus = "verified" | "rejected" | "pending"

// Application status
export type ApplicationStatus = "draft" | "pending" | "in-review" | "approved" | "rejected" | "won" | "lost"

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
  status: DocumentStatus
  uploadedAt: string
  fileUrl?: string
  rejectionReason?: string
}

// Partner application for Partner Dashboard
export interface PartnerApplication {
  id: string
  clientCompany: string
  productType: string
  amount: number
  status: "new" | "in-review" | "approved" | "rejected" | "info-requested"
  receivedAt: string
  deadline?: string
}
