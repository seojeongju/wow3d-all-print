import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { buildArticleSchema, buildBreadcrumbSchema, buildCollectionPageSchema } from '@/lib/aeo-schema'
import GuidesHubClient from '@/components/guides/GuidesHubClient'
import { getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site-url'

type Props = {
    params: Promise<{ locale: string }>
}

function guidesPath(locale: AppLocale) {
    return getPathname({ locale, href: '/guides' })
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
    const t = await getTranslations({ locale, namespace: 'GuidesHub' })

    const title = t('metaTitle')
    const description = t('metaDescription')
    const path = guidesPath(locale)
    const canonical = `${SITE_URL}${path}`

    return {
        title,
        description,
        alternates: {
            canonical,
            languages: {
                ko: `${SITE_URL}${guidesPath('ko')}`,
                en: `${SITE_URL}${guidesPath('en')}`,
                'x-default': `${SITE_URL}${guidesPath('ko')}`,
            },
        },
        openGraph: {
            title,
            description,
            url: canonical,
            type: 'website',
            locale: locale === 'en' ? 'en_US' : 'ko_KR',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    }
}

export default async function GuidesIndexPage({ params }: Props) {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'GuidesHub' })
    const tNav = await getTranslations({ locale, namespace: 'Nav' })

    const title = t('metaTitle')
    const description = t('metaDescription')
    const path = guidesPath(locale)
    const homePath = locale === 'en' ? '/en' : '/'
    const homeName = locale === 'en' ? 'Home' : '홈'

    const schemas = [
        buildCollectionPageSchema({
            name: title,
            description,
            path,
        }),
        buildArticleSchema({
            headline: title,
            description,
            path,
        }),
        buildBreadcrumbSchema([
            { name: homeName, path: homePath },
            { name: tNav('guides'), path },
        ]),
    ]

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
            />
            <GuidesHubClient />
        </>
    )
}
