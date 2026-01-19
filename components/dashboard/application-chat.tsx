"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Send, Paperclip, Loader2, RefreshCw, AlertCircle, FileText, X, Download, Image as ImageIcon, File as FileIcon } from "lucide-react"
import { useChatPolling, type ChatMessage } from "@/hooks/use-chat"
import { useAuth } from "@/lib/auth-context"
import { useAvatar } from "@/hooks/use-avatar"

interface ApplicationChatProps {
    applicationId: number | string
    className?: string
}

export function ApplicationChat({ applicationId, className }: ApplicationChatProps) {
    const { user } = useAuth()
    const { avatar: myAvatar, getInitials: getMyInitials } = useAvatar()
    const { messages, isLoading, isSending, error, sendMessage, refetch, clearError } = useChatPolling(applicationId)

    const [inputValue, setInputValue] = useState("")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const scrollAreaRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight
            }
        }
    }, [messages])

    // Handle send message
    const handleSend = async () => {
        if (!inputValue.trim() && !selectedFile) return

        const success = await sendMessage(inputValue, selectedFile || undefined)
        if (success) {
            setInputValue("")
            setSelectedFile(null)
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    // Handle file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
        }
    }

    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    // Get role badge
    const getRoleBadge = (role: string) => {
        const badges: Record<string, { label: string; className: string }> = {
            admin: { label: "Админ", className: "bg-[#E03E9D]/10 text-[#E03E9D] border-[#E03E9D]/30" },
            partner: { label: "Партнёр", className: "bg-[#E03E9D]/10 text-[#E03E9D] border-[#E03E9D]/30" },
            agent: { label: "Агент", className: "bg-[#4F7DF3]/10 text-[#4F7DF3] border-[#4F7DF3]/30" },
            client: { label: "Клиент", className: "bg-[#3CE8D1]/10 text-[#3CE8D1] border-[#3CE8D1]/30" },
        }
        const badge = badges[role]
        if (!badge) return null
        return (
            <Badge variant="outline" className={cn("ml-1 text-[10px] px-1.5 py-0 font-normal", badge.className)}>
                {badge.label}
            </Badge>
        )
    }

    // Get avatar initials
    const getInitials = (name: string) => {
        if (!name) return "?"
        const parts = name.trim().split(' ')
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase()
        }
        return name.substring(0, 2).toUpperCase()
    }

    // Format date
    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr)
            const now = new Date()
            const isToday = date.toDateString() === now.toDateString()

            if (isToday) {
                return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
            }
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch {
            return ""
        }
    }

    // Format file size
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} Б`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
        return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
    }

    // Get file extension and name from URL
    const parseFileUrl = (url: string) => {
        try {
            const fileName = decodeURIComponent(url.split('/').pop() || 'file')
            const ext = fileName.split('.').pop()?.toLowerCase() || ''
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)
            return { fileName, ext, isImage }
        } catch {
            return { fileName: 'file', ext: '', isImage: false }
        }
    }

    // Check if message is from current user
    const isOwnMessage = (message: ChatMessage) => {
        return user?.id === message.sender_id
    }

    return (
        <Card className={cn("flex flex-col h-[600px] overflow-hidden border-border", className)}>
            {/* Header */}
            <CardHeader className="py-3 px-4 border-b border-border bg-card flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#3CE8D1]" />
                        <CardTitle className="text-base font-semibold text-foreground">
                            Чат по заявке
                        </CardTitle>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={refetch}
                        disabled={isLoading}
                        className="h-8 w-8"
                    >
                        <RefreshCw className={cn("h-4 w-4 text-muted-foreground", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden min-h-0">
                {/* Error Alert */}
                {error && (
                    <div className="mx-3 mt-3 flex items-center gap-2 p-2.5 bg-[#E03E9D]/10 border border-[#E03E9D]/30 rounded-lg text-sm text-[#E03E9D] flex-shrink-0">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span className="flex-1 text-sm">{error}</span>
                        <button onClick={clearError} className="p-1 hover:bg-[#E03E9D]/20 rounded">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}

                {/* Messages Area */}
                <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0">
                    <div className="p-4 space-y-4">
                        {isLoading && messages.length === 0 ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-14 h-14 rounded-full bg-[#3CE8D1]/10 flex items-center justify-center mb-3">
                                    <Send className="h-6 w-6 text-[#3CE8D1]" />
                                </div>
                                <p className="text-sm font-medium text-foreground">Нет сообщений</p>
                                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                                    Отправьте сообщение, чтобы начать обсуждение заявки
                                </p>
                            </div>
                        ) : (
                            messages.map((message) => {
                                const isOwn = isOwnMessage(message)
                                const fileInfo = message.file_url ? parseFileUrl(message.file_url) : null

                                return (
                                    <div
                                        key={message.id}
                                        className={cn(
                                            "flex gap-2.5",
                                            isOwn ? "flex-row-reverse" : "flex-row"
                                        )}
                                    >
                                        {/* Avatar */}
                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                            {isOwn && myAvatar && (
                                                <AvatarImage src={myAvatar} alt="Вы" />
                                            )}
                                            <AvatarFallback className={cn(
                                                "text-xs font-medium",
                                                isOwn
                                                    ? "bg-[#3CE8D1] text-[#0a1628]"
                                                    : "bg-accent text-foreground"
                                            )}>
                                                {isOwn ? getMyInitials() : getInitials(message.sender_name)}
                                            </AvatarFallback>
                                        </Avatar>

                                        {/* Message Content */}
                                        <div className={cn(
                                            "max-w-[70%] flex flex-col",
                                            isOwn ? "items-end" : "items-start"
                                        )}>
                                            {/* Sender Info */}
                                            <div className="flex items-center gap-1 mb-1">
                                                <span className="text-xs text-muted-foreground">
                                                    {isOwn ? "Вы" : message.sender_name}
                                                </span>
                                                {!isOwn && getRoleBadge(message.sender_role)}
                                            </div>

                                            {/* Message Bubble */}
                                            <div className={cn(
                                                "rounded-xl px-4 py-2.5 shadow-sm",
                                                isOwn
                                                    ? "bg-gradient-to-br from-[#3CE8D1] to-[#2fd4c0] text-[#0a1628]"
                                                    : "bg-[#1e3a5f] border border-[#3CE8D1]/30 text-white"
                                            )}>
                                                {/* Text Content */}
                                                {message.content && (
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                                        {message.content}
                                                    </p>
                                                )}

                                                {/* File Attachment */}
                                                {message.file_url && fileInfo && (
                                                    <div className={cn(
                                                        "mt-2",
                                                        !message.content && "mt-0"
                                                    )}>
                                                        {fileInfo.isImage ? (
                                                            /* Image Preview */
                                                            <a
                                                                href={message.file_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="block"
                                                            >
                                                                <img
                                                                    src={message.file_url}
                                                                    alt={fileInfo.fileName}
                                                                    className="max-w-[220px] max-h-[160px] rounded-lg object-cover"
                                                                    onError={(e) => {
                                                                        // Fallback if image fails to load
                                                                        const target = e.target as HTMLImageElement
                                                                        target.style.display = 'none'
                                                                    }}
                                                                />
                                                            </a>
                                                        ) : (
                                                            /* Document Card */
                                                            <a
                                                                href={message.file_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={cn(
                                                                    "flex items-center gap-2.5 p-2.5 rounded-lg transition-colors",
                                                                    isOwn
                                                                        ? "bg-[#3CE8D1]/80 hover:bg-[#3CE8D1]/60"
                                                                        : "bg-card border border-border hover:bg-accent"
                                                                )}
                                                            >
                                                                {/* Icon */}
                                                                <div className={cn(
                                                                    "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                                                                    isOwn ? "bg-[#3CE8D1]/50" : "bg-[#4F7DF3]/10"
                                                                )}>
                                                                    <FileText className={cn(
                                                                        "h-4 w-4",
                                                                        isOwn ? "text-[#0a1628]" : "text-[#4F7DF3]"
                                                                    )} />
                                                                </div>

                                                                {/* Info */}
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={cn(
                                                                        "text-sm font-medium break-all",
                                                                        isOwn ? "text-[#0a1628]" : "text-foreground"
                                                                    )}>
                                                                        {fileInfo.fileName}
                                                                    </p>
                                                                    <p className={cn(
                                                                        "text-xs uppercase",
                                                                        isOwn ? "text-[#0a1628]/70" : "text-muted-foreground"
                                                                    )}>
                                                                        {fileInfo.ext || 'файл'}
                                                                    </p>
                                                                </div>

                                                                {/* Download Icon */}
                                                                <Download className={cn(
                                                                    "h-4 w-4 flex-shrink-0",
                                                                    isOwn ? "text-[#0a1628]/70" : "text-muted-foreground"
                                                                )} />
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Timestamp */}
                                            <span className="text-[10px] text-muted-foreground mt-1 px-0.5">
                                                {formatDate(message.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-3 border-t border-border bg-card flex-shrink-0">
                    {/* Selected File Preview */}
                    {selectedFile && (
                        <div className="mb-2 flex items-center gap-2.5 p-2.5 bg-accent rounded-lg border border-border">
                            <div className="w-9 h-9 rounded-lg bg-[#4F7DF3]/10 flex items-center justify-center flex-shrink-0">
                                {selectedFile.type.startsWith('image/') ? (
                                    <ImageIcon className="h-4 w-4 text-[#4F7DF3]" />
                                ) : (
                                    <FileIcon className="h-4 w-4 text-[#4F7DF3]" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                    {selectedFile.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatFileSize(selectedFile.size)}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-[#E03E9D]/10 hover:text-[#E03E9D]"
                                onClick={() => {
                                    setSelectedFile(null)
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = ""
                                    }
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Input Row */}
                    <div className="flex gap-2">
                        {/* Hidden File Input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileSelect}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                        />

                        {/* Attach Button */}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSending}
                            className="h-10 w-10 flex-shrink-0"
                        >
                            <Paperclip className="h-4 w-4" />
                        </Button>

                        {/* Text Input */}
                        <Input
                            placeholder="Сообщение..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isSending}
                            className="flex-1 h-10"
                        />

                        {/* Send Button */}
                        <Button
                            onClick={handleSend}
                            disabled={isSending || (!inputValue.trim() && !selectedFile)}
                            className="h-10 w-10 flex-shrink-0 bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] shadow-[0_0_10px_rgba(60,232,209,0.2)] border-0"
                        >
                            {isSending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
