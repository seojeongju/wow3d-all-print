'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { PlateShape } from '@/lib/name-tag/design'

type Props = {
    shape: PlateShape
    className?: string
    active?: boolean
}

export function ShapeInfographicIcon({ shape, className, active }: Props) {
    const strokeColor = active ? '#2dd4bf' : '#94a3b8'
    const fillColor = active ? 'rgba(45, 212, 191, 0.15)' : 'rgba(255, 255, 255, 0.04)'

    switch (shape) {
        case 'rounded':
            return (
                <svg viewBox="0 0 44 28" fill="none" className={cn('h-6 w-9 shrink-0', className)}>
                    {/* 둥근 사각 인포그래픽 */}
                    <rect
                        x="2"
                        y="2"
                        width="40"
                        height="24"
                        rx="6"
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth="2"
                    />
                    {/* 내부 가이드 라인 */}
                    <rect
                        x="8"
                        y="7"
                        width="28"
                        height="14"
                        rx="3"
                        stroke={active ? '#5eead4' : '#64748b'}
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        opacity={0.7}
                    />
                </svg>
            )

        case 'capsule':
            return (
                <svg viewBox="0 0 44 28" fill="none" className={cn('h-6 w-9 shrink-0', className)}>
                    {/* 캡슐 인포그래픽 */}
                    <rect
                        x="2"
                        y="3"
                        width="40"
                        height="22"
                        rx="11"
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth="2"
                    />
                    {/* 내부 가이드 라인 */}
                    <rect
                        x="10"
                        y="8"
                        width="24"
                        height="12"
                        rx="6"
                        stroke={active ? '#5eead4' : '#64748b'}
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        opacity={0.7}
                    />
                </svg>
            )

        case 'rect':
            return (
                <svg viewBox="0 0 44 28" fill="none" className={cn('h-6 w-9 shrink-0', className)}>
                    {/* 직사각형 인포그래픽 */}
                    <rect
                        x="2"
                        y="2"
                        width="40"
                        height="24"
                        rx="1"
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth="2"
                    />
                    <rect
                        x="7"
                        y="6"
                        width="30"
                        height="16"
                        rx="0.5"
                        stroke={active ? '#5eead4' : '#64748b'}
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        opacity={0.7}
                    />
                </svg>
            )

        case 'circle':
            return (
                <svg viewBox="0 0 44 28" fill="none" className={cn('h-6 w-9 shrink-0', className)}>
                    {/* 원형 인포그래픽 */}
                    <circle
                        cx="22"
                        cy="14"
                        r="12"
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth="2"
                    />
                    <circle
                        cx="22"
                        cy="14"
                        r="7"
                        stroke={active ? '#5eead4' : '#64748b'}
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        opacity={0.7}
                    />
                </svg>
            )

        case 'outline':
            return (
                <svg viewBox="0 0 44 28" fill="none" className={cn('h-6 w-9 shrink-0', className)}>
                    {/* 글자 외곽(유기적 윤곽) 인포그래픽 */}
                    <path
                        d="M 5 17 Q 8 6 16 6 Q 22 6 25 10 Q 30 5 37 9 Q 41 14 39 19 Q 36 24 28 23 Q 22 25 16 23 Q 6 24 5 17 Z"
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth="2"
                        strokeLinejoin="round"
                    />
                    <text
                        x="22"
                        y="17"
                        textAnchor="middle"
                        fill={active ? '#5eead4' : '#94a3b8'}
                        fontSize="9"
                        fontWeight="bold"
                        letterSpacing="0.5"
                    >
                        TXT
                    </text>
                </svg>
            )

        default:
            return null
    }
}
