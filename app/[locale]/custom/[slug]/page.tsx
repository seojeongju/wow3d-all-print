import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { absoluteUrl, SITE_URL } from '@/lib/site-url'
import { getCustomProductBySlug } from '@/lib/custom-products-public'
import { getProductMainImage, normalizeCustomProductSlug } from '@/lib/custom-products'
import {
    buildBreadcrumbSchema,
    buildCustomProductSchema,
} from '@/lib/aeo-schema'
import CustomProductDetailClient from './CustomProductDetailClient'

/** DB에 새로 등록한 상품도 배포 없이 바로 열리도록 런타임 렌더 */
export const dynamic = 'force-dynamic'
export const dynamicParams = true

type Props = {
    params: Promise<{ locale: string; slug: string }>
}

function resolveLocale(localeParam: string): AppLocale {
    return (routing.locales.includes(localeParam as AppLocale)
        ? localeParam
        : routing.defaultLocale) as AppLocale
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale: localeParam, slug: slugRaw } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const slug = normalizeCustomProductSlug(slugRaw)

    const product = await getCustomProductBySlug(slug)
    if (!product) {
        return { title: 'Not Found' }
    }

    const t = await getTranslations({ locale, namespace: 'CustomProducts' })
    const title = product.title
    const description = product.summary || product.description
    const path = getPathname({ locale, href: `/custom/${product.slug}` })
    const canonical = `${SITE_URL}${path}`
    const mainImage = absoluteUrl(getProductMainImage(product))

    return {
        title: `${title} | ${t('metaBrand')}`,
        description,
        alternates: {
            canonical,
            languages: {
                ko: `${SITE_URL}${getPathname({ locale: 'ko', href: `/custom/${product.slug}` })}`,
                en: `${SITE_URL}${getPathname({ locale: 'en', href: `/custom/${product.slug}` })}`,
                'x-default': `${SITE_URL}${getPathname({ locale: 'ko', href: `/custom/${product.slug}` })}`,
            },
        },
        openGraph: {
            title,
            description,
            url: canonical,
            type: 'website',
            locale: locale === 'en' ? 'en_US' : 'ko_KR',
            images: [
                {
                    url: mainImage,
                    alt: title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [mainImage],
        },
    }
}

export default async function CustomProductDetailPage({ params }: Props) {
    const { locale: localeParam, slug: slugRaw } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)

    const slug = normalizeCustomProductSlug(slugRaw)
    const product = await getCustomProductBySlug(slug)
    if (!product) notFound()

    const t = await getTranslations({ locale, namespace: 'CustomProducts' })
    const detailPath = getPathname({ locale, href: `/custom/${product.slug}` })
    const hubPath = getPathname({ locale, href: '/custom' })

    const schemas = [
        buildCustomProductSchema({
            name: product.title,
            description: product.summary || product.description,
            path: detailPath,
            imageUrls: product.images.slice(0, 8),
            priceNote: product.priceNote,
            brandName: t('metaBrand'),
            sku: product.slug,
        }),
        buildBreadcrumbSchema([
            { name: '홈', path: locale === 'en' ? '/en' : '/' },
            { name: t('backToHub'), path: hubPath },
            { name: product.title, path: detailPath },
        ]),
    ]

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
            />
            <CustomProductDetailClient product={product} />
        </>
    )
}
