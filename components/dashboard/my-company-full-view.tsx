"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  FileText,
  Building2,
  FolderOpen,
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
  Eye,
  Upload,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle,
  Clock,
} from "lucide-react"
import { useMyCompany } from "@/hooks/use-companies"
import { useDocuments, useDocumentMutations, formatDocumentType } from "@/hooks/use-documents"
import { useApplications } from "@/hooks/use-applications"
import { getStatusConfig } from "@/lib/status-mapping"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GENERAL_DOCUMENT_TYPES } from "@/lib/document-types"
import { MyCompanyView } from "./my-company-view"
import { cn } from "@/lib/utils"

// =============================================================================
// TYPES
// =============================================================================

type MyCompanyTab = "applications" | "company" | "documents"

interface MyCompanyFullViewProps {
  onApplicationClick?: (applicationId: number) => void
  onCreateApplication?: () => void
  initialTab?: MyCompanyTab
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MyCompanyFullView({
  onApplicationClick,
  initialTab = "applications",
}: MyCompanyFullViewProps) {
  const [activeTab, setActiveTab] = useState<MyCompanyTab>(initialTab)
  const [searchQuery, setSearchQuery] = useState("")

  // API Hooks
  const { company, isLoading: companyLoading, refetch: refetchCompany } = useMyCompany()
  const { documents, isLoading: docsLoading, refetch: refetchDocs } = useDocuments()
  const { applications, isLoading: appsLoading, refetch: refetchApps } = useApplications()

  // Document upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadName, setUploadName] = useState("")
  const [uploadTypeId, setUploadTypeId] = useState<number>(0)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const { uploadDocument, deleteDocument, isLoading: uploading } = useDocumentMutations()

  // Delete confirmation state
  const [deletingDoc, setDeletingDoc] = useState<{ id: number; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter documents by search
  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadFile(file)
      if (!uploadName) {
        setUploadName(file.name.replace(/\.[^/.]+$/, ""))
      }
    }
  }

  // Handle upload
  const handleUpload = async () => {
    if (!uploadFile || !uploadName) {
      toast.error("Заполните все поля")
      return
    }

    const doc = await uploadDocument({
      name: uploadName,
      file: uploadFile,
      document_type_id: uploadTypeId,
      product_type: "general",
    })

    if (doc) {
      toast.success("Документ загружен")
      setIsUploadOpen(false)
      setUploadName("")
      setUploadTypeId(0)
      setUploadFile(null)
      refetchDocs()
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!deletingDoc) return

    setIsDeleting(true)
    try {
      await deleteDocument(deletingDoc.id)
      toast.success("Документ удален")
      refetchDocs()
    } catch {
      toast.error("Ошибка удаления")
    } finally {
      setIsDeleting(false)
      setDeletingDoc(null)
    }
  }

  // Calculate company profile completion percentage
  const getProfileCompletion = () => {
    if (!company) return 0
    
    const fields = [
      company.inn,
      company.kpp,
      company.ogrn,
      company.name,
      company.legal_address,
      company.director_name,
      company.director_position,
    ]
    
    const filled = fields.filter(Boolean).length
    return Math.round((filled / fields.length) * 100)
  }

  const profileCompletion = getProfileCompletion()

