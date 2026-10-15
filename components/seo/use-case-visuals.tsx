import {
    Building2,
    Cog,
    Cpu,
    PersonStanding,
    Sparkles,
    Swords,
    Trophy,
    Type,
    Wrench,
    type LucideIcon,
} from 'lucide-react'
import type { UseCaseMethod } from '@/lib/use-case-pages'
import { cn } from '@/lib/utils'

/** 활용 사례 허브·상세 페이지 공용 인포그래픽 요소 */

/** 용도별 대표 아이콘 */
const CASE_ICONS: Record<string, LucideIcon> = {
    'figures-miniatures': PersonStanding,
    'electronics-enclosures': Cpu,
    'jigs-fixtures': Wrench,
    'replacement-parts': Cog,
    'architectural-models': Building2,
    'cosplay-props': Swords,
    'logos-signage': Type,
    'trophies-awards': Trophy,
}

export function caseIconFor(slug: string): LucideIcon {
    return CASE_ICONS[slug] ?? Sparkles
}

/** 출력 방식별 색상 */
export const METHOD_STYLE: Record<UseCaseMethod, { badge: string; bar: string; ring: string; text: string; stroke: string }> = {
    fdm: {
        badge: 'border-teal-400/40 bg-teal-400/15 text-teal-200',
        bar: 'bg-teal-400',
        ring: 'border-teal-400/30 hover:border-teal-300/60',
        text: 'text-teal-300',
        stroke: 'text-teal-300',
    },
    sla: {
        badge: 'border-indigo-400/40 bg-indigo-400/15 text-indigo-200',
        bar: 'bg-indigo-400',
        ring: 'border-indigo-400/30 hover:border-indigo-300/60',
        text: 'text-indigo-300',
        stroke: 'text-indigo-300',
    },
    dlp: {
        badge: 'border-fuchsia-400/40 bg-fuchsia-400/15 text-fuchsia-200',
        bar: 'bg-fuchsia-400',
        ring: 'border-fuchsia-400/30 hover:border-fuchsia-300/60',
        text: 'text-fuchsia-300',
        stroke: 'text-fuchsia-300',
    },
}

export const METHODS: UseCaseMethod[] = ['fdm', 'sla', 'dlp']

/** 출력 방식 비교 — 일반적인 경향 (5점 척도) */
export const METHOD_SCORES: Record<UseCaseMethod, Record<(typeof METRICS)[number], number>> = {
    fdm: { detail: 2, strength: 4, size: 5, cost: 5 },
    sla: { detail: 5, strength: 3, size: 3, cost: 3 },
    dlp: { detail: 5, strength: 3, size: 2, cost: 4 },
}
export const METRICS = ['detail', 'strength', 'size', 'cost'] as const

/** "DLP 레진"·"SLA resin"·"FDM" 같은 추천 문구에서 출력 방식 추출 */
export function methodKeyOf(label: string): UseCaseMethod | null {
    const m = label.toLowerCase().match(/fdm|sla|dlp/)
    return (m?.[0] as UseCaseMethod | undefined) ?? null
}

/** 5단계 점수 막대 */
export function ScoreBars({
    method,
    labels,
    compact = false,
}: {
    method: UseCaseMethod
    labels: Record<(typeof METRICS)[number], string>
    compact?: boolean
}) {
    const scores = METHOD_SCORES[method]
    const style = METHOD_STYLE[method]
    return (
        <dl className={compact ? 'space-y-2' : 'space-y-3'}>
            {METRICS.map((metric) => (
                <div key={metric}>
                    <div className="flex items-center justify-between text-[11px] font-bold text-white/55">
                        <dt>{labels[metric]}</dt>
                        <dd className="tabular-nums text-white/40">{scores[metric]}/5</dd>
                    </div>
                    <div className={cn('mt-1 grid grid-cols-5 gap-1', compact && 'mt-0.5')} aria-hidden>
                        {[1, 2, 3, 4, 5].map((n) => (
                            <span
                                key={n}
                                className={cn(compact ? 'h-1.5' : 'h-2', 'rounded-full', n <= scores[metric] ? style.bar : 'bg-white/10')}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </dl>
    )
}

/** 예시 크기를 비율대로 그린 등각 상자 (W·D·H mm) */
export function IsoBox({
    w,
    d,
    h,
    method,
    className,
}: {
    w: number
    d: number
    h: number
    method: UseCaseMethod
    className?: string
}) {
    const s = 100 / Math.max(w, d, h)
    const cos = Math.cos(Math.PI / 6)
    const sin = Math.sin(Math.PI / 6)
    const p = (x: number, y: number, z: number): [number, number] => [(x - y) * cos * s, (x + y) * sin * s - z * s]

    const top = [p(0, 0, h), p(w, 0, h), p(w, d, h), p(0, d, h)]
    const right = [p(w, 0, 0), p(w, d, 0), p(w, d, h), p(w, 0, h)]
    const left = [p(0, d, 0), p(w, d, 0), p(w, d, h), p(0, d, h)]
    const all = [...top, ...right, ...left]
    const pad = 26
    const minX = Math.min(...all.map((q) => q[0])) - pad
    const maxX = Math.max(...all.map((q) => q[0])) + pad
    const minY = Math.min(...all.map((q) => q[1])) - 10
    const maxY = Math.max(...all.map((q) => q[1])) + 22
    const pts = (face: [number, number][]) => face.map((q) => q.join(',')).join(' ')
    const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]

    const wLabel = mid(p(0, d, 0), p(w, d, 0))
    const dLabel = mid(p(w, 0, 0), p(w, d, 0))
    const hLabel = mid(p(w, 0, 0), p(w, 0, h))

    return (
        <svg
            viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
            className={cn(METHOD_STYLE[method].stroke, className)}
            role="img"
            aria-label={`${w} × ${d} × ${h} mm`}
        >
            <polygon points={pts(left)} fill="currentColor" fillOpacity={0.12} stroke="currentColor" strokeWidth={1.2} />
            <polygon points={pts(right)} fill="currentColor" fillOpacity={0.22} stroke="currentColor" strokeWidth={1.2} />
            <polygon points={pts(top)} fill="currentColor" fillOpacity={0.35} stroke="currentColor" strokeWidth={1.2} />
            <g className="fill-white/70" fontSize={9} fontWeight={800}>
                <text x={wLabel[0] - 6} y={wLabel[1] + 14} textAnchor="end">
                    W {w}
                </text>
                <text x={dLabel[0] + 6} y={dLabel[1] + 14} textAnchor="start">
                    D {d}
                </text>
                <text x={hLabel[0] + 8} y={hLabel[1] + 3} textAnchor="start">
                    H {h}
                </text>
            </g>
        </svg>
    )
}
