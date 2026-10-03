import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/aeo-schema'
import { Link, getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site-url'
import WorkPhotosSection from '@/components/seo/WorkPhotosSection'
import { buildWorkPhotoOgImages, pickGuideWorkPhotos } from '@/lib/seo-work-photos'
import MaterialCompareExplorer, {
    type CompareTableRow,
    type MaterialDetail,
} from '@/components/guides/MaterialCompareExplorer'

type Props = {
    params: Promise<{ locale: string }>
}

type CardItem = { title: string; body: string }
type FaqItem = { q: string; a: string }

const RESIN_KEYS = ['standard', 'tough', 'clear', 'flexible'] as const
type ResinKey = (typeof RESIN_KEYS)[number]
/** 카드 한 장이 레진 두 종류를 묶어 소개함(Standard·Tough / Clear·Flexible) */
const CARD_KEYS: ResinKey[][] = [
    ['standard', 'tough'],
    ['clear', 'flexible'],
]

const GUIDE_PATH = '/guides/standard-vs-tough-vs-clear-vs-flexible-resin' as const

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
    const t = await getTranslations({ locale, namespace: 'ResinCompareGuide' })

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
            images: buildWorkPhotoOgImages(pickGuideWorkPhotos('standard-vs-tough-vs-clear-vs-flexible-resin', locale)),
        },
    }
}

export default async function ResinGuidePage({ params }: Props) {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)

    const t = await getTranslations({ locale, namespace: 'ResinCompareGuide' })
    const tChrome = await getTranslations({ locale, namespace: 'GuideChrome' })

    const tableRows = t.raw('tableRows') as CompareTableRow[]
    const cards = (t.raw('cards') as CardItem[]).map((card, i) => ({ ...card, keys: CARD_KEYS[i] ?? [] }))
    const faqs = t.raw('faqs') as FaqItem[]
    const resinDetails = t.raw('resinDetails') as Record<ResinKey, MaterialDetail>
    const columnLabels: Record<ResinKey, string> = {
        standard: t('colStandard'),
        tough: t('colTough'),
        clear: t('colClear'),
        flexible: t('colFlexible'),
    }

    const path = guidePath(locale)
    const homePath = getPathname({ locale, href: '/' })
    const materialsPath = getPathname({ locale, href: '/materials' })

    const articleSchema = buildArticleSchema({
        headline: t('articleHeadline'),
        description: t('articleDescription'),
        path,
    })

    const breadcrumbSchema = buildBreadcrumbSchema([
        { name: tChrome('breadcrumbHome'), path: homePath },
        { name: t('breadcrumbMaterials'), path: materialsPath },
        { name: t('breadcrumbCurrent'), path },
    ])

    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
        url: `${SITE_URL}${path}`,
    }

    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <Header />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify([articleSchema, breadcrumbSchema, faqSchema]) }}
            />

            <section className="pt-32 pb-20 border-b border-white/10">
                <div className="container mx-auto px-6 max-w-5xl space-y-6">
                    <div className="inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-teal-300">
                        {t('eyebrow')}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                        {t('h1Line1')}
                        <br />
                        <span className="text-teal-400">{t('h1Accent')}</span>
                    </h1>
                    <p className="max-w-3xl text-lg text-white/70 leading-relaxed break-keep">{t('intro')}</p>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto px-6 max-w-5xl space-y-10">
                    <MaterialCompareExplorer
                        materialKeys={RESIN_KEYS}
                        itemLabel={t('colItem')}
                        columnLabels={columnLabels}
                        tableRows={tableRows}
                        cards={cards}
                        cardGridClassName="grid md:grid-cols-2 gap-6"
                        tableClassName="min-w-[860px]"
                        details={resinDetails}
                        sectionLabel={t('detailSectionLabel')}
                        hint={t('detailHint')}
                        viewDetail={t('viewDetail')}
                    />

                    <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10 space-y-5">
                        <h2 className="text-2xl font-black">{t('faqTitle')}</h2>
                        <div className="space-y-5">
                            {faqs.map((item) => (
                                <div key={item.q} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                                    <h3 className="text-lg font-black text-white mb-2">{item.q}</h3>
                                    <p className="text-white/68 leading-relaxed break-keep">{item.a}</p>
                                </div>
                            ))}
                        </div>
                    </article>

                    <div className="flex gap-3">
                        <Link href={'/materials' as '/'}>
                            <Button
                                variant="outline"
                                className="rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                            >
                                {t('ctaMaterials')}
                            </Button>
                        </Link>
                        <Link href={'/quote' as '/'}>
                            <Button className="rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black">
                                {t('ctaQuote')} <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <WorkPhotosSection photos={pickGuideWorkPhotos('standard-vs-tough-vs-clear-vs-flexible-resin', locale)} locale={locale} />

            <Footer />
        </main>
    )
}
