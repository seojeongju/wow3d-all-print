import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import UseCaseLandingPage from '@/components/seo/UseCaseLandingPage'
import { USE_CASES, getUseCaseBySlug, pickUseCaseWorkPhotos, getUseCaseContent } from '@/lib/use-case-pages'
import { getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site-url'
import { buildWorkPhotoOgImages } from '@/lib/seo-work-photos'

type Props = { params: Promise<{ locale: string; slug: string }> }

function resolveLocale(localeParam: string): AppLocale {
    return (routing.locales.includes(localeParam as AppLocale)
        ? localeParam
        : routing.defaultLocale) as AppLocale
}

export function generateStaticParams() {
    return USE_CASES.map((u) => ({ slug: u.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale: localeParam, slug } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const config = getUseCaseBySlug(slug)
    if (!config) return {}
    const c = getUseCaseContent(config, locale)

    const path = getPathname({ locale, href: config.path as '/' })
    const canonical = `${SITE_URL}${path}`

    return {
        title: c.title,
        description: c.description,
        alternates: {
            canonical,
            languages: {
                ko: `${SITE_URL}${getPathname({ locale: 'ko', href: config.path as '/' })}`,
                en: `${SITE_URL}${getPathname({ locale: 'en', href: config.path as '/' })}`,
                'x-default': `${SITE_URL}${getPathname({ locale: 'ko', href: config.path as '/' })}`,
            },
        },
        openGraph: {
            title: c.title,
            description: c.description,
            url: canonical,
            type: 'article',
            locale: locale === 'en' ? 'en_US' : 'ko_KR',
            images: buildWorkPhotoOgImages(pickUseCaseWorkPhotos(config, locale)),
        },
    }
}

export default async function UseCaseDetailPage({ params }: Props) {
    const { locale: localeParam, slug } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const config = getUseCaseBySlug(slug)
    if (!config) notFound()
    return <UseCaseLandingPage config={config} locale={locale} />
}
