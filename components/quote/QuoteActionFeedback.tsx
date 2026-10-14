'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle, HardDrive, Save, ShoppingCart, X } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

/** 견적 화면 저장·장바구니 결과 안내 — 화면 가운데(모바일은 하단 시트)에 크게 표시 */
export type QuoteFeedbackKind = 'cart' | 'saved' | 'savedLocal' | 'error'

export type QuoteFeedbackAction = {
    label: string
    href?: string
    onClick?: () => void
    primary?: boolean
}

export type QuoteFeedback = {
    id: number
    kind: QuoteFeedbackKind
    title: string
    description?: string
    /** 금액 강조 줄 (예: "FDM 견적 금액" / "₩22,000") */
    highlight?: { label: string; value: string }
    actions?: QuoteFeedbackAction[]
}

/** 자동 닫힘 시간(ms) — 버튼이 있으면 읽고 누를 시간을 더 줌 */
function resolveDuration(feedback: QuoteFeedback) {
    if (feedback.kind === 'error') return 6000
    return feedback.actions?.length ? 5000 : 3000
}

const KIND_STYLE: Record<QuoteFeedbackKind, { icon: typeof Save; ring: string; iconWrap: string; bar: string }> = {
    cart: {
        icon: ShoppingCart,
        ring: 'border-emerald-400/40',
        iconWrap: 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30',
        bar: 'bg-emerald-400',
    },
    saved: {
        icon: Save,
        ring: 'border-sky-400/40',
        iconWrap: 'bg-sky-400/15 text-sky-300 ring-sky-400/30',
        bar: 'bg-sky-400',
    },
    savedLocal: {
        icon: HardDrive,
        ring: 'border-amber-400/40',
        iconWrap: 'bg-amber-400/15 text-amber-300 ring-amber-400/30',
        bar: 'bg-amber-400',
    },
    error: {
        icon: AlertTriangle,
        ring: 'border-rose-400/50',
        iconWrap: 'bg-rose-500/15 text-rose-300 ring-rose-400/30',
        bar: 'bg-rose-400',
    },
}

type Props = {
    feedback: QuoteFeedback | null
    onClose: () => void
    closeLabel: string
}

export default function QuoteActionFeedback({ feedback, onClose, closeLabel }: Props) {
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    if (!mounted) return null
    return createPortal(
        <AnimatePresence>
            {feedback && (
                <FeedbackCard key={feedback.id} feedback={feedback} onClose={onClose} closeLabel={closeLabel} />
            )}
        </AnimatePresence>,
        document.body
    )
}

function FeedbackCard({ feedback, onClose, closeLabel }: { feedback: QuoteFeedback; onClose: () => void; closeLabel: string }) {
    const reduceMotion = useReducedMotion()
    const duration = resolveDuration(feedback)
    const style = KIND_STYLE[feedback.kind]
    const Icon = style.icon
    const [paused, setPaused] = useState(false)
    const remainingRef = useRef(duration)
    const startedAtRef = useRef(0)
    const firstButtonRef = useRef<HTMLElement | null>(null)
    const onCloseRef = useRef(onClose)
    onCloseRef.current = onClose

    // 자동 닫힘 — 마우스를 올리거나 키보드로 조작 중이면 멈춤
    useEffect(() => {
        if (paused) return
        startedAtRef.current = Date.now()
        const timer = window.setTimeout(() => onCloseRef.current(), remainingRef.current)
        return () => {
            window.clearTimeout(timer)
            remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current))
        }
    }, [paused])

    // ESC로 닫기 + 열릴 때 첫 버튼으로 포커스, 닫힐 때 이전 포커스 복원
    useEffect(() => {
        const prevFocused = document.activeElement as HTMLElement | null
        firstButtonRef.current?.focus({ preventScroll: true })
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCloseRef.current()
        }
        window.addEventListener('keydown', onKey)
        return () => {
            window.removeEventListener('keydown', onKey)
            prevFocused?.focus?.({ preventScroll: true })
        }
    }, [])

    const setFirstRef = useCallback((index: number) => (el: HTMLElement | null) => {
        if (index === 0) firstButtonRef.current = el
    }, [])

    const actions = feedback.actions ?? []

    return (
        <motion.div
            className="fixed inset-0 z-[200] flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
        >
            <motion.div
                role={feedback.kind === 'error' ? 'alertdialog' : 'status'}
                aria-live={feedback.kind === 'error' ? 'assertive' : 'polite'}
                aria-labelledby={`quote-feedback-title-${feedback.id}`}
                className={cn(
                    'relative w-full overflow-hidden border bg-slate-900/95 text-white shadow-[0_30px_80px_rgba(0,0,0,0.55)]',
                    'rounded-t-3xl px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-7',
                    'sm:w-[min(92vw,440px)] sm:rounded-3xl sm:px-8 sm:pb-7 sm:pt-8',
                    style.ring
                )}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onKeyDown={(e) => {
                    if (e.key !== 'Escape') setPaused(true)
                }}
            >
                <button
                    type="button"
                    aria-label={closeLabel}
                    className="absolute right-3 top-3 rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                    onClick={onClose}
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className={cn('mb-4 flex h-16 w-16 items-center justify-center rounded-full ring-1', style.iconWrap)}>
                        <Icon className="h-8 w-8" />
                    </div>
                    <h2 id={`quote-feedback-title-${feedback.id}`} className="text-xl font-black tracking-tight break-keep">
                        {feedback.title}
                    </h2>
                    {feedback.description && (
                        <p className="mt-2 text-[15px] leading-relaxed text-white/75 break-keep">{feedback.description}</p>
                    )}
                    {feedback.highlight && (
                        <div className="mt-4 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                            <span className="text-[13px] font-bold text-white/60">{feedback.highlight.label}</span>
                            <span className="font-mono text-lg font-black text-white">{feedback.highlight.value}</span>
                        </div>
                    )}
                </div>

                {actions.length > 0 && (
                    <div className={cn('mt-6 grid gap-2.5', actions.length > 1 && 'sm:grid-cols-2')}>
                        {actions.map((action, i) => {
                            const className = cn(
                                'flex h-12 items-center justify-center rounded-2xl px-4 text-[14px] font-black transition-all active:scale-[0.98]',
                                action.primary
                                    ? 'bg-white text-slate-950 hover:bg-white/90'
                                    : 'border border-white/20 bg-white/5 text-white hover:bg-white/10'
                            )
                            if (action.href) {
                                return (
                                    <Link key={action.label} ref={setFirstRef(i)} href={action.href} className={className} onClick={onClose}>
                                        {action.label}
                                    </Link>
                                )
                            }
                            return (
                                <button
                                    key={action.label}
                                    ref={setFirstRef(i)}
                                    type="button"
                                    className={className}
                                    onClick={() => {
                                        onClose()
                                        action.onClick?.()
                                    }}
                                >
                                    {action.label}
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* 남은 표시 시간 */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/5">
                    <div
                        className={cn('h-full origin-left', style.bar)}
                        style={{
                            animation: `quote-feedback-progress ${duration}ms linear forwards`,
                            animationPlayState: paused ? 'paused' : 'running',
                        }}
                    />
                </div>
                <style>{`@keyframes quote-feedback-progress { from { transform: scaleX(1); } to { transform: scaleX(0); } }`}</style>
            </motion.div>
        </motion.div>
    )
}
