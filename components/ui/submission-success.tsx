"use client"

import { useEffect, useState, useCallback } from "react"
import confetti from "canvas-confetti"
import { 
    CheckCircle, 
    Send, 
    Sparkles, 
    Clock, 
    AlertTriangle,
    XCircle,
    RefreshCw,
    PartyPopper,
    Trophy,
    FileCheck
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { DjangoApplicationStatus } from "@/lib/status-mapping"

// Effect types for different statuses
export type StatusEffectType = 
    | 'success'      // approved, won - confetti + green
    | 'sent'         // pending, in_review - blue pulse
    | 'warning'      // info_requested - yellow alert
    | 'rejected'     // rejected, lost - red
    | 'neutral'      // draft - no effect

interface StatusEffectConfig {
    type: StatusEffectType
    icon: React.ReactNode
    title: string
    description: string
    primaryColor: string
    bgGlow: string
    showConfetti: boolean
}

// Map Django status to effect configuration
export function getStatusEffectConfig(status: DjangoApplicationStatus): StatusEffectConfig {
    switch (status) {
        case 'approved':
            return {
                type: 'success',
                icon: <CheckCircle className="h-12 w-12 text-white" strokeWidth={2.5} />,
                title: 'Заявка одобрена!',
                description: 'Поздравляем! Заявка успешно одобрена банком.',
                primaryColor: 'from-emerald-400 to-[#3CE8D1]',
                bgGlow: 'bg-emerald-400/20',
                showConfetti: true,
            }
        case 'won':
            return {
                type: 'success',
                icon: <Trophy className="h-12 w-12 text-white" strokeWidth={2.5} />,
                title: 'Продукт выдан!',
                description: 'Поздравляем! Продукт успешно оформлен.',
                primaryColor: 'from-[#3CE8D1] to-emerald-400',
                bgGlow: 'bg-[#3CE8D1]/20',
                showConfetti: true,
            }
        case 'pending':
            return {
                type: 'sent',
                icon: <Send className="h-12 w-12 text-white" strokeWidth={2} />,
                title: 'Заявка отправлена на скорринг',
                description: 'На скорринге в банке.',
                primaryColor: 'from-amber-400 to-orange-400',
                bgGlow: 'bg-amber-400/20',
                showConfetti: false,
            }
        case 'in_review':
            return {
                type: 'sent',
                icon: <FileCheck className="h-12 w-12 text-white" strokeWidth={2} />,
                title: 'На рассмотрении',
                description: 'Заявка находится на рассмотрении в банке.',
                primaryColor: 'from-blue-400 to-indigo-500',
                bgGlow: 'bg-blue-400/20',
                showConfetti: false,
            }
        case 'info_requested':
            return {
                type: 'warning',
                icon: <AlertTriangle className="h-12 w-12 text-white" strokeWidth={2} />,
                title: 'Требуется доработка',
                description: 'Банк запросил дополнительную информацию. Внесите изменения и отправьте повторно.',
                primaryColor: 'from-yellow-400 to-amber-500',
                bgGlow: 'bg-yellow-400/20',
                showConfetti: false,
            }
        case 'rejected':
            return {
                type: 'rejected',
                icon: <XCircle className="h-12 w-12 text-white" strokeWidth={2} />,
                title: 'Заявка отклонена',
                description: 'К сожалению, банк не одобрил данную заявку.',
                primaryColor: 'from-rose-500 to-red-600',
                bgGlow: 'bg-rose-500/20',
                showConfetti: false,
            }
        case 'lost':
            return {
                type: 'rejected',
                icon: <XCircle className="h-12 w-12 text-white" strokeWidth={2} />,
                title: 'Не выдан',
                description: 'Продукт не был оформлен.',
                primaryColor: 'from-orange-500 to-red-500',
                bgGlow: 'bg-orange-500/20',
                showConfetti: false,
            }
        default:
            return {
                type: 'neutral',
                icon: <Clock className="h-12 w-12 text-white" strokeWidth={2} />,
                title: 'Создание заявки',
                description: 'Заполните все поля и отправьте заявку.',
                primaryColor: 'from-slate-400 to-slate-500',
                bgGlow: 'bg-slate-400/20',
                showConfetti: false,
            }
    }
}

interface StatusEffectProps {
    status: DjangoApplicationStatus
    isVisible: boolean
    isAnimated?: boolean
    onComplete?: () => void
    submittedAt?: string
    statusDisplay?: string
    compact?: boolean
}

/**
 * Status-aware effect component with animations
 * Shows different effects based on application status
 */
export function StatusEffect({ 
    status,
    isVisible, 
    isAnimated = true,
    onComplete,
    submittedAt,
    statusDisplay,
    compact = false
}: StatusEffectProps) {
    const [showIcon, setShowIcon] = useState(!isAnimated)
    const [showText, setShowText] = useState(!isAnimated)
    const [animationComplete, setAnimationComplete] = useState(!isAnimated)

    const config = getStatusEffectConfig(status)

    const fireConfetti = useCallback(() => {
        if (!config.showConfetti) return

        // Main burst from center
        const count = 200
        const defaults = {
            origin: { y: 0.7 },
            zIndex: 9999,
        }

        function fire(particleRatio: number, opts: confetti.Options) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio),
            })
        }

        // Multiple bursts for better effect
        fire(0.25, {
            spread: 26,
            startVelocity: 55,
            colors: ['#3CE8D1', '#4F7DF3', '#22c55e'],
        })
        fire(0.2, {
            spread: 60,
            colors: ['#3CE8D1', '#22c55e', '#10b981'],
        })
        fire(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8,
            colors: ['#3CE8D1', '#4F7DF3', '#22c55e', '#10b981'],
        })
        fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2,
            colors: ['#FFD93D', '#3CE8D1'],
        })
        fire(0.1, {
            spread: 120,
            startVelocity: 45,
            colors: ['#3CE8D1', '#22c55e'],
        })
    }, [config.showConfetti])

    useEffect(() => {
        if (isVisible && isAnimated && !animationComplete) {
            // Start animation sequence
            const timer1 = setTimeout(() => {
                if (config.showConfetti) {
                    fireConfetti()
                }
                setShowIcon(true)
            }, 100)

            const timer2 = setTimeout(() => {
                setShowText(true)
            }, 600)

            const timer3 = setTimeout(() => {
                setAnimationComplete(true)
                onComplete?.()
            }, 2000)

            return () => {
                clearTimeout(timer1)
                clearTimeout(timer2)
                clearTimeout(timer3)
            }
        }
    }, [isVisible, isAnimated, animationComplete, fireConfetti, onComplete, config.showConfetti])

    // Reset animation state when visibility changes
    useEffect(() => {
        if (!isVisible && isAnimated) {
            setShowIcon(false)
            setShowText(false)
            setAnimationComplete(false)
        }
    }, [isVisible, isAnimated])

    if (!isVisible) return null

    const iconSize = compact ? "w-16 h-16" : "w-24 h-24"
    const iconInnerSize = compact ? "w-16 h-16" : "w-24 h-24"
    const innerIconClass = compact ? "h-8 w-8" : "h-12 w-12"

    return (
        <div className={cn(
            "text-center",
            compact ? "py-4" : "py-8 [@media(max-height:820px)]:py-4"
        )}>
            {/* Animated icon container */}
            <div className={cn("relative mx-auto mb-6", iconSize)}>
                {/* Glow effect */}
                <div 
                    className={cn(
                        "absolute inset-0 rounded-full blur-xl transition-all duration-700",
                        config.bgGlow,
                        showIcon ? "scale-150 opacity-100" : "scale-0 opacity-0"
                    )}
                />
                
                {/* Pulse rings - different for each type */}
                {config.type === 'sent' && (
                    <>
                        <div 
                            className={cn(
                                "absolute inset-0 rounded-full border-2 border-blue-400/40 animate-ping",
                                showIcon ? "opacity-100" : "opacity-0"
                            )}
                        />
                        <div 
                            className={cn(
                                "absolute inset-0 rounded-full border-2 border-blue-400/20 animate-pulse",
                                showIcon ? "opacity-100" : "opacity-0"
                            )}
                        />
                    </>
                )}
                
                {config.type === 'warning' && (
                    <>
                        <div 
                            className={cn(
                                "absolute inset-0 rounded-full border-2 border-yellow-400/40 animate-pulse",
                                showIcon ? "opacity-100" : "opacity-0"
                            )}
                        />
                    </>
                )}
                
                {config.type === 'success' && (
                    <>
                        <div 
                            className={cn(
                                "absolute inset-0 rounded-full border-2 border-emerald-400/30 transition-all duration-700",
                                showIcon ? "scale-[2] opacity-0" : "scale-100 opacity-100"
                            )}
                        />
                        <div 
                            className={cn(
                                "absolute inset-0 rounded-full border-2 border-emerald-400/20 transition-all duration-1000 delay-200",
                                showIcon ? "scale-[2.5] opacity-0" : "scale-100 opacity-100"
                            )}
                        />
                    </>
                )}
                
                {/* Main circle with icon */}
                <div 
                    className={cn(
                        "relative rounded-full bg-gradient-to-br flex items-center justify-center transition-all duration-500",
                        config.primaryColor,
                        iconInnerSize,
                        isAnimated
                            ? showIcon 
                                ? "scale-100 opacity-100 rotate-0" 
                                : "scale-0 opacity-0 -rotate-180"
                            : "scale-100 opacity-100"
                    )}
                >
                    {config.icon}
                </div>

                {/* Sparkles for success */}
                {config.type === 'success' && (
                    <>
                        <Sparkles 
                            className={cn(
                                "absolute -top-2 -right-2 h-6 w-6 text-yellow-400 transition-all duration-500 delay-300",
                                showIcon ? "scale-100 opacity-100" : "scale-0 opacity-0"
                            )}
                        />
                        <Sparkles 
                            className={cn(
                                "absolute -bottom-1 -left-3 h-5 w-5 text-[#3CE8D1] transition-all duration-500 delay-500",
                                showIcon ? "scale-100 opacity-100" : "scale-0 opacity-0"
                            )}
                        />
                        <PartyPopper 
                            className={cn(
                                "absolute top-0 -left-4 h-5 w-5 text-amber-400 transition-all duration-500 delay-400",
                                showIcon ? "scale-100 opacity-100" : "scale-0 opacity-0"
                            )}
                        />
                    </>
                )}

                {/* Refresh icon for warning */}
                {config.type === 'warning' && (
                    <RefreshCw 
                        className={cn(
                            "absolute -bottom-1 -right-2 h-5 w-5 text-yellow-400 transition-all duration-500 delay-300 animate-spin",
                            showIcon ? "scale-100 opacity-100" : "scale-0 opacity-0"
                        )}
                        style={{ animationDuration: '3s' }}
                    />
                )}
            </div>

            {/* Text content */}
            <div 
                className={cn(
                    "transition-all duration-500",
                    isAnimated
                        ? showText ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                        : "opacity-100"
                )}
            >
                <h3 className={cn(
                    "font-bold text-white mb-2",
                    compact ? "text-xl" : "text-2xl"
                )}>
                    {config.type === 'success' && '🎉 '}{config.title}
                </h3>
                <p className="text-[#94a3b8] mb-4 flex items-center justify-center gap-2">
                    {statusDisplay || config.description}
                </p>
                {submittedAt && (
                    <p className="text-sm text-[#94a3b8]">
                        Отправлено: {new Date(submittedAt).toLocaleString('ru-RU')}
                    </p>
                )}
            </div>
        </div>
    )
}

