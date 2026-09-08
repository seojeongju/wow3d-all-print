import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import MakerspaceVisitClient from '@/components/makerspace/MakerspaceVisitClient'
import { MAKERSPACES } from '@/lib/makerspaces'
import { getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site-url'

type Props = {
    params: Promise<{ locale: string }>
}

function makerspacePath(locale: AppLocale) {
    return getPathname({ locale, href: '/makerspace' })
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
    const t = await getTranslations({ locale, namespace: 'Makerspace' })

    const title = t('metaTitle')
    const description = t('metaDescription')
    const path = makerspacePath(locale)
    const canonical = `${SITE_URL}${path}`

    return {
        title,
        description,
        alternates: {
            canonical,
            languages: {
                ko: `${SITE_URL}${makerspacePath('ko')}`,
                en: `${SITE_URL}${makerspacePath('en')}`,
                'x-default': `${SITE_URL}${makerspacePath('ko')}`,
            },
        },
        openGraph: {
            title: t('metaOgTitle'),
            description: t('metaOgDescription'),
            url: canonical,
            type: 'website',
            locale: locale === 'en' ? 'en_US' : 'ko_KR',
        },
    }
}

export default async function MakerspacePage({ params }: Props) {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'Makerspace' })

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: t('listSchemaName'),
        itemListElement: MAKERSPACES.map((center, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
                '@type': 'Place',
                name: `WOW3D ${t(`centers.${center.id}.name`)}`,
                address: {
                    '@type': 'PostalAddress',
                    streetAddress: center.addressDetail
                        ? `${center.address} ${center.addressDetail}`
                        : center.address,
                    addressCountry: 'KR',
                },
                geo: {
                    '@type': 'GeoCoordinates',
                    latitude: center.lat,
                    longitude: center.lng,
                },
                ...(center.phone ? { telephone: center.phone } : {}),
            },
        })),
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <MakerspaceVisitClient />
        </>
    )
}
