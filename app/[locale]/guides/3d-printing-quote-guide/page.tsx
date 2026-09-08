import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { ArrowRight, Calculator, Layers, Printer, Clock } from 'lucide-react'
import { buildArticleSchema } from '@/lib/aeo-schema'
import { Link, getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site-url'
import { PHOTO_TO_3D_QUOTE_PATH } from '@/lib/seo-photo-to-3d'

type Props = {
    params: Promise<{ locale: string }>
}

type CardItem = { title: string; body: string }
type FaqItem = { q: string; a: string }

const GUIDE_PATH = '/guides/3d-printing-quote-guide' as const
const CARD_ICONS = [Printer, Layers, Clock] as const

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
    const t = await getTranslations({ locale, namespace: 'QuoteGuide' })

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

export default async function QuoteGuidePage({ params }: Props) {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)

    const t = await getTranslations({ locale, namespace: 'QuoteGuide' })

    const cards = t.raw('cards') as CardItem[]
    const criteriaItems = t.raw('criteriaItems') as string[]
    const faqs = t.raw('faqs') as FaqItem[]

    const path = guidePath(locale)

    const articleSchema = buildArticleSchema({
        headline: t('articleHeadline'),
        description: t('articleDescription'),
        path,
    })

    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.a,
            },
        })),
        url: `${SITE_URL}${path}`,
    }

    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <Header />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify([faqSchema, articleSchema]) }}
            />

            <section className="pt-32 pb-20 border-b border-white/10">
                <div className="container mx-auto px-6 max-w-5xl">
                    <div className="max-w-3xl space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full bg-teal-400/10 border border-teal-400/20 px-4 py-2 text-[11px] font-black tracking-[0.25em] uppercase text-teal-300">
                            <Calculator className="w-4 h-4" /> {t('eyebrow')}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                            {t('h1Line1')}
                            <br />
                            <span className="text-teal-400">{t('h1Accent')}</span>
                        </h1>
                        <p className="text-lg text-white/70 leading-relaxed break-keep">{t('intro')}</p>
                    </div>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto px-6 max-w-5xl space-y-12">
                    <div className="grid md:grid-cols-3 gap-6">
                        {cards.map((card, index) => {
                            const Icon = CARD_ICONS[index] ?? Printer
                            return (
                                <article
                                    key={card.title}
                                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                                >
                                    <Icon className="w-8 h-8 text-teal-400 mb-4" />
                                    <h2 className="text-xl font-black mb-3">{card.title}</h2>
                                    <p className="text-white/65 leading-relaxed">{card.body}</p>
                                </article>
                            )
                        })}
                    </div>

                    <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10 space-y-5">
                        <h2 className="text-2xl font-black">{t('criteriaTitle')}</h2>
                        <p className="text-white/70 leading-relaxed break-keep">{t('criteriaBody')}</p>
                        <ul className="space-y-2 text-white/75 leading-relaxed">
                            {criteriaItems.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </article>

                    <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10 space-y-5">
                        <h2 className="text-2xl font-black">{t('layerTitle')}</h2>
                        <p className="text-white/70 leading-relaxed break-keep">{t('layerBody')}</p>
                        <div className="rounded-2xl bg-black/20 border border-white/10 p-5 text-sm text-white/70">
                            {t('layerNote')}
                        </div>
                    </article>

                    <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10 space-y-6">
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

                    <div className="rounded-[2rem] border border-teal-400/20 bg-teal-400/5 p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black">{t('ctaTitle')}</h2>
                            <p className="text-white/70 break-keep">{t('ctaBody')}</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link href={'/quote' as '/'}>
                                <Button className="h-12 px-6 rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black">
                                    {t('ctaQuote')} <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                            <Link href={PHOTO_TO_3D_QUOTE_PATH as '/'}>
                                <Button
                                    variant="outline"
                                    className="h-12 px-6 rounded-2xl border-indigo-400/30 bg-indigo-500/10 text-white hover:bg-indigo-500/20"
                                >
                                    {t('ctaPhoto')}
                                </Button>
                            </Link>
                            <Link href={'/print-methods' as '/'}>
                                <Button
                                    variant="outline"
                                    className="h-12 px-6 rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                                >
                                    {t('ctaMethods')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
