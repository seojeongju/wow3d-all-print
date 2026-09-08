import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { buildBreadcrumbSchema, buildCollectionPageSchema } from '@/lib/aeo-schema'
import { getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site-url'

type Props = {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}

function printMethodsPath(locale: AppLocale) {
    return getPathname({ locale, href: '/print-methods' })
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
    const t = await getTranslations({ locale, namespace: 'PrintMethods' })

    const title = t('metaTitle')
    const description = t('metaDescription')
    const path = printMethodsPath(locale)
    const canonical = `${SITE_URL}${path}`

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: canonical,
            locale: locale === 'en' ? 'en_US' : 'ko_KR',
        },
        alternates: {
            canonical,
            languages: {
                ko: `${SITE_URL}${printMethodsPath('ko')}`,
                en: `${SITE_URL}${printMethodsPath('en')}`,
                'x-default': `${SITE_URL}${printMethodsPath('ko')}`,
            },
        },
    }
}

export default async function PrintMethodsLayout({ children, params }: Props) {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'PrintMethods' })

    const title = t('metaTitle')
    const description = t('metaDescription')
    const path = printMethodsPath(locale)
    const homePath = locale === 'en' ? '/en' : '/'

    const schemas = [
        buildCollectionPageSchema({
            name: title,
            description,
            path,
        }),
        buildBreadcrumbSchema([
            { name: t('breadcrumbHome'), path: homePath },
            { name: t('breadcrumbMethods'), path },
        ]),
    ]

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
            />
            {children}
        </>
    )
}
