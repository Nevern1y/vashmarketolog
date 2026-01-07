"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Bell,
    CheckCircle2,
    XCircle,
    HelpCircle,
    FileText,
    ExternalLink,
    Check,
    Loader2,
} from "lucide-react"
import {
    useNotifications,
    formatCurrency,
    formatRelativeTime,
    type Notification,
} from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"

interface NotificationDropdownProps {
    onNotificationClick?: (notification: Notification) => void
}

// Get icon for notification type
function getNotificationIcon(type: Notification["type"]) {
    switch (type) {
        case "decision_approved":
            return <CheckCircle2 className="h-5 w-5 text-[#3CE8D1]" />
        case "decision_rejected":
            return <XCircle className="h-5 w-5 text-red-500" />
        case "decision_info_requested":
            return <HelpCircle className="h-5 w-5 text-[#f97316]" />
        case "document_verified":
            return <FileText className="h-5 w-5 text-[#3CE8D1]" />
        case "document_rejected":
            return <FileText className="h-5 w-5 text-red-500" />
        default:
            return <Bell className="h-5 w-5 text-muted-foreground" />
    }
}

// Get background color for notification type
function getNotificationBg(type: Notification["type"], isRead: boolean) {
    if (isRead) return "bg-background"

    switch (type) {
        case "decision_approved":
            return "bg-[#3CE8D1]/5"
        case "decision_rejected":
            return "bg-red-500/5"
        case "decision_info_requested":
            return "bg-[#f97316]/5"
        default:
            return "bg-muted/50"
    }
}

export function NotificationDropdown({ onNotificationClick }: NotificationDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
    } = useNotifications()

    const handleNotificationClick = (notification: Notification) => {
        markAsRead(notification.id)
        setIsOpen(false)
        onNotificationClick?.(notification)
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label="Уведомления"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center bg-[#3CE8D1] text-[#0a1628] text-xs font-bold"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-[380px] p-0"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="font-semibold">Уведомления</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => markAllAsRead()}
                        >
                            <Check className="h-3 w-3 mr-1" />
                            Прочитать все
                        </Button>
                    )}
                </div>

                {/* Content */}
                <ScrollArea className="max-h-[400px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">Нет уведомлений</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    className={cn(
                                        "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors",
                                        getNotificationBg(notification.type, notification.isRead),
                                        !notification.isRead && "border-l-2 border-l-[#3CE8D1]"
                                    )}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 mt-0.5">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {/* Title */}
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={cn(
                                                    "text-sm truncate",
                                                    !notification.isRead && "font-semibold"
                                                )}>
                                                    {notification.title}
                                                </p>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatRelativeTime(notification.createdAt)}
                                                </span>
                                            </div>

                                            {/* Application info */}
                                            {notification.details.companyName && (
                                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                    {notification.details.companyName} • {notification.details.productType}
                                                </p>
                                            )}

                                            {/* Message / Details */}
                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>

                                            {/* Amount and rate for approved */}
                                            {notification.type === "decision_approved" && notification.details.amount && (
                                                <div className="flex items-center gap-3 mt-2 text-xs">
                                                    <span className="px-2 py-0.5 rounded bg-[#3CE8D1]/10 text-[#3CE8D1] font-medium">
                                                        {formatCurrency(notification.details.amount)}
                                                    </span>
                                                    {notification.details.offeredRate && (
                                                        <span className="px-2 py-0.5 rounded bg-[#3CE8D1]/10 text-[#3CE8D1] font-medium">
                                                            {notification.details.offeredRate}%
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Partner name */}
                                            {notification.details.partnerName && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    От: {notification.details.partnerName}
                                                </p>
                                            )}

                                            {/* View link */}
                                            <div className="flex items-center gap-1 mt-2 text-xs text-[#3CE8D1]">
                                                <ExternalLink className="h-3 w-3" />
                                                <span>Открыть заявку</span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                {notifications.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <div className="px-4 py-2 text-center">
                            <span className="text-xs text-muted-foreground">
                                Показано {notifications.length} уведомлений
                            </span>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
