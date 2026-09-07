'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/** 사진→AI 3D 촬영·업로드 가이드 */
export function PhotoTo3DGuide() {
    const t = useTranslations('PhotoGuide')
    const [open, setOpen] = useState(false)
    const goodItems = t.raw('goodItems') as string[]
    const badItems = t.raw('badItems') as string[]

    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.04] transition-colors"
            >
                <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-widest text-white/40">
                        {t('title')}
                    </p>
                    {!open && (
                        <p className="text-[11px] font-bold text-white/45 mt-0.5 truncate">
                            {t('summary')}
                        </p>
                    )}
                </div>
                <ChevronDown
                    className={cn(
                        'w-4 h-4 text-white/40 shrink-0 transition-transform duration-200',
                        open && 'rotate-180'
                    )}
                />
            </button>

            {open && (
                <div className="px-4 pb-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-xl border border-teal-400/20 bg-teal-500/5 p-3 space-y-2">
                            <p className="text-[12px] font-black text-teal-200">{t('good')}</p>
                            <ul className="space-y-1.5">
                                {goodItems.map((item) => (
                                    <li
                                        key={item}
                                        className="flex items-start gap-2 text-[11px] font-bold text-white/70 leading-snug break-keep"
                                    >
                                        <Check className="w-3.5 h-3.5 text-teal-300 shrink-0 mt-0.5" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-xl border border-red-400/20 bg-red-500/5 p-3 space-y-2">
                            <p className="text-[12px] font-black text-red-200">{t('bad')}</p>
                            <ul className="space-y-1.5">
                                {badItems.map((item) => (
                                    <li
                                        key={item}
                                        className="flex items-start gap-2 text-[11px] font-bold text-white/70 leading-snug break-keep"
                                    >
                                        <X className="w-3.5 h-3.5 text-red-300 shrink-0 mt-0.5" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <p className="text-[11px] font-bold text-white/45 leading-relaxed break-keep">
                        {t('footnote')}
                    </p>
                </div>
            )}
        </div>
    )
}
