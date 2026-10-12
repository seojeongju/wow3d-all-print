import { getTranslations } from 'next-intl/server'
import { ArrowRight, Calculator, CheckCircle2, FileBox, ScanSearch } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import WorkPhotosSection from '@/components/seo/WorkPhotosSection'
import { buildArticleSchema, buildBreadcrumbSchema, buildFaqPageSchema } from '@/lib/aeo-schema'
import {
    USE_CASES,
    buildUseCaseCalculatorHref,
    buildUseCaseQuoteHref,
    pickUseCaseWorkPhotos,
    getUseCaseContent,
    type UseCaseConfig,
} from '@/lib/use-case-pages'
import { Link, getPathname } from '@/i18n/navigation'
import type { AppLocale } from '@/i18n/routing'

type Props = {
    config: UseCaseConfig
    locale: AppLocale
}

export default async function UseCaseLandingPage({ config, locale }: Props) {
    const t = await getTranslations({ locale, namespace: 'UseCases' })
    const c = getUseCaseContent(config, locale)
    const homePath = getPathname({ locale, href: '/' })
    const hubPath = getPathname({ locale, href: '/use-cases' })
    const pagePath = getPathname({ locale, href: config.path as '/' })
    const { w, d, h } = config.example

    const schemas = [
        buildBreadcrumbSchema([
            { name: t('breadcrumbHome'), path: homePath },
            { name: t('breadcrumbHub'), path: hubPath },
            { name: c.name, path: pagePath },
        ]),
        buildArticleSchema({ headline: c.title, description: c.description, path: pagePath }),
        buildFaqPageSchema(
            c.faqs.map((f, i) => ({ id: i + 1, question: f.q, answer: f.a, category: 'use-case' })),
            pagePath
        ),
    ]

    const others = USE_CASES.filter((u) => u.slug !== config.slug)

    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <Header />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />

            <section className="pt-32 pb-14 border-b border-white/10">
                <div className="container mx-auto px-6 max-w-5xl space-y-6">
                    <nav aria-label="breadcrumb" className="text-[12px] font-bold text-white/40">
                        <Link href="/use-cases" className="hover:text-white">
                            {t('breadcrumbHub')}
                        </Link>
                        <span className="mx-2">/</span>
                        <span className="text-white/60">{c.name}</span>
                    </nav>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-400">{c.eyebrow}</p>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight break-keep">
                        {c.h1}
                        <br />
                        <span className="text-teal-400">{c.h1Accent}</span>
                    </h1>
                    <p className="max-w-3xl text-lg text-white/70 leading-relaxed break-keep">{c.intro}</p>
                    <div className="flex flex-wrap gap-3 pt-2">
                        <Link
                            href={buildUseCaseQuoteHref(config, locale) as '/'}
                            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-teal-400 px-6 text-sm font-black text-slate-950 hover:bg-teal-300"
                        >
                            <FileBox className="h-4 w-4" /> {t('quoteCta')}
                        </Link>
                        <Link
                            href={buildUseCaseCalculatorHref(config) as '/'}
                            className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 text-sm font-black text-white hover:bg-white/10"
                        >
                            <Calculator className="h-4 w-4" /> {t('estimateCta')}
                        </Link>
                    </div>
                </div>
            </section>

            <section className="py-14">
                <div className="container mx-auto px-6 max-w-5xl space-y-14">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black mb-6">{t('recommendHeading')}</h2>
                        <div className="grid gap-4 md:grid-cols-3">
                            {c.recommendations.map((r) => (
                                <article
                                    key={r.label}
                                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-3"
                                >
                                    <span className="inline-block rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-[11px] font-black text-teal-300">
                                        {r.label}
                                    </span>
                                    <h3 className="text-lg font-black break-keep">
                                        {r.method} · <span className="text-teal-300">{r.materials}</span>
                                    </h3>
                                    <p className="text-sm text-white/65 leading-relaxed break-keep">{r.why}</p>
                                </article>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl md:text-3xl font-black mb-6">{t('checklistHeading')}</h2>
                        <ul className="space-y-3">
                            {c.checklist.map((item) => (
                                <li
                                    key={item}
                                    className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white/75 leading-relaxed break-keep"
                                >
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-400" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <Link
                            href="/stl-checker"
                            className="mt-4 inline-flex items-center gap-2 text-sm font-black text-indigo-300 hover:text-indigo-200"
                        >
                            <ScanSearch className="h-4 w-4" /> {t('checkerCta')} <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-[2rem] border border-teal-400/25 bg-teal-400/5 p-7 space-y-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-300">
                                {t('estimateEyebrow')}
                            </p>
                            <h2 className="text-2xl font-black break-keep">{c.exampleLabel}</h2>
                            <p className="text-sm text-white/65 leading-relaxed break-keep">
                                {t('estimateBody', { size: `${w}×${d}×${h}mm` })}
                            </p>
                            <Link
                                href={buildUseCaseCalculatorHref(config) as '/'}
                                className="inline-flex items-center gap-2 rounded-2xl bg-teal-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-teal-300"
                            >
                                <Calculator className="h-4 w-4" /> {t('estimateCta')} <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-7 space-y-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white/50">
                                {t('quoteEyebrow')}
                            </p>
                            <h2 className="text-2xl font-black break-keep">{t('quoteHeading')}</h2>
                            <p className="text-sm text-white/65 leading-relaxed break-keep">{t('quoteBody')}</p>
                            <div className="flex flex-wrap gap-2">
                                <Link
                                    href={buildUseCaseQuoteHref(config, locale) as '/'}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-white/90"
                                >
                                    <FileBox className="h-4 w-4" /> {t('quoteCta')}
                                </Link>
                                {c.secondaryCta ? (
                                    <Link
                                        href={c.secondaryCta.href as '/'}
                                        className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white/85 hover:bg-white/10"
                                    >
                                        {c.secondaryCta.label}
                                    </Link>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <WorkPhotosSection photos={pickUseCaseWorkPhotos(config, locale)} locale={locale} layout="block" />

                    <div>
                        <h2 className="text-2xl md:text-3xl font-black mb-6">{t('faqHeading')}</h2>
                        <div className="space-y-4">
                            {c.faqs.map((f) => (
                                <article key={f.q} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                                    <h3 className="text-lg font-black mb-2 break-keep">{f.q}</h3>
                                    <p className="text-white/65 leading-relaxed break-keep">{f.a}</p>
                                </article>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                        <div>
                            <h2 className="text-xl font-black mb-4">{t('relatedHeading')}</h2>
                            <div className="space-y-2">
                                {c.related.map((r) => (
                                    <Link
                                        key={r.href}
                                        href={r.href as '/'}
                                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-black text-white/75 hover:border-teal-400/30 hover:text-white"
                                    >
                                        {r.label} <ArrowRight className="h-4 w-4 text-teal-300" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-black mb-4">{t('otherCasesHeading')}</h2>
                            <div className="flex flex-wrap gap-2">
                                {others.map((u) => (
                                    <Link
                                        key={u.slug}
                                        href={u.path as '/'}
                                        className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[13px] font-bold text-white/70 hover:border-teal-400/30 hover:text-white"
                                    >
                                        {getUseCaseContent(u, locale).name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
