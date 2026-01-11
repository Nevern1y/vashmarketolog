import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContractConditionsView } from "@/components/dashboard/contract-conditions-view"
import { IndividualReviewView } from "@/components/dashboard/individual-review-view"
import { AgentDocumentsView } from "@/components/dashboard/agent-documents-view"
import { Landmark } from "lucide-react"

export function AgentBanksView() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3CE8D1]/10">
                    <Landmark className="h-5 w-5 text-[#3CE8D1]" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold font-['Manrope']">Банки</h1>
                    <p className="text-sm text-muted-foreground">Условия сотрудничества с банками-партнерами</p>
                </div>
            </div>

            <Tabs defaultValue="commission" className="w-full">
                <TabsList className="bg-muted/50 p-1 w-full flex flex-wrap h-auto">
                    <TabsTrigger value="commission" className="flex-1 min-w-[140px]">Условия банков</TabsTrigger>
                    <TabsTrigger value="tariffs" className="flex-1 min-w-[140px]">Тарифы</TabsTrigger>
                    <TabsTrigger value="individual" className="flex-1 min-w-[200px]">Индивидуальное рассмотрение</TabsTrigger>
                    <TabsTrigger value="documents" className="flex-1 min-w-[140px]">Документы</TabsTrigger>
                </TabsList>

                {/* Tab: Commission Rates (Renamed from My Contract -> Bank Conditions as requested) */}
                <TabsContent value="commission" className="mt-6">
                    <ContractConditionsView />
                </TabsContent>

                {/* Tab: Tariffs (Existing Bank Conditions from My Documents) */}
                {/* We pass a prop to specificy tab or we will refactor AgentDocumentsView to allow showing only specific content. 
                    For now, AgentDocumentsView has its own tabs. I will fix AgentDocumentsView in the next step to accept a "mode" prop 
                    or split it. For now, let's assume I'll use it here but I need to hide its internal tabs. 
                    Actually, I'll replace AgentDocumentsView logic with strict sub-views.
                    For this file, I'll place the placeholders using the existing component with a (to be added) prop or just wait for the next step.
                    To avoid breaking render, I will use AgentDocumentsView but I plan to split it.
                */}
                <TabsContent value="tariffs" className="mt-6">
                    <AgentDocumentsView initialTab="bank_conditions" hideTabs={true} />
                </TabsContent>

                <TabsContent value="individual" className="mt-6">
                    <IndividualReviewView />
                </TabsContent>

                <TabsContent value="documents" className="mt-6">
                    <AgentDocumentsView initialTab="my_documents" hideTabs={true} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
