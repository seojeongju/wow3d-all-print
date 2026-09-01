'use client'

import { useEffect, useState, useCallback } from 'react'
import { useFileStore, useEffectiveAnalysis } from '@/store/useFileStore'
import {
    aiPhotoSliderMaxPercent,
    getScalePercentMax,
    SCALE_PERCENT_MAX,
    SCALE_PERCENT_MIN,
    SCALE_PERCENT_STEP,
    scalePercentFromTargetMm,
} from '@/lib/model-transform'
import { maybeAutoFitMeshyScale } from '@/lib/model-analysis-runner'
import { RotateCcw, MoveDown, Maximize2 } from 'lucide-react'
import { assessPrintability } from '@/lib/printability'
import { MESHY_AI_DISCLAIMER } from '@/lib/meshy-disclaimer'
import { cn } from '@/lib/utils'

/**
 * 자동견적 뷰어용 모델 컨트롤
 * - 균일 스케일(%) + 치수(mm) 직접 입력
 * - 90° 축 회전 / 축 정렬(리셋)
 * - 바닥에 붙이기
 */
export default function ModelTransformPanel({ className }: { className?: string }) {
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
    const [sliderRangeMax, setSliderRangeMax] = useState(SCALE_PERCENT_MAX)
    /** 드래그 중에는 max를 고정하지 않으면 값 변경마다 막대 범위가 바뀌어 썸이 점프한다 */
    const [dragSliderMax, setDragSliderMax] = useState<number | null>(null)
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
        if (dragSliderMax !== null) return
        if (!isAiPhoto) {
            setSliderRangeMax(SCALE_PERCENT_MAX)
            return
        }
        setSliderRangeMax(aiPhotoSliderMaxPercent(transform.scalePercent, scaleMax))
    }, [dragSliderMax, isAiPhoto, transform.scalePercent, scaleMax])

    useEffect(() => {
        setDragSliderMax(null)
    }, [file])

    useEffect(() => {
        if (!effective) return
        setDimDraft({
            x: effective.boundingBox.x.toFixed(2),
            y: effective.boundingBox.y.toFixed(2),
            z: effective.boundingBox.z.toFixed(2),
        })
    }, [effective?.boundingBox.x, effective?.boundingBox.y, effective?.boundingBox.z])

    const beginSliderDrag = useCallback(() => {
        window.getSelection()?.removeAllRanges()
        document.body.classList.add('select-none')
        if (isAiPhoto) {
            setDragSliderMax(aiPhotoSliderMaxPercent(transform.scalePercent, scaleMax))
        }
    }, [isAiPhoto, transform.scalePercent, scaleMax])

    const endSliderDrag = useCallback(() => {
        document.body.classList.remove('select-none')
        setDragSliderMax(null)
    }, [])

    if (!file || !baseAnalysis || !effective) return null

    const box = effective.boundingBox
    const sliderMax = isAiPhoto ? (dragSliderMax ?? sliderRangeMax) : SCALE_PERCENT_MAX
    const sliderValue = Math.min(transform.scalePercent, sliderMax)
    const scalePresets = isAiPhoto && meshyFitScalePercent
        ? [...new Set([50, 100, 150, 200, meshyFitScalePercent].filter((p) => p <= scaleMax))].sort(
              (a, b) => a - b
          )
        : [50, 100, 150, 200]

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
                    title="스케일·회전 초기화"
                >
                    <RotateCcw className="w-3 h-3" />
                    초기화
                </button>
            </div>

            {isAiPhoto && (
                <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-2.5 py-2 text-[10px] font-bold text-amber-100/90 leading-relaxed break-keep space-y-1.5">
                    <p className="text-amber-50">{MESHY_AI_DISCLAIMER}</p>
                    <p>
                        아래 <strong className="text-amber-50">치수(mm)</strong>로 실제 길이에 맞추세요.
                        정밀 공차는 STL 직접 업로드를 권장합니다.
                    </p>
                    {meshyFitScalePercent != null && meshyFitTargetMm != null && (
                        <p className="text-teal-100">
                            · 기본 참고 크기: {printMethodForFit.toUpperCase()} 최대 출력의 약 절반(최장축 ≈{' '}
                            {meshyFitTargetMm}mm, {meshyFitScalePercent}%)으로 맞춰 두었습니다. 견적·실물 크기는
                            mm로 다시 조절해 주세요.
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

            {/* 스케일 */}
            <div className="space-y-2">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <span className="text-[11px] font-bold text-white/55 shrink-0">균일 스케일</span>
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
                            aria-label="스케일 퍼센트 직접 입력"
                        />
                        <span className="text-teal-300/80 text-[11px] font-bold">%</span>
                    </div>
                </div>
                <input
                    type="range"
                    min={SCALE_PERCENT_MIN}
                    max={sliderMax}
                    step={SCALE_PERCENT_STEP}
                    value={sliderValue}
                    onPointerDown={beginSliderDrag}
                    onPointerUp={endSliderDrag}
                    onPointerCancel={endSliderDrag}
                    onChange={(e) => setScalePercent(Number(e.target.value), { fromUser: true })}
                    className="w-full accent-teal-400 h-1.5 cursor-pointer touch-none select-none"
                    aria-label="모델 균일 스케일"
                    aria-valuemin={SCALE_PERCENT_MIN}
                    aria-valuemax={sliderMax}
                    aria-valuenow={sliderValue}
                />
                <div className="flex flex-wrap gap-1.5">
                    {scalePresets.map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setScalePercent(p, { fromUser: true })}
                            className={cn(
                                'rounded-md px-2 py-0.5 text-[10px] font-black transition-colors tabular-nums',
                                p >= 1000 && 'text-[9px] px-1.5',
                                transform.scalePercent === p
                                    ? 'bg-teal-500 text-slate-950'
                                    : 'bg-white/5 text-white/45 hover:bg-white/10 hover:text-white/80'
                            )}
                        >
                            {p}%
                        </button>
                    ))}
                </div>
            </div>

            {/* 치수 mm 직접 입력 */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white/55">치수 직접 입력 (mm)</span>
                    <span className="text-[9px] font-bold text-white/30">균일 스케일</span>
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
                                aria-label={`${axis.toUpperCase()}축 치수(mm)`}
                            />
                        </label>
                    ))}
                </div>
                <p className="text-[9px] text-white/35 font-bold leading-relaxed break-keep">
                    한 축을 바꾸면 비율을 유지한 채 전체가 함께 커지거나 작아집니다.
                </p>
            </div>

            {/* 90° 회전 */}
            <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-white/55">90° 회전</span>
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
                            title={`${item.label}축 90° 회전`}
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
                    바닥에 붙이기
                </button>
                <button
                    type="button"
                    onClick={alignAxes}
                    className="shrink-0 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-[10px] font-black text-white/55 hover:text-white transition-all active:scale-95"
                    title="회전을 0°로 맞춰 축 정렬"
                >
                    축 정렬
                </button>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 px-2.5 py-2 text-[10px] font-bold text-white/45 space-y-1">
                <div className="flex justify-between gap-2">
                    <span>적용 치수</span>
                    <span className="font-mono text-white/75">
                        {box.x.toFixed(1)} × {box.y.toFixed(1)} × {box.z.toFixed(1)} mm
                    </span>
                </div>
                <div className="flex justify-between gap-2">
                    <span>메쉬 부피</span>
                    <span className="font-mono text-white/75">{effective.volume.toFixed(2)} cm³</span>
                </div>
            </div>
        </div>
    )
}
