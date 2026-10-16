'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'
import {
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    CircleDashed,
    Copy,
    Droplets,
    Eye,
    EyeOff,
    FileWarning,
    FlipVertical2,
    Layers,
    Link2,
    Loader2,
    Maximize2,
    Ruler,
    Undo2,
    Wrench,
    type LucideIcon,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { useFileStore } from '@/store/useFileStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useQuoteFileHealthStore } from '@/store/useQuoteFileHealthStore'
import { summarizeThickness, type ThicknessSummary } from '@/lib/mesh-thickness'
import type { MeshHighlights } from '@/lib/mesh-inspect'
import type { PrintMethodKey } from '@/lib/model-transform'
import { CONVERSION_EVENT_CATEGORY, QUOTE_CONVERSION_EVENTS } from '@/lib/conversion-events'
import { trackConversionEvent } from '@/lib/track-conversion-event'

/** 출력 방식별 권장 최소 벽 두께 (mm) */
export const MIN_WALL_MM: Record<PrintMethodKey, number> = { fdm: 1.0, sla: 0.6, dlp: 0.6 }

/** 측정 잡음·모서리 끝 표본을 경고로 올리지 않도록 최소 개수·비율을 함께 요구 */
const THIN_WARN_MIN_COUNT = 10
const THIN_WARN_MIN_RATIO = 0.003

/** 이보다 얇은 값은 겹친 면·두께 없는 면에서 나온 측정값이라 "미만"으로만 표시 */
const THINNEST_DISPLAY_FLOOR_MM = 0.05

const EMPTY = new Float32Array(0)

export type QuoteThinState =
    | { status: 'measuring' }
    | { status: 'ok'; method: PrintMethodKey; minWallMm: number; summary: ThicknessSummary; warn: boolean }
    | null

/** 현재 파일·출력 방식·배율 기준 얇은 벽 집계 */
export function useQuoteThinState(): QuoteThinState {
    const file = useFileStore((s) => s.file)
    const method = useFileStore((s) => s.printMethodForFit)
    const transform = useFileStore((s) => s.transform)
    const thickness = useQuoteFileHealthStore((s) => s.thickness)

    return useMemo(() => {
        if (!file || !thickness || thickness.file !== file) return null
        if (thickness.status === 'measuring') return { status: 'measuring' }
        if (thickness.status !== 'ok') return null
        const minWallMm = MIN_WALL_MM[method] ?? MIN_WALL_MM.fdm
        // 축별 스케일이면 가장 작게 줄어든 축 기준으로 얇은 벽을 보수적으로 판정
        const sx = (transform.scaleXPercent ?? transform.scalePercent) / 100
        const sy = (transform.scaleYPercent ?? transform.scalePercent) / 100
        const sz = (transform.scaleZPercent ?? transform.scalePercent) / 100
        const scale = Math.min(sx, sy, sz)
        const summary = summarizeThickness(thickness.result, minWallMm, scale)
        const warn = summary.thinCount >= THIN_WARN_MIN_COUNT && summary.thinRatio >= THIN_WARN_MIN_RATIO
        return { status: 'ok', method, minWallMm, summary, warn }
    }, [file, thickness, method, transform.scalePercent, transform.scaleXPercent, transform.scaleYPercent, transform.scaleZPercent])
}

/** 뷰어에 얇은 부위만 표시하는 하이라이트 */
export function thinHighlights(points: Float32Array): MeshHighlights {
    return {
        openEdges: EMPTY,
        nonManifoldEdges: EMPTY,
        flippedEdges: EMPTY,
        holeCenters: EMPTY,
        nonManifoldPoints: EMPTY,
        thinPoints: points,
    }
}

function formatMm(v: number): string {
    return v >= 1 ? v.toFixed(1) : v.toFixed(2)
}

/** 원본 → 자동 리페어 → 견적·출력 흐름의 한 단계 */
function FlowStep({ icon: Icon, label, sub, tone }: { icon: LucideIcon; label: string; sub: string; tone: string }) {
    return (
        <li className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center">
            <span className={cn('flex h-9 w-9 items-center justify-center rounded-full border', tone)}>
                <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-[11px] font-black leading-tight text-white break-keep">{label}</span>
            <span className="text-[10px] font-bold leading-tight text-white/50 break-keep">{sub}</span>
        </li>
    )
}

/** 표면 중 얇은 부분 비율 도넛 */
function RatioRing({ percent }: { percent: number }) {
    const r = 24
    const c = 2 * Math.PI * r
    return (
        <svg viewBox="0 0 60 60" className="h-16 w-16 shrink-0 -rotate-90" aria-hidden>
            <circle cx="30" cy="30" r={r} fill="none" strokeWidth="7" className="stroke-white/10" />
            <circle
                cx="30"
                cy="30"
                r={r}
                fill="none"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${(Math.min(percent, 100) / 100) * c} ${c}`}
                className="stroke-amber-400"
            />
        </svg>
    )
}

export default function QuoteFileHealthCard() {
    const t = useTranslations('Quote.health')
    const file = useFileStore((s) => s.file)
    const repair = useQuoteFileHealthStore((s) => s.repair)
    const showThin = useQuoteFileHealthStore((s) => s.showThin)
    const setShowThin = useQuoteFileHealthStore((s) => s.setShowThin)
    const thin = useQuoteThinState()

    const thinWarn = thin?.status === 'ok' && thin.warn
    const trackedThinRef = useRef<File | null>(null)
    useEffect(() => {
        if (!thinWarn || !file || trackedThinRef.current === file) return
        trackedThinRef.current = file
        trackConversionEvent({
            eventName: QUOTE_CONVERSION_EVENTS.THIN_WALL,
            category: CONVERSION_EVENT_CATEGORY.QUOTE,
            userId: useAuthStore.getState().user?.id ?? null,
            metadata: {
                method: thin.method,
                thinRatio: Math.round(thin.summary.thinRatio * 1000) / 1000,
                minMm: thin.summary.minMm != null ? Math.round(thin.summary.minMm * 100) / 100 : null,
            },
        })
    }, [thinWarn, file, thin])

    if (!file) return null
    const viewingRepaired = repair != null && file === repair.repaired
    const viewingOriginal = repair != null && file === repair.original
    if (!viewingRepaired && !viewingOriginal && !thin) return null

    const switchTo = (target: File, revert: boolean) => {
        const store = useFileStore.getState()
        store.setFile(target, store.fileSource, { keepParseCache: true })
        if (revert) {
            trackConversionEvent({
                eventName: QUOTE_CONVERSION_EVENTS.AUTO_REPAIR_REVERT,
                category: CONVERSION_EVENT_CATEGORY.QUOTE,
                userId: useAuthStore.getState().user?.id ?? null,
            })
        }
    }

    const fixes: { key: string; icon: LucideIcon; count: number; unit: 'unitSpots' | 'unitFaces' }[] = []
    if (repair) {
        const r = repair.report
        if (r.holesFilled > 0) fixes.push({ key: 'statHoles', icon: CircleDashed, count: r.holesFilled, unit: 'unitSpots' })
        if (r.stitchedVertices > 0) fixes.push({ key: 'statStitched', icon: Link2, count: r.stitchedVertices, unit: 'unitSpots' })
        if (r.internalFacesRemoved > 0) fixes.push({ key: 'statInternal', icon: Layers, count: r.internalFacesRemoved, unit: 'unitFaces' })
        if (r.duplicateRemoved + r.degenerateRemoved > 0) {
            fixes.push({ key: 'statDuplicates', icon: Copy, count: r.duplicateRemoved + r.degenerateRemoved, unit: 'unitFaces' })
        }
        if (r.flippedFixed > 0) fixes.push({ key: 'statFlipped', icon: FlipVertical2, count: r.flippedFixed, unit: 'unitFaces' })
    }
    const fixTotal = fixes.reduce((sum, f) => sum + f.count, 0)

    return (
        <div className="space-y-3">
            {viewingRepaired && repair ? (
                <div className="rounded-2xl border border-teal-400/30 bg-teal-500/10 px-4 py-3.5 space-y-3">
                    <div className="flex items-start gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-400/20 text-teal-300">
                            <Wrench className="h-3.5 w-3.5" aria-hidden />
                        </span>
                        <div className="min-w-0 space-y-0.5">
                            <p className="text-xs sm:text-sm font-black text-white break-keep">{t('repairedTitle')}</p>
                            <p className="text-[11px] sm:text-xs font-bold text-teal-100/70 leading-relaxed break-keep">
                                {t('repairedDesc')}
                            </p>
                        </div>
                    </div>

                    {/* 처리 흐름 */}
                    <ol className="flex items-start rounded-xl border border-white/10 bg-black/20 px-2 py-2.5">
                        <FlowStep
                            icon={FileWarning}
                            label={t('flowOriginal')}
                            sub={t('flowOriginalSub')}
                            tone="border-amber-300/40 bg-amber-400/15 text-amber-200"
                        />
                        <ChevronRight className="mt-2.5 h-4 w-4 shrink-0 text-white/30" aria-hidden />
                        <FlowStep
                            icon={Wrench}
                            label={t('flowRepair')}
                            sub={fixTotal > 0 ? t('flowRepairSub', { count: fixTotal }) : t('flowRepairSubDone')}
                            tone="border-teal-300/50 bg-teal-400/20 text-teal-200"
                        />
                        <ChevronRight className="mt-2.5 h-4 w-4 shrink-0 text-white/30" aria-hidden />
                        <FlowStep
                            icon={CheckCircle2}
                            label={t('flowQuote')}
                            sub={t('flowQuoteSub')}
                            tone="border-emerald-300/50 bg-emerald-400/20 text-emerald-200"
                        />
                    </ol>

                    {/* 수정 항목별 수치 */}
                    {fixes.length > 0 ? (
                        <ul className="grid grid-cols-2 gap-1.5">
                            {fixes.map(({ key, icon: Icon, count, unit }) => (
                                <li
                                    key={key}
                                    className="flex items-center gap-2 rounded-xl border border-teal-300/20 bg-teal-400/[0.07] px-2.5 py-2"
                                >
                                    <Icon className="h-4 w-4 shrink-0 text-teal-300" aria-hidden />
                                    <div className="min-w-0">
                                        <p className="text-sm font-black leading-none text-white tabular-nums">
                                            {t(unit, { count })}
                                        </p>
                                        <p className="mt-1 text-[10px] font-bold leading-tight text-teal-100/70 break-keep">
                                            {t(key)}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <button
                            type="button"
                            onClick={() => switchTo(repair.original, true)}
                            className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-black text-white/60 hover:text-white transition-colors"
                        >
                            <Undo2 className="w-3.5 h-3.5" aria-hidden />
                            {t('useOriginal')}
                        </button>
                        <Link
                            href="/stl-checker"
                            className="text-[11px] sm:text-xs font-black text-teal-300 hover:text-teal-200"
                        >
                            {t('checkerLink')} →
                        </Link>
                    </div>
                </div>
            ) : null}

            {viewingOriginal && repair ? (
                <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" aria-hidden />
                        <div className="min-w-0 space-y-1">
                            <p className="text-xs sm:text-sm font-black text-white break-keep">{t('originalTitle')}</p>
                            <p className="text-[11px] sm:text-xs font-bold text-white/60 leading-relaxed break-keep">
                                {t('originalDesc')}
                            </p>
                        </div>
                    </div>
                    <div className="pl-6">
                        <button
                            type="button"
                            onClick={() => switchTo(repair.repaired, false)}
                            className="inline-flex items-center gap-1 rounded-lg border border-teal-400/30 bg-teal-400/15 px-3 py-1.5 text-[11px] sm:text-xs font-black text-teal-200 hover:bg-teal-400 hover:text-slate-900 transition-colors"
                        >
                            <Wrench className="w-3.5 h-3.5" aria-hidden />
                            {t('useRepaired')}
                        </button>
                    </div>
                </div>
            ) : null}

            {thin?.status === 'measuring' ? (
                <div className="flex items-center gap-2 px-1 text-[11px] sm:text-xs font-bold text-white/45">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                    {t('thinMeasuring')}
                </div>
            ) : null}

            {thin?.status === 'ok' && thin.warn ? (
                <ThinWallCard
                    method={thin.method}
                    minWallMm={thin.minWallMm}
                    summary={thin.summary}
                    showThin={showThin}
                    onToggleThin={() => setShowThin(!showThin)}
                />
            ) : null}

            {thin?.status === 'ok' && !thin.warn ? (
                <div className="flex items-center gap-2 px-1 text-[11px] sm:text-xs font-bold text-emerald-300/80 break-keep">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden />
                    {t('thinOk', { method: thin.method.toUpperCase(), min: formatMm(thin.minWallMm) })}
                </div>
            ) : null}
        </div>
    )
}

function ThinWallCard({
    method,
    minWallMm,
    summary,
    showThin,
    onToggleThin,
}: {
    method: PrintMethodKey
    minWallMm: number
    summary: ThicknessSummary
    showThin: boolean
    onToggleThin: () => void
}) {
    const t = useTranslations('Quote.health')
    const percent = Math.max(1, Math.round(summary.thinRatio * 100))
    const thinnest = summary.minMm ?? 0
    const thinnestLabel =
        thinnest < THINNEST_DISPLAY_FLOOR_MM
            ? t('thinThinnestBelow', { value: formatMm(THINNEST_DISPLAY_FLOOR_MM) })
            : t('thinThinnestValue', { value: formatMm(thinnest) })
    // 게이지는 0 ~ 권장 두께의 2배, 권장 두께가 가운데
    const gaugeMax = minWallMm * 2
    const markerPos = Math.min(Math.max(thinnest / gaugeMax, 0), 1) * 100

    const remedies: { key: string; icon: LucideIcon }[] = [
        { key: 'thinFixThicken', icon: Ruler },
        { key: 'thinFixScale', icon: Maximize2 },
        ...(method === 'fdm' ? [{ key: 'thinFixResin', icon: Droplets }] : []),
    ]

    return (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-500/[0.08] px-4 py-3.5 space-y-3">
            <div className="flex items-start gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div className="min-w-0 space-y-1.5">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm font-black text-white break-keep">
                        {t('thinTitle')}
                        <span className="rounded-full border border-amber-300/30 bg-amber-400/15 px-2 py-0.5 text-[10px] sm:text-[11px] font-black text-amber-100">
                            {t('thinStandard', { method: method.toUpperCase(), min: formatMm(minWallMm) })}
                        </span>
                    </p>
                    <p className="inline-flex max-w-full items-center rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1 text-[11px] sm:text-xs font-black text-emerald-100 break-keep">
                        {t('thinOrderOk')}
                    </p>
                    <p className="text-[11px] sm:text-xs font-bold text-amber-50/70 leading-relaxed break-keep">{t('thinRisk')}</p>
                </div>
            </div>

            {/* 얇은 비율 + 두께 게이지 */}
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                <div className="relative flex shrink-0 flex-col items-center">
                    <div className="relative">
                        <RatioRing percent={percent} />
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-white tabular-nums">
                            {percent}%
                        </span>
                    </div>
                    <span className="mt-1 max-w-[4.5rem] text-center text-[10px] font-bold leading-tight text-white/55 break-keep">
                        {t('thinRatioLabel')}
                    </span>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-end justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-white/50">{t('thinGaugeThinnest')}</p>
                            <p className="text-sm font-black text-amber-100 tabular-nums">{thinnestLabel}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-white/50">{t('thinGaugeMin')}</p>
                            <p className="text-sm font-black text-emerald-200 tabular-nums">{formatMm(minWallMm)}mm</p>
                        </div>
                    </div>
                    <div className="relative h-2.5 rounded-full">
                        <div className="absolute inset-y-0 left-0 w-1/2 rounded-l-full bg-gradient-to-r from-amber-500/70 to-amber-300/70" />
                        <div className="absolute inset-y-0 right-0 w-1/2 rounded-r-full bg-emerald-400/55" />
                        <div className="absolute left-1/2 top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
                        <div
                            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-200 bg-slate-950 shadow-[0_0_8px_rgba(251,191,36,0.45)]"
                            style={{ left: `${markerPos}%` }}
                        />
                    </div>
                    <div className="relative mt-1.5 h-3 text-[10px] font-bold text-white/40 tabular-nums">
                        <span className="absolute left-0">0</span>
                        <span className="absolute left-1/2 -translate-x-1/2">{formatMm(minWallMm)}</span>
                        <span className="absolute right-0">{formatMm(gaugeMax)}mm</span>
                    </div>
                </div>
            </div>

            {/* 품질 개선 제안 — 거절이 아니라 선택지 */}
            <div className="space-y-1.5">
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white/45">{t('thinFixesTitle')}</p>
                <ul className={cn('grid gap-1.5', remedies.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
                    {remedies.map(({ key, icon: Icon }) => (
                        <li
                            key={key}
                            className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-1.5 py-2 text-center"
                        >
                            <Icon className="h-4 w-4 text-amber-200" aria-hidden />
                            <span className="text-[10px] sm:text-[11px] font-black leading-tight text-white/85 break-keep">{t(key)}</span>
                        </li>
                    ))}
                </ul>
                <p className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[10px] sm:text-[11px] font-bold text-white/60 break-keep">
                    {t('thinReview')}
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <button
                    type="button"
                    onClick={onToggleThin}
                    aria-pressed={showThin}
                    className={cn(
                        'inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[11px] sm:text-xs font-black transition-colors',
                        showThin
                            ? 'border-sky-300/50 bg-sky-400 text-slate-900'
                            : 'border-sky-400/30 bg-sky-400/15 text-sky-200 hover:bg-sky-400/25'
                    )}
                >
                    {showThin ? <EyeOff className="w-3.5 h-3.5" aria-hidden /> : <Eye className="w-3.5 h-3.5" aria-hidden />}
                    {showThin ? t('thinHide') : t('thinShow')}
                </button>
                <Link
                    href="/guides/minimum-wall-thickness"
                    className="text-[11px] sm:text-xs font-black text-amber-200/90 hover:text-amber-100"
                >
                    {t('thinGuide')} →
                </Link>
            </div>
        </div>
    )
}
