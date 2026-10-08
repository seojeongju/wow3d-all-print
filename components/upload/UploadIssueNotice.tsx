'use client'

import { AlertTriangle, Mail, MessageCircle, ArrowRight, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { MODEL_FILE_MAX_BYTES } from '@/lib/model-file'
import { getNaverTalkTalkChatUrl, openNaverTalkTalkPopup } from '@/lib/naver-talktalk'
import type { UploadNotice } from '@/store/useUploadNoticeStore'

const CONTACT_EMAIL = 'wow3d16@naver.com'

function formatMb(bytes: number): string {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')}MB`
}

/** 업로드 실패 안내(용량 초과·분석 실패) — 원인·해결 방법 + 상담 채널 바로가기 */
export default function UploadIssueNotice({
    notice,
    onDismiss,
    variant = 'dark',
}: {
    notice: UploadNotice
    onDismiss?: () => void
    variant?: 'default' | 'dark'
}) {
    const t = useTranslations('Quote')
    const talkUrl = getNaverTalkTalkChatUrl()
    const isDark = variant === 'dark'
    const tooLarge = notice.kind === 'too_large'

    const title = tooLarge ? t('largeFileTitle') : t('analysisFailTitle')
    const detail = tooLarge
        ? t('largeFileLimit', { max: formatMb(MODEL_FILE_MAX_BYTES) })
        : t(`analysisFailReason.${notice.reason}`)
    const body = tooLarge ? t('largeFileBody') : t('analysisFailBody')
    const tip = tooLarge ? t('largeFileTip') : t('analysisFailTip')
    const subject = tooLarge
        ? t('largeFileEmailSubject', { name: notice.name })
        : t('analysisFailEmailSubject', { name: notice.name })
    const mailHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        t('largeFileEmailBody', { name: notice.name, size: formatMb(notice.size) })
    )}`

    const btn =
        'inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-black transition-all active:scale-[0.98]'

    return (
        <div
            role="alert"
            className={cn(
                'relative rounded-2xl border p-4 sm:p-5 text-left',
                isDark ? 'border-amber-400/40 bg-amber-500/12' : 'border-amber-300 bg-amber-50'
            )}
        >
            {onDismiss ? (
                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label={t('largeFileDismiss')}
                    className={cn(
                        'absolute right-2.5 top-2.5 rounded-lg p-1.5 transition-colors',
                        isDark ? 'text-amber-200/60 hover:bg-white/10 hover:text-white' : 'text-amber-700/60 hover:bg-amber-100'
                    )}
                >
                    <X className="h-4 w-4" />
                </button>
            ) : null}
            <div className="flex items-start gap-3 pr-6">
                <AlertTriangle className={cn('mt-0.5 h-5 w-5 shrink-0', isDark ? 'text-amber-400' : 'text-amber-600')} />
                <div className="min-w-0 space-y-1.5">
                    <p className={cn('text-sm font-black', isDark ? 'text-amber-100' : 'text-amber-900')}>{title}</p>
                    <p className={cn('break-all text-xs font-bold', isDark ? 'text-white/80' : 'text-slate-700')}>
                        {notice.name} · {formatMb(notice.size)}{' '}
                        <span className={isDark ? 'text-amber-300' : 'text-amber-700'}>({detail})</span>
                    </p>
                    <p className={cn('break-keep text-xs leading-relaxed', isDark ? 'text-amber-100/80' : 'text-slate-600')}>
                        {body}
                    </p>
                    <p className={cn('break-keep text-[11px] leading-relaxed', isDark ? 'text-white/55' : 'text-slate-500')}>
                        {tip}
                    </p>
                </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {talkUrl ? (
                    <a
                        href={talkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => openNaverTalkTalkPopup(e, talkUrl)}
                        className={cn(btn, 'bg-[#03C75A] text-white hover:bg-[#02b350]')}
                    >
                        <MessageCircle className="h-4 w-4" /> {t('largeFileTalk')}
                    </a>
                ) : null}
                <a
                    href={mailHref}
                    className={cn(
                        btn,
                        isDark
                            ? 'border border-white/20 bg-white/10 text-white hover:bg-white/15'
                            : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                    )}
                >
                    <Mail className="h-4 w-4" /> {t('largeFileEmail')}
                </a>
                <Link
                    href="/contact"
                    className={cn(
                        btn,
                        isDark
                            ? 'border border-amber-400/40 bg-amber-400/15 text-amber-100 hover:bg-amber-400/25'
                            : 'border border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200'
                    )}
                >
                    {t('largeFileContact')} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>
        </div>
    )
}
