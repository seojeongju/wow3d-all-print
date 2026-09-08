import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { GUIDE_PRINT_METHOD_SUMMARIES } from '@/lib/print-methods-data'
import { Link, getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site-url'

type Props = {
    params: Promise<{ locale: string }>
}

type CompareRow = {
    label: string
    fdm: string
    sla: string
    dlp: string
    powder: string
    jetting: string
}

type TipItem = { strong: string; rest: string }

type MethodMsg = {
    nameKo: string
    principle: string
    subtypes?: { name: string; description: string }[]
}

type FaqItem = { q: string; a: string }

const GUIDE_PATH = '/guides/fdm-vs-sla-vs-dlp' as const

const COLUMN_HEADERS = [
    { key: 'fdm', label: 'FDM', accent: 'text-amber-300' },
    { key: 'sla', label: 'SLA', accent: 'text-cyan-300' },
    { key: 'dlp', label: 'DLP', accent: 'text-violet-300' },
    { key: 'powder', label: 'SLS / SLM / DMLS', accent: 'text-rose-300' },
    { key: 'jetting', label: 'PolyJet / MJP', accent: 'text-sky-300' },
] as const

const WOW_METHOD_IDS = ['fdm', 'sla', 'dlp'] as const
const REF_METHOD_IDS = ['powder-sintering', 'material-jetting'] as const

function resolveLocale(localeParam: string): AppLocale {
    return (routing.locales.includes(localeParam as AppLocale)
        ? localeParam
        : routing.defaultLocale) as AppLocale
}

function guidePath(locale: AppLocale) {
    return getPathname({ locale, href: GUIDE_PATH as '/' })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'ProcessCompareGuide' })

    const title = t('metaTitle')
    const description = t('metaDescription')
    const path = guidePath(locale)
    const canonical = `${SITE_URL}${path}`

    return {
        title,
        description,
        alternates: {
            canonical,
            languages: {
                ko: `${SITE_URL}${guidePath('ko')}`,
                en: `${SITE_URL}${guidePath('en')}`,
                'x-default': `${SITE_URL}${guidePath('ko')}`,
            },
        },
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            url: canonical,
            type: 'article',
            locale: locale === 'en' ? 'en_US' : 'ko_KR',
        },
    }
}

