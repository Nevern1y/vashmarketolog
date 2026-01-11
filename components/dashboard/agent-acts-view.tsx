"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Info } from "lucide-react"

export function AgentActsView() {
    const [month, setMonth] = useState("january")
    const [year, setYear] = useState("2026")

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Отчёты об оказанных услугах</h2>

                {/* Manager info could go here as per design, but keeping it simple for now or reusing existing headers */}
                {/* The design shows manager info in the top right, but DashboardHeader usually handles this. 
            We will stick to the main content area. */}
            </div>

            <div className="rounded-lg border border-[#3CE8D1]/20 bg-[#3CE8D1]/5 p-4 text-sm text-[#3CE8D1] flex items-start gap-3">
                <Info className="h-5 w-5 text-[#3CE8D1] shrink-0 mt-0.5" />
                <p>Акт-отчет может быть согласован только после подтверждения о выпуске со стороны банка.</p>
            </div>

            <Card className="bg-[#111C2C] border-slate-800">
                <CardContent className="p-6 space-y-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="text-sm font-medium text-slate-400">Выберите период:</span>

                        <Select value={month} onValueChange={setMonth}>
                            <SelectTrigger className="w-[180px] bg-[#1e293b] border-slate-700 text-white">
                                <SelectValue placeholder="Выберите месяц" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1e293b] border-slate-700 text-white">
                                <SelectItem value="january">Январь</SelectItem>
                                <SelectItem value="february">Февраль</SelectItem>
                                <SelectItem value="march">Март</SelectItem>
                                <SelectItem value="april">Апрель</SelectItem>
                                <SelectItem value="may">Май</SelectItem>
                                <SelectItem value="june">Июнь</SelectItem>
                                <SelectItem value="july">Июль</SelectItem>
                                <SelectItem value="august">Август</SelectItem>
                                <SelectItem value="september">Сентябрь</SelectItem>
                                <SelectItem value="october">Октябрь</SelectItem>
                                <SelectItem value="november">Ноябрь</SelectItem>
                                <SelectItem value="december">Декабрь</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={year} onValueChange={setYear}>
                            <SelectTrigger className="w-[120px] bg-[#1e293b] border-slate-700 text-white">
                                <SelectValue placeholder="Год" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1e293b] border-slate-700 text-white">
                                <SelectItem value="2025">2025</SelectItem>
                                <SelectItem value="2026">2026</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button className="font-semibold bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]">
                            Запросить акт-отчет
                        </Button>
                    </div>

                    <Tabs defaultValue="active" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 sm:w-[400px] bg-[#1e293b]">
                            <TabsTrigger value="active" className="data-[state=active]:bg-[#3CE8D1] data-[state=active]:text-[#0a1628] text-slate-400">
                                Активные
                            </TabsTrigger>
                            <TabsTrigger value="completed" className="text-slate-400 data-[state=active]:text-white">Завершенные</TabsTrigger>
                            <TabsTrigger value="all" className="text-slate-400 data-[state=active]:text-white">Все</TabsTrigger>
                        </TabsList>

                        <div className="mt-6">
                            <div className="rounded-lg border border-slate-800 bg-[#1e293b]/50 p-12 text-center text-slate-400">
                                Заявок не найдено
                            </div>
                        </div>
                    </Tabs>
                </CardContent>
            </Card>
        </div >
    )
}
