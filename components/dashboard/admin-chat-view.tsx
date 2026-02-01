"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useChatThreads, formatRelativeTime, type ChatThread } from "@/hooks/use-chat-threads"
import { MessageCircle, Search, Loader2, ExternalLink, Wifi, WifiOff, AlertCircle } from "lucide-react"

interface AdminChatViewProps {
    onOpenApplication: (applicationId: number) => void
}

export function AdminChatView({ onOpenApplication }: AdminChatViewProps) {
    const { threads, isLoading, error, isConnected, refresh } = useChatThreads()
    const [searchQuery, setSearchQuery] = useState("")

    const filteredThreads = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return threads

        return threads.filter((thread) => {
            return (
                thread.companyName.toLowerCase().includes(query) ||
                thread.lastSenderName.toLowerCase().includes(query) ||
                thread.lastSenderEmail.toLowerCase().includes(query) ||
                thread.lastMessagePreview.toLowerCase().includes(query) ||
                String(thread.applicationId).includes(query)
            )
        })
    }, [threads, searchQuery])

    const handleOpenApplication = (applicationId: number) => {
        onOpenApplication(applicationId)
    }

    const getThreadStatus = (thread: ChatThread) => {
        if (thread.unreadCount > 0) {
            return {
                type: 'unread' as const,
                label: `${thread.unreadCount} непрочитанных`,
                className: 'bg-[#3CE8D1]/20 text-[#3CE8D1]',
            }
        }
        if (!thread.adminReplied) {
            return {
                type: 'no_reply' as const,
                label: 'Вы не ответили',
                className: 'bg-amber-500/20 text-amber-500',
            }
        }
        return null
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">Чат</h1>
                    <p className="text-sm text-muted-foreground">
                        Сообщения, требующие внимания
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {isConnected ? (
                        <Badge variant="outline" className="text-green-500 border-green-500/30">
                            <Wifi className="h-3 w-3 mr-1" />
                            Live
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                            <WifiOff className="h-3 w-3 mr-1" />
                            Polling
                        </Badge>
                    )}
                    <Button variant="ghost" size="sm" onClick={refresh}>
                        Обновить
                    </Button>
                </div>
            </div>

            <Card className="border-border">
                <CardContent className="p-3 md:py-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Поиск по компании, заявке или отправителю..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardContent>
            </Card>

            {error && (
                <Card className="border-destructive/50 bg-destructive/10">
                    <CardContent className="p-4 flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{error}</span>
                    </CardContent>
                </Card>
            )}

            <Card className="border-border">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredThreads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground">
                                {searchQuery ? 'Ничего не найдено' : 'Нет сообщений, требующих внимания'}
                            </p>
                            <p className="text-xs text-muted-foreground/60 mt-1">
                                Все сообщения прочитаны и получили ответ
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {filteredThreads.map((thread) => {
                                const status = getThreadStatus(thread)
                                
                                return (
                                    <div
                                        key={thread.applicationId}
                                        className={cn(
                                            "p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors",
                                            status?.type === 'unread' && "bg-[#3CE8D1]/5",
                                            status?.type === 'no_reply' && "bg-amber-500/5"
                                        )}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-sm font-semibold text-foreground truncate">
                                                    {thread.companyName}
                                                </h3>
                                                <Badge variant="outline" className="text-[10px]">
                                                    #{thread.applicationId}
                                                </Badge>
                                                {status && (
                                                    <Badge className={cn("text-[10px]", status.className)}>
                                                        {status.label}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                                {thread.lastSenderName}: {thread.lastMessagePreview}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-xs text-muted-foreground">
                                                {formatRelativeTime(thread.lastMessageAt)}
                                            </span>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleOpenApplication(thread.applicationId)}
                                            >
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Открыть
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
