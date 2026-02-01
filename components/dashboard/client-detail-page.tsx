"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronLeft, 
  FileText, 
  Building2, 
  FolderOpen, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  Plus,
  Download,
  Eye,
  Upload,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  Pencil,
  X,
  Check,
} from "lucide-react"
import { useCRMClient, useCRMClientMutations } from "@/hooks/use-companies"
import { useDocuments, useDocumentMutations, formatDocumentType } from "@/hooks/use-documents"
import { useApplications } from "@/hooks/use-applications"
import { getStatusConfig } from "@/lib/status-mapping"
import { formatDate } from "@/lib/form-utils"
import { getPrimaryAmountValue } from "@/lib/application-display"
import { toast } from "sonner"
import type { ClientDetailTab } from "@/lib/types"
import { getCompanyBasicsError } from "@/lib/company-basics"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GENERAL_DOCUMENT_TYPES } from "@/lib/document-types"

// =============================================================================
// PROPS
// =============================================================================

interface ClientDetailPageProps {
  clientId: number
  initialTab?: ClientDetailTab
  onBack: () => void
  onApplicationClick?: (applicationId: number) => void
  onCreateApplication?: (clientId: number) => void
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ClientDetailPage({
  clientId,
  initialTab = "applications",
  onBack,
  onApplicationClick,
  onCreateApplication,
}: ClientDetailPageProps) {
  const [activeTab, setActiveTab] = useState<ClientDetailTab>(initialTab)
  const [searchQuery, setSearchQuery] = useState("")
  
  // API Hooks
  const { client, isLoading: clientLoading, error: clientError, refetch: refetchClient } = useCRMClient(clientId)
  const { documents, isLoading: docsLoading, refetch: refetchDocs } = useDocuments({ company: clientId })
  const { applications, isLoading: appsLoading, refetch: refetchApps } = useApplications()
  
  // Filter applications for this client
  const clientApplications = applications.filter(app => String(app.company) === String(clientId))
  
  // Get client status badge
  const getClientStatusBadge = () => {
    if (!client) return null
    
    const isConfirmed = client.client_status === 'confirmed'
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isConfirmed 
          ? 'bg-[#3CE8D1]/10 text-[#3CE8D1]' 
          : 'bg-[#FFD93D]/10 text-[#FFD93D]'
      }`}>
        {isConfirmed ? 'Закреплен' : 'На рассмотрении'}
      </span>
    )
  }
  
  // Loading state
  if (clientLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
          <p className="text-muted-foreground">Загрузка данных клиента...</p>
        </div>
      </div>
    )
  }
  
  // Error state
  if (clientError) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Назад к списку
        </Button>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{clientError}</span>
            <Button variant="outline" size="sm" onClick={() => refetchClient()}>
              Повторить
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (!client) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Назад к списку
        </Button>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Клиент не найден
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleCreateApplication = () => {
    const companyError = getCompanyBasicsError({ inn: client.inn, name: client.name })
    if (companyError) {
      toast.error(companyError)
      return
    }
    onCreateApplication?.(clientId)
  }

  return (
    <div className="space-y-6">
      {/* Header with breadcrumb */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={onBack} className="hover:text-foreground transition-colors">
            Мои клиенты
          </button>
          <span>/</span>
          <span className="text-foreground">{client.short_name || client.name}</span>
        </div>
        
        {/* Company header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {client.short_name || client.name}, ИНН: {client.inn}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-muted-foreground">Статус клиента:</span>
              {getClientStatusBadge()}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                refetchClient()
                refetchDocs()
                refetchApps()
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {onCreateApplication && (
              <Button 
                className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] gap-2"
                onClick={handleCreateApplication}
              >
                <Plus className="h-4 w-4" />
                Создать заявку
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ClientDetailTab)}>
        <TabsList className="w-full justify-start border-b bg-transparent p-0">
          <TabsTrigger 
            value="applications" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#3CE8D1] data-[state=active]:bg-transparent px-6 py-3"
          >
            <FileText className="h-4 w-4 mr-2" />
            ЗАЯВКИ
          </TabsTrigger>
          <TabsTrigger 
            value="info"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#3CE8D1] data-[state=active]:bg-transparent px-6 py-3"
          >
            <Building2 className="h-4 w-4 mr-2" />
            ИНФОРМАЦИЯ О КОМПАНИИ
          </TabsTrigger>
          <TabsTrigger 
            value="documents"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#3CE8D1] data-[state=active]:bg-transparent px-6 py-3"
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            ДОКУМЕНТЫ
          </TabsTrigger>
        </TabsList>
        
        {/* Applications Tab */}
        <TabsContent value="applications" className="mt-6">
          <ClientApplicationsTab
            applications={clientApplications}
            isLoading={appsLoading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onApplicationClick={onApplicationClick}
            onCreateApplication={handleCreateApplication}
          />
        </TabsContent>
        
        {/* Company Info Tab */}
        <TabsContent value="info" className="mt-6">
          <ClientInfoTab client={client} onRefresh={refetchClient} />
        </TabsContent>
        
        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6">
          <ClientDocumentsTab
            documents={documents}
            isLoading={docsLoading}
            companyId={clientId}
            onRefresh={refetchDocs}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// =============================================================================
// APPLICATIONS TAB
// =============================================================================

interface ApplicationsTabProps {
  applications: any[]
  isLoading: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onApplicationClick?: (id: number) => void
  onCreateApplication?: () => void
}

function ClientApplicationsTab({
  applications,
  isLoading,
  searchQuery,
  onSearchChange,
  onApplicationClick,
  onCreateApplication,
}: ApplicationsTabProps) {
  // Filter applications by search
  const filteredApps = applications.filter(app => {
    const searchLower = searchQuery.toLowerCase()
    return (
      app.application_number?.toLowerCase().includes(searchLower) ||
      app.notice_number?.toLowerCase().includes(searchLower) ||
      app.bank_name?.toLowerCase().includes(searchLower)
    )
  })
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={onCreateApplication}
              className="border-[#3CE8D1] text-[#3CE8D1] hover:bg-[#3CE8D1] hover:text-[#0a1628]"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="поиск"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Всего заявок: {filteredApps.length}
            </span>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              ФИЛЬТР
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Заявки не найдены</p>
            {onCreateApplication && (
              <Button 
                className="mt-4 bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                onClick={onCreateApplication}
              >
                Создать первую заявку
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>№ заявки / № извещения</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>МФО/Банк</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead className="text-right">Сумма продукта, руб.</TableHead>
                <TableHead className="text-right">Сумма к оплате, руб.</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApps.map((app) => {
                const statusConfig = getStatusConfig(app.status)
                const primaryAmount = getPrimaryAmountValue(app)
                return (
                  <TableRow 
                    key={app.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => onApplicationClick?.(app.id)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-[#3CE8D1]">{app.application_number || '—'}</p>
                        <p className="text-xs text-muted-foreground">{app.notice_number || '—'}</p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(app.created_at)}</TableCell>
                    <TableCell>{app.bank_name || '—'}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.company_name}</p>
                        <p className="text-xs text-muted-foreground">ИНН: {app.company_inn}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {primaryAmount !== null ? primaryAmount.toLocaleString('ru-RU') : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {app.commission?.toLocaleString('ru-RU') || '0,00'}
                    </TableCell>
                    <TableCell>
                      <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${statusConfig.color}15`,
                          color: statusConfig.color 
                        }}
                      >
                        {statusConfig.label}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// COMPANY INFO TAB
