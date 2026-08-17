'use client'

import { Check, X } from 'lucide-react'

const GOOD = [
    '물체가 화면 중앙에 크게',
    '단색·밝은 배경',
    '정면 또는 살짝 사선',
    '그림자·반사 최소화',
]

const BAD = [
    '여러 물체가 한 장에',
    '복잡한 배경·손·테이블 혼잡',
    '너무 어둡거나 흐림',
    '극단적 클로즈업·잘림',
]

/** 사진→AI 3D 촬영·업로드 가이드 */
export function PhotoTo3DGuide() {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-white/40">
                촬영 가이드
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-teal-400/20 bg-teal-500/5 p-3 space-y-2">
                    <p className="text-[12px] font-black text-teal-200">좋은 예</p>
                    <ul className="space-y-1.5">
                        {GOOD.map((t) => (
                            <li key={t} className="flex items-start gap-2 text-[11px] font-bold text-white/70 leading-snug break-keep">
                                <Check className="w-3.5 h-3.5 text-teal-300 shrink-0 mt-0.5" />
                                {t}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-xl border border-red-400/20 bg-red-500/5 p-3 space-y-2">
                    <p className="text-[12px] font-black text-red-200">피하세요</p>
                    <ul className="space-y-1.5">
                        {BAD.map((t) => (
                            <li key={t} className="flex items-start gap-2 text-[11px] font-bold text-white/70 leading-snug break-keep">
                                <X className="w-3.5 h-3.5 text-red-300 shrink-0 mt-0.5" />
                                {t}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <p className="text-[11px] font-bold text-white/45 leading-relaxed break-keep">
                결과는 시제품·형상 확인용입니다. 정밀 치수·조립 공차는 3D 파일 업로드를 권장합니다.
            </p>
        </div>
    )
}
