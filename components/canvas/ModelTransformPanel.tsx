'use client'

import { useFileStore, useEffectiveAnalysis } from '@/store/useFileStore'
import {
    SCALE_PERCENT_MAX,
    SCALE_PERCENT_MIN,
    SCALE_PERCENT_STEP,
} from '@/lib/model-transform'
import { RotateCcw, MoveDown, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 자동견적 뷰어용 모델 컨트롤
 * - 균일 스케일(%): 견적 부피·면적·치수 연동
 * - 90° 축 회전 / 축 정렬(리셋)
 * - 바닥에 붙이기
 */
export default function ModelTransformPanel({ className }: { className?: string }) {
    const file = useFileStore((s) => s.file)
    const baseAnalysis = useFileStore((s) => s.baseAnalysis)
    const transform = useFileStore((s) => s.transform)
    const setScalePercent = useFileStore((s) => s.setScalePercent)
    const rotateAxis90 = useFileStore((s) => s.rotateAxis90)
    const setSnapToBed = useFileStore((s) => s.setSnapToBed)
    const alignAxes = useFileStore((s) => s.alignAxes)
    const resetTransform = useFileStore((s) => s.resetTransform)
    const effective = useEffectiveAnalysis()

    if (!file || !baseAnalysis || !effective) return null

    const box = effective.boundingBox

    return (
        <div
            className={cn(
                'pointer-events-auto w-[min(100%,320px)] rounded-2xl border border-white/15 bg-black/70 backdrop-blur-xl shadow-2xl p-3 sm:p-4 space-y-3',
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

            {/* 스케일 */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-white/55">균일 스케일</span>
                    <span className="font-mono text-teal-300">{transform.scalePercent}%</span>
                </div>
                <input
                    type="range"
                    min={SCALE_PERCENT_MIN}
                    max={SCALE_PERCENT_MAX}
                    step={SCALE_PERCENT_STEP}
                    value={transform.scalePercent}
                    onChange={(e) => setScalePercent(Number(e.target.value))}
                    className="w-full accent-teal-400 h-1.5 cursor-pointer"
                    aria-label="모델 균일 스케일"
                />
                <div className="flex flex-wrap gap-1.5">
                    {[50, 100, 150, 200].map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setScalePercent(p)}
                            className={cn(
                                'rounded-md px-2 py-0.5 text-[10px] font-black transition-colors',
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

            <div className="rounded-xl bg-white/5 border border-white/10 px-2.5 py-2 text-[10px] font-bold text-white/45 space-y-0.5">
                <div className="flex justify-between gap-2">
                    <span>치수 (mm)</span>
                    <span className="font-mono text-white/75">
                        {box.x.toFixed(1)} × {box.y.toFixed(1)} × {box.z.toFixed(1)}
                    </span>
                </div>
                <div className="flex justify-between gap-2">
                    <span>부피</span>
                    <span className="font-mono text-white/75">{effective.volume.toFixed(2)} cm³</span>
                </div>
            </div>
        </div>
    )
}
