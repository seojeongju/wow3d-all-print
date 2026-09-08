import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import GuideCTA from '@/components/guides/GuideCTA'
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/aeo-schema'
import { getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site-url'
import {
    BEST_MATERIALS_GUIDE_META,
    type BestMaterialsGuideSlug,
} from '@/lib/best-materials-guides'

type Props = {
    params: Promise<{ locale: string }>
    slug: BestMaterialsGuideSlug
}

type OptionItem = { title: string; detail: string }
type UseCaseItem = { title: string; material: string; reason: string }
type FaqItem = { q: string; a: string }

function resolveLocale(localeParam: string): AppLocale {
    return (routing.locales.includes(localeParam as AppLocale)
        ? localeParam
        : routing.defaultLocale) as AppLocale
}

function guidePath(locale: AppLocale, slug: BestMaterialsGuideSlug) {
    const href = BEST_MATERIALS_GUIDE_META[slug].path
    return getPathname({ locale, href: href as '/' })
}

export async function generateBestMaterialsMetadata({
    params,
    slug,
}: Props): Promise<Metadata> {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'BestMaterialsGuides' })

    const title = t(`${slug}.metaTitle`)
    const description = t(`${slug}.metaDescription`)
    const path = guidePath(locale, slug)
    const canonical = `${SITE_URL}${path}`

    return {
        title,
        description,
        alternates: {
            canonical,
            languages: {
                ko: `${SITE_URL}${guidePath('ko', slug)}`,
                en: `${SITE_URL}${guidePath('en', slug)}`,
                'x-default': `${SITE_URL}${guidePath('ko', slug)}`,
            },
        },
        openGraph: {
            title: t(`${slug}.ogTitle`),
            description: t(`${slug}.ogDescription`),
            url: canonical,
            type: 'article',
            locale: locale === 'en' ? 'en_US' : 'ko_KR',
        },
    }
}

export async function BestMaterialsGuidePage({ params, slug }: Props) {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)

    const meta = BEST_MATERIALS_GUIDE_META[slug]
    const t = await getTranslations({ locale, namespace: 'BestMaterialsGuides' })
    const tChrome = await getTranslations({ locale, namespace: 'GuideChrome' })

    const faqs = t.raw(`${slug}.faqs`) as FaqItem[]
    const checklistItems = t.raw(`${slug}.checklistItems`) as string[]

    const path = guidePath(locale, slug)
    const homePath = getPathname({ locale, href: '/' })
    const materialsPath = getPathname({ locale, href: '/materials' })

    const articleSchema = buildArticleSchema({
        headline: t(`${slug}.articleHeadline`),
        description: t(`${slug}.articleDescription`),
        path,
    })

    const breadcrumbSchema = buildBreadcrumbSchema([
        { name: tChrome('breadcrumbHome'), path: homePath },
        { name: t('breadcrumbMaterials'), path: materialsPath },
        { name: t(`${slug}.breadcrumbCurrent`), path },
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
                        {t(`${slug}.eyebrow`)}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                        {t(`${slug}.h1Line1`)}
                        <br />
                        <span className="text-teal-400">{t(`${slug}.h1Accent`)}</span>
                    </h1>
                    <p className="max-w-3xl text-lg text-white/70 leading-relaxed break-keep">{t(`${slug}.intro`)}</p>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto px-6 max-w-5xl space-y-10">
                    {meta.variant === 'useCases' ? (
                        <div className="grid md:grid-cols-2 gap-6">
                            {(t.raw(`${slug}.items`) as UseCaseItem[]).map((item) => (
                                <article key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                                    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-400 mb-2">
                                        {t('useCaseLabel')}
                                    </p>
                                    <h2 className="text-2xl font-black mb-3">{item.title}</h2>
                                    <p className="text-white mb-3 font-bold">{item.material}</p>
                                    <p className="text-white/65 leading-relaxed break-keep">{item.reason}</p>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {(t.raw(`${slug}.items`) as OptionItem[]).map((item) => (
                                <article key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                                    <h2 className="text-2xl font-black mb-3">{item.title}</h2>
                                    <p className="text-white/65 leading-relaxed break-keep">{item.detail}</p>
                                </article>
                            ))}
                        </div>
                    )}

                    <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10 space-y-5">
                        <h2 className="text-2xl font-black">{t(`${slug}.checklistTitle`)}</h2>
                        <ul className="space-y-2 text-white/75 leading-relaxed">
                            {checklistItems.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </article>

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

                    <GuideCTA
                        eyebrow={t(`${slug}.ctaEyebrow`)}
                        title={t(`${slug}.ctaTitle`)}
                        description={t(`${slug}.ctaDescription`)}
                        trackingSource={meta.trackingSource}
                        trackingTopic={t(`${slug}.trackingTopic`)}
                        secondaryHref="/materials"
                        secondaryLabel={t('ctaSecondaryLabel')}
                    />
                </div>
            </section>

            <Footer />
        </main>
    )
}
