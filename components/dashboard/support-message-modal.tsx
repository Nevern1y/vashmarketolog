"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, MessageSquare } from "lucide-react"
import { toast } from "sonner"

interface SupportMessageModalProps {
    isOpen: boolean
    onClose: () => void
}

export function SupportMessageModal({ isOpen, onClose }: SupportMessageModalProps) {
    const [topic, setTopic] = useState("")
    const [message, setMessage] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!topic.trim() || !message.trim()) {
            toast.error("Заполните тему и текст сообщения")
            return
        }

        setIsSubmitting(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        toast.success("Сообщение отправлено в поддержку")
        setIsSubmitting(false)
        handleClose()
    }

    const handleClose = () => {
        setTopic("")
        setMessage("")
        onClose()
    }

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            handleClose()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px] top-[50%] translate-y-[-50%]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3CE8D1]/10">
                            <MessageSquare className="h-5 w-5 text-[#3CE8D1]" />
                        </div>
                        <div>
                            <DialogTitle>Написать в поддержку</DialogTitle>
                            <DialogDescription>
                                Отправьте сообщение в отдел поддержки клиентов
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="topic">Тема сообщения</Label>
                        <Input
                            id="topic"
                            placeholder="Например: Проблема с заявкой"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message">Текст сообщения</Label>
                        <Textarea
                            id="message"
                            placeholder="Опишите вашу проблему или вопрос..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[120px]"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Отмена
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Отправка...
                            </>
                        ) : (
                            "Отправить сообщение"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
