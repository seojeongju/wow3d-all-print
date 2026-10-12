import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ArrowRight, Calculator, Camera, ScanSearch } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import WorkPhotosSection from '@/components/seo/WorkPhotosSection'
import { buildBreadcrumbSchema, buildCollectionPageSchema } from '@/lib/aeo-schema'
import { buildWorkPhotoOgImages, pickWorkPhotos } from '@/lib/seo-work-photos'
import { USE_CASES, getUseCaseContent } from '@/lib/use-case-pages'
import { Link, getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site-url'

type Props = { params: Promise<{ locale: string }> }

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

    const tools = [
        { href: '/price-calculator', icon: Calculator, title: t('toolCalcTitle'), desc: t('toolCalcDesc') },
        { href: '/stl-checker', icon: ScanSearch, title: t('toolCheckerTitle'), desc: t('toolCheckerDesc') },
        { href: '/quote?entry=photo&guide_source=use_case_hub', icon: Camera, title: t('toolPhotoTitle'), desc: t('toolPhotoDesc') },
    ]

    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <Header />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />

            <section className="pt-32 pb-14 border-b border-white/10">
                <div className="container mx-auto px-6 max-w-6xl space-y-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-400">{t('hubEyebrow')}</p>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight break-keep">
                        {t('hubTitle')}
                        <br />
                        <span className="text-teal-400">{t('hubTitleAccent')}</span>
                    </h1>
                    <p className="max-w-3xl text-lg text-white/70 leading-relaxed break-keep">{t('hubSubtitle')}</p>
                </div>
            </section>

            <section className="py-14">
                <div className="container mx-auto px-6 max-w-6xl space-y-14">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {USE_CASES.map((u) => {
                            const c = getUseCaseContent(u, locale)
                            const lead = c.recommendations[0]
                            return (
                                <Link
                                    key={u.slug}
                                    href={u.path as '/'}
                                    className="group flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-teal-400/40 hover:bg-teal-400/[0.04]"
                                >
                                    <h2 className="text-lg font-black break-keep">{c.name}</h2>
                                    <p className="mt-2 flex-1 text-sm text-white/60 leading-relaxed break-keep">{c.cardDesc}</p>
                                    <p className="mt-4 text-[12px] font-black text-teal-300 break-keep">
                                        {lead.method} · {lead.materials}
                                    </p>
                                    <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-black text-white/50 group-hover:text-white">
                                        {t('viewCase')} <ArrowRight className="h-3.5 w-3.5" />
                                    </span>
                                </Link>
                            )
                        })}
                    </div>

                    <div>
                        <h2 className="text-2xl md:text-3xl font-black mb-6 break-keep">{t('toolsHeading')}</h2>
                        <div className="grid gap-4 md:grid-cols-3">
                            {tools.map(({ href, icon: Icon, title, desc }) => (
                                <Link
                                    key={href}
                                    href={href as '/'}
                                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-indigo-400/40"
                                >
                                    <Icon className="h-6 w-6 text-indigo-300" />
                                    <h3 className="mt-3 text-lg font-black break-keep">{title}</h3>
                                    <p className="mt-1 text-sm text-white/60 leading-relaxed break-keep">{desc}</p>
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
