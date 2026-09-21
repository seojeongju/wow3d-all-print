'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, ChevronDown, X } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { PhotoGuideVisualCards } from '@/components/quote/PhotoGuideVisualCards'

type VisualCard = {
    id: 'single' | 'background' | 'framing' | 'lighting'
    title: string
    badLabel: string
    goodLabel: string
    tip?: string
}

/**
 * 사진→AI 3D 촬영·업로드 가이드
 * 기본 접힘 — 업로드 영역이 바로 보이도록. 클릭 시 펼침.
 */
export function PhotoTo3DGuide() {
    const t = useTranslations('PhotoGuide')
    const [open, setOpen] = useState(false)
    const goodItems = t.raw('goodItems') as string[]
    const badItems = t.raw('badItems') as string[]
    const visualCards = t.raw('visualCards') as VisualCard[]

    return (
        <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/[0.06] overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-white/[0.04] transition-colors"
            >
                <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-widest text-indigo-200/70">
                        {t('title')}
                    </p>
                    <p className="text-[11px] font-bold text-white/55 mt-0.5 truncate break-keep">
                        {open ? t('heroTip') : t('summary')}
                    </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {!open && (
                        <span className="hidden sm:inline text-[10px] font-black text-indigo-300/80">
                            {t('expandHint')}
                        </span>
                    )}
                    <ChevronDown
                        className={cn(
                            'w-4 h-4 text-white/40 transition-transform duration-200',
                            open && 'rotate-180'
                        )}
                    />
                </div>
            </button>

            {open && (
                <div className="px-3 sm:px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                    <p className="text-[12px] font-bold text-white/80 break-keep px-0.5">
                        {t('heroTip')}
                    </p>
                    <PhotoGuideVisualCards
                        cards={visualCards}
                        compact
                        badBadge={t('badBadge')}
                        goodBadge={t('goodBadge')}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="rounded-xl border border-teal-400/20 bg-teal-500/5 p-3 space-y-1.5">
                            <p className="text-[11px] font-black text-teal-200">{t('good')}</p>
                            <ul className="space-y-1">
                                {goodItems.map((item) => (
                                    <li
                                        key={item}
                                        className="flex items-start gap-1.5 text-[11px] font-bold text-white/70 leading-snug break-keep"
                                    >
                                        <Check className="w-3.5 h-3.5 text-teal-300 shrink-0 mt-0.5" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-xl border border-red-400/20 bg-red-500/5 p-3 space-y-1.5">
                            <p className="text-[11px] font-black text-red-200">{t('bad')}</p>
                            <ul className="space-y-1">
                                {badItems.map((item) => (
                                    <li
                                        key={item}
                                        className="flex items-start gap-1.5 text-[11px] font-bold text-white/70 leading-snug break-keep"
                                    >
                                        <X className="w-3.5 h-3.5 text-red-300 shrink-0 mt-0.5" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-0.5">
                        <p className="text-[11px] font-bold text-white/45 leading-relaxed break-keep">
                            {t('footnote')}
                        </p>
                        <Link
                            href={'/guides/photo-to-3d-printing-quote' as '/'}
                            className="shrink-0 text-[11px] font-black text-indigo-300 hover:text-indigo-200 underline-offset-2 hover:underline"
                        >
                            {t('moreLink')}
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}