export default async function CompareGuidePage({ params }: Props) {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)

    const t = await getTranslations({ locale, namespace: 'ProcessCompareGuide' })
    const tPm = await getTranslations({ locale, namespace: 'PrintMethods' })
    const tChrome = await getTranslations({ locale, namespace: 'GuideChrome' })

    const compareRows = t.raw('allCompareRows') as CompareRow[]
    const tips = t.raw('tips') as TipItem[]
    const methodsMap = tPm.raw('methods') as Record<string, MethodMsg>
    const faqs = tPm.raw('faqs') as FaqItem[]

    const wowSummaries = GUIDE_PRINT_METHOD_SUMMARIES.filter((m) => m.category === 'wow3d').filter((m) =>
        (WOW_METHOD_IDS as readonly string[]).includes(m.id),
    )
    const refSummaries = GUIDE_PRINT_METHOD_SUMMARIES.filter((m) => m.category === 'reference').filter((m) =>
        (REF_METHOD_IDS as readonly string[]).includes(m.id),
    )

    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <Header />
            <section className="pt-32 pb-20">
                <div className="container mx-auto max-w-5xl space-y-6 px-6">
                    <div className="inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-teal-300">
                        {t('eyebrow')}
                    </div>
                    <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
                        {t('h1Line1')}
                        <br />
                        <span className="text-teal-400">{t('h1Accent')}</span>
                    </h1>
                    <p className="max-w-3xl text-lg leading-relaxed text-white/70 break-keep">{t('intro')}</p>
                </div>
            </section>

            <section className="pb-24">
                <div className="container mx-auto max-w-5xl space-y-10 px-6">
                    <div>
                        <h2 className="mb-4 text-2xl font-black">{t('tableTitle')}</h2>
                        <p className="mb-5 text-sm text-white/55 break-keep">{t('tableNote')}</p>
                        <div className="overflow-x-auto rounded-[2rem] border border-white/10 bg-white/[0.03]">
                            <table className="w-full min-w-[900px] text-sm">
                                <thead className="bg-white/[0.04]">
                                    <tr>
                                        <th className="p-4 text-left font-black">{t('colItem')}</th>
                                        {COLUMN_HEADERS.map((col) => (
                                            <th key={col.key} className={`p-4 text-left font-black ${col.accent}`}>
                                                {col.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="text-white/75">
                                    {compareRows.map((row) => (
                                        <tr key={row.label} className="border-t border-white/10">
                                            <td className="p-4 font-bold text-white">{row.label}</td>
                                            {COLUMN_HEADERS.map((col) => (
                                                <td key={col.key} className="p-4">
                                                    {row[col.key]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.25em] text-teal-400">
                            {t('wowEyebrow')}
                        </p>
                        <h2 className="mb-5 text-2xl font-black">{t('wowTitle')}</h2>
                        <div className="grid gap-6 md:grid-cols-3">
                            {wowSummaries.map((method) => {
                                const msg = methodsMap[method.id]
                                return (
                                    <article
                                        key={method.id}
                                        className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                                    >
                                        <div className="mb-3 flex items-center gap-2">
                                            <h3 className="text-xl font-black">{method.name}</h3>
                                            <span className="rounded-full border border-teal-400/30 bg-teal-400/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-teal-300">
                                                {t('badgeProvided')}
                                            </span>
                                        </div>
                                        <p className="mb-1 text-xs font-bold text-white/45">
                                            {msg?.nameKo ?? method.nameKo}
                                        </p>
                                        <p className="leading-relaxed text-white/65 break-keep">
                                            {msg?.principle ?? method.summary}
                                        </p>
                                    </article>
                                )
                            })}
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.25em] text-white/40">
                            {t('refEyebrow')}
                        </p>
                        <h2 className="mb-5 text-2xl font-black">{t('refTitle')}</h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            {refSummaries.map((method) => {
                                const msg = methodsMap[method.id]
                                const subtypes = msg?.subtypes ?? ('subtypes' in method ? method.subtypes : undefined)
                                return (
                                    <article
                                        key={method.id}
                                        className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                                    >
                                        <div className="mb-3 flex items-center gap-2">
                                            <h3 className="text-xl font-black">{method.name}</h3>
                                            <span className="rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white/50">
                                                {t('badgeInfo')}
                                            </span>
                                        </div>
                                        <p className="mb-3 text-xs font-bold text-white/45">
                                            {msg?.nameKo ?? method.nameKo}
                                        </p>
                                        <p className="mb-4 leading-relaxed text-white/65 break-keep">
                                            {msg?.principle ?? method.summary}
                                        </p>
                                        {subtypes && subtypes.length > 0 && (
                                            <div className="space-y-2 border-t border-white/10 pt-4">
                                                {subtypes.map((sub) => (
                                                    <div key={sub.name}>
                                                        <p className="text-sm font-black text-white/80">{sub.name}</p>
                                                        <p className="text-xs leading-relaxed text-white/55 break-keep">
                                                            {sub.description}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </article>
                                )
                            })}
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-teal-400/15 bg-teal-400/5 p-8">
                        <h2 className="mb-4 text-2xl font-black">{t('tipsTitle')}</h2>
                        <ul className="space-y-3 text-white/70">
                            {tips.map((tip) => (
                                <li key={tip.strong} className="flex gap-3 break-keep">
                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                                    <span>
                                        <strong className="text-white">{tip.strong}</strong>
                                        {tip.rest}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-5 rounded-[2rem] border border-white/10 bg-white/[0.03] p-8">
                        <h2 className="text-2xl font-black">{tChrome('faqHeading')}</h2>
                        {faqs.map((item) => (
                            <div key={item.q} className="rounded-2xl border border-white/10 bg-black/15 p-5">
                                <h3 className="mb-2 text-lg font-black break-keep">{item.q}</h3>
                                <p className="leading-relaxed text-white/68 break-keep">{item.a}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link href={'/quote' as '/'}>
                            <Button className="rounded-2xl bg-teal-400 font-black text-slate-950 hover:bg-teal-300">
                                {t('ctaQuote')} <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href={'/print-methods' as '/'}>
                            <Button
                                variant="outline"
                                className="rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                            >
                                {t('ctaMethods')}
                            </Button>
                        </Link>
                        <Link href={'/contact' as '/'}>
                            <Button
                                variant="outline"
                                className="rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                            >
                                {t('ctaContact')}
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
            <Footer />
        </main>
    )
}
