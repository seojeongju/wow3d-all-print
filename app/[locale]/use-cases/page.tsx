import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import {
    ArrowRight,
    Building2,
    Calculator,
    Camera,
    ChevronRight,
    Cog,
    Cpu,
    FileBox,
    FlaskConical,
    ListChecks,
    MousePointerClick,
    PersonStanding,
    Ruler,
    ScanSearch,
    Sparkles,
    Swords,
    Trophy,
    Type,
    Wrench,
    type LucideIcon,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import WorkPhotosSection from '@/components/seo/WorkPhotosSection'
import { buildBreadcrumbSchema, buildCollectionPageSchema } from '@/lib/aeo-schema'
import { buildWorkPhotoOgImages, pickWorkPhotos } from '@/lib/seo-work-photos'
import { USE_CASES, getUseCaseContent, type UseCaseMethod } from '@/lib/use-case-pages'
import { Link, getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site-url'
import { cn } from '@/lib/utils'

type Props = { params: Promise<{ locale: string }> }

/** 용도별 대표 아이콘 */
const CASE_ICONS: Record<string, LucideIcon> = {
    'figures-miniatures': PersonStanding,
    'electronics-enclosures': Cpu,
    'jigs-fixtures': Wrench,
    'replacement-parts': Cog,
    'architectural-models': Building2,
    'cosplay-props': Swords,
    'logos-signage': Type,
    'trophies-awards': Trophy,
}

/** 출력 방식별 색상 */
const METHOD_STYLE: Record<UseCaseMethod, { badge: string; bar: string; ring: string; text: string }> = {
    fdm: {
        badge: 'border-teal-400/40 bg-teal-400/15 text-teal-200',
        bar: 'bg-teal-400',
        ring: 'border-teal-400/30 hover:border-teal-300/60',
        text: 'text-teal-300',
    },
    sla: {
        badge: 'border-indigo-400/40 bg-indigo-400/15 text-indigo-200',
        bar: 'bg-indigo-400',
        ring: 'border-indigo-400/30 hover:border-indigo-300/60',
        text: 'text-indigo-300',
    },
    dlp: {
        badge: 'border-fuchsia-400/40 bg-fuchsia-400/15 text-fuchsia-200',
        bar: 'bg-fuchsia-400',
        ring: 'border-fuchsia-400/30 hover:border-fuchsia-300/60',
        text: 'text-fuchsia-300',
    },
}

const METHODS: UseCaseMethod[] = ['fdm', 'sla', 'dlp']

/** 출력 방식 비교 — 일반적인 경향 (5점 척도) */
const METHOD_SCORES: Record<UseCaseMethod, { detail: number; strength: number; size: number; cost: number }> = {
    fdm: { detail: 2, strength: 4, size: 5, cost: 5 },
    sla: { detail: 5, strength: 3, size: 3, cost: 3 },
    dlp: { detail: 5, strength: 3, size: 2, cost: 4 },
}
const METRICS = ['detail', 'strength', 'size', 'cost'] as const

function hubPath(locale: AppLocale) {
    return getPathname({ locale, href: '/use-cases' })
}

function resolveLocale(localeParam: string): AppLocale {
    return (routing.locales.includes(localeParam as AppLocale)
        ? localeParam
        : routing.defaultLocale) as AppLocale
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'UseCases' })
    const title = t('hubMetaTitle')
    const description = t('hubMetaDescription')
    const canonical = `${SITE_URL}${hubPath(locale)}`

    return {
        title,
        description,
        alternates: {
            canonical,
            languages: {
                ko: `${SITE_URL}${hubPath('ko')}`,
                en: `${SITE_URL}${hubPath('en')}`,
                'x-default': `${SITE_URL}${hubPath('ko')}`,
            },
        },
        openGraph: {
            title,
            description,
            url: canonical,
            type: 'website',
            locale: locale === 'en' ? 'en_US' : 'ko_KR',
            images: buildWorkPhotoOgImages(pickWorkPhotos({ seed: 'use-cases', locale })),
        },
    }
}

