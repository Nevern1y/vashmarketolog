"use client"

import { useState, useCallback } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    FileText,
    Upload,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    FolderOpen,
    Plus,
    File,
    Eye
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useDocuments, useDocumentMutations } from "@/hooks/use-documents"
import { useApplicationMutations } from "@/hooks/use-applications"
import { toast } from "sonner"

interface RequiredDocument {
    name: string
    id: number
    required: boolean
}

interface AdditionalDocumentsModalProps {
    isOpen: boolean
    onClose: () => void
    applicationId: number
    productType: string
    existingDocuments: Array<{
        id: number
        name: string
        document_type_id?: number
        type_display?: string
        file_url?: string
    }>
    onDocumentsAttached: () => void
    getRequiredDocuments: (productType: string) => RequiredDocument[]
}

export function AdditionalDocumentsModal({
    isOpen,
    onClose,
    applicationId,
    productType,
    existingDocuments,
    onDocumentsAttached,
    getRequiredDocuments
}: AdditionalDocumentsModalProps) {
    // Fetch user's "Мои документы"
    const { documents: myDocuments, isLoading: docsLoading, refetch: refetchDocs } = useDocuments({})
    const { uploadDocument, isLoading: uploading } = useDocumentMutations()
    const { updateApplication, isLoading: updating } = useApplicationMutations()

    // Tab state
    const [activeTab, setActiveTab] = useState<'attach' | 'upload'>('attach')
    
    // Selected documents to attach
    const [selectedDocIds, setSelectedDocIds] = useState<number[]>([])
    const [isDragging, setIsDragging] = useState(false)

    // Get required documents hints - only show top 4 required ones
    const requiredDocs = getRequiredDocuments(productType)
    const topRequiredDocs = requiredDocs.filter(d => d.required).slice(0, 4)

    // Check which required documents are already uploaded
    const isDocumentUploaded = (docId: number): boolean => {
        return existingDocuments.some(d => d.document_type_id === docId)
    }

    // Filter "Мои документы" to exclude already attached ones
    const availableDocuments = myDocuments.filter(doc => 
        !existingDocuments.some(existing => existing.id === doc.id)
    )

    // Toggle document selection
    const toggleDocument = (docId: number) => {
        setSelectedDocIds(prev =>
            prev.includes(docId)
                ? prev.filter(id => id !== docId)
                : [...prev, docId]
        )
    }

    // Select all documents
    const selectAll = () => {
        setSelectedDocIds(availableDocuments.map(d => d.id))
    }

    // Deselect all
    const deselectAll = () => {
        setSelectedDocIds([])
    }

    // Attach selected documents
    const handleAttach = async () => {
        if (selectedDocIds.length === 0) {
            toast.error("Выберите хотя бы один документ")
            return
        }

        try {
            const existingIds = existingDocuments.map(d => d.id)
            const allDocIds = [...existingIds, ...selectedDocIds]

            await updateApplication(applicationId, { document_ids: allDocIds })
            toast.success(`Прикреплено ${selectedDocIds.length} документов`)
            setSelectedDocIds([])
            onDocumentsAttached()
            onClose()
        } catch (err) {
            toast.error("Ошибка при прикреплении документов")
        }
    }

    // Handle file upload
    const handleFileUpload = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return

        const uploadedIds: number[] = []

        for (const file of Array.from(files)) {
            const doc = await uploadDocument({
                name: file.name,
                file: file,
                document_type_id: 0,
                product_type: productType,
            })

            if (doc && doc.id) {
                uploadedIds.push(doc.id)
                toast.success(`"${file.name}" загружен`)
            } else {
                toast.error(`Ошибка загрузки "${file.name}"`)
            }
        }

        // Auto-attach uploaded documents to application
        if (uploadedIds.length > 0) {
            try {
                const existingIds = existingDocuments.map(d => d.id)
                const allDocIds = [...existingIds, ...uploadedIds]
                await updateApplication(applicationId, { document_ids: allDocIds })
                toast.success(`Документы прикреплены к заявке`)
                onDocumentsAttached()
                await refetchDocs()
            } catch (err) {
                toast.error("Ошибка прикрепления")
            }
        }
    }, [uploadDocument, productType, existingDocuments, applicationId, updateApplication, onDocumentsAttached, refetchDocs])

    // Drag-and-drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        handleFileUpload(e.dataTransfer.files)
    }

    // Count missing required documents
    const missingRequiredCount = topRequiredDocs.filter(d => !isDocumentUploaded(d.id)).length
    const attachedCount = existingDocuments.length

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-[#0a1628] border-[#1e3a5f] text-white max-w-lg sm:max-w-xl">
                <DialogHeader className="pb-2">
                    <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                        <FolderOpen className="h-5 w-5 text-[#3CE8D1]" />
                        Документы заявки #{applicationId}
                    </DialogTitle>
                    <p className="text-sm text-[#94a3b8]">
                        Прикреплено: {attachedCount} • 
                        {missingRequiredCount > 0 
                            ? ` Не хватает: ${missingRequiredCount} обязательных`
                            : ' Все обязательные загружены'
                        }
                    </p>
                </DialogHeader>

                {/* Quick status - only if there are missing required docs */}
                {missingRequiredCount > 0 && (
                    <div className="bg-[#E03E9D]/10 border border-[#E03E9D]/30 rounded-lg p-3 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-[#E03E9D] shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-[#E03E9D]">Не хватает обязательных документов</p>
                            <p className="text-[#94a3b8] text-xs mt-1">
                                {topRequiredDocs.filter(d => !isDocumentUploaded(d.id)).map(d => d.name).join(', ')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'attach' | 'upload')} className="mt-2">
                    <TabsList className="w-full grid grid-cols-2 bg-[#1a2942]">
                        <TabsTrigger value="attach" className="data-[state=active]:bg-[#3CE8D1] data-[state=active]:text-[#0a1628]">
                            <FolderOpen className="h-4 w-4 mr-2" />
                            Мои документы
                        </TabsTrigger>
                        <TabsTrigger value="upload" className="data-[state=active]:bg-[#3CE8D1] data-[state=active]:text-[#0a1628]">
                            <Upload className="h-4 w-4 mr-2" />
                            Загрузить новый
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Attach from My Documents */}
                    <TabsContent value="attach" className="mt-4">
                        {docsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-[#3CE8D1]" />
                            </div>
                        ) : availableDocuments.length > 0 ? (
                            <div className="space-y-3">
                                {/* Select all / Deselect all */}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-[#94a3b8]">
                                        {availableDocuments.length} документов доступно
                                    </span>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={selectAll}
                                            className="text-[#3CE8D1] hover:underline text-xs"
                                        >
                                            Выбрать все
                                        </button>
                                        {selectedDocIds.length > 0 && (
                                            <button 
                                                onClick={deselectAll}
                                                className="text-[#94a3b8] hover:underline text-xs"
                                            >
                                                Сбросить
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Document list */}
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {availableDocuments.map((doc) => {
                                        const isSelected = selectedDocIds.includes(doc.id)
                                        return (
                                            <div
                                                key={doc.id}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                                                    isSelected
                                                        ? "bg-[#3CE8D1]/15 border border-[#3CE8D1]/50"
                                                        : "bg-[#1a2942]/50 border border-[#2a3a5c]/50 hover:border-[#3CE8D1]/30"
                                                )}
                                                onClick={() => toggleDocument(doc.id)}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    className="border-[#3CE8D1] data-[state=checked]:bg-[#3CE8D1] data-[state=checked]:text-[#0a1628]"
                                                />
                                                <File className="h-4 w-4 text-[#3CE8D1] shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-white truncate">{doc.name}</p>
                                                    <p className="text-xs text-[#64748b]">{doc.type_display || 'Документ'}</p>
                                                </div>
                                                {isSelected && (
                                                    <CheckCircle2 className="h-4 w-4 text-[#3CE8D1]" />
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Attach button */}
                                <Button
                                    onClick={handleAttach}
                                    disabled={selectedDocIds.length === 0 || updating}
                                    className="w-full bg-[#3CE8D1] hover:bg-[#3CE8D1]/80 text-[#0a1628] font-medium"
                                >
                                    {updating ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Plus className="h-4 w-4 mr-2" />
                                    )}
                                    Прикрепить {selectedDocIds.length > 0 ? `(${selectedDocIds.length})` : ''}
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <FileText className="h-12 w-12 mx-auto mb-3 text-[#1e3a5f]" />
                                <p className="text-[#94a3b8]">Нет доступных документов</p>
                                <p className="text-xs text-[#64748b] mt-1">
                                    Загрузите новый на вкладке "Загрузить новый"
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => setActiveTab('upload')}
                                    className="mt-4 border-[#3CE8D1] text-[#3CE8D1]"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Загрузить документ
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    {/* Tab 2: Upload new */}
                    <TabsContent value="upload" className="mt-4">
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                                isDragging
                                    ? "border-[#3CE8D1] bg-[#3CE8D1]/10"
                                    : "border-[#2a3a5c] hover:border-[#3CE8D1]/50 hover:bg-[#1a2942]/30"
                            )}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('modal-file-input')?.click()}
                        >
                            <input
                                type="file"
                                id="modal-file-input"
                                multiple
                                className="hidden"
                                onChange={(e) => handleFileUpload(e.target.files)}
                            />
                            {uploading ? (
                                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-[#3CE8D1]" />
                            ) : (
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#3CE8D1]/10 flex items-center justify-center">
                                    <Upload className="h-8 w-8 text-[#3CE8D1]" />
                                </div>
                            )}
                            <p className="text-white font-medium">
                                {uploading ? "Загрузка..." : "Перетащите файлы сюда"}
                            </p>
                            <p className="text-sm text-[#94a3b8] mt-1">
                                или нажмите для выбора
                            </p>
                            <p className="text-xs text-[#64748b] mt-3">
                                PDF, DOC, DOCX, XLS, XLSX, JPG, PNG до 10 МБ
                            </p>
                        </div>

                        <p className="text-xs text-[#64748b] text-center mt-3">
                            Загруженные документы автоматически прикрепятся к заявке
                        </p>
                    </TabsContent>
                </Tabs>

                {/* Already attached documents preview */}
                {existingDocuments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#1e3a5f]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-[#94a3b8]">
                                Уже прикреплены ({existingDocuments.length})
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {existingDocuments.slice(0, 5).map((doc) => (
                                <Badge 
                                    key={doc.id} 
                                    variant="secondary"
                                    className="bg-[#1a2942] text-[#94a3b8] text-xs"
                                >
                                    <FileText className="h-3 w-3 mr-1" />
                                    {doc.name.length > 20 ? doc.name.substring(0, 20) + '...' : doc.name}
                                </Badge>
                            ))}
                            {existingDocuments.length > 5 && (
                                <Badge variant="secondary" className="bg-[#1a2942] text-[#94a3b8] text-xs">
                                    +{existingDocuments.length - 5} ещё
                                </Badge>
                            )}
                        </div>
                    </div>
                )}

                {/* Close button */}
                <div className="flex justify-end mt-4">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-[#94a3b8] hover:text-white"
                    >
                        Закрыть
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
