import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site-url'
import {
    CUSTOM_PRODUCT_SLUGS,
    getCustomProduct,
    isCustomProductSlug,
} from '@/lib/custom-products'
import CustomProductDetailClient from './CustomProductDetailClient'

type Props = {
    params: Promise<{ locale: string; slug: string }>
}

function resolveLocale(localeParam: string): AppLocale {
    return (routing.locales.includes(localeParam as AppLocale)
        ? localeParam
        : routing.defaultLocale) as AppLocale
}

export function generateStaticParams() {
    return CUSTOM_PRODUCT_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale: localeParam, slug } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)

    if (!isCustomProductSlug(slug)) {
        return { title: 'Not Found' }
    }

    const t = await getTranslations({ locale, namespace: 'CustomProducts' })
    const title = t(`products.${slug}.title`)
    const description = t(`products.${slug}.summary`)
    const path = getPathname({ locale, href: `/custom/${slug}` })
    const canonical = `${SITE_URL}${path}`

    return {
        title: `${title} | ${t('metaBrand')}`,
        description,
        alternates: {
            canonical,
            languages: {
                ko: `${SITE_URL}${getPathname({ locale: 'ko', href: `/custom/${slug}` })}`,
                en: `${SITE_URL}${getPathname({ locale: 'en', href: `/custom/${slug}` })}`,
                'x-default': `${SITE_URL}${getPathname({ locale: 'ko', href: `/custom/${slug}` })}`,
            },
        },
        openGraph: {
            title,
            description,
            url: canonical,
            type: 'website',
            locale: locale === 'en' ? 'en_US' : 'ko_KR',
        },
    }
}

export default async function CustomProductDetailPage({ params }: Props) {
    const { locale: localeParam, slug } = await params
    setRequestLocale(resolveLocale(localeParam))

    const product = getCustomProduct(slug)
    if (!product) notFound()

    return <CustomProductDetailClient product={product} />
}