export default async function UseCasesHubPage({ params }: Props) {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'UseCases' })
    const path = hubPath(locale)

    const schemas = [
        buildCollectionPageSchema({ name: t('hubMetaTitle'), description: t('hubMetaDescription'), path }),
        buildBreadcrumbSchema([
            { name: t('breadcrumbHome'), path: getPathname({ locale, href: '/' }) },
            { name: t('breadcrumbHub'), path },
        ]),
    ]

    const cases = USE_CASES.map((u) => {
        const c = getUseCaseContent(u, locale)
        const maxDim = Math.max(u.example.w, u.example.d, u.example.h)
        return { config: u, content: c, maxDim }
    })
    const largestDim = Math.max(...cases.map((c) => c.maxDim))
    const tipCount = cases.reduce((sum, c) => sum + c.content.checklist.length, 0)
    const casesByMethod = (m: UseCaseMethod) => cases.filter((c) => c.config.example.method === m)

    const flow = [
        { icon: MousePointerClick, label: t('hubFlowStep1') },
        { icon: FlaskConical, label: t('hubFlowStep2') },
        { icon: FileBox, label: t('hubFlowStep3') },
    ]

    const stats = [
        { value: cases.length, label: t('hubStatCases') },
        { value: METHODS.length, label: t('hubStatMethods') },
        { value: tipCount, label: t('hubStatTips') },
    ]

    const nextSteps = [
        { state: t('stateNoFile'), href: '/price-calculator', icon: Calculator, title: t('toolCalcTitle'), desc: t('toolCalcDesc') },
        {
            state: t('statePhoto'),
            href: '/quote?entry=photo&guide_source=use_case_hub',
            icon: Camera,
            title: t('toolPhotoTitle'),
            desc: t('toolPhotoDesc'),
        },
        { state: t('stateCheck'), href: '/stl-checker', icon: ScanSearch, title: t('toolCheckerTitle'), desc: t('toolCheckerDesc') },
        {
            state: t('stateReady'),
            href: '/quote?entry=file&guide_source=use_case_hub',
            icon: FileBox,
            title: t('toolQuoteTitle'),
            desc: t('toolQuoteDesc'),
            primary: true,
        },
    ]

    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <Header />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />

            {/* ── 히어로: 제목 + 3단계 흐름 + 핵심 수치 ── */}
            <section className="relative overflow-hidden border-b border-white/10 pt-32 pb-14">
                <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-teal-500/15 blur-[110px]" />
                <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-indigo-600/15 blur-[120px]" />
                <div className="container relative mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
                    <div className="space-y-5">
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-400">{t('hubEyebrow')}</p>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight break-keep">
                            {t('hubTitle')}
                            <br />
                            <span className="text-teal-400">{t('hubTitleAccent')}</span>
                        </h1>
                        <p className="max-w-2xl text-base md:text-lg text-white/70 leading-relaxed break-keep">{t('hubSubtitle')}</p>
                        <dl className="grid max-w-lg grid-cols-3 gap-2 pt-2">
                            {stats.map(({ value, label }) => (
                                <div key={label} className="flex flex-col-reverse rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
                                    <dt className="mt-0.5 text-[11px] md:text-xs font-bold text-white/55 break-keep">{label}</dt>
                                    <dd className="text-2xl md:text-3xl font-black tabular-nums text-white">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/45">{t('hubFlowTitle')}</p>
                        <ol className="mt-4 space-y-2.5">
                            {flow.map(({ icon: Icon, label }, i) => (
                                <li key={label} className="relative flex items-center gap-3">
                                    {i < flow.length - 1 && (
                                        <span
                                            className="absolute left-5 top-10 h-[calc(100%-1.75rem)] w-px bg-gradient-to-b from-teal-400/50 to-transparent"
                                            aria-hidden
                                        />
                                    )}
                                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-teal-400/40 bg-teal-400/15 text-teal-200">
                                        <Icon className="h-[18px] w-[18px]" aria-hidden />
                                    </span>
                                    <div className="flex min-w-0 flex-1 items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                                        <span className="text-sm font-black break-keep">{label}</span>
                                        <span className="text-[11px] font-black tabular-nums text-teal-300/80">0{i + 1}</span>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </section>

            <section className="py-14">
                <div className="container mx-auto max-w-6xl space-y-16 px-4 sm:px-6">
                    {/* ── 용도별 카드 ── */}
                    <div>
                        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                            <h2 className="text-2xl md:text-3xl font-black break-keep">{t('casesHeading')}</h2>
                            <ul className="flex flex-wrap gap-2" aria-label={t('legendLabel')}>
                                {METHODS.map((m) => (
                                    <li key={m} className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-black', METHOD_STYLE[m].badge)}>
                                        {m.toUpperCase()}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {cases.map(({ config: u, content: c, maxDim }) => {
                                const Icon = CASE_ICONS[u.slug] ?? Sparkles
                                const style = METHOD_STYLE[u.example.method]
                                const lead = c.recommendations[0]
                                return (
                                    <Link
                                        key={u.slug}
                                        href={u.path as '/'}
                                        className={cn(
                                            'group flex flex-col rounded-3xl border bg-white/[0.03] p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.05] hover:shadow-[0_18px_40px_rgba(0,0,0,0.35)] motion-reduce:hover:translate-y-0',
                                            style.ring
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <span
                                                className={cn(
                                                    'flex h-11 w-11 items-center justify-center rounded-2xl border transition-transform duration-300 group-hover:scale-110 motion-reduce:transform-none',
                                                    style.badge
                                                )}
                                            >
                                                <Icon className="h-5 w-5" aria-hidden />
                                            </span>
                                            <span className={cn('rounded-full border px-2.5 py-0.5 text-[10px] font-black', style.badge)}>
                                                {u.example.method.toUpperCase()}
                                            </span>
                                        </div>
                                        <h3 className="mt-4 text-lg font-black break-keep">{c.name}</h3>
                                        <p className="mt-1.5 flex-1 text-sm text-white/60 leading-relaxed break-keep">{c.cardDesc}</p>

                                        <dl className="mt-4 space-y-2.5 border-t border-white/10 pt-4">
                                            <div>
                                                <div className="flex items-center justify-between text-[11px] font-bold text-white/50">
                                                    <dt className="inline-flex items-center gap-1">
                                                        <Ruler className="h-3.5 w-3.5" aria-hidden />
                                                        {t('cardSize')}
                                                    </dt>
                                                    <dd className="font-black tabular-nums text-white/80">
                                                        {u.example.w}×{u.example.d}×{u.example.h}mm
                                                    </dd>
                                                </div>
                                                <div className="mt-1.5 h-1.5 rounded-full bg-white/10" aria-hidden>
                                                    <div
                                                        className={cn('h-full rounded-full', style.bar)}
                                                        style={{ width: `${Math.max(8, (maxDim / largestDim) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-1.5 text-[11px] font-bold text-white/50">
                                                <dt className="inline-flex shrink-0 items-center pt-px">
                                                    <FlaskConical className="h-3.5 w-3.5" aria-hidden />
                                                    <span className="sr-only">{t('cardMaterial')}</span>
                                                </dt>
                                                <dd className={cn('font-black break-keep', style.text)}>{lead.materials}</dd>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/50">
                                                <dt className="inline-flex items-center">
                                                    <ListChecks className="h-3.5 w-3.5" aria-hidden />
                                                    <span className="sr-only">{t('cardTipsLabel')}</span>
                                                </dt>
                                                <dd>{t('cardTips', { count: c.checklist.length })}</dd>
                                            </div>
                                        </dl>

                                        <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-black text-white/50 transition-colors group-hover:text-white">
                                            {t('viewCase')}
                                            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                                        </span>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>

                    {/* ── 출력 방식 비교 ── */}
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black break-keep">{t('methodHeading')}</h2>
                        <p className="mt-2 text-sm text-white/55 break-keep">{t('methodNote')}</p>
                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            {METHODS.map((m) => {
                                const style = METHOD_STYLE[m]
                                const scores = METHOD_SCORES[m]
                                const used = casesByMethod(m)
                                return (
                                    <div key={m} className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className={cn('text-2xl font-black', style.text)}>{m.toUpperCase()}</h3>
                                            <span className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-black tabular-nums', style.badge)}>
                                                {t('methodCaseCount', { count: used.length })}
                                            </span>
                                        </div>
                                        <p className="mt-1.5 text-sm text-white/60 leading-relaxed break-keep">{t(`method_${m}_desc`)}</p>

                                        <dl className="mt-5 space-y-3">
                                            {METRICS.map((metric) => (
                                                <div key={metric}>
                                                    <div className="flex items-center justify-between text-[11px] font-bold text-white/55">
                                                        <dt>{t(`metric_${metric}`)}</dt>
                                                        <dd className="tabular-nums text-white/40">{scores[metric]}/5</dd>
                                                    </div>
                                                    <div className="mt-1 grid grid-cols-5 gap-1" aria-hidden>
                                                        {[1, 2, 3, 4, 5].map((n) => (
                                                            <span
                                                                key={n}
                                                                className={cn('h-2 rounded-full', n <= scores[metric] ? style.bar : 'bg-white/10')}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </dl>

                                        {used.length > 0 && (
                                            <div className="mt-5 border-t border-white/10 pt-4">
                                                <p className="text-[11px] font-bold text-white/45">{t('methodUsedBy')}</p>
                                                <ul className="mt-2 flex flex-wrap gap-1.5">
                                                    {used.map(({ config: u, content: c }) => (
                                                        <li key={u.slug}>
                                                            <Link
                                                                href={u.path as '/'}
                                                                className="inline-flex rounded-full border border-white/12 bg-white/[0.05] px-2.5 py-1 text-[11px] font-bold text-white/80 transition-colors hover:border-white/30 hover:text-white"
                                                            >
                                                                {c.name}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* ── 상황별 다음 단계 ── */}
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black break-keep">{t('toolsHeading')}</h2>
                        <p className="mt-2 text-sm text-white/55 break-keep">{t('toolsSub')}</p>
                        <div className="mt-6 grid gap-3 md:grid-cols-2">
                            {nextSteps.map(({ state, href, icon: Icon, title, desc, primary }) => (
                                <Link
                                    key={href}
                                    href={href as '/'}
                                    className={cn(
                                        'group flex items-center gap-3 rounded-3xl border p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0',
                                        primary
                                            ? 'border-teal-400/40 bg-teal-400/10 hover:border-teal-300/70 hover:bg-teal-400/15'
                                            : 'border-white/10 bg-white/[0.03] hover:border-indigo-400/40 hover:bg-white/[0.05]'
                                    )}
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-black text-white/45 break-keep">{state}</p>
                                        <div className="mt-2 flex items-center gap-3">
                                            <ChevronRight className="h-4 w-4 shrink-0 text-white/30" aria-hidden />
                                            <span
                                                className={cn(
                                                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border',
                                                    primary
                                                        ? 'border-teal-300/50 bg-teal-400 text-slate-950'
                                                        : 'border-indigo-400/30 bg-indigo-400/15 text-indigo-200'
                                                )}
                                            >
                                                <Icon className="h-5 w-5" aria-hidden />
                                            </span>
                                            <div className="min-w-0">
                                                <h3 className="text-base font-black break-keep">{title}</h3>
                                                <p className="mt-0.5 text-[13px] text-white/60 leading-relaxed break-keep">{desc}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight
                                        className="h-4 w-4 shrink-0 text-white/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white"
                                        aria-hidden
                                    />
                                </Link>
                            ))}
                        </div>
                    </div>

                    <WorkPhotosSection photos={pickWorkPhotos({ seed: 'use-cases', locale })} locale={locale} layout="block" />
                </div>
            </section>

            <Footer />
        </main>
    )
}
