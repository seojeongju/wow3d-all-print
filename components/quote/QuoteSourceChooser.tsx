'use client'

import { FileBox, ImageIcon, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export type QuoteEntryMode = 'file' | 'photo'

type Props = {
    onSelect: (mode: QuoteEntryMode) => void
}

export default function QuoteSourceChooser({ onSelect }: Props) {
    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-300/90">
                    Step 1 · 시작 방식 선택
                </p>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-[1.15]">
                    어떤 방식으로 <br />
                    <span className="text-teal-400">견적을 시작할까요?</span>
                </h1>
                <p className="text-white/70 text-[13px] sm:text-[15px] font-bold leading-relaxed break-keep">
                    3D 파일이 있으면 바로 업로드하세요. 제품 실사 사진(이미지)이면 AI가 입체 메시를 만듭니다.
                    로고·스케치 돌출(2.5D)은 Maker를 이용하세요.
                </p>
            </div>

            <div className="grid gap-3 sm:gap-4">
                <button
                    type="button"
                    onClick={() => onSelect('file')}
                    className={cn(
                        'group text-left w-full p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem]',
                        'bg-white/10 border border-white/20 hover:border-teal-400/50 hover:bg-teal-400/10',
                        'transition-all active:scale-[0.99] shadow-xl'
                    )}
                >
                    <div className="flex items-start gap-4 sm:gap-5">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-teal-400/20 border border-teal-400/30 flex items-center justify-center text-teal-400 shrink-0 group-hover:scale-110 transition-transform">
                            <FileBox className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="text-base sm:text-lg font-black text-white">
                                    3D 모델이 있어요
                                </h2>
                                <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </div>
                            <p className="text-[12px] sm:text-[13px] text-white/55 font-bold leading-relaxed break-keep">
                                STL · OBJ · 3MF · PLY 즉시 견적 · STEP/STP 자동 변환
                            </p>
                            <span className="inline-flex mt-1 text-[10px] font-black uppercase tracking-widest text-teal-300/80">
                                빠른 자동견적
                            </span>
                        </div>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onSelect('photo')}
                    className={cn(
                        'group text-left w-full p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem]',
                        'bg-white/10 border border-white/20 hover:border-indigo-400/50 hover:bg-indigo-500/10',
                        'transition-all active:scale-[0.99] shadow-xl'
                    )}
                >
                    <div className="flex items-start gap-4 sm:gap-5">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0 group-hover:scale-110 transition-transform">
                            <ImageIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                                    3D 모델이 없어요
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[9px] font-black uppercase tracking-wider text-indigo-200">
                                        <Sparkles className="w-3 h-3" />
                                        AI
                                    </span>
                                </h2>
                                <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </div>
                            <p className="text-[12px] sm:text-[13px] text-white/55 font-bold leading-relaxed break-keep">
                                제품 사진(이미지)(JPG/PNG)을 올리면 AI가 3D 모델을 만들고 견적으로 연결합니다
                            </p>
                            <span className="inline-flex mt-1 text-[10px] font-black uppercase tracking-widest text-indigo-300/80">
                                사진(이미지) → 3D 모델링
                            </span>
                        </div>
                    </div>
                </button>
            </div>

            <p className="text-[11px] text-white/35 font-bold leading-relaxed break-keep px-1">
                AI 모델링은 시제품·형상 확인에 적합합니다. 정밀 치수가 필요하면 3D 파일 업로드를 권장합니다.
                로고·배지는{' '}
                <a href="/#ai-3d-maker" className="text-teal-400 hover:underline">AI 3D Maker(2.5D)</a>
                를 이용해 주세요.
            </p>
        </div>
    )
}
