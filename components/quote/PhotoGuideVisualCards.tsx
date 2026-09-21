'use client'

import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type CardKind = 'single' | 'background' | 'framing' | 'lighting'

type CardCopy = {
    id: CardKind
    title: string
    badLabel: string
    goodLabel: string
}

type Props = {
    cards: CardCopy[]
    compact?: boolean
    className?: string
}

/** 한 장에 여러 물체 vs 단일 물체 */
function IllustSingle({ good }: { good: boolean }) {
    if (good) {
        return (
            <svg viewBox="0 0 160 100" className="w-full h-auto" aria-hidden>
                <rect width="160" height="100" rx="10" fill="#0f172a" />
                <rect x="8" y="8" width="144" height="84" rx="6" fill="#f1f5f9" />
                <ellipse cx="80" cy="72" rx="28" ry="6" fill="#cbd5e1" opacity="0.55" />
                <path
                    d="M58 68 L68 38 L92 38 L102 68 Z"
                    fill="#2dd4bf"
                    stroke="#0f766e"
                    strokeWidth="1.5"
                />
                <rect x="72" y="28" width="16" height="12" rx="2" fill="#14b8a6" />
            </svg>
        )
    }
    return (
        <svg viewBox="0 0 160 100" className="w-full h-auto" aria-hidden>
            <rect width="160" height="100" rx="10" fill="#1c1010" />
            <rect x="8" y="8" width="144" height="84" rx="6" fill="#2a1a1a" />
            {/* 여러 파편 */}
            <path d="M28 70 L36 42 L52 70 Z" fill="#f87171" opacity="0.9" />
            <rect x="58" y="48" width="22" height="22" rx="2" fill="#fb7185" opacity="0.85" />
            <circle cx="108" cy="58" r="12" fill="#f43f5e" opacity="0.8" />
            <path d="M118 78 L128 52 L142 78 Z" fill="#e11d48" opacity="0.75" />
            <rect x="40" y="72" width="14" height="8" rx="1" fill="#fda4af" opacity="0.7" />
            <ellipse cx="88" cy="78" rx="10" ry="5" fill="#fecdd3" opacity="0.5" />
        </svg>
    )
}

/** 단색 배경 vs 잡동사니 */
function IllustBackground({ good }: { good: boolean }) {
    if (good) {
        return (
            <svg viewBox="0 0 160 100" className="w-full h-auto" aria-hidden>
                <rect width="160" height="100" rx="10" fill="#0f172a" />
                <rect x="8" y="8" width="144" height="84" rx="6" fill="#f8fafc" />
                <ellipse cx="80" cy="74" rx="32" ry="7" fill="#e2e8f0" />
                <rect x="58" y="36" width="44" height="36" rx="6" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
            </svg>
        )
    }
    return (
        <svg viewBox="0 0 160 100" className="w-full h-auto" aria-hidden>
            <rect width="160" height="100" rx="10" fill="#1c1010" />
            <rect x="8" y="8" width="144" height="84" rx="6" fill="#3f2a1a" />
            <rect x="16" y="18" width="18" height="28" rx="2" fill="#78716c" opacity="0.7" />
            <rect x="40" y="22" width="12" height="20" rx="1" fill="#a8a29e" opacity="0.5" />
            <circle cx="130" cy="30" r="10" fill="#57534e" opacity="0.6" />
            <path d="M20 88 Q80 60 140 88" stroke="#57534e" strokeWidth="8" fill="none" opacity="0.4" />
            <rect x="64" y="40" width="32" height="28" rx="4" fill="#f87171" opacity="0.85" />
            {/* 손 실루엣 */}
            <path
                d="M118 78 C118 62 108 54 98 56 C92 48 82 52 84 62 L88 88 Z"
                fill="#a16207"
                opacity="0.55"
            />
        </svg>
    )
}

