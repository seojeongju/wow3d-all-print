import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import GuideCTA from '@/components/guides/GuideCTA'
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/aeo-schema'
import {
    buildPhotoTo3DHowToSchema,
    buildPhotoTo3DShowcaseSchema,
    PHOTO_TO_3D_GUIDE_PATH,
    PHOTO_TO_3D_QUOTE_PATH,
} from '@/lib/seo-photo-to-3d'
import PhotoTo3DBeforeAfter from '@/components/seo/PhotoTo3DBeforeAfter'
import { getPhotoTo3DShowcaseItems } from '@/lib/photo-to-3d-showcase'
import { Link, getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site-url'
import { Check, X } from 'lucide-react'

type Props = {
    params: Promise<{ locale: string }>
}

type StepItem = { title: string; body: string }
type FaqItem = { q: string; a: string }
type CompareRow = { label: string; maker: string; photo: string }
type HowToStep = { name: string; text: string }

function resolveLocale(localeParam: string): AppLocale {
    return (routing.locales.includes(localeParam as AppLocale)
        ? localeParam
        : routing.defaultLocale) as AppLocale
}

function guidePath(locale: AppLocale) {
    return getPathname({ locale, href: PHOTO_TO_3D_GUIDE_PATH as '/' })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'PhotoTo3DGuide' })

    const title = t('metaTitle')
    const description = t('metaDescription')
    const keywords = t.raw('metaKeywords') as string[]
    const path = guidePath(locale)
    const canonical = `${SITE_URL}${path}`

    return {
        title,
        description,
        keywords,
        alternates: {
            canonical,
            languages: {
                ko: `${SITE_URL}${guidePath('ko')}`,
                en: `${SITE_URL}${guidePath('en')}`,
                'x-default': `${SITE_URL}${guidePath('ko')}`,
            },
        },
        openGraph: {
            title,
            description,
            url: canonical,
            type: 'article',
            locale: locale === 'en' ? 'en_US' : 'ko_KR',
        },
    }
}

