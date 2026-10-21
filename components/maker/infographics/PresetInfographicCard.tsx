'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { NameTagPresetId } from '@/lib/name-tag/design'
import { Briefcase, Dog, Luggage, Sparkles, Tag, UserCheck } from 'lucide-react'

type PresetMeta = {
    id: NameTagPresetId
    name: string
    badge: string
    sub: string
    icon: React.ComponentType<{ className?: string }>
}

export const PRESET_INFOS: Record<NameTagPresetId, PresetMeta> = {
    bag: {
        id: 'bag',
        name: '가방 이름표',
        badge: '인기',
        sub: '가방·백팩 키링',
        icon: Luggage,
    },
    pet: {
        id: 'pet',
        name: '반려동물 인식표',
        badge: '경량',
        sub: '강아지·고양이 목줄',
        icon: Dog,
    },
    label: {
        id: 'label',
        name: '소품 라벨',
        badge: '슬림',
        sub: '서랍·학용품 네임택',
        icon: Tag,
    },
    desk: {
        id: 'desk',
        name: '책상 명패',
        badge: '와이드',
        sub: '사무실·데스크 명패',
        icon: Briefcase,
    },
    badge: {
        id: 'badge',
        name: '행사 명찰',
        badge: '2줄 추천',
        sub: '세미나·소속 명찰',
        icon: UserCheck,
    },
}

type Props = {
    presetId: NameTagPresetId
    label: string
    onClick: () => void
    active?: boolean
}

export function PresetInfographicCard({ presetId, label, onClick, active }: Props) {
    const meta = PRESET_INFOS[presetId]
    const Icon = meta?.icon || Sparkles

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'group relative flex flex-col items-start rounded-2xl border p-3 text-left transition-all duration-200',
                active
                    ? 'border-teal-400/80 bg-teal-400/15 shadow-[0_0_18px_rgba(45,212,191,0.2)] ring-1 ring-teal-400/50'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
            )}
        >
            <div className="flex w-full items-center justify-between gap-1.5">
                <div
                    className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-xl transition-colors',
                        active
                            ? 'bg-teal-400 text-slate-950'
                            : 'bg-white/10 text-white/80 group-hover:bg-white/15 group-hover:text-white'
                    )}
                >
                    <Icon className="h-4 w-4" />
                </div>
                {meta?.badge && (
                    <span
                        className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight',
                            active
                                ? 'bg-teal-300 text-slate-950 font-black'
                                : 'bg-white/10 text-white/60 group-hover:text-white/80'
                        )}
                    >
                        {meta.badge}
                    </span>
                )}
            </div>

            <span className="mt-2 text-[13px] font-black text-white group-hover:text-teal-200">
                {label || meta?.name}
            </span>

            <span className="mt-0.5 text-[11px] font-medium text-white/50 line-clamp-1">
                {meta?.sub}
            </span>
        </button>
    )
}