  // Loading state
  if (companyLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
          <p className="text-muted-foreground">Загрузка данных компании...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with company info */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {company?.short_name || company?.name || "Моя компания"}
            </h1>
            {company?.inn && (
              <p className="text-sm text-muted-foreground mt-1">
                ИНН: {company.inn}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Profile completion indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0f2042] border border-[#1e3a5f]">
              <div className="relative w-8 h-8">
                <svg className="transform -rotate-90" width={32} height={32}>
                  <circle
                    cx={16}
                    cy={16}
                    r={14}
                    stroke="var(--border)"
                    strokeWidth={2}
                    fill="none"
                  />
                  <circle
                    cx={16}
                    cy={16}
                    r={14}
                    stroke={profileCompletion === 100 ? "#10b981" : "#3CE8D1"}
                    strokeWidth={2}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={88}
                    strokeDashoffset={88 - (profileCompletion / 100) * 88}
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                  {profileCompletion}
                </span>
              </div>
              <span className="text-xs text-[#94a3b8]">Анкета</span>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                refetchCompany()
                refetchDocs()
                refetchApps()
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MyCompanyTab)}>
        <TabsList className="w-full justify-start border-b bg-transparent p-0">
          <TabsTrigger
            value="applications"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#3CE8D1] data-[state=active]:bg-transparent px-6 py-3"
          >
            <FileText className="h-4 w-4 mr-2" />
            ЗАЯВКИ
            {applications.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {applications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="company"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#3CE8D1] data-[state=active]:bg-transparent px-6 py-3"
          >
            <Building2 className="h-4 w-4 mr-2" />
            АНКЕТА
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#3CE8D1] data-[state=active]:bg-transparent px-6 py-3"
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            ДОКУМЕНТЫ
            {documents.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {documents.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Applications Tab */}
        <TabsContent value="applications" className="mt-6">
          <Card className="bg-[#0f2042] border-[#1e3a5f]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Мои заявки</CardTitle>
            </CardHeader>
            <CardContent>
              {appsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#3CE8D1]" />
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-[#94a3b8] mb-3" />
                  <p className="text-[#94a3b8]">У вас пока нет заявок</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#1e3a5f]">
                      <TableHead className="text-[#94a3b8]">№</TableHead>
                      <TableHead className="text-[#94a3b8]">Продукт</TableHead>
                      <TableHead className="text-[#94a3b8]">Сумма</TableHead>
                      <TableHead className="text-[#94a3b8]">Статус</TableHead>
                      <TableHead className="text-[#94a3b8]">Дата</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => {
                      const statusConfig = getStatusConfig(app.status)
                      return (
                        <TableRow
                          key={app.id}
                          className="border-[#1e3a5f] cursor-pointer hover:bg-[#1e3a5f]/50"
                          onClick={() => onApplicationClick?.(app.id)}
                        >
                          <TableCell className="text-white font-mono">#{app.id}</TableCell>
                          <TableCell className="text-white">{app.product_type_display}</TableCell>
                          <TableCell className="text-white">
                            {parseFloat(app.amount || "0").toLocaleString("ru-RU")} ₽
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "border",
                                statusConfig.bgColor,
                                statusConfig.color
                              )}
                            >
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[#94a3b8]">
                            {new Date(app.created_at).toLocaleDateString("ru-RU")}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Info Tab - Reuses existing MyCompanyView */}
        <TabsContent value="company" className="mt-6">
          <MyCompanyView />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6">
          <Card className="bg-[#0f2042] border-[#1e3a5f]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Мои документы</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                  <Input
                    placeholder="Поиск..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-[#0a1628] border-[#1e3a5f] text-white w-48"
                  />
                </div>
                <Button
                  size="sm"
                  className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                  onClick={() => setIsUploadOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Загрузить
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {docsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#3CE8D1]" />
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 mx-auto text-[#94a3b8] mb-3" />
                  <p className="text-[#94a3b8]">
                    {searchQuery ? "Документы не найдены" : "У вас пока нет документов"}
                  </p>
                  {!searchQuery && (
                    <Button
                      variant="outline"
                      className="mt-4 border-[#3CE8D1] text-[#3CE8D1] hover:bg-[#3CE8D1]/10"
                      onClick={() => setIsUploadOpen(true)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Загрузить первый документ
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#1e3a5f]">
                      <TableHead className="text-[#94a3b8]">Название</TableHead>
                      <TableHead className="text-[#94a3b8]">Тип</TableHead>
                      <TableHead className="text-[#94a3b8]">Статус</TableHead>
                      <TableHead className="text-[#94a3b8]">Дата</TableHead>
                      <TableHead className="text-[#94a3b8] w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc) => (
                      <TableRow key={doc.id} className="border-[#1e3a5f]">
                        <TableCell className="text-white font-medium">{doc.name}</TableCell>
                        <TableCell className="text-[#94a3b8]">
                          {formatDocumentType(doc)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "border",
                              doc.status === "approved"
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : doc.status === "rejected"
                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            )}
                          >
                            {doc.status_display || doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[#94a3b8]">
                          {new Date(doc.uploaded_at).toLocaleDateString("ru-RU")}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#0f2042] border-[#1e3a5f]">
                              {doc.file_url && (
                                <>
                                  <DropdownMenuItem
                                    className="text-white hover:bg-[#1e3a5f]"
                                    onClick={() => window.open(doc.file_url, "_blank")}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Просмотр
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-white hover:bg-[#1e3a5f]"
                                    onClick={() => {
                                      const link = document.createElement("a")
                                      link.href = doc.file_url
                                      link.download = doc.name
                                      link.click()
                                    }}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Скачать
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem
                                className="text-red-400 hover:bg-red-500/10"
                                onClick={() => setDeletingDoc({ id: doc.id, name: doc.name })}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Удалить
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Document Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="bg-[#0f2042] border-[#1e3a5f] text-white">
          <DialogHeader>
            <DialogTitle>Загрузка документа</DialogTitle>
            <DialogDescription className="text-[#94a3b8]">
              Загрузите документ в библиотеку компании
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#94a3b8]">Название документа</Label>
              <Input
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="Например: Устав компании"
                className="bg-[#0a1628] border-[#1e3a5f] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#94a3b8]">Тип документа</Label>
              <Select
                value={String(uploadTypeId)}
                onValueChange={(v) => setUploadTypeId(Number(v))}
              >
                <SelectTrigger className="bg-[#0a1628] border-[#1e3a5f] text-white">
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f2042] border-[#1e3a5f]">
                  <SelectItem value="0" className="text-white">
                    Дополнительный документ
                  </SelectItem>
                  {GENERAL_DOCUMENT_TYPES.slice(0, 20).map((type) => (
                    <SelectItem key={type.id} value={String(type.id)} className="text-white">
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[#94a3b8]">Файл</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={handleFileSelect}
                  className="bg-[#0a1628] border-[#1e3a5f] text-white file:bg-[#3CE8D1] file:text-[#0a1628] file:border-0"
                />
              </div>
              {uploadFile && (
                <p className="text-xs text-[#94a3b8]">Выбран: {uploadFile.name}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsUploadOpen(false)}
              className="text-[#94a3b8]"
            >
              Отмена
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !uploadFile || !uploadName}
              className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Загрузить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingDoc} onOpenChange={() => setDeletingDoc(null)}>
        <DialogContent className="bg-[#0f2042] border-[#1e3a5f] text-white">
          <DialogHeader>
            <DialogTitle>Удалить документ?</DialogTitle>
            <DialogDescription className="text-[#94a3b8]">
              Вы уверены, что хотите удалить документ &quot;{deletingDoc?.name}&quot;? Это действие
              необратимо.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeletingDoc(null)}
              className="text-[#94a3b8]"
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
