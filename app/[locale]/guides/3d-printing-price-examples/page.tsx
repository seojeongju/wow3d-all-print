import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { Link, getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site-url'
import { buildArticleSchema, buildBreadcrumbSchema, buildFaqPageSchema } from '@/lib/aeo-schema'
import ContentDatesNote from '@/components/seo/ContentDatesNote'
import { loadPrintSpecs, loadPublicMaterials, PRINT_SPECS_NO_DB } from '@/lib/pricing-public-data'
import {
    computePriceExamples,
    formatKrw,
    priceCalculatorHref,
    type PriceExampleCell,
    type PriceExampleRow,
} from '@/lib/price-examples'
import type { EstimatorMethod, EstimatorSpecs } from '@/lib/price-estimator'
import type { PublicMaterial } from '@/lib/pricing-public-data'
import { kstTodayISO } from '@/lib/date-utils'

/** 관리자 단가(D1)로 매 요청 계산 — 빌드 시점 정적 생성 금지 */
export const dynamic = 'force-dynamic'

type Props = {
    params: Promise<{ locale: string }>
}

type FaqItem = { q: string; a: string }
type FactorItem = { title: string; body: string }

const GUIDE_PATH = '/guides/3d-printing-price-examples' as const
const METHOD_COLUMNS: { method: EstimatorMethod; key: 'colFdm' | 'colSla' | 'colDlp'; accent: string }[] = [
    { method: 'fdm', key: 'colFdm', accent: 'text-amber-300' },
    { method: 'sla', key: 'colSla', accent: 'text-cyan-300' },
    { method: 'dlp', key: 'colDlp', accent: 'text-violet-300' },
]

function resolveLocale(localeParam: string): AppLocale {
    return (routing.locales.includes(localeParam as AppLocale)
        ? localeParam
        : routing.defaultLocale) as AppLocale
}

function guidePath(locale: AppLocale) {
    return getPathname({ locale, href: GUIDE_PATH as '/' })
}

async function loadPricingData(): Promise<{ materials: PublicMaterial[]; specs: EstimatorSpecs }> {
    try {
        const { env } = await getCloudflareContext({ async: true })
        if (!env?.DB) return { materials: [], specs: PRINT_SPECS_NO_DB as EstimatorSpecs }
        const [materials, specs] = await Promise.all([loadPublicMaterials(env.DB), loadPrintSpecs(env.DB)])
        return { materials, specs: specs as EstimatorSpecs }
    } catch (e) {
        console.error('price examples: 단가 조회 실패', e)
        return { materials: [], specs: PRINT_SPECS_NO_DB as EstimatorSpecs }
    }
}

function dimsLabel(row: PriceExampleRow) {
    const { x, y, z } = row.example.dims
    return `${x}×${y}×${z}mm`
}

function rangeText(cell: Extract<PriceExampleCell, { status: 'ok' }>, locale: string) {
    const low = cell.range.low.totalKrw
    const high = cell.range.high.totalKrw
    return low === high ? formatKrw(low, locale) : `${formatKrw(low, locale)} ~ ${formatKrw(high, locale)}`
}

/** 출력 시간 — 하한·상한이 같으면 한 값만 */
function hoursText(
    cell: Extract<PriceExampleCell, { status: 'ok' }>,
    t: (key: 'hoursLabel' | 'hoursSingle', values: Record<string, string>) => string
) {
    const low = cell.range.low.hours.toFixed(1)
    const high = cell.range.high.hours.toFixed(1)
    return low === high ? t('hoursSingle', { hours: low }) : t('hoursLabel', { low, high })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'PriceExamplesGuide' })
    const path = guidePath(locale)
    const canonical = `${SITE_URL}${path}`

    return {
        title: t('metaTitle'),
        description: t('metaDescription'),
        alternates: {
            canonical,
            languages: {
                ko: `${SITE_URL}${guidePath('ko')}`,
                en: `${SITE_URL}${guidePath('en')}`,
                'x-default': `${SITE_URL}${guidePath('ko')}`,
            },
        },
        openGraph: {
            title: t('articleHeadline'),
            description: t('metaDescription'),
            url: canonical,
            type: 'article',
            locale: locale === 'en' ? 'en_US' : 'ko_KR',
        },
    }
}

