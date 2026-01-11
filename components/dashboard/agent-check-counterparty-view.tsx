"use client"

import { useState } from "react"
import { Search, Building2, MapPin, FileCheck, CheckCircle2, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export function AgentCheckCounterpartyView() {
    const [inn, setInn] = useState("")
    const [ogrn, setOgrn] = useState("")
    const [name, setName] = useState("")
    const [address, setAddress] = useState("")
    const [isChecking, setIsChecking] = useState(false)
    const [result, setResult] = useState<"success" | "error" | null>(null)

    const handleCheck = () => {
        if (!inn || !name) {
            toast.error("Заполните ИНН и Наименование компании")
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
                    <p className="text-sm text-muted-foreground">Проверка юридических лиц по базам данных</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Данные для проверки</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Наименование компании *</Label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="pl-9"
                                    placeholder="ООО «Ромашка»"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>ИНН *</Label>
                                <Input
                                    value={inn}
                                    onChange={e => setInn(e.target.value)}
                                    placeholder="Введите ИНН"
                                    maxLength={12}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>ОГРН</Label>
                                <Input
                                    value={ogrn}
                                    onChange={e => setOgrn(e.target.value)}
                                    placeholder="Введите ОГРН"
                                    maxLength={15}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Юридический адрес</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    className="pl-9"
                                    placeholder="г. Москва, ул. Ленина, д. 1"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleCheck}
                            disabled={isChecking}
                            className="w-full bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] font-semibold mt-4"
                        >
                            {isChecking ? "Проверка..." : "Проверить контрагента"}
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
