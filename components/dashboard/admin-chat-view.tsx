"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useNotifications, formatRelativeTime } from "@/hooks/use-notifications"
import { useApplications } from "@/hooks/use-applications"
import { MessageCircle, Search, Loader2, ExternalLink } from "lucide-react"

interface AdminChatViewProps {
    onOpenApplication: (applicationId: number) => void
}

export function AdminChatView({ onOpenApplication }: AdminChatViewProps) {
    const { notifications, isLoading, markAsRead } = useNotifications()
    const { applications } = useApplications()
    const [searchQuery, setSearchQuery] = useState("")

    const appMap = useMemo(() => {
        return new Map(applications.map((app) => [app.id, app]))
    }, [applications])

    const chatNotifications = useMemo(() => {
        return notifications.filter((n) => n.type === "chat_message")
    }, [notifications])

    const filteredNotifications = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return chatNotifications

        return chatNotifications.filter((n) => {
            const app = n.details.applicationId ? appMap.get(n.details.applicationId) : null
            const companyName = app?.company_name || ""
            const senderName = n.details.senderName || ""
            const preview = n.details.previewText || n.message || ""

            return (
                companyName.toLowerCase().includes(query) ||
                senderName.toLowerCase().includes(query) ||
                preview.toLowerCase().includes(query) ||
                String(n.details.applicationId || "").includes(query)
            )
        })
    }, [chatNotifications, searchQuery, appMap])

    const handleOpenApplication = (notificationId: string, applicationId?: number) => {
        if (!applicationId) return
        markAsRead(notificationId)
        onOpenApplication(applicationId)
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">Чат</h1>
                    <p className="text-sm text-muted-foreground">
                        Последние сообщения по заявкам
                    </p>
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

            <Card className="border-border">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground">Сообщений нет</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {filteredNotifications.map((notification) => {
                                const appId = notification.details.applicationId
                                const app = appId ? appMap.get(appId) : null
                                const companyName = app?.company_name || "Заявка"
                                const senderName = notification.details.senderName || ""
                                const preview = notification.details.previewText || notification.message

                                return (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "p-4 flex flex-col md:flex-row md:items-center justify-between gap-3",
                                            !notification.isRead && "bg-[#3CE8D1]/5"
                                        )}
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-semibold text-foreground truncate">
                                                    {companyName}
                                                </h3>
                                                {appId && (
                                                    <Badge variant="outline" className="text-[10px]">
                                                        #{appId}
                                                    </Badge>
                                                )}
                                                {!notification.isRead && (
                                                    <Badge className="bg-[#3CE8D1]/20 text-[#3CE8D1] text-[10px]">Новое</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {senderName ? `${senderName}: ` : ""}{preview}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-muted-foreground">
                                                {formatRelativeTime(notification.createdAt)}
                                            </span>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleOpenApplication(notification.id, appId)}
                                                disabled={!appId}
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
