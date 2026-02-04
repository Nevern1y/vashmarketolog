"use client"

import { useState } from "react"
import { Search, FileCheck, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export function AgentCheckCounterpartyView() {
    const [inn, setInn] = useState("")
    const [isChecking, setIsChecking] = useState(false)
    const [result, setResult] = useState<"success" | "error" | null>(null)

    const handleCheck = () => {
        if (!inn) {
            toast.error("Введите ИНН")
            return
        }

        setIsChecking(true)
        setResult(null)

        // Simulate API call
        setTimeout(() => {
            setIsChecking(false)
            setResult("success")
            toast.success("Проверка завершена. Контрагент надежен.")
        }, 1500)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3CE8D1]/10">
                    <Search className="h-5 w-5 text-[#3CE8D1]" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold font-['Manrope']">Проверка контрагента</h1>
                    <p className="text-sm text-muted-foreground">Проверка юридических лиц по ИНН</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Данные для проверки</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>ИНН *</Label>
                            <Input
                                value={inn}
                                onChange={e => setInn(e.target.value)}
                                placeholder="Введите ИНН"
                                maxLength={12}
                            />
                        </div>

                        <Button
                            onClick={handleCheck}
                            disabled={isChecking}
                            className="w-full bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] font-semibold mt-4"
                        >
                            {isChecking ? "Проверка..." : "Проверить"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Result Placeholder */}
                <div className="space-y-6">
                    {result === "success" && (
                        <Card className="border-green-500/20 bg-green-500/5">
                            <CardHeader>
                                <div className="flex items-center gap-2 text-green-500">
                                    <CheckCircle2 className="h-5 w-5" />
                                    <CardTitle>Контрагент надежен</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-green-400">
                                    Компания не находится в стадии ликвидации. Нет активных судебных разбирательств в качестве ответчика на значительные суммы. Налоговая задолженность отсутствует.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {!result && !isChecking && (
                        <Card className="bg-muted/30 border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <FileCheck className="h-12 w-12 mb-4 opacity-50" />
                                <p>Введите данные компании и нажмите "Проверить"</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
