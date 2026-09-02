'use client'

import { FileBox, ImageIcon, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export type QuoteEntryMode = 'file' | 'photo'

type Props = {
    onSelect: (mode: QuoteEntryMode) => void
}

export default function QuoteSourceChooser({ onSelect }: Props) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-300/90">
                    자동견적 시작
                </p>
                <h1 className="text-3xl font-black leading-[1.15] tracking-tight text-white sm:text-4xl">
                    3D 파일·사진으로
                    <br />
                    <span className="text-teal-400">실시간 견적</span>
                </h1>
                <p className="max-w-lg text-sm font-medium leading-relaxed text-white/60 break-keep">
                    파일이 있으면 즉시 분석, 사진만 있으면 AI가 3D 모델을 만든 뒤 견적으로 이어집니다.
                </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <button
                    type="button"
                    onClick={() => onSelect('file')}
                    className={cn(
                        'group rounded-2xl border border-teal-400/25 bg-teal-400/10 p-5 text-left transition-all',
                        'hover:-translate-y-0.5 hover:border-teal-400/40 hover:bg-teal-400/15 active:scale-[0.99]',
                    )}
                >
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-teal-400/30 bg-teal-400/15 text-teal-300">
                        <FileBox className="h-5 w-5" />
                    </div>
                    <p className="text-lg font-black text-white">3D 파일이 있어요</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/55 break-keep">
                        STL · OBJ · STEP 등 즉시 자동견적
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-teal-300 group-hover:gap-2">
                        업로드하기 <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => onSelect('photo')}
                    className={cn(
                        'group rounded-2xl border border-indigo-400/25 bg-indigo-500/10 p-5 text-left transition-all',
                        'hover:-translate-y-0.5 hover:border-indigo-400/40 hover:bg-indigo-500/15 active:scale-[0.99]',
                    )}
                >
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/15 text-indigo-300">
                        <ImageIcon className="h-5 w-5" />
                    </div>
                    <p className="flex items-center gap-2 text-lg font-black text-white">
                        사진만 있어요
                        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-400/30 bg-indigo-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-indigo-200">
                            <Sparkles className="h-3 w-3" />
                            AI
                        </span>
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-white/55 break-keep">
                        JPG · PNG → AI 3D → 견적
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-indigo-300 group-hover:gap-2">
                        3D 만들기 <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                </button>
            </div>

            <p className="text-[11px] font-bold leading-relaxed text-white/35 break-keep">
                로고·2.5D 배지는{' '}
                <a href="/#ai-3d-maker" className="text-teal-400 hover:underline">
                    AI 3D Maker
                </a>
                를 이용해 주세요.
            </p>
        </div>
    )
}