export default async function PriceExamplesGuidePage({ params }: Props) {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)

    const t = await getTranslations({ locale, namespace: 'PriceExamplesGuide' })
    const tChrome = await getTranslations({ locale, namespace: 'GuideChrome' })
    const notes = t.raw('notes') as string[]
    const factors = t.raw('factors') as FactorItem[]
    const faqs = t.raw('faqs') as FaqItem[]

    const { materials, specs } = await loadPricingData()
    const rows = computePriceExamples(materials, specs)

    // 결론 먼저(AEO): 첫 예시의 실제 계산값으로 답변 문장 구성
    const lead = rows[0]
    const leadFdm = lead?.cells.fdm
    const leadSla = lead?.cells.sla
    const answer =
        lead && leadFdm?.status === 'ok' && leadSla?.status === 'ok'
            ? t('answerTemplate', {
                  dims: dimsLabel(lead),
                  item: t(`examples.${lead.example.id}.name`),
                  fdmMaterial: leadFdm.materialName,
                  fdmPrice: rangeText(leadFdm, locale),
                  slaMaterial: leadSla.materialName,
                  slaPrice: rangeText(leadSla, locale),
              }) +
              // 작은 부품은 최소 주문 금액이 적용된 값이므로 그 사실을 함께 밝힘
              (leadFdm.range.low.minApplied || leadSla.range.low.minApplied ? ` ${t('answerMinNote')}` : '')
            : t('answerFallback')

    const path = guidePath(locale)
    const schemas = [
        buildBreadcrumbSchema([
            { name: tChrome('breadcrumbHome'), path: getPathname({ locale, href: '/' }) },
            { name: tChrome('breadcrumbGuides'), path: getPathname({ locale, href: '/guides' }) },
            { name: t('breadcrumbCurrent'), path },
        ]),
        buildArticleSchema({
            headline: t('articleHeadline'),
            description: t('metaDescription'),
            path,
            locale,
        }),
        buildFaqPageSchema(
            faqs.map((f, i) => ({ id: i + 1, question: f.q, answer: f.a, category: 'guide' })),
            path,
        ),
    ]

    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <Header />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />

            <section className="pt-32 pb-16">
                <div className="container mx-auto max-w-5xl space-y-6 px-6">
                    <div className="inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-teal-300">
                        {t('eyebrow')}
                    </div>
                    <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl break-keep">
                        {t('h1Line1')}
                        <br />
                        <span className="text-teal-400">{t('h1Accent')}</span>
                    </h1>
                    <p className="max-w-3xl text-lg leading-relaxed text-white/75 break-keep">{answer}</p>
                    <ContentDatesNote path={path} locale={locale} />
                </div>
            </section>

            <section className="pb-24">
                <div className="container mx-auto max-w-5xl space-y-12 px-6">
                    <div>
                        <h2 className="mb-2 text-2xl font-black break-keep">{t('tableTitle')}</h2>
                        <p className="mb-5 text-xs font-bold text-white/45">
                            {t('asOf', { date: kstTodayISO() })}
                        </p>
                        <div className="overflow-x-auto rounded-[2rem] border border-white/10 bg-white/[0.03]">
                            <table className="w-full min-w-[760px] text-sm">
                                <thead className="bg-white/[0.04]">
                                    <tr>
                                        <th scope="col" className="p-4 text-left font-black">{t('colItem')}</th>
                                        {METHOD_COLUMNS.map((c) => (
                                            <th key={c.method} scope="col" className={`p-4 text-left font-black ${c.accent}`}>
                                                {t(c.key)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="text-white/75">
                                    {rows.map((row) => (
                                        <tr key={row.example.id} className="border-t border-white/10 align-top">
                                            <th scope="row" className="p-4 text-left">
                                                <p className="font-black text-white break-keep">
                                                    {t(`examples.${row.example.id}.name`)}
                                                </p>
                                                <p className="mt-0.5 text-xs text-white/50">
                                                    {dimsLabel(row)} · {t(`examples.${row.example.id}.note`)}
                                                </p>
                                                <Link
                                                    href={priceCalculatorHref(row.example) as '/'}
                                                    className="mt-2 inline-flex items-center gap-1 text-xs font-black text-teal-300 hover:text-teal-200"
                                                >
                                                    {t('calcLink')} <ArrowRight className="h-3 w-3" aria-hidden />
                                                </Link>
                                            </th>
                                            {METHOD_COLUMNS.map(({ method }) => {
                                                const cell = row.cells[method]
                                                return (
                                                    <td key={method} className="p-4">
                                                        {cell.status === 'ok' ? (
                                                            <>
                                                                <p className="font-black text-white">
                                                                    {rangeText(cell, locale)}
                                                                    {cell.range.low.minApplied ? (
                                                                        <span className="ml-1.5 align-middle rounded-md border border-amber-300/30 bg-amber-300/10 px-1.5 py-0.5 text-[10px] font-black text-amber-200">
                                                                            {t('minAppliedBadge')}
                                                                        </span>
                                                                    ) : null}
                                                                </p>
                                                                <p className="mt-0.5 text-xs text-white/50">
                                                                    {cell.materialName} · {hoursText(cell, t)}
                                                                </p>
                                                            </>
                                                        ) : (
                                                            <p className="text-xs font-bold text-white/50 break-keep">
                                                                {cell.status === 'too-large'
                                                                    ? t('cellTooLarge')
                                                                    : cell.status === 'consult'
                                                                      ? t('cellConsult')
                                                                      : t('cellNoMaterial')}
                                                            </p>
                                                        )}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-teal-400/15 bg-teal-400/5 p-8">
                        <h2 className="mb-4 text-2xl font-black">{t('notesTitle')}</h2>
                        <ul className="space-y-2 text-white/70">
                            {notes.map((n) => (
                                <li key={n} className="flex gap-3 break-keep">
                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                                    <span>{n}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h2 className="mb-5 text-2xl font-black">{t('factorsTitle')}</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            {factors.map((f) => (
                                <article key={f.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                                    <h3 className="mb-2 text-lg font-black break-keep">{f.title}</h3>
                                    <p className="leading-relaxed text-white/65 break-keep">{f.body}</p>
                                </article>
                            ))}
                        </div>
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
                        <Link href={'/price-calculator' as '/'}>
                            <Button
                                variant="outline"
                                className="rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                            >
                                {t('ctaCalculator')}
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
