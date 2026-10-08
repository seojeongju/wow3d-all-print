'use client'

import { useEffect, useState } from 'react'
import { Check, FileBox, Loader2, MessageCircle, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { modelParseTimeoutMs } from '@/lib/model-parse-client'
import { getNaverTalkTalkChatUrl, openNaverTalkTalkPopup } from '@/lib/naver-talktalk'
import { useAnalysisProgressStore, type AnalysisStage } from '@/store/useAnalysisProgressStore'

const STAGES: AnalysisStage[] = ['reading', 'parsing', 'preparing', 'measuring']

/** 이 시간이 지나면 장시간 안내(상담·취소) 표시 */
const SLOW_HINT_AFTER_MS = 15_000

function formatSize(bytes: number): string {
    return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`
}

function formatElapsed(ms: number): string {
    const s = Math.max(0, Math.floor(ms / 1000))
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** 모델 분석 중 화면 — 단계·경과 시간·취소, 오래 걸리면 상담 안내 */
export default function ModelAnalyzingPanel({
    file,
    analysisError,
    onCancel,
}: {
    file: File
    analysisError: string | null
    onCancel: () => void
}) {
    const t = useTranslations('Quote')
    const progress = useAnalysisProgressStore()
    const current = progress.file === file ? progress : null
    const stage: AnalysisStage = current?.stage ?? 'reading'
    const stageIndex = STAGES.indexOf(stage)
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        const id = window.setInterval(() => setNow(Date.now()), 1000)
        return () => window.clearInterval(id)
    }, [])

    const elapsed = current?.startedAt ? now - current.startedAt : 0
    const isSlow = elapsed >= SLOW_HINT_AFTER_MS
    const limitMin = Math.ceil(modelParseTimeoutMs(file.size) / 60_000)
    const talkUrl = getNaverTalkTalkChatUrl()

    return (
        <div className="flex min-h-[300px] flex-col items-center justify-center space-y-6 sm:min-h-[400px] sm:space-y-7">
            <div className="group relative flex h-20 w-20 items-center justify-center rounded-[2rem] border border-teal-400/30 bg-teal-400/20 sm:h-24 sm:w-24 sm:rounded-[2.5rem]">
                <Loader2 className="h-10 w-10 animate-spin text-teal-400 sm:h-12 sm:w-12" />
                <div className="absolute inset-0 animate-pulse rounded-[2.5rem] bg-teal-400/25 blur-2xl" />
            </div>

            <div className="space-y-2 text-center sm:space-y-3">
                <h1 className="text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
                    {t('analyzingTitle')} <span className="text-teal-400">{t('analyzingTitleAccent')}</span>
                </h1>
                <p className="px-4 text-xs font-bold leading-relaxed text-white/60 break-keep sm:text-sm">
                    {t('analyzingBody')}
                    <br className="hidden sm:block" />
                    {t('analyzing')}
                </p>
                {analysisError ? (
                    <p className="px-6 text-[11px] font-bold text-rose-300 break-keep sm:text-xs">{analysisError}</p>
                ) : null}
            </div>

            <ol className="w-full space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4" aria-label={t('analysisStagesAria')}>
                {STAGES.map((s, idx) => {
                    const done = idx < stageIndex
                    const active = idx === stageIndex
                    return (
                        <li key={s} className="flex items-center gap-3">
                            <span
                                className={cn(
                                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-black',
                                    done && 'border-teal-400/50 bg-teal-400/20 text-teal-300',
                                    active && 'border-teal-300 bg-teal-400 text-slate-950',
                                    !done && !active && 'border-white/15 text-white/30'
                                )}
                            >
                                {done ? <Check className="h-3.5 w-3.5" /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : idx + 1}
                            </span>
                            <span
                                className={cn(
                                    'text-xs font-bold sm:text-sm',
                                    done && 'text-white/55',
                                    active && 'text-white',
                                    !done && !active && 'text-white/30'
                                )}
                            >
                                {t(`analysisStage.${s}`)}
                            </span>
                        </li>
                    )
                })}
                <li className="flex items-center justify-between border-t border-white/10 pt-2 text-[11px] font-bold text-white/45">
                    <span>{t('analysisElapsed', { time: formatElapsed(elapsed) })}</span>
                    <span>{t('analysisLimit', { min: limitMin })}</span>
                </li>
            </ol>

            {isSlow ? (
                <div role="status" className="w-full rounded-2xl border border-amber-400/35 bg-amber-500/10 p-4">
                    <p className="text-sm font-black text-amber-100">{t('analysisSlowTitle')}</p>
                    <p className="mt-1 text-xs leading-relaxed text-amber-100/75 break-keep">
                        {t('analysisSlowBody', { min: limitMin })}
                    </p>
                    {talkUrl ? (
                        <a
                            href={talkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => openNaverTalkTalkPopup(e, talkUrl)}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#03C75A] px-3 py-2 text-xs font-black text-white transition-colors hover:bg-[#02b350]"
                        >
                            <MessageCircle className="h-4 w-4" /> {t('largeFileTalk')}
                        </a>
                    ) : null}
                </div>
            ) : file.size >= 20 * 1024 * 1024 ? (
                <p className="px-6 text-center text-[11px] font-bold text-amber-300/90 break-keep sm:text-xs">
                    {t('analyzingLargeFile')}
                </p>
            ) : null}

            <div className="flex w-full items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-xl sm:rounded-3xl sm:p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-teal-400/30 bg-teal-400/20 text-teal-400 sm:h-14 sm:w-14 sm:rounded-2xl">
                    <FileBox className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-black text-white sm:text-sm">{file.name}</div>
                    <div className="mt-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-white/40 sm:text-xs">{formatSize(file.size)}</div>
                </div>
            </div>

            <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-black text-white/70 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white"
            >
                <X className="h-4 w-4" /> {t('analysisCancel')}
            </button>
        </div>
    )
}
