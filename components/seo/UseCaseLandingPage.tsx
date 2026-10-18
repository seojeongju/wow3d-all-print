import { getTranslations } from 'next-intl/server'
import { ArrowRight, Calculator, ChevronDown, FileBox, FlaskConical, Layers, Package, Ruler, ScanSearch } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import WorkPhotosSection from '@/components/seo/WorkPhotosSection'
import { IsoBox, METHOD_STYLE, ScoreBars, caseIconFor, methodKeyOf } from '@/components/seo/use-case-visuals'
import { buildArticleSchema, buildBreadcrumbSchema, buildFaqPageSchema } from '@/lib/aeo-schema'
import ContentDatesNote from '@/components/seo/ContentDatesNote'
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
import { cn } from '@/lib/utils'

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
    const { w, d, h, method, qty, shape } = config.example
    const style = METHOD_STYLE[method]
    const CaseIcon = caseIconFor(config.slug)
    const lead = c.recommendations[0]
    const metricLabels = {
        detail: t('metric_detail'),
        strength: t('metric_strength'),
        size: t('metric_size'),
        cost: t('metric_cost'),
    }

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
    const conditions = [
        { icon: Ruler, label: t('glanceSize'), value: `${w}×${d}×${h}mm` },
        { icon: Layers, label: t('glanceMethod'), value: method.toUpperCase() },
        { icon: Package, label: t('glanceQty'), value: t('qtyValue', { count: qty }) },
        { icon: FlaskConical, label: t('glanceShape'), value: t(`shape_${shape}`) },
    ]

    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <Header />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />

            {/* ── 히어로: 소개 + 한눈에 보기 카드 ── */}
            <section className="relative overflow-hidden border-b border-white/10 pt-32 pb-14">
                <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-teal-500/15 blur-[110px]" />
                <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-indigo-600/15 blur-[120px]" />
                <div className="container relative mx-auto grid max-w-6xl items-start gap-10 px-4 sm:px-6 lg:grid-cols-[1.15fr_1fr]">
                    <div className="space-y-5">
                        <nav aria-label="breadcrumb" className="text-[12px] font-bold text-white/40">
                            <Link href="/use-cases" className="hover:text-white">
                                {t('breadcrumbHub')}
                            </Link>
                            <span className="mx-2">/</span>
                            <span className="text-white/60">{c.name}</span>
                        </nav>
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-400">{c.eyebrow}</p>
                            <span className={cn('rounded-full border px-2.5 py-0.5 text-[10px] font-black', style.badge)}>
                                {method.toUpperCase()}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight break-keep">
                            {c.h1}
                            <br />
                            <span className="text-teal-400">{c.h1Accent}</span>
                        </h1>
                        <p className="max-w-2xl text-base md:text-lg text-white/70 leading-relaxed break-keep">{c.intro}</p>
                        <ContentDatesNote path={pagePath} locale={locale} />
                        <div className="flex flex-wrap gap-3 pt-2">
                            <Link
                                href={buildUseCaseQuoteHref(config, locale) as '/'}
                                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-teal-400 px-6 text-sm font-black text-slate-950 transition-colors hover:bg-teal-300"
                            >
                                <FileBox className="h-4 w-4" /> {t('quoteCta')}
                            </Link>
                            <Link
                                href={buildUseCaseCalculatorHref(config) as '/'}
                                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 text-sm font-black text-white transition-colors hover:bg-white/10"
                            >
                                <Calculator className="h-4 w-4" /> {t('estimateCta')}
                            </Link>
                        </div>
                    </div>

                    <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6" aria-label={t('glanceHeading')}>
                        <div className="flex items-center gap-3">
                            <span className={cn('flex h-11 w-11 items-center justify-center rounded-2xl border', style.badge)}>
                                <CaseIcon className="h-5 w-5" aria-hidden />
                            </span>
                            <div className="min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/45">{t('glanceHeading')}</p>
                                <p className="text-base font-black break-keep">{c.name}</p>
                            </div>
                        </div>
                        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-4">
                            <IsoBox w={w} d={d} h={h} method={method} className="h-auto w-full max-h-44" />
                            <dl className="space-y-3">
                                <div>
                                    <dt className="text-[11px] font-bold text-white/45">{t('glanceMethod')}</dt>
                                    <dd className={cn('text-sm font-black break-keep', style.text)}>{lead.method}</dd>
                                </div>
                                <div>
                                    <dt className="text-[11px] font-bold text-white/45">{t('glanceMaterial')}</dt>
                                    <dd className="text-sm font-black text-white/90 break-keep">{lead.materials}</dd>
                                </div>
                                <div>
                                    <dt className="text-[11px] font-bold text-white/45">{t('glanceSize')}</dt>
                                    <dd className="text-sm font-black tabular-nums text-white/90">
                                        {w}×{d}×{h}mm
                                    </dd>
                                </div>
                            </dl>
                        </div>
                        <div className="mt-5 border-t border-white/10 pt-4">
                            <p className="mb-2.5 text-[11px] font-bold text-white/45">
                                {t('glanceFit', { method: method.toUpperCase() })}
                            </p>
                            <ScoreBars method={method} labels={metricLabels} compact />
                        </div>
                    </aside>
                </div>
            </section>

            <section className="py-14">
                <div className="container mx-auto max-w-6xl space-y-16 px-4 sm:px-6">
                    {/* ── 추천 출력 방식·소재 ── */}
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black mb-6 break-keep">{t('recommendHeading')}</h2>
                        <div className={cn('grid gap-4', c.recommendations.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
                            {c.recommendations.map((r, i) => {
                                const key = methodKeyOf(r.method)
                                const rs = key ? METHOD_STYLE[key] : null
                                return (
                                    <article
                                        key={r.label}
                                        className={cn(
                                            'flex flex-col rounded-3xl border bg-white/[0.03] p-5 sm:p-6',
                                            i === 0 ? 'border-teal-400/40 bg-teal-400/[0.05]' : 'border-white/10'
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-3xl font-black tabular-nums text-white/15">0{i + 1}</span>
                                            <span
                                                className={cn(
                                                    'rounded-full border px-3 py-1 text-[11px] font-black',
                                                    i === 0 ? 'border-teal-400/40 bg-teal-400/15 text-teal-200' : 'border-white/15 bg-white/5 text-white/70'
                                                )}
                                            >
                                                {r.label}
                                            </span>
                                        </div>
                                        <h3 className="mt-3 text-lg font-black break-keep">
                                            <span className={rs?.text}>{r.method}</span>
                                            <span className="text-white/30"> · </span>
                                            {r.materials}
                                        </h3>
                                        <p className="mt-2 flex-1 text-sm text-white/65 leading-relaxed break-keep">{r.why}</p>
                                        {key ? (
                                            <div className="mt-5 border-t border-white/10 pt-4">
                                                <ScoreBars method={key} labels={metricLabels} compact />
                                            </div>
                                        ) : null}
                                    </article>
                                )
                            })}
                        </div>
                        <p className="mt-3 text-[12px] text-white/45 break-keep">{t('methodNote')}</p>
                    </div>

                    {/* ── 설계 체크리스트 ── */}
                    <div>
                        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                            <h2 className="text-2xl md:text-3xl font-black break-keep">{t('checklistHeading')}</h2>
                            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-black text-white/70">
                                {t('checklistCount', { count: c.checklist.length })}
                            </span>
                        </div>
                        <ol className="grid gap-3 md:grid-cols-2">
                            {c.checklist.map((item, i) => (
                                <li
                                    key={item}
                                    className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
                                >
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-teal-400/40 bg-teal-400/15 text-sm font-black tabular-nums text-teal-200">
                                        {i + 1}
                                    </span>
                                    <p className="text-[15px] text-white/75 leading-relaxed break-keep">{item}</p>
                                </li>
                            ))}
                        </ol>
                        <Link
                            href="/stl-checker"
                            className="mt-4 inline-flex items-center gap-2 text-sm font-black text-indigo-300 hover:text-indigo-200"
                        >
                            <ScanSearch className="h-4 w-4" /> {t('checkerCta')} <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {/* ── 예상 가격 · 정확한 견적 ── */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex flex-col rounded-[2rem] border border-teal-400/25 bg-teal-400/5 p-6 sm:p-7">
                            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-300">{t('estimateEyebrow')}</p>
                            <h2 className="mt-3 text-2xl font-black break-keep">{c.exampleLabel}</h2>
                            <dl className="mt-5 grid grid-cols-2 gap-2">
                                {conditions.map(({ icon: Icon, label, value }) => (
                                    <div key={label} className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
                                        <dt className="flex items-center gap-1 text-[11px] font-bold text-white/45">
                                            <Icon className="h-3.5 w-3.5" aria-hidden />
                                            {label}
                                        </dt>
                                        <dd className="mt-0.5 text-sm font-black tabular-nums text-white break-keep">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                            <p className="mt-4 flex-1 text-sm text-white/65 leading-relaxed break-keep">
                                {t('estimateBody', { size: `${w}×${d}×${h}mm` })}
                            </p>
                            <Link
                                href={buildUseCaseCalculatorHref(config) as '/'}
                                className="mt-5 inline-flex w-fit items-center gap-2 rounded-2xl bg-teal-400 px-5 py-3 text-sm font-black text-slate-950 transition-colors hover:bg-teal-300"
                            >
                                <Calculator className="h-4 w-4" /> {t('estimateCta')} <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="flex flex-col rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-7">
                            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white/50">{t('quoteEyebrow')}</p>
                            <h2 className="mt-3 text-2xl font-black break-keep">{t('quoteHeading')}</h2>
                            <ol className="mt-5 flex items-start">
                                {[t('quoteStep1'), t('quoteStep2'), t('quoteStep3')].map((step, i, arr) => (
                                    <li key={step} className="flex min-w-0 flex-1 items-start">
                                        <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-black tabular-nums">
                                                {i + 1}
                                            </span>
                                            <span className="mt-1.5 text-[11px] font-black leading-tight text-white/75 break-keep">{step}</span>
                                        </div>
                                        {i < arr.length - 1 && <span className="mt-[18px] h-px w-4 shrink-0 bg-white/20 sm:w-8" aria-hidden />}
                                    </li>
                                ))}
                            </ol>
                            <p className="mt-5 flex-1 text-sm text-white/65 leading-relaxed break-keep">{t('quoteBody')}</p>
                            <div className="mt-5 flex flex-wrap gap-2">
                                <Link
                                    href={buildUseCaseQuoteHref(config, locale) as '/'}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition-colors hover:bg-white/90"
                                >
                                    <FileBox className="h-4 w-4" /> {t('quoteCta')}
                                </Link>
                                {c.secondaryCta ? (
                                    <Link
                                        href={c.secondaryCta.href as '/'}
                                        className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white/85 transition-colors hover:bg-white/10"
                                    >
                                        {c.secondaryCta.label}
                                    </Link>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <WorkPhotosSection photos={pickUseCaseWorkPhotos(config, locale)} locale={locale} layout="block" />

                    {/* ── FAQ ── */}
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black mb-6 break-keep">{t('faqHeading')}</h2>
                        <div className="space-y-3">
                            {c.faqs.map((f, i) => (
                                <details
                                    key={f.q}
                                    open={i === 0}
                                    className="group rounded-3xl border border-white/10 bg-white/[0.03] open:border-teal-400/30 open:bg-teal-400/[0.04]"
                                >
                                    <summary className="flex cursor-pointer list-none items-center gap-3 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-teal-400/40 bg-teal-400/15 text-xs font-black text-teal-200">
                                            Q
                                        </span>
                                        <h3 className="flex-1 text-base sm:text-lg font-black break-keep">{f.q}</h3>
                                        <ChevronDown
                                            className="h-5 w-5 shrink-0 text-white/40 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                                            aria-hidden
                                        />
                                    </summary>
                                    <p className="px-5 pb-5 pl-[4.25rem] text-white/65 leading-relaxed break-keep sm:px-6 sm:pb-6 sm:pl-[4.75rem]">{f.a}</p>
                                </details>
                            ))}
                        </div>
                    </div>

                    {/* ── 관련 자료 · 다른 활용 사례 ── */}
                    <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
                        <div>
                            <h2 className="text-xl font-black mb-4 break-keep">{t('relatedHeading')}</h2>
                            <div className="space-y-2">
                                {c.related.map((r) => (
                                    <Link
                                        key={r.href}
                                        href={r.href as '/'}
                                        className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-black text-white/75 transition-colors hover:border-teal-400/30 hover:text-white"
                                    >
                                        <span className="break-keep">{r.label}</span>
                                        <ArrowRight className="h-4 w-4 shrink-0 text-teal-300 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-black mb-4 break-keep">{t('otherCasesHeading')}</h2>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {others.map((u) => {
                                    const OtherIcon = caseIconFor(u.slug)
                                    const os = METHOD_STYLE[u.example.method]
                                    return (
                                        <Link
                                            key={u.slug}
                                            href={u.path as '/'}
                                            className={cn(
                                                'group flex items-center gap-3 rounded-2xl border bg-white/[0.03] px-3 py-2.5 transition-colors hover:bg-white/[0.06]',
                                                os.ring
                                            )}
                                        >
                                            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border', os.badge)}>
                                                <OtherIcon className="h-4 w-4" aria-hidden />
                                            </span>
                                            <span className="min-w-0 flex-1 text-[13px] font-black text-white/85 break-keep">
                                                {getUseCaseContent(u, locale).name}
                                            </span>
                                            <span className={cn('text-[10px] font-black', os.text)}>{u.example.method.toUpperCase()}</span>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
