'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
    getQuotePrintSettingChips,
    type QuotePrintSettings,
} from '@/lib/quote-print-settings'

type Props = {
    settings: QuotePrintSettings | null | undefined
    className?: string
    /** FDM/SLA/DLP·부피 등 기본 태그 뒤에 붙일 때 */
    trailing?: ReactNode
}

export default function QuotePrintSettingsChips({ settings, className, trailing }: Props) {
    const chips = getQuotePrintSettingChips(settings)
    if (chips.length === 0 && !trailing) return null

    return (
        <div className={cn('flex flex-wrap items-center gap-2', className)}>
            {chips.map((label) => (
                <span
                    key={label}
                    className="inline-flex items-center px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-[11px] font-bold text-amber-100/90"
                >
                    {label}
                </span>
            ))}
            {trailing}
        </div>
    )
}
