import { ArrowRight, Box, FileBox, ImageIcon, ScanSearch, Sparkles, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

export type QuotePathTone = 'teal' | 'indigo'
export type QuotePathMode = 'file' | 'photo'

const TONE = {
    teal: {
        chip: 'border-teal-400/30 bg-teal-400/10 text-teal-100',
        node: 'border-teal-400/40 bg-teal-400/15 text-teal-200',
        line: 'bg-teal-400/35',
        diagram: 'border-teal-400/25 bg-teal-400/[0.07]',
        accent: 'text-teal-300',
    },
    indigo: {
        chip: 'border-indigo-400/30 bg-indigo-500/15 text-indigo-100',
        node: 'border-indigo-400/40 bg-indigo-500/15 text-indigo-200',
        line: 'bg-indigo-400/35',
        diagram: 'border-indigo-400/25 bg-indigo-500/[0.07]',
        accent: 'text-indigo-300',
    },
} as const

type DiagramProps = {
    mode: QuotePathMode
    tone: QuotePathTone
    compact?: boolean
}

/** 경로 차이를 한눈에 보여주는 미니 다이어그램 */
export function QuotePathDiagram({ mode, tone, compact }: DiagramProps) {
    const c = TONE[tone]
    const box = compact ? 'h-8 w-8' : 'h-9 w-9'
    const icon = compact ? 'h-3.5 w-3.5' : 'h-4 w-4'
    const gap = compact ? 'gap-1.5' : 'gap-2'

    const nodes =
        mode === 'file'
            ? [
                  { icon: FileBox, label: 'file' },
                  { icon: ScanSearch, label: 'check' },
                  { icon: Tag, label: 'quote' },
              ]
            : [
                  { icon: ImageIcon, label: 'photo' },
                  { icon: Sparkles, label: 'ai' },
                  { icon: Box, label: 'mesh' },
              ]

    return (
        <div
            className={cn(
                'flex items-center justify-center rounded-xl border',
                c.diagram,
                compact ? 'px-2.5 py-2' : 'px-3 py-2.5',
                gap,
            )}
            aria-hidden
        >
            {nodes.map((n, i) => {
                const Icon = n.icon
                return (
                    <div key={n.label} className={cn('flex items-center', gap)}>
                        <div
                            className={cn(
                                'flex items-center justify-center rounded-lg border transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:transform-none',
                                box,
                                c.node,
                                i === 1 && mode === 'photo' && 'relative',
                            )}
                        >
                            <Icon className={icon} />
                            {mode === 'photo' && i === 1 && (
                                <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-indigo-300 shadow-[0_0_8px_rgba(165,180,252,0.9)]" />
                            )}
                        </div>
                        {i < nodes.length - 1 && (
                            <div className={cn('h-px w-3 sm:w-4 rounded-full', c.line)} />
                        )}
                    </div>
                )
            })}
        </div>
    )
}

type FlowProps = {
    steps: readonly [string, string, string]
    tone: QuotePathTone
    compact?: boolean
}

/** 3스텝 미니 플로우 — 제목·설명 아래, CTA 위 */
export function QuotePathFlowStrip({ steps, tone, compact }: FlowProps) {
    const c = TONE[tone]

    return (
        <ol
            className={cn(
                'grid grid-cols-3',
                compact ? 'gap-1' : 'gap-1.5',
            )}
        >
            {steps.map((label, i) => (
                <li key={label} className="relative min-w-0">
                    <div
                        className={cn(
                            'flex h-full flex-col items-center rounded-lg border px-1 text-center',
                            c.chip,
                            compact ? 'gap-0.5 py-1.5' : 'gap-1 py-2',
                        )}
                    >
                        <span
                            className={cn(
                                'flex items-center justify-center rounded-full border font-black tabular-nums',
                                c.node,
                                compact ? 'h-4 w-4 text-[9px]' : 'h-5 w-5 text-[10px]',
                            )}
                        >
                            {i + 1}
                        </span>
                        <span
                            className={cn(
                                'w-full break-keep font-bold leading-tight text-white/80',
                                compact ? 'text-[10px]' : 'text-[11px]',
                            )}
                        >
                            {label}
                        </span>
                    </div>
                    {i < steps.length - 1 && (
                        <ArrowRight
                            className={cn(
                                'pointer-events-none absolute -right-1 top-1/2 z-10 -translate-y-1/2 opacity-50 sm:-right-1.5',
                                c.accent,
                                compact ? 'h-2.5 w-2.5' : 'h-3 w-3',
                            )}
                            aria-hidden
                        />
                    )}
                </li>
            ))}
        </ol>
    )
}
