import { getTranslations } from 'next-intl/server'
import { getKeyAnswer } from '@/lib/guide-key-answers'
import type { AppLocale } from '@/i18n/routing'

/**
 * 페이지 상단 "핵심 답변" 상자 (AEO — 결론 먼저).
 * 내용은 lib/guide-key-answers.ts에서 경로로 찾으며, Article 스키마 abstract와 같은 문장이다.
 */
export default async function KeyAnswerBox({
    path,
    locale,
    className = '',
}: {
    path: string
    locale: AppLocale
    className?: string
}) {
    const answer = getKeyAnswer(path, locale)
    if (!answer) return null
    const t = await getTranslations({ locale, namespace: 'GuideChrome' })

    return (
        <div className={`max-w-3xl rounded-2xl border border-teal-400/25 bg-teal-400/[0.07] px-5 py-4 ${className}`}>
            <p className="mb-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-teal-300">
                {t('keyAnswerLabel')}
            </p>
            <p className="text-base leading-relaxed text-white/85 break-keep">{answer}</p>
        </div>
    )
}
