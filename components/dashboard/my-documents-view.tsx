"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  Upload,
  MoreHorizontal,
  Download,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Filter,
  Loader2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react"
import { useDocuments, useDocumentMutations, type DocumentListItem } from "@/hooks/use-documents"
import { toast } from "sonner"
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_MAP,
  DOCUMENT_GROUPS,
  getGroupedDocumentTypes,
  COMMON_DOCUMENT_TYPES
} from "@/lib/document-types"

// Use shared document type map for display
const documentTypeMap = DOCUMENT_TYPE_MAP

// Use common types for filter dropdown (first 20 most used)
const documentTypeOptions = COMMON_DOCUMENT_TYPES

type DocumentStatus = "pending" | "verified" | "rejected"

export function MyDocumentsView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | "all">("all")
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  // Upload form state
  const [uploadName, setUploadName] = useState("")
  const [uploadType, setUploadType] = useState("")
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Delete confirmation modal state
  const [deletingDoc, setDeletingDoc] = useState<{ id: number; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // API Hooks
  const { documents, isLoading, error, refetch } = useDocuments()
  const { uploadDocument, deleteDocument, isLoading: uploading } = useDocumentMutations()

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || doc.document_type === filterType
    const matchesStatus = filterStatus === "all" || doc.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  // Status badge
  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-[#3CE8D1]/10 text-[#3CE8D1] hover:bg-[#3CE8D1]/20 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Подтвержден
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Отклонен
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            На проверке
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Stats
  const stats = {
    total: documents.length,
    verified: documents.filter((d) => d.status === "verified").length,
    rejected: documents.filter((d) => d.status === "rejected").length,
    pending: documents.filter((d) => d.status === "pending").length,
  }

  // Handle file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

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
    if (!uploadFile || !uploadName || !uploadType) {
      toast.error("Заполните все поля")
      return
    }

    const doc = await uploadDocument({
      name: uploadName,
      file: uploadFile,
      document_type: uploadType,
    })

    if (doc) {
      toast.success("Документ загружен")
      setIsUploadOpen(false)
      setUploadName("")
      setUploadType("")
      setUploadFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      refetch()
    } else {
      toast.error("Ошибка загрузки документа")
    }
  }

  // Open delete confirmation modal
  const openDeleteConfirm = (id: number, name: string) => {
    setDeletingDoc({ id, name })
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingDoc) return

    setIsDeleting(true)
    const success = await deleteDocument(deletingDoc.id)
    setIsDeleting(false)

    if (success) {
      toast.success("Документ удален")
      refetch()
    } else {
      toast.error("Ошибка удаления документа")
    }

    setDeletingDoc(null)
  }

  // Get file URL for viewing/downloading
  const getFileUrl = (doc: DocumentListItem): string => {
    // Use file_url if available, otherwise construct from file path
    if (doc.file_url) return doc.file_url
    if (doc.file) {
      // If file is a relative path, prepend the API base URL
      if (doc.file.startsWith('http')) return doc.file
      return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${doc.file}`
    }
    return '#'
  }

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("ru-RU")
    } catch {
      return dateStr
    }
  }

  // Loading skeleton
  const TableSkeleton = () => (
    <>
      {[1, 2, 3, 4].map((i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-10 w-48" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Мои документы</h1>
          <p className="text-muted-foreground">Управление документами компании</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] gap-2"
            onClick={() => setIsUploadOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Загрузить документ
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Повторить
            </Button>
          </CardContent>
        </Card>
      )}

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
              <Label>Тип документа *</Label>
              <Select value={uploadType} onValueChange={setUploadType}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Файл *</Label>
              <div
                className="flex items-center justify-center w-full cursor-pointer"
                onClick={handleUploadClick}
              >
                <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                  {uploadFile ? (
                    <div className="flex flex-col items-center text-center px-4">
                      <FileText className="h-8 w-8 text-[#3CE8D1] mb-2" />
                      <p className="text-sm font-medium truncate max-w-full">{uploadFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Нажмите или перетащите файл</p>
                      <p className="text-xs text-muted-foreground">PDF, DOC до 10MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                Отмена
              </Button>
              <Button
                className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                onClick={handleUpload}
                disabled={uploading || !uploadFile || !uploadName || !uploadType}
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
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingDoc} onOpenChange={(open) => !open && setDeletingDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Удалить документ?</DialogTitle>
            <DialogDescription className="pt-2">
              Вы уверены, что хотите удалить документ{" "}
              <span className="font-medium">"{deletingDoc?.name}"</span>?
              <br />
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeletingDoc(null)}
              disabled={isDeleting}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.total}</p>
                )}
                <p className="text-sm text-muted-foreground">Всего</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#3CE8D1]/10">
                <CheckCircle2 className="h-6 w-6 text-[#3CE8D1]" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.verified}</p>
                )}
                <p className="text-sm text-muted-foreground">Подтверждено</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                )}
                <p className="text-sm text-muted-foreground">Отклонено</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f97316]/10">
                <Clock className="h-6 w-6 text-[#f97316]" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.pending}</p>
                )}
                <p className="text-sm text-muted-foreground">На проверке</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Список документов</CardTitle>
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск документов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  {documentTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as DocumentStatus | "all")}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="verified">Подтвержден</SelectItem>
                  <SelectItem value="rejected">Отклонен</SelectItem>
                  <SelectItem value="pending">На проверке</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата загрузки</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton />
              ) : filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="h-8 w-8" />
                      <p>Документы не найдены</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <a
                        href={getFileUrl(doc)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 hover:text-[#3CE8D1] transition-colors group"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground group-hover:text-[#3CE8D1]" />
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{doc.name}</p>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </a>
                    </TableCell>
                    <TableCell>
                      {doc.type_display || documentTypeMap[doc.document_type] || doc.document_type}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(doc.status as DocumentStatus)}
                    </TableCell>
                    <TableCell>{formatDate(doc.uploaded_at)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a
                              href={getFileUrl(doc)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Просмотр
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a
                              href={getFileUrl(doc)}
                              download={doc.name}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Скачать
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => openDeleteConfirm(doc.id, doc.name)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