// Legacy component for backward compatibility
interface SubmissionSuccessProps {
    isVisible: boolean
    onComplete?: () => void
    submittedAt?: string
    statusDisplay?: string
}

/**
 * @deprecated Use StatusEffect component instead
 * Kept for backward compatibility
 */
export function SubmissionSuccess({ 
    isVisible, 
    onComplete,
    submittedAt,
    statusDisplay 
}: SubmissionSuccessProps) {
    return (
        <StatusEffect
            status="in_review"
            isVisible={isVisible}
            isAnimated={true}
            onComplete={onComplete}
            submittedAt={submittedAt}
            statusDisplay={statusDisplay}
        />
    )
}

/**
 * Hook to trigger submission success animation
 */
export function useSubmissionSuccess() {
    const [isAnimating, setIsAnimating] = useState(false)
    const [hasPlayed, setHasPlayed] = useState(false)

    const triggerAnimation = useCallback(() => {
        if (!hasPlayed) {
            setIsAnimating(true)
            setHasPlayed(true)
        }
    }, [hasPlayed])

    const resetAnimation = useCallback(() => {
        setIsAnimating(false)
        setHasPlayed(false)
    }, [])

    return {
        isAnimating,
        hasPlayed,
        triggerAnimation,
        resetAnimation,
    }
}

/**
 * Hook for status-based effects
 */
export function useStatusEffect() {
    const [currentStatus, setCurrentStatus] = useState<DjangoApplicationStatus | null>(null)
    const [isAnimating, setIsAnimating] = useState(false)
    const [hasAnimated, setHasAnimated] = useState<Set<DjangoApplicationStatus>>(new Set())

    const triggerEffect = useCallback((status: DjangoApplicationStatus) => {
        // Only animate if this status hasn't been animated yet
        if (!hasAnimated.has(status)) {
            setCurrentStatus(status)
            setIsAnimating(true)
            setHasAnimated(prev => new Set([...prev, status]))
        }
    }, [hasAnimated])

    const onEffectComplete = useCallback(() => {
        setIsAnimating(false)
    }, [])

    const resetEffects = useCallback(() => {
        setCurrentStatus(null)
        setIsAnimating(false)
        setHasAnimated(new Set())
    }, [])

    return {
        currentStatus,
        isAnimating,
        triggerEffect,
        onEffectComplete,
        resetEffects,
    }
}
