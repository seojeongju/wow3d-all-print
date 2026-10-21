import { getTranslations } from 'next-intl/server'
import { Calculator, CalendarClock, FileCheck2 } from 'lucide-react'
import { HOME_KEY_QUESTIONS } from '@/lib/guide-key-answers'
import type { AppLocale } from '@/i18n/routing'
import KeyAnswerCards, { type KeyAnswerCard } from './KeyAnswerCards'

/**
 * 홈 상단 "핵심 답변" (AEO — 결론 먼저). 서버에서 렌더링해 검색·AI가 HTML로 바로 읽는다.
 * 기본은 질문 + 인포그래픽만 보이고, 카드를 누르면 전체 답변이 슬라이드로 열린다.
 * 인포그래픽 수치는 각 답변 문장(lib/guide-key-answers.ts)에 있는 값만 쓴다.
 * 첫 답변은 #aeo-key-answer로 Speakable 대상이며, 세 질문 모두 홈 FAQPage 스키마에 같은 문장으로 들어간다.
 */
export default async function HomeKeyAnswers({ locale }: { locale: AppLocale }) {
    const t = await getTranslations({ locale, namespace: 'Home.keyAnswers' })
    const pick = (v: { ko: string; en: string }) => (locale === 'en' ? v.en : v.ko)

    // 비용 = 재료비 + 장비비 + 옵션비
    const costGraphic = (
        <div className="flex items-stretch gap-1.5 text-center">
            {(['material', 'machine', 'option'] as const).map((k, i) => (
                <div key={k} className="flex flex-1 items-center gap-1.5">
                    {i > 0 && <span className="text-sm font-black text-white/30" aria-hidden>+</span>}
                    <div className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-1.5 py-2">
                        <p className="text-xs font-bold text-white">{t(`cost.${k}`)}</p>
                        <p className="mt-0.5 text-[10px] leading-tight text-white/45 break-keep">{t(`cost.${k}Hint`)}</p>
                    </div>
                </div>
            ))}
        </div>
    )

    // 납기 = 주문 확정 → 제작 → 검수 → 발송, 평균 3~7일
    const steps = ['confirm', 'make', 'inspect', 'ship'] as const
    const leadGraphic = (
        <div className="flex items-center gap-3">
            <div className="flex-1">
                <div className="relative flex justify-between">
                    <span className="absolute left-1.5 right-1.5 top-[5px] h-0.5 bg-gradient-to-r from-teal-400/70 to-teal-400/20" aria-hidden />
                    {steps.map((s) => (
                        <span key={s} className="relative z-10 flex flex-col items-center gap-1.5">
                            <span className="h-3 w-3 rounded-full border-2 border-teal-300 bg-slate-950" aria-hidden />
                            <span className="text-[10px] font-semibold text-white/60 whitespace-nowrap">{t(`lead.${s}`)}</span>
                        </span>
                    ))}
                </div>
            </div>
            <div className="shrink-0 rounded-lg border border-teal-400/30 bg-teal-400/10 px-2.5 py-1.5 text-center">
                <p className="text-[10px] text-teal-200/70">{t('lead.avg')}</p>
                <p className="text-base font-black leading-none text-teal-300">{t('lead.days')}</p>
            </div>
        </div>
    )

    // 파일 = STL·OBJ·3MF·PLY 즉시, STEP·STP 자동 변환
    const fileGraphic = (
        <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
                {['STL', 'OBJ', '3MF', 'PLY'].map((f) => (
                    <span key={f} className="rounded-md bg-teal-400/15 px-2 py-1 text-[11px] font-black text-teal-200">{f}</span>
                ))}
                <span className="text-[10px] font-semibold text-white/50">{t('files.instant')}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
                {['STEP', 'STP'].map((f) => (
                    <span key={f} className="rounded-md bg-indigo-400/15 px-2 py-1 text-[11px] font-black text-indigo-200">{f}</span>
                ))}
                <span className="text-[10px] font-semibold text-white/50">{t('files.convert')}</span>
            </div>
        </div>
    )

    const graphics = [costGraphic, leadGraphic, fileGraphic]
    const icons = [
        <Calculator key="c" className="h-4.5 w-4.5" aria-hidden />,
        <CalendarClock key="l" className="h-4.5 w-4.5" aria-hidden />,
        <FileCheck2 key="f" className="h-4.5 w-4.5" aria-hidden />,
    ]
    const cards: KeyAnswerCard[] = HOME_KEY_QUESTIONS.map((item, i) => ({
        href: item.href,
        icon: icons[i],
        question: pick(item.question),
        graphic: graphics[i],
        answer: pick(item.answer),
        speakable: i === 0,
    }))

    return (
        <section className="relative border-t border-white/5 bg-slate-950/60" aria-labelledby="home-key-answers-title">
            <div className="container mx-auto px-4 py-7 sm:py-8">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-400/80">{t('eyebrow')}</p>
                    <h2 id="home-key-answers-title" className="text-lg sm:text-xl font-black text-white tracking-tight break-keep">
                        {t('title')}
                    </h2>
                </div>
                <KeyAnswerCards cards={cards} showLabel={t('show')} hideLabel={t('hide')} moreLabel={t('more')} />
            </div>
        </section>
    )
}
