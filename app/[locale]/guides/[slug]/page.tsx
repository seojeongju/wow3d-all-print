import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import GuideLandingPage from '@/components/seo/GuideLandingPage'
import { getGuideBySlug, NEW_SEO_GUIDES } from '@/lib/seo-guide-pages'
import { getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site-url'

type Props = { params: Promise<{ locale: string; slug: string }> }

function resolveLocale(localeParam: string): AppLocale {
    return (routing.locales.includes(localeParam as AppLocale)
        ? localeParam
        : routing.defaultLocale) as AppLocale
}

export function generateStaticParams() {
    return NEW_SEO_GUIDES.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale: localeParam, slug } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const config = getGuideBySlug(slug, locale)
    if (!config) return {}

    const path = getPathname({ locale, href: config.path as '/' })
    const canonical = `${SITE_URL}${path}`

    return {
        title: config.title,
        description: config.description,
        alternates: {
            canonical,
            languages: {
                ko: `${SITE_URL}${getPathname({ locale: 'ko', href: config.path as '/' })}`,
                en: `${SITE_URL}${getPathname({ locale: 'en', href: config.path as '/' })}`,
                'x-default': `${SITE_URL}${getPathname({ locale: 'ko', href: config.path as '/' })}`,
            },
        },
        openGraph: {
            title: config.title,
            description: config.description,
            url: canonical,
            type: 'article',
            locale: locale === 'en' ? 'en_US' : 'ko_KR',
        },
    }
}

export default async function DynamicSeoGuidePage({ params }: Props) {
    const { locale: localeParam, slug } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const config = getGuideBySlug(slug, locale)
    if (!config) notFound()
    return <GuideLandingPage config={config} locale={locale} />
}
