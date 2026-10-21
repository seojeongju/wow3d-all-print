'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { HolePosition } from '@/lib/name-tag/design'

type Props = {
    position: HolePosition
    className?: string
    active?: boolean
}

export function HoleInfographicIcon({ position, className, active }: Props) {
    const strokeColor = active ? '#2dd4bf' : '#94a3b8'
    const fillColor = active ? 'rgba(45, 212, 191, 0.15)' : 'rgba(255, 255, 255, 0.04)'
    const holeColor = active ? '#2dd4bf' : '#cbd5e1'
    const holeFill = active ? '#0f172a' : '#0a0a0f'

    return (
        <svg viewBox="0 0 44 28" fill="none" className={cn('h-6 w-9 shrink-0', className)}>
            {/* 기본 베이스 플레이트 */}
            <rect
                x="3"
                y="4"
                width="38"
                height="20"
                rx="6"
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth="1.8"
            />

            {position === 'left' && (
                <g>
                    {/* 좌측 홀 */}
                    <circle
                        cx="9"
                        cy="14"
                        r="3.5"
                        fill={holeFill}
                        stroke={holeColor}
                        strokeWidth="1.8"
                    />
                    {/* 키링 링 형상 */}
                    <path
                        d="M 9 10.5 C 5 6, 2 8, 2 14 C 2 20, 5 22, 9 17.5"
                        stroke={active ? '#5eead4' : '#64748b'}
                        strokeWidth="1.2"
                        strokeDasharray="2 1"
                        fill="none"
                    />
                </g>
            )}

            {position === 'top' && (
                <g>
                    {/* 상단 홀 */}
                    <circle
                        cx="22"
                        cy="9"
                        r="3.2"
                        fill={holeFill}
                        stroke={holeColor}
                        strokeWidth="1.8"
                    />
                    {/* 키링 링 형상 */}
                    <path
                        d="M 18 9 C 14 4, 18 1, 22 1 C 26 1, 30 4, 26 9"
                        stroke={active ? '#5eead4' : '#64748b'}
                        strokeWidth="1.2"
                        strokeDasharray="2 1"
                        fill="none"
                    />
                </g>
            )}

            {position === 'none' && (
                <g>
                    {/* 구멍 없음: 빗금 또는 클린 라인 표시 */}
                    <line
                        x1="18"
                        y1="10"
                        x2="26"
                        y2="18"
                        stroke={active ? '#2dd4bf' : '#64748b'}
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        opacity={0.4}
                    />
                    <line
                        x1="26"
                        y1="10"
                        x2="18"
                        y2="18"
                        stroke={active ? '#2dd4bf' : '#64748b'}
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        opacity={0.4}
                    />
                </g>
            )}
        </svg>
    )
}
