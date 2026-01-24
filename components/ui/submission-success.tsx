"use client"

import { useEffect, useState, useCallback } from "react"
import confetti from "canvas-confetti"
import { CheckCircle, Send, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface SubmissionSuccessProps {
    isVisible: boolean
    onComplete?: () => void
    submittedAt?: string
    statusDisplay?: string
}

/**
 * Animated success component for application submission
 * Shows confetti + animated checkmark when application is sent to bank
 */
export function SubmissionSuccess({ 
    isVisible, 
    onComplete,
    submittedAt,
    statusDisplay 
}: SubmissionSuccessProps) {
    const [showCheckmark, setShowCheckmark] = useState(false)
    const [showText, setShowText] = useState(false)
    const [animationComplete, setAnimationComplete] = useState(false)

    const fireConfetti = useCallback(() => {
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
    }, [])

    useEffect(() => {
        if (isVisible && !animationComplete) {
            // Start animation sequence
            const timer1 = setTimeout(() => {
                fireConfetti()
                setShowCheckmark(true)
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
    }, [isVisible, animationComplete, fireConfetti, onComplete])

    // Reset animation state when visibility changes
    useEffect(() => {
        if (!isVisible) {
            setShowCheckmark(false)
            setShowText(false)
            setAnimationComplete(false)
        }
    }, [isVisible])

    if (!isVisible) return null

    return (
        <div className="text-center py-8 [@media(max-height:820px)]:py-4">
            {/* Animated checkmark container */}
            <div className="relative mx-auto w-24 h-24 mb-6">
                {/* Glow effect */}
                <div 
                    className={cn(
                        "absolute inset-0 rounded-full bg-emerald-400/20 blur-xl transition-all duration-700",
                        showCheckmark ? "scale-150 opacity-100" : "scale-0 opacity-0"
                    )}
                />
                
                {/* Pulse rings */}
                <div 
                    className={cn(
                        "absolute inset-0 rounded-full border-2 border-emerald-400/30 transition-all duration-700",
                        showCheckmark ? "scale-[2] opacity-0" : "scale-100 opacity-100"
                    )}
                />
                <div 
                    className={cn(
                        "absolute inset-0 rounded-full border-2 border-emerald-400/20 transition-all duration-1000 delay-200",
                        showCheckmark ? "scale-[2.5] opacity-0" : "scale-100 opacity-100"
                    )}
                />
                
                {/* Main circle with checkmark */}
                <div 
                    className={cn(
                        "relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-[#3CE8D1] flex items-center justify-center transition-all duration-500",
                        showCheckmark 
                            ? "scale-100 opacity-100 rotate-0" 
                            : "scale-0 opacity-0 -rotate-180"
                    )}
                >
                    <CheckCircle className="h-12 w-12 text-white" strokeWidth={2.5} />
                </div>

                {/* Sparkles */}
                <Sparkles 
                    className={cn(
                        "absolute -top-2 -right-2 h-6 w-6 text-yellow-400 transition-all duration-500 delay-300",
                        showCheckmark ? "scale-100 opacity-100" : "scale-0 opacity-0"
                    )}
                />
                <Sparkles 
                    className={cn(
                        "absolute -bottom-1 -left-3 h-5 w-5 text-[#3CE8D1] transition-all duration-500 delay-500",
                        showCheckmark ? "scale-100 opacity-100" : "scale-0 opacity-0"
                    )}
                />
            </div>

            {/* Text content */}
            <div 
                className={cn(
                    "transition-all duration-500",
                    showText ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
            >
                <h3 className="text-2xl font-bold text-white mb-2">
                    Заявка отправлена!
                </h3>
                <p className="text-[#94a3b8] mb-4 flex items-center justify-center gap-2">
                    <Send className="h-4 w-4" />
                    {statusDisplay || "На рассмотрении в банке"}
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
