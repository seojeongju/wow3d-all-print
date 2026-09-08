'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useFileStore, useEffectiveAnalysis } from '@/store/useFileStore'
import {
    getScalePercentMax,
    SCALE_PERCENT_MIN,
    SCALE_PERCENT_STEP,
    scalePercentFromTargetMm,
} from '@/lib/model-transform'
import { maybeAutoFitMeshyScale } from '@/lib/model-analysis-runner'
import { RotateCcw, MoveDown, Maximize2 } from 'lucide-react'
import { assessPrintability } from '@/lib/printability'
import { MESHY_AI_DISCLAIMER, MESHY_AI_DISCLAIMER_EN } from '@/lib/meshy-disclaimer'
import { cn } from '@/lib/utils'

/**
 * 자동견적 뷰어용 모델 컨트롤
 * - 균일 스케일(%) 직접 입력 + 치수(mm) 직접 입력
 * - 90° 축 회전 / 축 정렬(리셋)
 * - 바닥에 붙이기
 */
export default function ModelTransformPanel({ className }: { className?: string }) {
    const t = useTranslations('Quote')
    const locale = useLocale()
    const file = useFileStore((s) => s.file)
    const fileSource = useFileStore((s) => s.fileSource)
    const baseAnalysis = useFileStore((s) => s.baseAnalysis)
    const transform = useFileStore((s) => s.transform)
    const setScalePercent = useFileStore((s) => s.setScalePercent)
    const rotateAxis90 = useFileStore((s) => s.rotateAxis90)
    const setSnapToBed = useFileStore((s) => s.setSnapToBed)
    const alignAxes = useFileStore((s) => s.alignAxes)
    const resetTransform = useFileStore((s) => s.resetTransform)
    const meshyFitScalePercent = useFileStore((s) => s.meshyFitScalePercent)
    const meshyFitTargetMm = useFileStore((s) => s.meshyFitTargetMm)
    const printMethodForFit = useFileStore((s) => s.printMethodForFit)
    const bedMaxForFit = useFileStore((s) => s.bedMaxForFit)
    const effective = useEffectiveAnalysis()

    const [scaleDraft, setScaleDraft] = useState(String(transform.scalePercent))
    const [dimDraft, setDimDraft] = useState({ x: '', y: '', z: '' })
    const isAiPhoto = fileSource.kind === 'meshy-photo'
    const scaleMax = getScalePercentMax(fileSource.kind)

    useEffect(() => {
        if (!isAiPhoto || !baseAnalysis) return
        maybeAutoFitMeshyScale()
    }, [isAiPhoto, baseAnalysis, printMethodForFit, bedMaxForFit])

    useEffect(() => {
        setScaleDraft(String(transform.scalePercent))
    }, [transform.scalePercent])

    useEffect(() => {
        if (!effective) return
        setDimDraft({
            x: effective.boundingBox.x.toFixed(2),
            y: effective.boundingBox.y.toFixed(2),
            z: effective.boundingBox.z.toFixed(2),
        })
    }, [effective?.boundingBox.x, effective?.boundingBox.y, effective?.boundingBox.z])

    if (!file || !baseAnalysis || !effective) return null

    const box = effective.boundingBox

    const commitScalePercent = (raw: string) => {
        const n = Number(raw)
        if (!Number.isFinite(n)) {
            setScaleDraft(String(transform.scalePercent))
            return
        }
        setScalePercent(n, { fromUser: true })
    }

    const commitAxisMm = (axis: 'x' | 'y' | 'z', raw: string) => {
        const n = Number(raw)
        if (!Number.isFinite(n) || n <= 0) {
            setDimDraft((d) => ({ ...d, [axis]: box[axis].toFixed(2) }))
            return
        }
        const next = scalePercentFromTargetMm(baseAnalysis, transform, axis, n, scaleMax)
        setScalePercent(next, { fromUser: true })
    }

    return (
        <div
            className={cn(
                'pointer-events-auto w-[min(100%,340px)] rounded-2xl border border-white/15 bg-black/70 backdrop-blur-xl shadow-2xl p-3 sm:p-4 space-y-3',
                className
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <Maximize2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70 truncate">
                        Model Adjust
                    </span>
                </div>
                <button
                    type="button"
                    onClick={resetTransform}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black text-white/50 hover:text-teal-300 hover:bg-white/5 transition-colors"
                    title={t('transformResetTitle')}
                >
                    <RotateCcw className="w-3 h-3" />
                    {t('transformReset')}
                </button>
            </div>

            {isAiPhoto && (
                <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-2.5 py-2 text-[10px] font-bold text-amber-100/90 leading-relaxed break-keep space-y-1.5">
                    <p className="text-amber-50">
                        {locale === 'en' ? MESHY_AI_DISCLAIMER_EN : MESHY_AI_DISCLAIMER}
                    </p>
                    <p>
                        {t('transformPhotoHintBefore')}{' '}
                        <strong className="text-amber-50">{t('transformPhotoHintStrong')}</strong>{' '}
                        {t('transformPhotoHintAfter')}
                    </p>
                    {meshyFitScalePercent != null && meshyFitTargetMm != null && (
                        <p className="text-teal-100">
                            {t('transformMeshyFitHint', {
                                method: printMethodForFit.toUpperCase(),
                                mm: meshyFitTargetMm,
                                percent: meshyFitScalePercent,
                            })}
                        </p>
                    )}
                    {assessPrintability(effective).map((w) => (
                        <p
                            key={w.message}
                            className={
                                w.level === 'warn' ? 'text-amber-50' : 'text-amber-100/80'
                            }
                        >
                            · {w.message}
                        </p>
                    ))}
                </div>
            )}

            {/* 스케일 % 직접 입력 */}
            <div className="space-y-1.5">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <span className="text-[11px] font-bold text-white/55 shrink-0">
                        {t('transformScaleLabel')}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min={SCALE_PERCENT_MIN}
                            max={scaleMax}
                            step={SCALE_PERCENT_STEP}
                            value={scaleDraft}
                            onChange={(e) => setScaleDraft(e.target.value.replace(/[^\d]/g, ''))}
                            onBlur={() => commitScalePercent(scaleDraft)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.currentTarget.blur()
                                }
                            }}
                            className="min-w-[5.5rem] w-[6.5rem] rounded-lg border border-white/15 bg-black/40 px-2.5 py-1 text-right font-mono text-[12px] tabular-nums text-teal-300 outline-none focus:border-teal-400/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            aria-label={t('transformScaleAria')}
                        />
                        <span className="text-teal-300/80 text-[11px] font-bold">%</span>
                    </div>
                </div>
                <p className="text-[9px] text-white/35 font-bold leading-relaxed break-keep">
                    {t('transformScaleHint')}
                </p>
            </div>

            {/* 치수 mm 직접 입력 */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white/55">{t('transformDimLabel')}</span>
                    <span className="text-[9px] font-bold text-white/30">{t('transformDimUniform')}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                    {(['x', 'y', 'z'] as const).map((axis) => (
                        <label
                            key={axis}
                            className="rounded-xl border border-white/10 bg-white/5 px-1.5 py-1.5 focus-within:border-teal-400/40"
                        >
                            <div className="text-[8px] font-black text-teal-400/80 uppercase text-center mb-1">
                                {axis}
                            </div>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={dimDraft[axis]}
                                onChange={(e) =>
                                    setDimDraft((d) => ({
                                        ...d,
                                        [axis]: e.target.value.replace(/[^\d.]/g, ''),
                                    }))
                                }
                                onBlur={() => commitAxisMm(axis, dimDraft[axis])}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') e.currentTarget.blur()
                                }}
                                className="w-full min-w-0 bg-transparent text-center font-mono text-[11px] tabular-nums text-white/90 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                aria-label={t('transformDimAria', { axis: axis.toUpperCase() })}
                            />
                        </label>
                    ))}
                </div>
                <p className="text-[9px] text-white/35 font-bold leading-relaxed break-keep">
                    {t('transformDimHint')}
                </p>
            </div>

            {/* 90° 회전 */}
            <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-white/55">{t('transformRotate90')}</span>
                <div className="grid grid-cols-3 gap-1.5">
                    {(
                        [
                            { axis: 'x' as const, label: 'X', value: transform.rotX },
                            { axis: 'y' as const, label: 'Y', value: transform.rotY },
                            { axis: 'z' as const, label: 'Z', value: transform.rotZ },
                        ] as const
                    ).map((item) => (
                        <button
                            key={item.axis}
                            type="button"
                            onClick={() => rotateAxis90(item.axis, 90)}
                            className="rounded-xl border border-white/10 bg-white/5 hover:border-teal-400/40 hover:bg-teal-400/10 px-2 py-2 text-center transition-all active:scale-95"
                            title={t('transformRotateAxisTitle', { axis: item.label })}
                        >
                            <div className="text-[10px] font-black text-teal-300/90">{item.label}</div>
                            <div className="text-[11px] font-mono font-bold text-white/80 mt-0.5">
                                {item.value}°
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* 바닥 붙이기 + 축 정렬 */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setSnapToBed(!transform.snapToBed)}
                    className={cn(
                        'flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-[10px] font-black transition-all active:scale-95',
                        transform.snapToBed
                            ? 'border-teal-400/50 bg-teal-400/15 text-teal-300'
                            : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                    )}
                >
                    <MoveDown className="w-3.5 h-3.5" />
                    {t('transformSnapFloor')}
                </button>
                <button
                    type="button"
                    onClick={alignAxes}
                    className="shrink-0 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-[10px] font-black text-white/55 hover:text-white transition-all active:scale-95"
                    title={t('transformAlignAxesTitle')}
                >
                    {t('transformAlignAxes')}
                </button>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 px-2.5 py-2 text-[10px] font-bold text-white/45 space-y-1">
                <div className="flex justify-between gap-2">
                    <span>{t('transformAppliedDims')}</span>
                    <span className="font-mono text-white/75">
                        {box.x.toFixed(1)} × {box.y.toFixed(1)} × {box.z.toFixed(1)} mm
                    </span>
                </div>
                <div className="flex justify-between gap-2">
                    <span>{t('transformMeshVolume')}</span>
                    <span className="font-mono text-white/75">{effective.volume.toFixed(2)} cm³</span>
                </div>
            </div>
        </div>
    )
}
