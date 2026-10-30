import { getTranslations } from 'next-intl/server'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { AppLocale } from '@/i18n/routing'

type Fact = { label: string; value: string }
type Step = { name: string; text: string }
type Faq = { q: string; a: string }

const MORE_LINKS = [
    { href: '/services/name-tag-studio', key: 'linkNameTagService' },
    { href: '/services/ai-3d-maker', key: 'linkAi3dMakerService' },
    { href: '/guides/name-tag-studio', key: 'linkNameTagGuide' },
    { href: '/guides/ai-3d-maker-2-5d', key: 'linkAi3dMakerGuide' },
    { href: '/quote?entry=photo', key: 'linkPhotoTo3d' },
    { href: '/quote', key: 'linkQuote' },
] as const

/**
 * /maker 서버 렌더링 안내 섹션.
 * 네임택·AI 3D Maker 앱은 CSR이라 서버 HTML이 비므로,
 * 검색엔진·AI 크롤러가 읽을 h1·핵심 답변·절차·FAQ를 여기서 HTML로 내보낸다.
 */
export default async function MakerSeoSection({ locale }: { locale: AppLocale }) {
    const t = await getTranslations({ locale, namespace: 'MakerSeo' })
    const tMaker = await getTranslations({ locale, namespace: 'Maker' })
    const facts = t.raw('facts') as Fact[]
    const steps = t.raw('steps') as Step[]
    const faqs = tMaker.raw('faqs') as Faq[]

    return (
        <section
            aria-labelledby="maker-seo-title"
            className="relative z-10 border-t border-white/10 bg-slate-950 text-slate-100"
        >
            <div className="container mx-auto max-w-5xl px-6 pt-16 pb-20 sm:pt-20 space-y-14">
                <header className="space-y-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-400">
                        {t('eyebrow')}
                    </p>
                    <h1
                        id="maker-seo-title"
                        className="text-2xl sm:text-4xl font-black tracking-tight leading-tight break-keep"
                    >
                        {t('h1')}
                    </h1>
                    <p className="max-w-3xl text-sm sm:text-base text-white/70 leading-relaxed break-keep">
                        {t('answer')}
                    </p>
                </header>

                <div className="space-y-4">
                    <h2 className="text-lg sm:text-xl font-black break-keep">{t('factsTitle')}</h2>
                    <dl className="grid gap-3 sm:grid-cols-2">
                        {facts.map((f) => (
                            <div
                                key={f.label}
                                className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4"
                            >
                                <dt className="text-xs font-black text-teal-300">{f.label}</dt>
                                <dd className="mt-1 text-sm text-white/75 leading-relaxed break-keep">
                                    {f.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg sm:text-xl font-black break-keep">{t('stepsTitle')}</h2>
                    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {steps.map((s, i) => (
                            <li
                                key={s.name}
                                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                            >
                                <span className="text-xs font-black text-teal-400">STEP {i + 1}</span>
                                <h3 className="mt-1 text-sm font-black break-keep">{s.name}</h3>
                                <p className="mt-2 text-xs text-white/60 leading-relaxed break-keep">
                                    {s.text}
                                </p>
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg sm:text-xl font-black break-keep">{t('faqTitle')}</h2>
                    <div className="space-y-2">
                        {faqs.map((f) => (
                            <details
                                key={f.q}
                                className="group rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4"
                            >
                                <summary className="cursor-pointer list-none text-sm font-black break-keep marker:hidden">
                                    <h3 className="inline">{f.q}</h3>
                                </summary>
                                <p className="mt-3 text-sm text-white/65 leading-relaxed break-keep">{f.a}</p>
                            </details>
                        ))}
                    </div>
                </div>

                <nav aria-label={t('moreTitle')} className="space-y-4">
                    <h2 className="text-lg sm:text-xl font-black break-keep">{t('moreTitle')}</h2>
                    <ul className="grid gap-2 sm:grid-cols-2">
                        {MORE_LINKS.map((l) => (
                            <li key={l.href}>
                                <Link
                                    href={l.href}
                                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm font-bold text-white/80 hover:border-teal-400/40 hover:text-teal-200 transition-colors"
                                >
                                    <span className="break-keep">{t(l.key)}</span>
                                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </section>
    )
}
