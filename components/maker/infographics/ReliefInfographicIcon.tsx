'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { ReliefMode } from '@/lib/name-tag/design'

type Props = {
    mode: ReliefMode
    className?: string
    active?: boolean
}

export function ReliefInfographicIcon({ mode, className, active }: Props) {
    const strokeColor = active ? '#2dd4bf' : '#94a3b8'
    const accentColor = active ? '#5eead4' : '#64748b'
    const plateFill = active ? 'rgba(45, 212, 191, 0.15)' : 'rgba(255, 255, 255, 0.05)'
    const reliefFill = active ? '#2dd4bf' : '#cbd5e1'

    if (mode === 'emboss') {
        // 양각: 판 위로 튀어나온 3D 단면 일러스트
        return (
            <svg viewBox="0 0 44 28" fill="none" className={cn('h-6 w-9 shrink-0', className)}>
                {/* 베이스 플레이트 단면 */}
                <rect
                    x="4"
                    y="14"
                    width="36"
                    height="10"
                    rx="2"
                    fill={plateFill}
                    stroke={strokeColor}
                    strokeWidth="1.5"
                />
                {/* 돌출된 글자(양각) 단면 */}
                <path
                    d="M 14 14 L 14 7 L 30 7 L 30 14 Z"
                    fill={reliefFill}
                    stroke={accentColor}
                    strokeWidth="1.5"
                />
                {/* 위로 향하는 화살표/인디케이터 */}
                <path
                    d="M 22 5 L 22 2 M 19 4 L 22 1 L 25 4"
                    stroke={active ? '#2dd4bf' : '#94a3b8'}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        )
    }

    // 음각 (engrave): 판 안으로 파인 3D 단면 일러스트
    return (
        <svg viewBox="0 0 44 28" fill="none" className={cn('h-6 w-9 shrink-0', className)}>
            {/* 파인 베이스 플레이트 단면 */}
            <path
                d="M 4 8 L 14 8 L 14 17 L 30 17 L 30 8 L 40 8 L 40 22 L 4 22 Z"
                fill={plateFill}
                stroke={strokeColor}
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            {/* 아래로 향하는 화살표/인디케이터 */}
            <path
                d="M 22 9 L 22 14 M 19 12 L 22 15 L 25 12"
                stroke={active ? '#2dd4bf' : '#94a3b8'}
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}