// =============================================================================

interface InfoTabProps {
  client: any
  onRefresh: () => void
}

function ClientInfoTab({ client, onRefresh }: InfoTabProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { updateClient } = useCRMClientMutations()
  
  // Form state for editing
  const [formData, setFormData] = useState({
    name: client.name || '',
    short_name: client.short_name || '',
    inn: client.inn || '',
    kpp: client.kpp || '',
    ogrn: client.ogrn || '',
    region: client.region || '',
    employee_count: client.employee_count || '',
    legal_address: client.legal_address || '',
    actual_address: client.actual_address || '',
    director_name: client.director_name || '',
    director_position: client.director_position || '',
    contact_person: client.contact_person || '',
    contact_phone: client.contact_phone || '',
    contact_email: client.contact_email || '',
    website: client.website || '',
  })
  
  // Reset form when client changes
  useEffect(() => {
    setFormData({
      name: client.name || '',
      short_name: client.short_name || '',
      inn: client.inn || '',
      kpp: client.kpp || '',
      ogrn: client.ogrn || '',
      region: client.region || '',
      employee_count: client.employee_count || '',
      legal_address: client.legal_address || '',
      actual_address: client.actual_address || '',
      director_name: client.director_name || '',
      director_position: client.director_position || '',
      contact_person: client.contact_person || '',
      contact_phone: client.contact_phone || '',
      contact_email: client.contact_email || '',
      website: client.website || '',
    })
  }, [client])
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateClient(client.id, formData)
      if (result) {
        toast.success('Данные компании обновлены')
        setIsEditing(false)
        onRefresh()
      } else {
        toast.error('Ошибка сохранения данных')
      }
    } catch {
      toast.error('Ошибка сохранения данных')
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleCancel = () => {
    setFormData({
      name: client.name || '',
      short_name: client.short_name || '',
      inn: client.inn || '',
      kpp: client.kpp || '',
      ogrn: client.ogrn || '',
      region: client.region || '',
      employee_count: client.employee_count || '',
      legal_address: client.legal_address || '',
      actual_address: client.actual_address || '',
      director_name: client.director_name || '',
      director_position: client.director_position || '',
      contact_person: client.contact_person || '',
      contact_phone: client.contact_phone || '',
      contact_email: client.contact_email || '',
      website: client.website || '',
    })
    setIsEditing(false)
  }
  
  // Calculate completion percentages (simplified)
  const sections = [
    { name: "Общая информация", filled: client.name && client.inn ? 67 : 0 },
    { name: "Госрегистрация", filled: client.ogrn && client.kpp ? 62 : 0 },
    { name: "Деятельность и лицензии", filled: client.okved ? 50 : 0 },
    { name: "Руководство", filled: client.director_name ? 18 : 0 },
    { name: "Учредители", filled: client.founders_data?.length > 0 ? 50 : 0 },
    { name: "Банк. реквизиты", filled: client.bank_name ? 100 : 0 },
    { name: "Реквизиты счетов ЭТП", filled: client.etp_accounts_data?.length > 0 ? 50 : 0 },
    { name: "Контактные лица", filled: client.contact_person ? 100 : 0 },
  ]
  
  // Editable field component
  const EditableField = ({ label, field, type = "text", colSpan = false, mono = false }: { 
    label: string
    field: keyof typeof formData
    type?: string 
    colSpan?: boolean
    mono?: boolean
  }) => (
    <div className={colSpan ? "md:col-span-2" : ""}>
      <Label className="text-muted-foreground">{label}</Label>
      {isEditing ? (
        <Input
          type={type}
          value={formData[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className={`mt-1 ${mono ? 'font-mono' : ''}`}
        />
      ) : (
        <div className={`mt-1 p-2 bg-muted/50 rounded ${mono ? 'font-mono' : ''}`}>
          {String(formData[field]) || '—'}
        </div>
      )}
    </div>
  )
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main form */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Общая информация</CardTitle>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                    <X className="h-4 w-4 mr-1" />
                    Отмена
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    Сохранить
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Редактировать
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EditableField label="ИНН" field="inn" mono />
              <EditableField label="КПП" field="kpp" mono />
              <EditableField label="Полное наименование" field="name" colSpan />
              <EditableField label="Сокращённое наименование" field="short_name" />
              <EditableField label="ОГРН" field="ogrn" mono />
              <EditableField label="Регион" field="region" />
              <EditableField label="Количество сотрудников" field="employee_count" type="number" />
              <EditableField label="Юридический адрес" field="legal_address" colSpan />
              <EditableField label="Фактический адрес" field="actual_address" colSpan />
            </div>
            
            {/* Director section */}
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-4">Руководитель</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EditableField label="ФИО" field="director_name" />
                <EditableField label="Должность" field="director_position" />
              </div>
            </div>
            
            {/* Contact section */}
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-4">Контактная информация</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EditableField label="Контактное лицо" field="contact_person" />
                <EditableField label="Телефон" field="contact_phone" />
                <EditableField label="Email" field="contact_email" type="email" />
                <EditableField label="Сайт" field="website" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Completion sidebar */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Заполненность форм:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sections.map((section) => (
              <div key={section.name} className="flex items-center justify-between">
                <span className="text-sm">{section.name}</span>
                <div 
                  className="flex items-center justify-center w-12 h-12 rounded-full text-xs font-bold"
                  style={{
                    background: `conic-gradient(${section.filled >= 50 ? '#3CE8D1' : '#f97316'} ${section.filled * 3.6}deg, #e5e7eb ${section.filled * 3.6}deg)`,
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                    <span style={{ color: section.filled >= 50 ? '#3CE8D1' : '#f97316' }}>
                      {section.filled}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// =============================================================================
// DOCUMENTS TAB
// =============================================================================

interface DocumentsTabProps {
  documents: any[]
  isLoading: boolean
  companyId: number
  onRefresh: () => void
}

function ClientDocumentsTab({ documents, isLoading, companyId, onRefresh }: DocumentsTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadName, setUploadName] = useState("")
  const [uploadTypeId, setUploadTypeId] = useState<number>(0)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  
  const { uploadDocument, isLoading: uploading } = useDocumentMutations()
  
  // Filter documents by search
  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.type_display?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const handleUpload = async () => {
    if (!uploadFile || !uploadName) {
      toast.error("Заполните все поля")
      return
    }
    
    const doc = await uploadDocument({
      name: uploadName,
      file: uploadFile,
      document_type_id: uploadTypeId,
      product_type: 'general',
      company: companyId,
    })
    
    if (doc) {
      toast.success(`Документ "${uploadName}" загружен`)
      setIsUploadOpen(false)
      setUploadName("")
      setUploadTypeId(0)
      setUploadFile(null)
      onRefresh()
    } else {
      toast.error("Ошибка загрузки документа")
    }
  }
  
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      'verified': { label: 'Допущен', color: '#3CE8D1' },
      'pending': { label: 'На проверке', color: '#f97316' },
      'rejected': { label: 'Отклонен', color: '#ef4444' },
    }
    const config = statusMap[status] || { label: status, color: '#94a3b8' }
    return (
      <span 
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
        style={{ color: config.color }}
      >
        ● {config.label}
      </span>
    )
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setIsUploadOpen(true)}
                className="border-[#3CE8D1] text-[#3CE8D1] hover:bg-[#3CE8D1] hover:text-[#0a1628]"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="поиск"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
            </div>
            <span className="text-sm text-muted-foreground">
              Всего документов: {filteredDocs.length}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Документы не найдены</p>
              <Button 
                className="mt-4 bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                onClick={() => setIsUploadOpen(true)}
              >
                Загрузить документ
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Наименование документа</TableHead>
                  <TableHead></TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Статус документа</TableHead>
                  <TableHead>ЭЦП</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <input type="checkbox" className="rounded border-gray-300" />
                    </TableCell>
                    <TableCell>
                      <a
                        href={doc.file_url || doc.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#3CE8D1] transition-colors"
                      >
                        {doc.name}
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <a href={doc.file_url || doc.file} download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(doc.uploaded_at)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(doc.status)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Загрузить документ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Название документа *</Label>
              <Input
                placeholder="Введите название"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Тип документа</Label>
              <Select
                value={String(uploadTypeId)}
                onValueChange={(val) => setUploadTypeId(parseInt(val, 10))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {GENERAL_DOCUMENT_TYPES.slice(0, 20).map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Файл *</Label>
              <div
                className="flex items-center justify-center w-full cursor-pointer"
                onClick={() => document.getElementById('doc-upload-input')?.click()}
              >
                <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                  {uploadFile ? (
                    <div className="flex flex-col items-center">
                      <FileText className="h-8 w-8 text-[#3CE8D1] mb-2" />
                      <p className="text-sm font-medium">{uploadFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Нажмите или перетащите файл</p>
                    </div>
                  )}
                </div>
                <input
                  id="doc-upload-input"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setUploadFile(file)
                      if (!uploadName) {
                        setUploadName(file.name.replace(/\.[^/.]+$/, ""))
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              Отмена
            </Button>
            <Button
              className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
              onClick={handleUpload}
              disabled={uploading || !uploadFile || !uploadName}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Загрузка...
                </>
              ) : (
                "Загрузить"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
