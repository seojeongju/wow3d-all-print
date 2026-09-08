import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site-url'
import { isShowcaseSlug } from '@/lib/showcase'
import { getShowcaseDetail } from '@/lib/showcase-public'
import ShowcaseDetailClient from './ShowcaseDetailClient'

type Props = {
    params: Promise<{ locale: string; slug: string }>
}

function resolveLocale(localeParam: string): AppLocale {
    return (routing.locales.includes(localeParam as AppLocale)
        ? localeParam
        : routing.defaultLocale) as AppLocale
}

function showcasePath(locale: AppLocale, slug: string) {
    return getPathname({ locale, href: `/expert/showcase/${slug}` })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale: localeParam, slug } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'Expert' })

    if (!isShowcaseSlug(slug)) {
        return { title: t('showcaseMetaFallback') }
    }

    const data = await getShowcaseDetail(slug)
    const path = showcasePath(locale, slug)
    const canonical = `${SITE_URL}${path}`
    const title = t('showcaseMetaTitle', { title: data.title })
    const description = data.description

    return {
        title,
        description,
        alternates: {
            canonical,
            languages: {
                ko: `${SITE_URL}${showcasePath('ko', slug)}`,
                en: `${SITE_URL}${showcasePath('en', slug)}`,
                'x-default': `${SITE_URL}${showcasePath('ko', slug)}`,
            },
        },
        openGraph: {
            title: t('showcaseOgTitle', { title: data.title }),
            description,
            url: canonical,
            type: 'website',
            locale: locale === 'en' ? 'en_US' : 'ko_KR',
        },
    }
}

export default async function ExpertShowcasePage({ params }: Props) {
    const { locale: localeParam, slug } = await params
    setRequestLocale(resolveLocale(localeParam))
    if (!isShowcaseSlug(slug)) notFound()
    const data = await getShowcaseDetail(slug)
    return <ShowcaseDetailClient slug={slug} initialData={data} />
}
