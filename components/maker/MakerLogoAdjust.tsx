'use client'

import { Move, RotateCw, Maximize2, RotateCcw, Box } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

export type LogoAdjustItem = {
    id: string
    name: string
    scale: number
    offsetXMm: number
    offsetYMm: number
    rotationDeg: number
}

type Props = {
    items: LogoAdjustItem[]
    selectedId: string | null
    onSelect: (id: string) => void
    baseSizeMm: number
    extrusionHeight: number
    onExtrusionChange: (mm: number) => void
    onChange: (id: string, patch: Partial<Pick<LogoAdjustItem, 'scale' | 'offsetXMm' | 'offsetYMm' | 'rotationDeg'>>) => void
    onReset: (id: string) => void
    onRemove: (id: string) => void
}

const EXTRUDE_PRESETS = [0.8, 1.2, 2, 3, 5] as const

export function MakerLogoAdjust({
    items,
    selectedId,
    onSelect,
    baseSizeMm,
    extrusionHeight,
    onExtrusionChange,
    onChange,
    onReset,
    onRemove,
}: Props) {
    if (items.length === 0) return null

    const active = items.find((i) => i.id === selectedId) ?? items[0]
    const maxOffset = Math.max(8, Math.round(baseSizeMm * 0.45))

    return (
        <div className="rounded-2xl border border-teal-400/35 bg-teal-500/10 p-4 shadow-xl space-y-4">
            <div>
                <h3 className="font-bold text-[13px] text-white flex items-center gap-2 uppercase tracking-[0.12em]">
                    <Box className="w-4 h-4 text-teal-300" />
                    로고 크기 · 돌출
                </h3>
                <p className="text-[11px] font-bold text-white/80 leading-relaxed break-keep mt-1.5">
                    크기·위치를 맞춘 뒤 <strong className="text-teal-200">돌출 높이(mm)</strong>로 두께를 정합니다. 결과물(3D)에 바로 반영됩니다.
                </p>
            </div>

            {items.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                    {items.map((it) => (
                        <button
                            key={it.id}
                            type="button"
                            onClick={() => onSelect(it.id)}
                            className={cn(
                                'h-8 max-w-[9rem] truncate rounded-lg border px-2.5 text-[11px] font-bold transition-colors',
                                active.id === it.id
                                    ? 'bg-teal-500 border-teal-400 text-slate-950'
                                    : 'bg-white/10 border-white/25 text-white hover:bg-white/20'
                            )}
                            title={it.name}
                        >
                            {it.name}
                        </button>
                    ))}
                </div>
            )}

            <div className="space-y-4 rounded-xl border border-teal-400/25 bg-black/30 p-3">
                {/* 돌출 높이 — 최상단 강조 */}
                <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[12px] font-black text-amber-100 flex items-center gap-1.5">
                            <Box className="w-3.5 h-3.5" />
                            돌출 높이
                        </label>
                        <span className="text-[13px] font-black text-amber-200 tabular-nums">
                            {extrusionHeight.toFixed(1)}mm
                        </span>
                    </div>
                    <Slider
                        value={[extrusionHeight]}
                        min={0.4}
                        max={12}
                        step={0.1}
                        onValueChange={([v]) => onExtrusionChange(v)}
                        className="cursor-pointer accent-amber-400 bg-white/25"
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {EXTRUDE_PRESETS.map((mm) => (
                            <button
                                key={mm}
                                type="button"
                                onClick={() => onExtrusionChange(mm)}
                                className={cn(
                                    'h-7 rounded-md border px-2 text-[10px] font-black',
                                    Math.abs(extrusionHeight - mm) < 0.05
                                        ? 'bg-amber-400 border-amber-300 text-slate-950'
                                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                )}
                            >
                                {mm}mm
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[12px] font-bold text-white/90 flex items-center gap-1.5">
                            <Maximize2 className="w-3.5 h-3.5 text-teal-300" />
                            평면 크기
                        </label>
                        <span className="text-[12px] font-black text-teal-200 tabular-nums">
                            {Math.round(active.scale * 100)}%
                        </span>
                    </div>
                    <Slider
                        value={[Math.round(active.scale * 100)]}
                        min={20}
                        max={140}
                        step={1}
                        onValueChange={([v]) => onChange(active.id, { scale: v / 100 })}
                        className="cursor-pointer accent-teal-400 bg-white/25"
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {[40, 60, 80, 100].map((pct) => (
                            <button
                                key={pct}
                                type="button"
                                onClick={() => onChange(active.id, { scale: pct / 100 })}
                                className={cn(
                                    'h-7 rounded-md border px-2 text-[10px] font-black',
                                    Math.round(active.scale * 100) === pct
                                        ? 'bg-teal-500 border-teal-400 text-slate-950'
                                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                )}
                            >
                                {pct}%
                            </button>
                        ))}
                    </div>
                    <p className="mt-1.5 text-[10px] font-bold text-white/65 break-keep">
                        배지 밖으로 나가거나 어둡게 가려 보이면 크기를 줄이세요.
                    </p>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[12px] font-bold text-white/90 flex items-center gap-1.5">
                            <Move className="w-3.5 h-3.5 text-teal-300" />
                            좌우 이동
                        </label>
                        <span className="text-[12px] font-black text-teal-200 tabular-nums">
                            {active.offsetXMm > 0 ? '+' : ''}{active.offsetXMm.toFixed(1)}mm
                        </span>
                    </div>
                    <Slider
                        value={[active.offsetXMm]}
                        min={-maxOffset}
                        max={maxOffset}
                        step={0.5}
                        onValueChange={([v]) => onChange(active.id, { offsetXMm: v })}
                        className="cursor-pointer accent-teal-400 bg-white/25"
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[12px] font-bold text-white/90 flex items-center gap-1.5">
                            <Move className="w-3.5 h-3.5 text-teal-300 rotate-90" />
                            위아래 이동
                        </label>
                        <span className="text-[12px] font-black text-teal-200 tabular-nums">
                            {active.offsetYMm > 0 ? '+' : ''}{active.offsetYMm.toFixed(1)}mm
                        </span>
                    </div>
                    <Slider
                        value={[active.offsetYMm]}
                        min={-maxOffset}
                        max={maxOffset}
                        step={0.5}
                        onValueChange={([v]) => onChange(active.id, { offsetYMm: v })}
                        className="cursor-pointer accent-teal-400 bg-white/25"
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[12px] font-bold text-white/90 flex items-center gap-1.5">
                            <RotateCw className="w-3.5 h-3.5 text-teal-300" />
                            회전
                        </label>
                        <span className="text-[12px] font-black text-teal-200 tabular-nums">
                            {Math.round(active.rotationDeg)}°
                        </span>
                    </div>
                    <Slider
                        value={[active.rotationDeg]}
                        min={-180}
                        max={180}
                        step={1}
                        onValueChange={([v]) => onChange(active.id, { rotationDeg: v })}
                        className="cursor-pointer accent-teal-400 bg-white/25"
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {[0, 90, -90, 180].map((deg) => (
                            <button
                                key={deg}
                                type="button"
                                onClick={() => onChange(active.id, { rotationDeg: deg })}
                                className={cn(
                                    'h-7 rounded-md border px-2 text-[10px] font-black',
                                    Math.round(active.rotationDeg) === deg
                                        ? 'bg-teal-500 border-teal-400 text-slate-950'
                                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                )}
                            >
                                {deg > 0 ? `+${deg}°` : `${deg}°`}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2 pt-1">
                    <button
                        type="button"
                        onClick={() => onReset(active.id)}
                        className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-white/25 bg-white/10 text-[11px] font-black text-white hover:bg-white/20"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        위치·크기 초기화
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (window.confirm(`"${active.name}"을(를) 삭제할까요?`)) onRemove(active.id)
                        }}
                        className="h-9 rounded-xl border border-red-400/40 bg-red-500/15 px-3 text-[11px] font-black text-red-200 hover:bg-red-500/25"
                    >
                        삭제
                    </button>
                </div>
            </div>
        </div>
    )
}
