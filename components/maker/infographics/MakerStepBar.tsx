'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Type, Shapes, CircleDot, Palette, LayoutGrid } from 'lucide-react'

export type MakerStepId = 'all' | 'text' | 'shape' | 'relief' | 'finish'

type StepDef = {
    id: MakerStepId
    label: string
    shortLabel: string
    icon: React.ComponentType<{ className?: string }>
}

const STEPS: StepDef[] = [
    { id: 'all', label: '전체', shortLabel: '전체', icon: LayoutGrid },
    { id: 'text', label: '문구·폰트', shortLabel: '1. 문구', icon: Type },
    { id: 'shape', label: '형태·크기', shortLabel: '2. 형태', icon: Shapes },
    { id: 'relief', label: '홀·입체감', shortLabel: '3. 가공', icon: CircleDot },
    { id: 'finish', label: '색상·사양', shortLabel: '4. 완료', icon: Palette },
]

type Props = {
    activeStep: MakerStepId
    onSelectStep: (step: MakerStepId) => void
}

export function MakerStepBar({ activeStep, onSelectStep }: Props) {
    return (
        <div className="grid grid-cols-5 gap-1 rounded-2xl border border-white/10 bg-black/40 p-1.5 backdrop-blur-md">
            {STEPS.map((step) => {
                const Icon = step.icon
                const isActive = activeStep === step.id

                return (
                    <button
                        key={step.id}
                        id={`maker-step-${step.id}`}
                        type="button"
                        onClick={() => onSelectStep(step.id)}
                        aria-pressed={isActive}
                        className={cn(
                            'group flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-bold leading-tight transition-all',
                            isActive
                                ? 'bg-teal-400 text-slate-950 shadow-[0_0_12px_rgba(45,212,191,0.35)] font-black'
                                : 'text-white/60 hover:bg-white/10 hover:text-white'
                        )}
                    >
                        <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-slate-950' : 'text-white/50 group-hover:text-white')} />
                        <span className="w-full truncate text-center">{step.label}</span>
                    </button>
                )
            })}
        </div>
    )
}
