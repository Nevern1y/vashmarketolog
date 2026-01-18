"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    Filter,
    Loader2,
    AlertCircle,
    RefreshCw,
    ExternalLink,
    Eye,
    Check,
    X,
    Download,
} from "lucide-react"
import { useDocuments, useDocumentMutations, type DocumentListItem, formatDocumentType } from "@/hooks/use-documents"
import { toast } from "sonner"

// ============================================
// Admin Documents View - Document Verification
// ============================================

type DocumentStatus = "pending" | "verified" | "rejected"

// Extended document type for admin view (includes owner info)
interface AdminDocumentItem extends DocumentListItem {
    owner_email?: string
    owner?: number
}

export function AdminDocumentsView() {
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState<DocumentStatus | "all">("all")
    const [filterUser, setFilterUser] = useState<string>("all")

    // Rejection modal state
    const [rejectingDoc, setRejectingDoc] = useState<{ id: number; name: string } | null>(null)
    const [rejectionReason, setRejectionReason] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)

    // API Hooks
    const { documents, isLoading, error, refetch } = useDocuments()
    const { verifyDocument } = useDocumentMutations()

    // Get unique users for filter dropdown
    const uniqueUsers = [...new Set(documents.map(d => d.owner_email).filter(Boolean))] as string[]

    // Filter and sort documents - group by user
    const filteredDocuments = documents
        .filter((doc) => {
            const matchesSearch =
                doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (doc.type_display && doc.type_display.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (doc.owner_email && doc.owner_email.toLowerCase().includes(searchQuery.toLowerCase()))
            const matchesStatus = filterStatus === "all" || doc.status === filterStatus
            const matchesUser = filterUser === "all" || doc.owner_email === filterUser
            return matchesSearch && matchesStatus && matchesUser
        })
        // Sort by owner_email first, then by upload date (newest first)
        .sort((a, b) => {
            // First sort by owner
            const ownerA = a.owner_email || ''
            const ownerB = b.owner_email || ''
            if (ownerA !== ownerB) {
                return ownerA.localeCompare(ownerB)
            }
            // Then by date (newest first)
            return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
        })

    // Status badge
    const getStatusBadge = (status: DocumentStatus) => {
        switch (status) {
            case "verified":
                return (
                    <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 gap-1">
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
                    <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 gap-1">
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

    // Handle approve
    const handleApprove = async (docId: number, docName: string) => {
        setIsProcessing(true)
        const result = await verifyDocument(docId, "verified")
        setIsProcessing(false)

        if (result) {
            toast.success(`Документ "${docName}" подтвержден`)
            refetch()
        } else {
            toast.error("Ошибка при подтверждении документа")
        }
    }

    // Handle reject confirmation
    const handleRejectConfirm = async () => {
        if (!rejectingDoc) return

        if (!rejectionReason.trim()) {
            toast.error("Укажите причину отклонения")
            return
        }

        setIsProcessing(true)
        const result = await verifyDocument(rejectingDoc.id, "rejected", rejectionReason)
        setIsProcessing(false)

        if (result) {
            toast.success(`Документ "${rejectingDoc.name}" отклонен`)
            refetch()
            setRejectingDoc(null)
            setRejectionReason("")
        } else {
            toast.error("Ошибка при отклонении документа")
        }
    }

    // Get file URL for viewing/downloading
    const getFileUrl = (doc: DocumentListItem): string => {
        if (doc.file_url) return doc.file_url
        if (doc.file) {
            if (doc.file.startsWith("http")) return doc.file
            const origin = typeof window !== "undefined"
                ? window.location.origin
                : (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:8000")
            return `${origin}${doc.file}`
        }
        return "#"
    }


    // Format date
    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            })
        } catch {
            return dateStr
        }
    }

    // Loading skeleton
    const TableSkeleton = () => (
        <>
            {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                </TableRow>
            ))}
        </>
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Верификация документов</h1>
                    <p className="text-muted-foreground">Проверка и подтверждение документов пользователей</p>
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetch()}
                    disabled={isLoading}
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
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

            {/* Rejection Modal */}
            <Dialog open={!!rejectingDoc} onOpenChange={(open) => !open && setRejectingDoc(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Отклонить документ?</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <p className="text-sm text-muted-foreground">
                            Документ: <span className="font-medium text-foreground">{rejectingDoc?.name}</span>
                        </p>
                        <div className="space-y-2">
                            <Label htmlFor="rejection-reason">Причина отклонения *</Label>
                            <Textarea
                                id="rejection-reason"
                                placeholder="Укажите причину отклонения документа..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRejectingDoc(null)
                                setRejectionReason("")
                            }}
                            disabled={isProcessing}
                        >
                            Отмена
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRejectConfirm}
                            disabled={isProcessing || !rejectionReason.trim()}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Отклонение...
                                </>
                            ) : (
                                <>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Отклонить
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
                <Card className="shadow-sm border-amber-500/30">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                                <Clock className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
                                )}
                                <p className="text-sm text-muted-foreground">На проверке</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
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
                                    placeholder="Поиск..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 w-[200px]"
                                />
                            </div>
                            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as DocumentStatus | "all")}>
                                <SelectTrigger className="w-[160px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Статус" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все статусы</SelectItem>
                                    <SelectItem value="pending">На проверке</SelectItem>
                                    <SelectItem value="verified">Подтвержден</SelectItem>
                                    <SelectItem value="rejected">Отклонен</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterUser} onValueChange={setFilterUser}>
                                <SelectTrigger className="w-[220px]">
                                    <SelectValue placeholder="Пользователь" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все пользователи</SelectItem>
                                    {uniqueUsers.map(email => (
                                        <SelectItem key={email} value={email}>{email}</SelectItem>
                                    ))}
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
                                <TableHead>Владелец</TableHead>
                                <TableHead>Статус</TableHead>
                                <TableHead>Дата загрузки</TableHead>
                                <TableHead className="text-right">Действия</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableSkeleton />
                            ) : filteredDocuments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
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
                                                className="flex items-center gap-2 hover:text-[#3CE8D1] transition-colors group"
                                            >
                                                <FileText className="h-4 w-4 text-muted-foreground group-hover:text-[#3CE8D1]" />
                                                <span className="font-medium">{doc.name}</span>
                                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDocumentType(doc)}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {doc.owner_email || '—'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(doc.status as DocumentStatus)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(doc.uploaded_at)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                {/* View/Download */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    asChild
                                                    className="h-8 w-8"
                                                >
                                                    <a
                                                        href={getFileUrl(doc)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Просмотр"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </a>
                                                </Button>

                                                {/* Approve Button - only for pending */}
                                                {doc.status === "pending" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                                                        onClick={() => handleApprove(doc.id, doc.name)}
                                                        disabled={isProcessing}
                                                        title="Подтвердить"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                {/* Reject Button - only for pending */}
                                                {doc.status === "pending" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => setRejectingDoc({ id: doc.id, name: doc.name })}
                                                        disabled={isProcessing}
                                                        title="Отклонить"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
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