/** 전체 프레이밍 vs 잘림 */
function IllustFraming({ good }: { good: boolean }) {
    if (good) {
        return (
            <svg viewBox="0 0 160 100" className="w-full h-auto" aria-hidden>
                <rect width="160" height="100" rx="10" fill="#0f172a" />
                <rect x="8" y="8" width="144" height="84" rx="6" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 3" />
                <path
                    d="M52 72 L62 34 L98 34 L108 72 Z"
                    fill="#a78bfa"
                    stroke="#7c3aed"
                    strokeWidth="1.5"
                />
                <circle cx="80" cy="28" r="8" fill="#8b5cf6" />
            </svg>
        )
    }
    return (
        <svg viewBox="0 0 160 100" className="w-full h-auto" aria-hidden>
            <rect width="160" height="100" rx="10" fill="#1c1010" />
            <rect x="8" y="8" width="144" height="84" rx="6" fill="#2a1a1a" />
            {/* 잘린 부분만 */}
            <path d="M40 100 L55 20 L105 20 L120 100" fill="#f87171" opacity="0.9" />
            <rect x="0" y="0" width="160" height="18" fill="#1c1010" />
            <rect x="0" y="82" width="160" height="18" fill="#1c1010" />
            <text x="80" y="14" textAnchor="middle" fill="#fda4af" fontSize="8" fontWeight="700">
                CROP
            </text>
        </svg>
    )
}

/** 밝은 조명 vs 어두움 */
function IllustLighting({ good }: { good: boolean }) {
    if (good) {
        return (
            <svg viewBox="0 0 160 100" className="w-full h-auto" aria-hidden>
                <rect width="160" height="100" rx="10" fill="#0f172a" />
                <rect x="8" y="8" width="144" height="84" rx="6" fill="#fffbeb" />
                <circle cx="128" cy="24" r="14" fill="#fde68a" />
                <circle cx="128" cy="24" r="8" fill="#fbbf24" />
                <ellipse cx="80" cy="74" rx="26" ry="5" fill="#fcd34d" opacity="0.35" />
                <path
                    d="M60 70 L70 40 L90 40 L100 70 Z"
                    fill="#f59e0b"
                    stroke="#b45309"
                    strokeWidth="1.5"
                />
            </svg>
        )
    }
    return (
        <svg viewBox="0 0 160 100" className="w-full h-auto" aria-hidden>
            <rect width="160" height="100" rx="10" fill="#0a0a0a" />
            <rect x="8" y="8" width="144" height="84" rx="6" fill="#171717" />
            <path
                d="M60 70 L70 40 L90 40 L100 70 Z"
                fill="#525252"
                opacity="0.45"
            />
            <ellipse cx="80" cy="55" rx="36" ry="22" fill="#000" opacity="0.35" />
            <text x="80" y="92" textAnchor="middle" fill="#737373" fontSize="8" fontWeight="700">
                DARK / BLUR
            </text>
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

function CompareCard({ card, compact }: { card: CardCopy; compact?: boolean }) {
    return (
        <article
            className={cn(
                'shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden',
                compact ? 'w-[240px] sm:w-auto sm:min-w-0 sm:flex-1' : 'w-full'
            )}
        >
            <div className="px-3 pt-3 pb-1.5">
                <p className="text-[11px] sm:text-xs font-black text-white tracking-tight">{card.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-1.5 px-2.5 pb-2.5">
                <div className="rounded-xl overflow-hidden border border-red-400/25 bg-red-500/5">
                    <Illustration kind={card.id} good={false} />
                    <div className="flex items-center gap-1 px-2 py-1.5">
                        <X className="w-3 h-3 text-red-300 shrink-0" />
                        <span className="text-[10px] font-bold text-red-200/90 leading-tight break-keep">
                            {card.badLabel}
                        </span>
                    </div>
                </div>
                <div className="rounded-xl overflow-hidden border border-teal-400/25 bg-teal-500/5">
                    <Illustration kind={card.id} good={true} />
                    <div className="flex items-center gap-1 px-2 py-1.5">
                        <Check className="w-3 h-3 text-teal-300 shrink-0" />
                        <span className="text-[10px] font-bold text-teal-200/90 leading-tight break-keep">
                            {card.goodLabel}
                        </span>
                    </div>
                </div>
            </div>
        </article>
    )
}

/**
 * 사진→3D 촬영 가이드 — 굿/배드 대비 일러스트 카드
 * compact: 업로드 패널용 가로 스크롤
 */
export function PhotoGuideVisualCards({ cards, compact = false, className }: Props) {
    if (compact) {
        return (
            <div
                className={cn(
                    'flex gap-2.5 overflow-x-auto overscroll-x-contain pb-1 -mx-0.5 px-0.5 sm:grid sm:grid-cols-2 sm:overflow-visible',
                    className
                )}
            >
                {cards.map((card) => (
                    <CompareCard key={card.id} card={card} compact />
                ))}
            </div>
        )
    }

    return (
        <div className={cn('grid gap-4 sm:grid-cols-2', className)}>
            {cards.map((card) => (
                <CompareCard key={card.id} card={card} />
            ))}
        </div>
    )
}
