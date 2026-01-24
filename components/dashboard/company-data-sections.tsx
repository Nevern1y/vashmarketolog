"use client"

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Users,
    Building2,
    Briefcase,
    Award,
    Landmark,
    FileSignature,
    BadgeCheck,
    Download,
    ChevronDown,
    ChevronRight,
    Phone,
    Mail,
    Globe,
} from 'lucide-react'
import { useState, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { CompanyDataForPartner } from '@/hooks/use-applications'

// ============================================
// Type Definitions for JSON data structures
// ============================================

interface FounderDocument {
    series?: string
    number?: string
    issued_at?: string
    authority_name?: string
    authority_code?: string
}

interface PhysicalFounder {
    full_name?: string
    name?: string
    inn?: string
    share_relative?: number
    document?: FounderDocument
    birth_date?: string
    birth_place?: string
    gender?: number
    citizen?: string
    is_resident?: boolean
}

interface LegalFounder {
    name?: string
    inn?: string
    ogrn?: string
    share_relative?: number
    director_name?: string
    director_position?: string
    registration_date?: string
}

interface LeaderPassport {
    series?: string
    number?: string
    issued_date?: string
    issued_by?: string
    department_code?: string
}

interface Leader {
    position?: string
    full_name?: string
    share_percent?: number
    email?: string
    phone?: string
    passport?: LeaderPassport
    citizenship?: string
    birth_date?: string
}

interface License {
    type?: string
    name?: string
    number?: string
    issued_date?: string
    valid_until?: string
}

interface BankAccount {
    bank_name?: string
    bic?: string
    bank_bik?: string
    account?: string
}

interface ETPAccount {
    platform?: string
    account?: string
}

interface ContactPerson {
    first_name?: string
    last_name?: string
    patronymic?: string
    position?: string
    phone?: string
    email?: string
}

// ============================================
// Collapsible Section Component
// ============================================

interface CollapsibleSectionProps {
    title: string
    icon: ReactNode
    children: ReactNode
    defaultOpen?: boolean
    className?: string
    badge?: string | number
}

export function CollapsibleSection({
    title,
    icon,
    children,
    defaultOpen = false,
    className,
    badge
}: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className={cn("border border-border/30 rounded-lg overflow-hidden", className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 p-3 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-2 text-[#3CE8D1]">
                    {icon}
                </div>
                <span className="text-sm font-medium">{title}</span>
                {badge !== undefined && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                        {badge}
                    </Badge>
                )}
                <div className="ml-auto text-muted-foreground">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
            </button>
            {isOpen && (
                <div className="p-3 border-t border-border/30">
                    {children}
                </div>
            )}
        </div>
    )
}

// ============================================
// Signatory & MCHD Section
// ============================================

interface SignatoryMCHDSectionProps {
    companyData: CompanyDataForPartner
    variant?: 'card' | 'collapsible'
    DataCard?: React.ComponentType<{ title: string; icon: ReactNode; children: ReactNode }>
    DataRow?: React.ComponentType<{ label: string; value?: string | null; mono?: boolean }>
}

export function SignatoryMCHDSection({
    companyData,
    variant = 'collapsible',
    DataCard,
    DataRow
}: SignatoryMCHDSectionProps) {
    const hasSignatory = companyData.signatory_basis || companyData.is_mchd

    if (!hasSignatory) return null

    const signatoryBasisLabel = companyData.signatory_basis === 'charter' ? 'Устав' :
        companyData.signatory_basis === 'power_of_attorney' ? 'Доверенность' :
        companyData.signatory_basis

    const content = (
        <>
            <div className="flex items-center gap-2 py-2 border-b border-border/20">
                <span className="text-xs text-muted-foreground min-w-[140px]">Основание полномочий</span>
                <span className="text-sm ml-auto">{signatoryBasisLabel || '—'}</span>
            </div>
            {companyData.is_mchd && (
                <>
                    <Separator className="my-3" />
                    <div className="flex items-center gap-2 mb-3">
                        <BadgeCheck className="h-4 w-4 text-[#3CE8D1]" />
                        <span className="text-sm font-medium">Машиночитаемая доверенность (МЧД)</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 py-1">
                            <span className="text-xs text-muted-foreground min-w-[140px]">Номер МЧД</span>
                            <span className="text-sm font-mono ml-auto">{companyData.mchd_number || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2 py-1">
                            <span className="text-xs text-muted-foreground min-w-[140px]">Дата выдачи</span>
                            <span className="text-sm ml-auto">{companyData.mchd_issue_date || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2 py-1">
                            <span className="text-xs text-muted-foreground min-w-[140px]">Действует до</span>
                            <span className="text-sm ml-auto">{companyData.mchd_expiry_date || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2 py-1">
                            <span className="text-xs text-muted-foreground min-w-[140px]">ИНН доверителя</span>
                            <span className="text-sm font-mono ml-auto">{companyData.mchd_principal_inn || '—'}</span>
                        </div>
                        {companyData.mchd_file && (
                            <div className="mt-3 pt-3 border-t border-border/20">
                                <a
                                    href={companyData.mchd_file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-[#3CE8D1] hover:underline"
                                >
                                    <Download className="h-4 w-4" />
                                    Скачать файл МЧД
                                </a>
                            </div>
                        )}
                    </div>
                </>
            )}
        </>
    )

    if (variant === 'card' && DataCard && DataRow) {
        return (
            <DataCard title="Подписант" icon={<FileSignature className="h-4 w-4" />}>
                <DataRow label="Основание полномочий" value={signatoryBasisLabel} />
                {companyData.is_mchd && (
                    <>
                        <Separator className="my-3" />
                        <div className="flex items-center gap-2 mb-2">
                            <BadgeCheck className="h-4 w-4 text-[#3CE8D1]" />
                            <span className="text-sm font-medium">Машиночитаемая доверенность (МЧД)</span>
                        </div>
                        <DataRow label="Номер МЧД" value={companyData.mchd_number} mono />
                        <DataRow label="Дата выдачи" value={companyData.mchd_issue_date} />
                        <DataRow label="Действует до" value={companyData.mchd_expiry_date} />
                        <DataRow label="ИНН доверителя" value={companyData.mchd_principal_inn} mono />
                        {companyData.mchd_file && (
                            <div className="mt-3 pt-3 border-t border-border/20">
                                <a
                                    href={companyData.mchd_file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-[#3CE8D1] hover:underline"
                                >
                                    <Download className="h-4 w-4" />
                                    Скачать файл МЧД
                                </a>
                            </div>
                        )}
                    </>
                )}
            </DataCard>
        )
    }

    return (
        <CollapsibleSection
            title="Подписант и МЧД"
            icon={<FileSignature className="h-4 w-4" />}
        >
            {content}
        </CollapsibleSection>
    )
}

// ============================================
// Founders Physical Section
// ============================================

interface FoundersPhysicalSectionProps {
    foundersData: PhysicalFounder[]
    variant?: 'card' | 'collapsible'
    className?: string
}

export function FoundersPhysicalSection({
    foundersData,
    variant = 'collapsible',
    className
}: FoundersPhysicalSectionProps) {
    if (!foundersData || foundersData.length === 0) return null

    const content = (
        <div className="space-y-4">
            {foundersData.map((founder, idx) => (
                <div key={idx} className="p-3 bg-slate-800/30 rounded-lg border border-border/30">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <span className="text-sm font-medium">{founder.full_name || founder.name}</span>
                        <div className="flex items-center gap-2 flex-wrap">
                            {founder.inn && <span className="font-mono text-xs bg-slate-700/50 px-2 py-0.5 rounded">ИНН: {founder.inn}</span>}
                            {founder.share_relative != null && <Badge variant="outline">Доля: {founder.share_relative}%</Badge>}
                        </div>
                    </div>
                    {/* Passport Info */}
                    {founder.document && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 pt-2 border-t border-border/20">
                            <div>
                                <p className="text-xs text-muted-foreground">Серия/Номер</p>
                                <p className="text-xs font-mono">{founder.document.series} {founder.document.number}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Дата выдачи</p>
                                <p className="text-xs">{founder.document.issued_at}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs text-muted-foreground">Кем выдан</p>
                                <p className="text-xs truncate">{founder.document.authority_name}</p>
                            </div>
                        </div>
                    )}
                    {/* Additional info */}
                    {(founder.birth_date || founder.birth_place) && (
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/20">
                            {founder.birth_date && (
                                <div>
                                    <p className="text-xs text-muted-foreground">Дата рождения</p>
                                    <p className="text-xs">{founder.birth_date}</p>
                                </div>
                            )}
                            {founder.birth_place && (
                                <div>
                                    <p className="text-xs text-muted-foreground">Место рождения</p>
                                    <p className="text-xs">{founder.birth_place}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )

    return (
        <CollapsibleSection
            title="Учредители (физ. лица)"
            icon={<Users className="h-4 w-4" />}
            badge={foundersData.length}
            className={className}
        >
            {content}
        </CollapsibleSection>
    )
}

// ============================================
// Founders Legal Section
// ============================================

interface FoundersLegalSectionProps {
    legalFoundersData: LegalFounder[]
    variant?: 'card' | 'collapsible'
    className?: string
}

export function FoundersLegalSection({
    legalFoundersData,
    variant = 'collapsible',
    className
}: FoundersLegalSectionProps) {
    if (!legalFoundersData || legalFoundersData.length === 0) return null

    const content = (
        <div className="space-y-3">
            {legalFoundersData.map((legalFounder, idx) => (
                <div key={idx} className="p-3 bg-slate-800/30 rounded-lg border border-border/30">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <span className="text-sm font-medium">{legalFounder.name}</span>
                        {legalFounder.share_relative != null && <Badge variant="outline">Доля: {legalFounder.share_relative}%</Badge>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {legalFounder.inn && (
                            <div>
                                <p className="text-muted-foreground">ИНН</p>
                                <p className="font-mono">{legalFounder.inn}</p>
                            </div>
                        )}
                        {legalFounder.ogrn && (
                            <div>
                                <p className="text-muted-foreground">ОГРН</p>
                                <p className="font-mono">{legalFounder.ogrn}</p>
                            </div>
                        )}
                        {legalFounder.director_name && (
                            <div className="col-span-2">
                                <p className="text-muted-foreground">Руководитель</p>
                                <p>{legalFounder.director_position || 'Генеральный директор'}: {legalFounder.director_name}</p>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )

    return (
        <CollapsibleSection
            title="Учредители (юр. лица)"
            icon={<Building2 className="h-4 w-4" />}
            badge={legalFoundersData.length}
            className={className}
        >
            {content}
        </CollapsibleSection>
    )
}

// ============================================
// Leadership Section
// ============================================

interface LeadershipSectionProps {
    leadershipData: Leader[]
    variant?: 'card' | 'collapsible'
    className?: string
}

export function LeadershipSection({
    leadershipData,
    variant = 'collapsible',
    className
}: LeadershipSectionProps) {
    if (!leadershipData || leadershipData.length === 0) return null

    const content = (
        <div className="space-y-3">
            {leadershipData.map((leader, idx) => (
                <div key={idx} className="p-3 bg-slate-800/30 rounded-lg border border-border/30">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div>
                            <span className="text-sm font-medium">{leader.full_name}</span>
                            <span className="text-xs text-muted-foreground ml-2">({leader.position})</span>
                        </div>
                        {leader.share_percent != null && <Badge variant="outline">Доля: {leader.share_percent}%</Badge>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {leader.email && (
                            <div>
                                <p className="text-muted-foreground">Email</p>
                                <p>{leader.email}</p>
                            </div>
                        )}
                        {leader.phone && (
                            <div>
                                <p className="text-muted-foreground">Телефон</p>
                                <p>{leader.phone}</p>
                            </div>
                        )}
                        {leader.passport && (
                            <div className="col-span-2">
                                <p className="text-muted-foreground">Паспорт</p>
                                <p className="font-mono">{leader.passport.series} {leader.passport.number}</p>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )

    return (
        <CollapsibleSection
            title="Руководство компании"
            icon={<Briefcase className="h-4 w-4" />}
            badge={leadershipData.length}
            className={className}
        >
            {content}
        </CollapsibleSection>
    )
}

// ============================================
// Licenses & SRO Section
// ============================================

interface LicensesSROSectionProps {
    licensesData: License[]
    variant?: 'card' | 'collapsible'
    className?: string
}

export function LicensesSROSection({
    licensesData,
    variant = 'collapsible',
    className
}: LicensesSROSectionProps) {
    if (!licensesData || licensesData.length === 0) return null

    const content = (
        <div className="space-y-3">
            {licensesData.map((license, idx) => (
                <div key={idx} className="p-2 bg-slate-800/30 rounded border border-border/30">
                    <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                        <span className="text-sm font-medium">{license.name}</span>
                        {license.type && <Badge variant="outline">{license.type}</Badge>}
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                        {license.number && <span>№ {license.number}</span>}
                        {license.issued_date && <span>от {license.issued_date}</span>}
                        {license.valid_until && <span>до {license.valid_until}</span>}
                    </div>
                </div>
            ))}
        </div>
    )

    return (
        <CollapsibleSection
            title="Лицензии и СРО"
            icon={<Award className="h-4 w-4" />}
            badge={licensesData.length}
            className={className}
        >
            {content}
        </CollapsibleSection>
    )
}

// ============================================
// Bank Accounts Section
// ============================================

interface BankAccountsSectionProps {
    bankAccountsData: BankAccount[]
    showAll?: boolean // If false, skip first account (primary is shown elsewhere)
    variant?: 'card' | 'collapsible'
    className?: string
}

export function BankAccountsSection({
    bankAccountsData,
    showAll = false,
    variant = 'collapsible',
    className
}: BankAccountsSectionProps) {
    const accounts = showAll ? bankAccountsData : bankAccountsData?.slice(1)
    
    if (!accounts || accounts.length === 0) return null

    const content = (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {accounts.map((account, idx) => (
                <div key={idx} className="p-3 bg-slate-800/30 rounded-lg border border-border/30">
                    <p className="text-sm font-medium mb-2">{account.bank_name}</p>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">БИК:</span>
                            <span className="font-mono">{account.bic || account.bank_bik}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Р/С:</span>
                            <span className="font-mono">{account.account}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )

    return (
        <CollapsibleSection
            title={showAll ? "Банковские счета" : "Дополнительные счета"}
            icon={<Landmark className="h-4 w-4" />}
            badge={accounts.length}
            className={className}
        >
            {content}
        </CollapsibleSection>
    )
}

// ============================================
// ETP Accounts Section
// ============================================

interface ETPAccountsSectionProps {
    etpAccountsData: ETPAccount[]
    variant?: 'card' | 'collapsible'
    className?: string
}

export function ETPAccountsSection({
    etpAccountsData,
    variant = 'collapsible',
    className
}: ETPAccountsSectionProps) {
    if (!etpAccountsData || etpAccountsData.length === 0) return null

    const content = (
        <div className="space-y-2">
            {etpAccountsData.map((etp, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <span className="text-sm">{etp.platform}</span>
                    {etp.account && <span className="font-mono text-xs bg-slate-700/50 px-2 py-0.5 rounded">{etp.account}</span>}
                </div>
            ))}
        </div>
    )

    return (
        <CollapsibleSection
            title="Аккаунты ЭТП"
            icon={<Globe className="h-4 w-4" />}
            badge={etpAccountsData.length}
            className={className}
        >
            {content}
        </CollapsibleSection>
    )
}

// ============================================
// Contact Persons Section
// ============================================

interface ContactPersonsSectionProps {
    contactPersonsData: ContactPerson[]
    variant?: 'card' | 'collapsible'
    className?: string
}

export function ContactPersonsSection({
    contactPersonsData,
    variant = 'collapsible',
    className
}: ContactPersonsSectionProps) {
    if (!contactPersonsData || contactPersonsData.length === 0) return null

    const content = (
        <div className="space-y-3">
            {contactPersonsData.map((person, idx) => (
                <div key={idx} className="p-2 bg-slate-800/30 rounded border border-border/30">
                    <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                        <span className="text-sm font-medium">
                            {[person.last_name, person.first_name, person.patronymic].filter(Boolean).join(' ')}
                        </span>
                        {person.position && <span className="text-xs text-muted-foreground">{person.position}</span>}
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                        {person.phone && (
                            <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />{person.phone}
                            </span>
                        )}
                        {person.email && (
                            <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />{person.email}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )

    return (
        <CollapsibleSection
            title="Контактные лица"
            icon={<Users className="h-4 w-4" />}
            badge={contactPersonsData.length}
            className={className}
        >
            {content}
        </CollapsibleSection>
    )
}

// ============================================
// Combined Company Extended Data Sections
// ============================================

interface CompanyExtendedDataProps {
    companyData: CompanyDataForPartner
    className?: string
}

export function CompanyExtendedDataSections({ companyData, className }: CompanyExtendedDataProps) {
    return (
        <div className={cn("space-y-3", className)}>
            <SignatoryMCHDSection companyData={companyData} />
            
            <FoundersPhysicalSection 
                foundersData={companyData.founders_data as PhysicalFounder[] || []} 
            />
            
            <FoundersLegalSection 
                legalFoundersData={companyData.legal_founders_data as LegalFounder[] || []} 
            />
            
            <LeadershipSection 
                leadershipData={companyData.leadership_data as Leader[] || []} 
            />
            
            <LicensesSROSection 
                licensesData={companyData.licenses_data as License[] || []} 
            />
            
            <BankAccountsSection 
                bankAccountsData={companyData.bank_accounts_data as BankAccount[] || []} 
                showAll={false}
            />
            
            <ETPAccountsSection 
                etpAccountsData={companyData.etp_accounts_data as ETPAccount[] || []} 
            />
            
            <ContactPersonsSection 
                contactPersonsData={companyData.contact_persons_data as ContactPerson[] || []} 
            />
        </div>
    )
}
