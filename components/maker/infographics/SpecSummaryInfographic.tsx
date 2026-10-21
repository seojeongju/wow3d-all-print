'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { AlertTriangle, CheckCircle2, Info, Layers, Scale, ShieldCheck, Sparkles } from 'lucide-react'
import type { NameTagBuildResult, NameTagIssue } from '@/lib/name-tag/build'

type Props = {
    result: NameTagBuildResult | null
    issues: NameTagIssue[]
    hasText: boolean
    isCircle: boolean
    onFixBoldFont: () => void
    onFixBiggerPlate: () => void
    onToggleShowThin: () => void
    showThin: boolean
}

export function SpecSummaryInfographic({
    result,
    issues,
    hasText,
    isCircle,
    onFixBoldFont,
    onFixBiggerPlate,
    onToggleShowThin,
    showThin,
}: Props) {
    if (!hasText || !result) {
        return (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/40">
                    <Sparkles className="h-4 w-4" />
                </div>
                <p className="mt-2 text-[12px] font-bold text-white/60">문구를 입력하면 제작 사양이 자동 계산됩니다</p>
                <p className="mt-0.5 text-[11px] text-white/40">치수 · 예상 무게 · 3D 출력 안정성 검사</p>
            </div>
        )
    }

    const [w, h, z] = result.stats.sizeMm
    const volumeCm3 = result.stats.volumeMm3 / 1000
    // PLA 표준 밀도 약 1.24 g/cm3, 약 20% 인필 고려 실중량 추산
    const estimatedWeightG = Math.max(0.5, volumeCm3 * 1.24 * 0.85).toFixed(1)

    const hasError = issues.some((i) => i.level === 'error')
    const hasWarn = issues.some((i) => i.level === 'warn')

    const thinStrokeIssue = issues.find((i) => i.code === 'thin-stroke')
    const smallTextIssue = issues.find((i) => i.code === 'small-text')

    return (
        <div className="space-y-3 rounded-2xl border border-white/12 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-4 backdrop-blur-md shadow-lg">
            {/* 상단 헤더: 제작 사양 요약 & 출력 안정성 뱃지 */}
            <div className="flex items-center justify-between border-b border-white/8 pb-2.5">
                <div className="flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-teal-400" />
                    <span className="text-[12px] font-black uppercase tracking-wider text-white">3D 출력 사양 분석</span>
                </div>

                <div
                    className={cn(
                        'flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-black',
                        hasError
                            ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/40'
                            : hasWarn
                            ? 'bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40'
                            : 'bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/40'
                    )}
                >
                    {hasError ? (
                        <>
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>출력 불가 주의</span>
                        </>
                    ) : hasWarn ? (
                        <>
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>보완 권장</span>
                        </>
                    ) : (
                        <>
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>출력 최적 규격</span>
                        </>
                    )}
                </div>
            </div>

            {/* 인포그래픽 수치 그리드 */}
            <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-white/6 bg-black/30 p-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-white/50">
                        <span>완성 규격 (가로×세로×두께)</span>
                    </div>
                    <p className="mt-1 font-mono text-[14px] font-black text-white">
                        {w.toFixed(1)} <span className="text-white/40">×</span> {h.toFixed(1)}{' '}
                        <span className="text-white/40">×</span> {z.toFixed(1)} <span className="text-[11px] font-normal text-white/50">mm</span>
                    </p>
                </div>

                <div className="rounded-xl border border-white/6 bg-black/30 p-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-white/50">
                        <span>체적 & 실체감 무게</span>
                        <Scale className="h-3.5 w-3.5 text-teal-300/70" />
                    </div>
                    <p className="mt-1 font-mono text-[14px] font-black text-teal-300">
                        ~{estimatedWeightG}g <span className="text-[11px] font-normal text-white/50">({volumeCm3.toFixed(2)} cm³)</span>
                    </p>
                </div>
            </div>

            {/* 이슈/가이드 및 원클릭 해결 액션 버튼 */}
            {issues.length > 0 && (
                <div className="space-y-2 pt-1">
                    {thinStrokeIssue && (
                        <div className="flex flex-col gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-2.5 text-[11px] text-amber-200">
                            <div className="flex items-start gap-1.5 font-bold">
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                                <span>가는 획이 감지되어 출력 시 부러질 수 있습니다.</span>
                            </div>
                            <div className="flex items-center gap-1.5 self-end">
                                <button
                                    type="button"
                                    onClick={onFixBoldFont}
                                    className="rounded-lg bg-amber-400 px-2.5 py-1 text-[11px] font-black text-slate-950 shadow hover:bg-amber-300"
                                >
                                    굵은 폰트로 원클릭 변경
                                </button>
                                <button
                                    type="button"
                                    onClick={onToggleShowThin}
                                    className="rounded-lg border border-amber-400/40 bg-black/40 px-2 py-1 text-[11px] font-bold text-amber-200 hover:bg-black/60"
                                >
                                    {showThin ? '빨간선 숨기기' : '위험 부위 확인'}
                                </button>
                            </div>
                        </div>
                    )}

                    {smallTextIssue && !isCircle && (
                        <div className="flex flex-col gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-2.5 text-[11px] text-amber-200">
                            <div className="flex items-start gap-1.5 font-bold">
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                                <span>글자가 너무 작아 뭉개질 수 있습니다.</span>
                            </div>
                            <button
                                type="button"
                                onClick={onFixBiggerPlate}
                                className="self-end rounded-lg bg-teal-400 px-2.5 py-1 text-[11px] font-black text-slate-950 shadow hover:bg-teal-300"
                            >
                                판 크기 20% 키우기
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
