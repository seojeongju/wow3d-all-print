import { getTranslations } from 'next-intl/server'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { HOME_KEY_QUESTIONS } from '@/lib/guide-key-answers'
import type { AppLocale } from '@/i18n/routing'

/**
 * 홈 상단 "핵심 답변" (AEO — 결론 먼저). 서버에서 렌더링해 검색·AI가 HTML로 바로 읽는다.
 * 첫 답변은 #aeo-key-answer로 Speakable 대상이며, 세 질문 모두 홈 FAQPage 스키마에 같은 문장으로 들어간다.
 */
export default async function HomeKeyAnswers({ locale }: { locale: AppLocale }) {
    const t = await getTranslations({ locale, namespace: 'Home.keyAnswers' })
    const pick = (v: { ko: string; en: string }) => (locale === 'en' ? v.en : v.ko)

    return (
        <section className="relative border-t border-white/5 bg-slate-950/60" aria-labelledby="home-key-answers-title">
            <div className="container mx-auto px-4 py-10 sm:py-12">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-400/80 mb-2">{t('eyebrow')}</p>
                <h2 id="home-key-answers-title" className="text-xl sm:text-2xl font-black text-white tracking-tight break-keep">
                    {t('title')}
                </h2>
                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                    {HOME_KEY_QUESTIONS.map((item, i) => (
                        <article
                            key={item.href}
                            className="flex flex-col rounded-2xl border border-teal-400/20 bg-teal-400/[0.05] p-5"
                        >
                            <h3 className="text-base font-bold text-white break-keep">{pick(item.question)}</h3>
                            <p
                                id={i === 0 ? 'aeo-key-answer' : undefined}
                                className="mt-2 flex-1 text-sm leading-relaxed text-white/70 break-keep"
                            >
                                {pick(item.answer)}
                            </p>
                            <Link
                                href={item.href}
                                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-300 hover:text-teal-200"
                            >
                                {t('more')} <ArrowRight className="h-4 w-4" />
                            </Link>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    )
}
