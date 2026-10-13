'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Loader2, Undo2, Wrench } from 'lucide-react'
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

const EMPTY = new Float32Array(0)

export type QuoteThinState =
    | { status: 'measuring' }
    | { status: 'ok'; method: PrintMethodKey; minWallMm: number; summary: ThicknessSummary; warn: boolean }
    | null

/** 현재 파일·출력 방식·배율 기준 얇은 벽 집계 */
export function useQuoteThinState(): QuoteThinState {
    const file = useFileStore((s) => s.file)
    const method = useFileStore((s) => s.printMethodForFit)
    const scalePercent = useFileStore((s) => s.transform.scalePercent)
    const thickness = useQuoteFileHealthStore((s) => s.thickness)

    return useMemo(() => {
        if (!file || !thickness || thickness.file !== file) return null
        if (thickness.status === 'measuring') return { status: 'measuring' }
        if (thickness.status !== 'ok') return null
        const minWallMm = MIN_WALL_MM[method] ?? MIN_WALL_MM.fdm
        const summary = summarizeThickness(thickness.result, minWallMm, scalePercent / 100)
        const warn = summary.thinCount >= THIN_WARN_MIN_COUNT && summary.thinRatio >= THIN_WARN_MIN_RATIO
        return { status: 'ok', method, minWallMm, summary, warn }
    }, [file, thickness, method, scalePercent])
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

    const fixes: string[] = []
    if (repair) {
        const r = repair.report
        if (r.holesFilled > 0) fixes.push(t('fixHoles', { count: r.holesFilled }))
        if (r.stitchedVertices > 0) fixes.push(t('fixStitched', { count: r.stitchedVertices }))
        if (r.internalFacesRemoved > 0) fixes.push(t('fixInternal', { count: r.internalFacesRemoved }))
        if (r.duplicateRemoved + r.degenerateRemoved > 0) {
            fixes.push(t('fixDuplicates', { count: r.duplicateRemoved + r.degenerateRemoved }))
        }
        if (r.flippedFixed > 0) fixes.push(t('fixFlipped', { count: r.flippedFixed }))
    }

    return (
        <div className="space-y-3">
            {viewingRepaired && repair ? (
                <div className="rounded-2xl border border-teal-400/30 bg-teal-500/10 px-4 py-3.5 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                        <Wrench className="w-4 h-4 mt-0.5 shrink-0 text-teal-300" aria-hidden />
                        <div className="min-w-0 space-y-1">
                            <p className="text-xs sm:text-sm font-black text-white break-keep">{t('repairedTitle')}</p>
                            <p className="text-[11px] sm:text-xs font-bold text-teal-100/80 leading-relaxed break-keep">
                                {t('repairedDesc')}
                            </p>
                        </div>
                    </div>
                    {fixes.length > 0 ? (
                        <ul className="flex flex-wrap gap-1.5 pl-6">
                            {fixes.map((fix) => (
                                <li
                                    key={fix}
                                    className="rounded-full border border-teal-300/25 bg-teal-400/10 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-black text-teal-100/90"
                                >
                                    {fix}
                                </li>
                            ))}
                        </ul>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-6">
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
                <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3.5 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" aria-hidden />
                        <div className="min-w-0 space-y-1">
                            <p className="text-xs sm:text-sm font-black text-white break-keep">
                                {t('thinTitle', { method: thin.method.toUpperCase(), min: formatMm(thin.minWallMm) })}
                            </p>
                            <p className="text-[11px] sm:text-xs font-bold text-amber-100/80 leading-relaxed break-keep">
                                {t('thinDesc', {
                                    ratio: Math.max(1, Math.round(thin.summary.thinRatio * 100)),
                                    min: formatMm(thin.minWallMm),
                                    thinnest: formatMm(thin.summary.minMm ?? 0),
                                })}
                            </p>
                            <p className="text-[11px] sm:text-xs font-bold text-white/55 leading-relaxed break-keep">
                                {thin.method === 'fdm' ? t('thinAdviceFdm') : t('thinAdviceResin')}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-6">
                        <button
                            type="button"
                            onClick={() => setShowThin(!showThin)}
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
