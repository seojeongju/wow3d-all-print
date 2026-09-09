'use client'

import { cn } from '@/lib/utils'
import {
    type StatsGranularity,
    STATS_RANGE,
} from '@/lib/admin-stats-range'

type Props = {
    value: StatsGranularity
    onChange: (value: StatsGranularity) => void
    className?: string
    size?: 'sm' | 'md'
}

const OPTIONS: StatsGranularity[] = ['day', 'week', 'month']

export default function AdminStatsRangeToggle({
    value,
    onChange,
    className,
    size = 'md',
}: Props) {
    return (
        <div
            className={cn(
                'inline-flex rounded-xl border border-white/10 bg-white/[0.04] p-1',
                className
            )}
            role="tablist"
            aria-label="차트 집계 기간"
        >
            {OPTIONS.map((key) => {
                const active = value === key
                return (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(key)}
                        className={cn(
                            'rounded-lg font-bold transition-all',
                            size === 'sm'
                                ? 'px-2.5 py-1 text-[10px]'
                                : 'px-3.5 py-1.5 text-xs',
                            active
                                ? 'bg-teal-500 text-white shadow-md shadow-teal-500/25'
                                : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                        )}
                    >
                        {STATS_RANGE[key].shortLabel}
                    </button>
                )
            })}
        </div>
    )
}
