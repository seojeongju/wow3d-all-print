import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { Link, getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site-url'

type Props = {
    params: Promise<{ locale: string }>
}

type StepItem = { label: string; title: string; body: string }

const GUIDE_PATH = '/guides/3d-printing-turnaround-time' as const

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
    const t = await getTranslations({ locale, namespace: 'TurnaroundGuide' })

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

export default async function TurnaroundGuidePage({ params }: Props) {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)

    const t = await getTranslations({ locale, namespace: 'TurnaroundGuide' })
    const steps = t.raw('steps') as StepItem[]
    const factors = t.raw('factors') as string[]

    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <Header />
            <section className="pt-32 pb-20">
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

            <section className="pb-24">
                <div className="container mx-auto px-6 max-w-5xl space-y-10">
                    <div className="grid md:grid-cols-4 gap-4">
                        {steps.map((step) => (
                            <div key={step.label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                                <p className="text-[11px] uppercase tracking-[0.25em] text-teal-400 mb-2">{step.label}</p>
                                <h2 className="text-xl font-black mb-2">{step.title}</h2>
                                <p className="text-white/60">{step.body}</p>
                            </div>
                        ))}
                    </div>

                    <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 space-y-5">
                        <h2 className="text-2xl font-black">{t('factorsTitle')}</h2>
                        <ul className="space-y-2 text-white/70 leading-relaxed">
                            {factors.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </article>

                    <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 space-y-5">
                        <h2 className="text-2xl font-black">{t('flowTitle')}</h2>
                        <p className="text-white/70 leading-relaxed break-keep">{t('flowBody')}</p>
                    </article>

                    <div className="flex gap-3">
                        <Link href={'/contact' as '/'}>
                            <Button className="rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black">
                                {t('ctaContact')} <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                        <Link href={'/quote' as '/'}>
                            <Button
                                variant="outline"
                                className="rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                            >
                                {t('ctaQuote')}
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
            <Footer />
        </main>
    )
}