export default async function PhotoTo3DPrintingGuidePage({ params }: Props) {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)

    const t = await getTranslations({ locale, namespace: 'PhotoTo3DGuide' })
    const tChrome = await getTranslations({ locale, namespace: 'GuideChrome' })

    const steps = t.raw('steps') as StepItem[]
    const goodPhoto = t.raw('goodPhoto') as string[]
    const badPhoto = t.raw('badPhoto') as string[]
    const faqs = t.raw('faqs') as FaqItem[]
    const makerVsPhotoRows = t.raw('makerVsPhotoRows') as CompareRow[]
    const howToSteps = t.raw('howToSteps') as HowToStep[]

    const path = guidePath(locale)
    const homePath = getPathname({ locale, href: '/' })
    const guidesHubPath = getPathname({ locale, href: '/guides' })
    const quotePath = getPathname({ locale, href: '/quote' })

    const showcaseItems = await getPhotoTo3DShowcaseItems()

    const articleSchema = buildArticleSchema({
        headline: t('articleHeadline'),
        description: t('metaDescription'),
        path,
    })

    const breadcrumbSchema = buildBreadcrumbSchema([
        { name: tChrome('breadcrumbHome'), path: homePath },
        { name: tChrome('breadcrumbGuides'), path: guidesHubPath },
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

    const howToSchema = {
        ...buildPhotoTo3DHowToSchema({ locale, guidePath: path }),
        name: t('howToName'),
        description: t('howToDescription'),
        supply: [
            { '@type': 'HowToSupply', name: t('howToSupplyPhoto') },
            { '@type': 'HowToSupply', name: t('howToSupplyLogin') },
        ],
        tool: [{ '@type': 'HowToTool', name: t('howToTool') }],
        step: howToSteps.map((step, index) => ({
            '@type': 'HowToStep',
            position: index + 1,
            name: step.name,
            text: step.text,
            url:
                index < 2
                    ? `${SITE_URL}${quotePath}?entry=photo`
                    : index === 2
                      ? `${SITE_URL}${quotePath}`
                      : `${SITE_URL}${getPathname({ locale, href: '/checkout' })}`,
        })),
        url: `${SITE_URL}${path}`,
    }

    const showcaseSchema = buildPhotoTo3DShowcaseSchema(showcaseItems, {
        locale,
        path,
        name: t('showcaseSchemaName'),
        description: t('showcaseSchemaDescription'),
    })

    const schemas = [articleSchema, breadcrumbSchema, faqSchema, howToSchema, showcaseSchema]

    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <Header />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(schemas),
                }}
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
                    <p className="max-w-3xl text-lg text-white/70 leading-relaxed break-keep">
                        {t('heroBody')}
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                        <Link
                            href={PHOTO_TO_3D_QUOTE_PATH as '/'}
                            className="inline-flex items-center rounded-2xl bg-teal-400 px-6 py-3 text-sm font-black text-slate-950 hover:bg-teal-300 transition-colors"
                        >
                            {t('ctaStart')}
                        </Link>
                        <Link
                            href={'/guides/3d-printing-file-preparation' as '/'}
                            className="inline-flex items-center rounded-2xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-black text-white hover:bg-white/10 transition-colors"
                        >
                            {t('ctaStlGuide')}
                        </Link>
                    </div>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto px-6 max-w-5xl space-y-12">
                    <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10 space-y-6">
                        <h2 className="text-2xl font-black">{t('stepsHeading')}</h2>
                        <ol className="space-y-4">
                            {steps.map((step, i) => (
                                <li
                                    key={step.title}
                                    className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5"
                                >
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-400/20 text-sm font-black text-teal-300">
                                        {i + 1}
                                    </span>
                                    <div>
                                        <h3 className="text-lg font-black mb-1">{step.title}</h3>
                                        <p className="text-white/68 leading-relaxed break-keep">{step.body}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </article>

                    <PhotoTo3DBeforeAfter
                        items={showcaseItems}
                        heading={t('showcaseHeading')}
                        description={t('showcaseDescription')}
                        beforeLabel={t('beforeLabel')}
                        afterLabel={t('afterLabel')}
                    />

                    <div className="grid md:grid-cols-2 gap-5">
                        <article className="rounded-2xl border border-teal-400/20 bg-teal-500/5 p-6 space-y-3">
                            <h2 className="text-lg font-black text-teal-200">{t('goodHeading')}</h2>
                            <ul className="space-y-2">
                                {goodPhoto.map((item) => (
                                    <li key={item} className="flex items-start gap-2 text-sm text-white/75 break-keep">
                                        <Check className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </article>
                        <article className="rounded-2xl border border-red-400/20 bg-red-500/5 p-6 space-y-3">
                            <h2 className="text-lg font-black text-red-200">{t('badHeading')}</h2>
                            <ul className="space-y-2">
                                {badPhoto.map((item) => (
                                    <li key={item} className="flex items-start gap-2 text-sm text-white/75 break-keep">
                                        <X className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </article>
                    </div>

                    <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10 space-y-5 overflow-x-auto">
                        <h2 className="text-2xl font-black">{t('compareHeading')}</h2>
                        <p className="text-white/65 text-sm break-keep leading-relaxed">
                            {t('compareIntro')}
                        </p>
                        <table className="w-full min-w-[480px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-white/45">
                                    <th className="py-2 pr-4 font-black">{t('compareColCategory')}</th>
                                    <th className="py-2 pr-4 font-black">{t('compareColMaker')}</th>
                                    <th className="py-2 font-black">{t('compareColPhoto')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {makerVsPhotoRows.map((row) => (
                                    <tr key={row.label} className="border-b border-white/5">
                                        <td className="py-3 pr-4 font-bold text-white/50">{row.label}</td>
                                        <td className="py-3 pr-4 text-white/75 break-keep">{row.maker}</td>
                                        <td className="py-3 text-teal-200/90 break-keep">{row.photo}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex flex-wrap gap-3 pt-2">
                            <Link
                                href={'/maker' as '/'}
                                className="text-sm font-bold text-white/60 hover:text-white underline-offset-2 hover:underline"
                            >
                                {t('compareLinkMaker')}
                            </Link>
                            <Link
                                href={PHOTO_TO_3D_QUOTE_PATH as '/'}
                                className="text-sm font-bold text-teal-300 hover:text-teal-200 underline-offset-2 hover:underline"
                            >
                                {t('compareLinkPhoto')}
                            </Link>
                        </div>
                    </article>

                    <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10 space-y-6">
                        <h2 className="text-2xl font-black">{t('faqHeading')}</h2>
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
                        eyebrow={t('ctaEyebrow')}
                        title={t('ctaTitle')}
                        description={t('ctaDescription')}
                        primaryHref={PHOTO_TO_3D_QUOTE_PATH}
                        primaryLabel={t('ctaPrimary')}
                        secondaryHref="/services/photo-to-3d"
                        secondaryLabel={t('ctaSecondary')}
                        trackingSource="photo_to_3d"
                        trackingTopic={t('ctaTrackingTopic')}
                    />
                </div>
            </section>

            <Footer />
        </main>
    )
}
