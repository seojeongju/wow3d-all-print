import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import MakerspaceVisitClient from '@/components/makerspace/MakerspaceVisitClient'
import { MAKERSPACES } from '@/lib/makerspaces'
import { buildMakerspaceLocalBusiness } from '@/lib/aeo-schema'
import { getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL, buildOgImages } from '@/lib/site-url'

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
            images: buildOgImages(locale),
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
        // 센터별 LocalBusiness — 회사(Organization)의 subOrganization @id와 같은 엔티티
        itemListElement: MAKERSPACES.map((center, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: buildMakerspaceLocalBusiness(center),
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
