import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import ServicesHubClient from '@/components/services/ServicesHubClient'
import { buildBreadcrumbSchema, buildCollectionPageSchema } from '@/lib/aeo-schema'
import { getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site-url'

type Props = {
    params: Promise<{ locale: string }>
}

function resolveLocale(localeParam: string): AppLocale {
    return (routing.locales.includes(localeParam as AppLocale)
        ? localeParam
        : routing.defaultLocale) as AppLocale
}

function servicesPath(locale: AppLocale) {
    return getPathname({ locale, href: '/services' })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'Services' })

    const title = t('metaTitle')
    const description = t('metaDescription')
    const path = servicesPath(locale)
    const canonical = `${SITE_URL}${path}`

    return {
        title,
        description,
        alternates: {
            canonical,
            languages: {
                ko: `${SITE_URL}${servicesPath('ko')}`,
                en: `${SITE_URL}${servicesPath('en')}`,
                'x-default': `${SITE_URL}${servicesPath('ko')}`,
            },
        },
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            url: canonical,
            type: 'website',
            locale: locale === 'en' ? 'en_US' : 'ko_KR',
        },
    }
}

export default async function ServicesHubPage({ params }: Props) {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'Services' })

    const path = servicesPath(locale)
    const homePath = getPathname({ locale, href: '/' })

    const schemas = [
        buildCollectionPageSchema({
            name: t('collectionName'),
            description: t('collectionDescription'),
            path,
        }),
        buildBreadcrumbSchema([
            { name: t('breadcrumbHome'), path: homePath },
            { name: t('breadcrumbServices'), path },
        ]),
    ]

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
            />
            <ServicesHubClient />
        </>
    )
}
