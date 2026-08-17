'use client'

import { Slider } from '@/components/ui/slider'
import type { BasePlateType } from '@/lib/maker-geometry'
import type { MakerTemplateId } from '@/lib/maker-templates'
import { cn } from '@/lib/utils'

const BADGE_PRESETS = [25, 40, 50, 58] as const
const KEYCAP_PRESETS = [16, 18, 19] as const

type Props = {
    basePlateType: BasePlateType
    baseSizeMm: number
    activeTemplateId: MakerTemplateId | null
    onChange: (mm: number) => void
}

function sizeLabel(basePlateType: BasePlateType, activeTemplateId: MakerTemplateId | null): string {
    if (activeTemplateId === 'keycap-1u') return '키캡 한 변'
    if (basePlateType === 'circle') return '배지 지름'
    return '배지 한 변'
}

function sizeHint(basePlateType: BasePlateType, activeTemplateId: MakerTemplateId | null): string {
    if (activeTemplateId === 'keycap-1u') return 'Cherry MX 1U 기준은 18mm입니다.'
    if (basePlateType === 'circle') return '원형 배지의 지름(Ø)입니다. 로고도 함께 맞춰집니다.'
    return '사각·라운드 판의 한 변 길이입니다. 로고도 함께 맞춰집니다.'
}

function formatValue(mm: number, basePlateType: BasePlateType, activeTemplateId: MakerTemplateId | null): string {
    if (activeTemplateId === 'keycap-1u') return `${mm}mm`
    if (basePlateType === 'circle') return `Ø${mm}mm`
    return `${mm}×${mm}mm`
}

export function MakerSizeControl({
    basePlateType,
    baseSizeMm,
    activeTemplateId,
    onChange,
}: Props) {
    if (basePlateType === 'none') return null

    const isKeycap = activeTemplateId === 'keycap-1u'
    const presets = isKeycap ? KEYCAP_PRESETS : BADGE_PRESETS
    const min = isKeycap ? 14 : 15
    const max = isKeycap ? 22 : 80
    const label = sizeLabel(basePlateType, activeTemplateId)
    const clamped = Math.min(max, Math.max(min, baseSizeMm))

    return (
        <div className="rounded-2xl border border-teal-400/30 bg-teal-500/10 p-4 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-1">
                <label className="text-[12px] font-black text-white">{label}</label>
                <span className="text-[13px] font-black text-teal-200 tabular-nums">
                    {formatValue(clamped, basePlateType, activeTemplateId)}
                </span>
            </div>
            <p className="text-[11px] font-bold text-white/75 leading-relaxed break-keep mb-3">
                {sizeHint(basePlateType, activeTemplateId)}
            </p>

            <div className="flex flex-wrap gap-1.5 mb-3">
                {presets.map((mm) => (
                    <button
                        key={mm}
                        type="button"
                        onClick={() => onChange(mm)}
                        className={cn(
                            'h-8 min-w-[3rem] px-2 rounded-lg border text-[11px] font-black transition-colors',
                            clamped === mm
                                ? 'bg-teal-500 border-teal-400 text-slate-950'
                                : 'bg-white/10 border-white/25 text-white hover:bg-white/20'
                        )}
                    >
                        {basePlateType === 'circle' && !isKeycap ? `Ø${mm}` : `${mm}`}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3">
                <div className="flex-1 px-0.5">
                    <Slider
                        value={[clamped]}
                        min={min}
                        max={max}
                        step={1}
                        onValueChange={([v]) => onChange(v)}
                        className="cursor-pointer accent-teal-400 bg-white/25"
                    />
                </div>
                <input
                    type="number"
                    min={min}
                    max={max}
                    step={1}
                    value={clamped}
                    onChange={(e) => {
                        const n = Number(e.target.value)
                        if (Number.isFinite(n)) onChange(n)
                    }}
                    className="w-14 shrink-0 rounded-lg border border-white/20 bg-black/40 px-2 py-1.5 text-right font-mono text-[12px] font-bold text-teal-200 outline-none focus:border-teal-400/60"
                    aria-label={`${label} (mm)`}
                />
            </div>
            <p className="mt-2 text-[10px] font-bold text-white/65">
                {isKeycap ? `조절 범위 ${min}–${max}mm` : `조절 범위 ${min}–${max}mm · 흔히 쓰는 크기 버튼을 먼저 눌러 보세요`}
            </p>
        </div>
    )
}
