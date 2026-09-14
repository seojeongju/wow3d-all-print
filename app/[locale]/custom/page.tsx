import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL, buildOgImages } from '@/lib/site-url'
import { getCustomProductList } from '@/lib/custom-products-public'
import { getProductMainImage } from '@/lib/custom-products'
import {
    buildBreadcrumbSchema,
    buildCollectionPageSchema,
    buildCustomProductItemListSchema,
} from '@/lib/aeo-schema'
import CustomHubClient from './CustomHubClient'

export const dynamic = 'force-dynamic'

type Props = {
    params: Promise<{ locale: string }>
}

function resolveLocale(localeParam: string): AppLocale {
    return (routing.locales.includes(localeParam as AppLocale)
        ? localeParam
        : routing.defaultLocale) as AppLocale
}

function customPath(locale: AppLocale) {
    return getPathname({ locale, href: '/custom' })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'CustomProducts' })

    const title = t('metaTitle')
    const description = t('metaDescription')
    const path = customPath(locale)
    const canonical = `${SITE_URL}${path}`
    const ogImages = buildOgImages()

    return {
        title,
        description,
        alternates: {
            canonical,
            languages: {
                ko: `${SITE_URL}${customPath('ko')}`,
                en: `${SITE_URL}${customPath('en')}`,
                'x-default': `${SITE_URL}${customPath('ko')}`,
            },
        },
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            url: canonical,
            type: 'website',
            locale: locale === 'en' ? 'en_US' : 'ko_KR',
            images: ogImages,
        },
        twitter: {
            card: 'summary_large_image',
            title: t('ogTitle'),
            description: t('ogDescription'),
            images: ogImages.map((img) => img.url),
        },
    }
}

export default async function CustomProductsPage({ params }: Props) {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'CustomProducts' })
    const products = await getCustomProductList()

    const hubPath = customPath(locale)
    const schemas = [
        buildCollectionPageSchema({
            name: `${t('hubTitle')} ${t('hubTitleAccent')}`,
            description: t('metaDescription'),
            path: hubPath,
        }),
        buildCustomProductItemListSchema(
            products.map((p) => ({
                name: p.title,
                path: getPathname({ locale, href: `/custom/${p.slug}` }),
                imageUrl: getProductMainImage(p),
            })),
            hubPath
        ),
        buildBreadcrumbSchema([
            { name: '홈', path: locale === 'en' ? '/en' : '/' },
            { name: t('backToHub'), path: hubPath },
        ]),
    ]

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
            />
            <CustomHubClient products={products} />
        </>
    )
}
