import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site-url'
import { getCustomProductList } from '@/lib/custom-products-public'
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
        },
    }
}

export default async function CustomProductsPage({ params }: Props) {
    const { locale: localeParam } = await params
    setRequestLocale(resolveLocale(localeParam))
    const products = await getCustomProductList()
    return <CustomHubClient products={products} />
}
