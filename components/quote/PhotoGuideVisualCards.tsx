'use client'

import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type CardKind = 'single' | 'background' | 'framing' | 'lighting'

type CardCopy = {
    id: CardKind
    title: string
    badLabel: string
    goodLabel: string
    /** 왜 중요한지 — 가이드 페이지에서만 표시 */
    tip?: string
}

type Props = {
    cards: CardCopy[]
    compact?: boolean
    className?: string
    badBadge?: string
    goodBadge?: string
}

/** 카메라 뷰파인더 코너 */
function ViewfinderCorners({ tone }: { tone: 'bad' | 'good' }) {
    const c = tone === 'good' ? '#5eead4' : '#fca5a5'
    return (
        <g opacity="0.55" stroke={c} strokeWidth="1.5" fill="none">
            <path d="M14 28 V18 H24" />
            <path d="M146 28 V18 H136" />
            <path d="M14 72 V82 H24" />
            <path d="M146 72 V82 H136" />
        </g>
    )
}

/** ① 한 장 = 물체 하나 — L자 브라켓 */
function IllustSingle({ good }: { good: boolean }) {
    const uid = good ? 'g' : 'b'
    if (good) {
        return (
            <svg viewBox="0 0 160 100" className="w-full h-auto" aria-hidden>
                <defs>
                    <linearGradient id={`pg-sg-bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f8fafc" />
                        <stop offset="100%" stopColor="#e2e8f0" />
                    </linearGradient>
                    <linearGradient id={`pg-sg-part-${uid}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#5eead4" />
                        <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                </defs>
                <rect width="160" height="100" rx="12" fill="#0b1220" />
                <rect x="10" y="10" width="140" height="80" rx="8" fill={`url(#pg-sg-bg-${uid})`} />
                <ellipse cx="80" cy="78" rx="34" ry="5" fill="#94a3b8" opacity="0.35" />
                <path
                    d="M52 72 V38 H72 V48 H88 V72 Z"
                    fill={`url(#pg-sg-part-${uid})`}
                    stroke="#0f766e"
                    strokeWidth="1.4"
                />
                <circle cx="62" cy="58" r="3.2" fill="#ccfbf1" />
                <circle cx="80" cy="62" r="3.2" fill="#ccfbf1" />
                <ViewfinderCorners tone="good" />
            </svg>
        )
    }
    return (
        <svg viewBox="0 0 160 100" className="w-full h-auto" aria-hidden>
            <rect width="160" height="100" rx="12" fill="#1a0c0c" />
            <rect x="10" y="10" width="140" height="80" rx="8" fill="#2a1515" />
            <path d="M30 74 L40 44 L54 74 Z" fill="#f87171" />
            <rect x="52" y="48" width="20" height="20" rx="2.5" fill="#fb7185" />
            <circle cx="92" cy="56" r="11" fill="#f43f5e" />
            <path d="M104 76 L116 48 L132 76 Z" fill="#e11d48" opacity="0.9" />
            <rect x="68" y="68" width="16" height="10" rx="1.5" fill="#fda4af" opacity="0.85" />
            <ellipse cx="48" cy="78" rx="9" ry="4" fill="#fecdd3" opacity="0.45" />
            <path
                d="M44 52 Q70 40 96 52"
                stroke="#fecaca"
                strokeWidth="1.2"
                strokeDasharray="3 2"
                fill="none"
                opacity="0.7"
            />
            <ViewfinderCorners tone="bad" />
        </svg>
    )
}

/** ② 배경 단순 */
function IllustBackground({ good }: { good: boolean }) {
    const uid = good ? 'g' : 'b'
    if (good) {
        return (
            <svg viewBox="0 0 160 100" className="w-full h-auto" aria-hidden>
                <defs>
                    <linearGradient id={`pg-bg-g-${uid}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#f1f5f9" />
                    </linearGradient>
                </defs>
                <rect width="160" height="100" rx="12" fill="#0b1220" />
                <rect x="10" y="10" width="140" height="80" rx="8" fill={`url(#pg-bg-g-${uid})`} />
                <ellipse cx="80" cy="76" rx="30" ry="5" fill="#cbd5e1" opacity="0.5" />
                <rect
                    x="58"
                    y="34"
                    width="44"
                    height="38"
                    rx="5"
                    fill="#38bdf8"
                    stroke="#0284c7"
                    strokeWidth="1.4"
                />
                <path d="M58 42 H102" stroke="#7dd3fc" strokeWidth="1" opacity="0.7" />
                <ViewfinderCorners tone="good" />
            </svg>
        )
    }
    return (
        <svg viewBox="0 0 160 100" className="w-full h-auto" aria-hidden>
            <rect width="160" height="100" rx="12" fill="#1a0c0c" />
            <rect x="10" y="10" width="140" height="80" rx="8" fill="#3b2416" />
            <rect x="18" y="18" width="16" height="26" rx="2" fill="#78716c" opacity="0.75" />
            <rect x="38" y="22" width="11" height="18" rx="1" fill="#a8a29e" opacity="0.55" />
            <circle cx="128" cy="28" r="9" fill="#57534e" opacity="0.65" />
            <path d="M22 86 Q80 58 138 86" stroke="#57534e" strokeWidth="10" fill="none" opacity="0.35" />
            <rect x="64" y="40" width="32" height="28" rx="4" fill="#f87171" opacity="0.9" />
            <path
                d="M122 80 C120 62 108 54 98 56 C90 46 80 52 82 64 L86 88 Z"
                fill="#a16207"
                opacity="0.65"
            />
            <ViewfinderCorners tone="bad" />
        </svg>
    )
}

/** ③ 프레이밍 */
function IllustFraming({ good }: { good: boolean }) {
    const uid = good ? 'g' : 'b'
    if (good) {
        return (
            <svg viewBox="0 0 160 100" className="w-full h-auto" aria-hidden>
                <defs>
                    <linearGradient id={`pg-fr-g-${uid}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f8fafc" />
                        <stop offset="100%" stopColor="#e2e8f0" />
                    </linearGradient>
                </defs>
                <rect width="160" height="100" rx="12" fill="#0b1220" />
                <rect
                    x="10"
                    y="10"
                    width="140"
                    height="80"
                    rx="8"
                    fill={`url(#pg-fr-g-${uid})`}
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="4 3"
                />
                <rect
                    x="28"
                    y="22"
                    width="104"
                    height="60"
                    rx="4"
                    fill="none"
                    stroke="#a78bfa"
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                    opacity="0.45"
                />
                <path
                    d="M54 70 L64 34 L96 34 L106 70 Z"
                    fill="#a78bfa"
                    stroke="#7c3aed"
                    strokeWidth="1.4"
                />
                <circle cx="80" cy="28" r="7" fill="#8b5cf6" />
                <text x="80" y="88" textAnchor="middle" fill="#64748b" fontSize="7" fontWeight="700">
                    60–80%
                </text>
                <ViewfinderCorners tone="good" />
            </svg>
        )
    }
    return (
        <svg viewBox="0 0 160 100" className="w-full h-auto" aria-hidden>
            <rect width="160" height="100" rx="12" fill="#1a0c0c" />
            <rect x="10" y="10" width="140" height="80" rx="8" fill="#2a1515" />
            <path d="M36 100 L52 8 L108 8 L124 100" fill="#f87171" opacity="0.92" />
            <rect x="0" y="0" width="160" height="16" fill="#1a0c0c" />
            <rect x="0" y="84" width="160" height="16" fill="#1a0c0c" />
            <rect x="48" y="4" width="64" height="14" rx="4" fill="#7f1d1d" />
            <text x="80" y="14" textAnchor="middle" fill="#fecaca" fontSize="8" fontWeight="800">
                CROP
            </text>
            <ViewfinderCorners tone="bad" />
        </svg>
    )
}

/** ④ 조명 */
function IllustLighting({ good }: { good: boolean }) {
    const uid = good ? 'g' : 'b'
    if (good) {
        return (
            <svg viewBox="0 0 160 100" className="w-full h-auto" aria-hidden>
                <defs>
                    <radialGradient id={`pg-lt-sun-${uid}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#fde68a" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id={`pg-lt-bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fffbeb" />
                        <stop offset="100%" stopColor="#fef3c7" />
                    </linearGradient>
                </defs>
                <rect width="160" height="100" rx="12" fill="#0b1220" />
                <rect x="10" y="10" width="140" height="80" rx="8" fill={`url(#pg-lt-bg-${uid})`} />
                <circle cx="126" cy="26" r="18" fill={`url(#pg-lt-sun-${uid})`} />
                <circle cx="126" cy="26" r="7" fill="#fbbf24" />
                <g stroke="#fcd34d" strokeWidth="1.5" opacity="0.7">
                    <line x1="126" y1="10" x2="126" y2="4" />
                    <line x1="140" y1="26" x2="148" y2="26" />
                    <line x1="138" y1="14" x2="144" y2="8" />
                </g>
                <ellipse cx="80" cy="76" rx="28" ry="5" fill="#fbbf24" opacity="0.3" />
                <path
                    d="M58 70 L68 38 L92 38 L102 70 Z"
                    fill="#f59e0b"
                    stroke="#b45309"
                    strokeWidth="1.4"
                />
                <ViewfinderCorners tone="good" />
            </svg>
        )
    }
    return (
        <svg viewBox="0 0 160 100" className="w-full h-auto" aria-hidden>
            <defs>
                <filter id={`pg-lt-blur-${uid}`}>
                    <feGaussianBlur stdDeviation="1.8" />
                </filter>
            </defs>
            <rect width="160" height="100" rx="12" fill="#050505" />
            <rect x="10" y="10" width="140" height="80" rx="8" fill="#121212" />
            <path
                d="M58 70 L68 38 L92 38 L102 70 Z"
                fill="#525252"
                opacity="0.4"
                filter={`url(#pg-lt-blur-${uid})`}
            />
            <ellipse cx="80" cy="54" rx="40" ry="24" fill="#000" opacity="0.45" />
            <rect x="48" y="84" width="64" height="12" rx="4" fill="#262626" />
            <text x="80" y="93" textAnchor="middle" fill="#737373" fontSize="7" fontWeight="800">
                DARK / BLUR
            </text>
            <ViewfinderCorners tone="bad" />
        </svg>
    )
}

function Illustration({ kind, good }: { kind: CardKind; good: boolean }) {
    switch (kind) {
        case 'single':
            return <IllustSingle good={good} />
        case 'background':
            return <IllustBackground good={good} />
        case 'framing':
            return <IllustFraming good={good} />
        case 'lighting':
            return <IllustLighting good={good} />
    }
}

function CompareCard({
    card,
    compact,
    badBadge,
    goodBadge,
}: {
    card: CardCopy
    compact?: boolean
    badBadge: string
    goodBadge: string
}) {
    return (
        <article
            className={cn(
                'group shrink-0 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] overflow-hidden transition-all duration-300',
                'hover:border-indigo-400/30 hover:shadow-[0_12px_40px_-16px_rgba(99,102,241,0.45)]',
                compact ? 'w-[260px] sm:w-auto sm:min-w-0 sm:flex-1' : 'w-full'
            )}
        >
            <div className="px-3.5 pt-3.5 pb-2">
                <p className="text-[12px] sm:text-[13px] font-black text-white tracking-tight break-keep leading-snug">
                    {card.title}
                </p>
            </div>

            <div className="relative grid grid-cols-2 gap-2 px-2.5 pb-2">
                <div className="relative rounded-xl overflow-hidden border border-red-400/30 bg-red-500/[0.06] transition-colors group-hover:border-red-400/45">
                    <div className="absolute top-1.5 left-1.5 z-10 inline-flex items-center gap-0.5 rounded-md bg-red-500/90 px-1.5 py-0.5 text-[9px] font-black text-white shadow-sm">
                        <X className="w-2.5 h-2.5" strokeWidth={3} />
                        {badBadge}
                    </div>
                    <Illustration kind={card.id} good={false} />
                    <div className="px-2 py-1.5 border-t border-red-400/15">
                        <span className="text-[10px] font-bold text-red-200/95 leading-tight break-keep block">
                            {card.badLabel}
                        </span>
                    </div>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-teal-400/35 bg-teal-500/[0.07] transition-colors group-hover:border-teal-400/55">
                    <div className="absolute top-1.5 left-1.5 z-10 inline-flex items-center gap-0.5 rounded-md bg-teal-400 px-1.5 py-0.5 text-[9px] font-black text-slate-950 shadow-sm">
                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                        {goodBadge}
                    </div>
                    <Illustration kind={card.id} good={true} />
                    <div className="px-2 py-1.5 border-t border-teal-400/15">
                        <span className="text-[10px] font-bold text-teal-100 leading-tight break-keep block">
                            {card.goodLabel}
                        </span>
                    </div>
                </div>

                <div
                    className="pointer-events-none absolute left-1/2 top-[42%] z-20 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-slate-950/90 text-[8px] font-black text-white/70 shadow-lg"
                    aria-hidden
                >
                    VS
                </div>
            </div>

            {card.tip && !compact && (
                <p className="mx-3 mb-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-[11px] font-bold leading-relaxed text-white/55 break-keep">
                    <span className="text-indigo-300/90">Tip · </span>
                    {card.tip}
                </p>
            )}
        </article>
    )
}

/**
 * 사진→3D 촬영 가이드 — 굿/배드 대비 일러스트 카드
 * compact: 업로드 패널용 가로 스크롤
 */
export function PhotoGuideVisualCards({
    cards,
    compact = false,
    className,
    badBadge = 'BAD',
    goodBadge = 'GOOD',
}: Props) {
    if (compact) {
        return (
            <div
                className={cn(
                    'flex gap-2.5 overflow-x-auto overscroll-x-contain pb-1 -mx-0.5 px-0.5 sm:grid sm:grid-cols-2 sm:overflow-visible',
                    className
                )}
            >
                {cards.map((card) => (
                    <CompareCard
                        key={card.id}
                        card={card}
                        compact
                        badBadge={badBadge}
                        goodBadge={goodBadge}
                    />
                ))}
            </div>
        )
    }

    return (
        <div className={cn('grid gap-4 sm:grid-cols-2', className)}>
            {cards.map((card) => (
                <CompareCard
                    key={card.id}
                    card={card}
                    badBadge={badBadge}
                    goodBadge={goodBadge}
                />
            ))}
        </div>
    )
}
