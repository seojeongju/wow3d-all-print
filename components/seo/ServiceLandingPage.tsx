import { getTranslations } from 'next-intl/server'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { absoluteUrl } from '@/lib/site-url'
import { buildBreadcrumbSchema, buildFaqPageSchema } from '@/lib/aeo-schema'
import type { ServiceLandingConfig } from '@/lib/seo-service-pages'
import type { QnAItem } from '@/lib/qna'
import PhotoTo3DBeforeAfter from '@/components/seo/PhotoTo3DBeforeAfter'
import { getPhotoTo3DShowcaseItems } from '@/lib/photo-to-3d-showcase'
import { buildPhotoTo3DShowcaseSchema } from '@/lib/seo-photo-to-3d'
import { Link, getPathname } from '@/i18n/navigation'
import type { AppLocale } from '@/i18n/routing'

type Props = {
    config: ServiceLandingConfig
    locale: AppLocale
}

export default async function ServiceLandingPage({ config, locale }: Props) {
    const t = await getTranslations({ locale, namespace: 'ServiceChrome' })
    const showcaseItems =
        config.slug === 'photo-to-3d' ? await getPhotoTo3DShowcaseItems() : null

    const faqItems: QnAItem[] = config.faqs.map((f, i) => ({
        id: i + 1,
        question: f.q,
        answer: f.a,
        category: 'service',
    }))

    const homePath = getPathname({ locale, href: '/' })
    const servicesPath = getPathname({ locale, href: '/services' })
    const pagePath = getPathname({ locale, href: config.path as '/' })
    const displayName = config.h1Accent ? `${config.h1} ${config.h1Accent}` : config.h1

    const schemas = [
        buildBreadcrumbSchema([
            { name: t('breadcrumbHome'), path: homePath },
            { name: t('breadcrumbServices'), path: servicesPath },
            { name: displayName, path: pagePath },
        ]),
        buildFaqPageSchema(faqItems, pagePath),
        {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: config.title.split('|')[0].trim(),
            description: config.description,
            provider: {
                '@type': 'Organization',
                name: t('organizationName'),
                url: absoluteUrl('/'),
            },
            areaServed: 'KR',
            url: absoluteUrl(pagePath),
        },
        ...(config.slug === 'photo-to-3d' && showcaseItems
            ? [buildPhotoTo3DShowcaseSchema(showcaseItems)]
            : []),
    ]

    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <Header />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
            />

            <section className="pt-32 pb-16 border-b border-white/10">
                <div className="container mx-auto px-6 max-w-5xl space-y-6">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-400">
                        {config.eyebrow}
                    </p>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight break-keep">
                        {config.h1}{' '}
                        <span className="text-teal-400">{config.h1Accent}</span>
                    </h1>
                    <p className="max-w-3xl text-lg text-white/70 leading-relaxed break-keep">
                        {config.description}
                    </p>
                    <div className="flex flex-wrap gap-3 pt-4">
                        <Link href={config.primaryCta.href as '/'}>
                            <Button className="h-12 px-6 rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black gap-2">
                                {config.primaryCta.label}
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                        {config.secondaryCta && (
                            <Link href={config.secondaryCta.href as '/'}>
                                <Button
                                    variant="outline"
                                    className="h-12 px-6 rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                                >
                                    {config.secondaryCta.label}
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto px-6 max-w-5xl space-y-14">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black mb-6">{t('suitableHeading')}</h2>
                        <ul className="space-y-4">
                            {config.bullets.map((b) => (
                                <li key={b} className="flex items-start gap-3 text-white/75 break-keep">
                                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                                    <span className="font-medium leading-relaxed">{b}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {config.slug === 'photo-to-3d' && showcaseItems && (
                        <PhotoTo3DBeforeAfter
                            items={showcaseItems}
                            heading={t('photoShowcaseHeading')}
                            description={t('photoShowcaseDescription')}
                            beforeLabel={t('photoBeforeLabel')}
                            afterLabel={t('photoAfterLabel')}
                        />
                    )}

                    <div>
                        <h2 className="text-2xl md:text-3xl font-black mb-6">{t('faqHeading')}</h2>
                        <div className="space-y-4">
                            {config.faqs.map((f) => (
                                <article
                                    key={f.q}
                                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                                >
                                    <h3 className="text-lg font-black mb-2 break-keep">{f.q}</h3>
                                    <p className="text-white/65 leading-relaxed break-keep">{f.a}</p>
                                </article>
                            ))}
                        </div>
                    </div>

                    {config.relatedGuides && config.relatedGuides.length > 0 && (
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black mb-6">{t('relatedGuidesHeading')}</h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {config.relatedGuides.map((g) => (
                                    <Link
                                        key={g.href}
                                        href={g.href as '/'}
                                        className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.05] transition-colors font-bold"
                                    >
                                        {g.title}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="rounded-[2rem] border border-teal-400/20 bg-teal-400/10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-2xl font-black mb-2">{t('ctaHeading')}</h2>
                            <p className="text-white/70 break-keep">{t('ctaBody')}</p>
                        </div>
                        <Link href={config.primaryCta.href as '/'}>
                            <Button className="h-12 px-6 rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black gap-2">
                                {config.primaryCta.label}
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
