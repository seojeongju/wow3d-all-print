import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL, buildOgImages } from '@/lib/site-url'
import { buildBreadcrumbSchema, buildFaqPageSchema, buildWebPageSchema } from '@/lib/aeo-schema'
import ScopedIntlProvider from '@/components/i18n/ScopedIntlProvider'

type Props = {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}

function calculatorPath(locale: AppLocale) {
    return getPathname({ locale, href: '/price-calculator' })
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
    const t = await getTranslations({ locale, namespace: 'PriceCalculator' })

    const title = t('metaTitle')
    const description = t('metaDescription')
    const canonical = `${SITE_URL}${calculatorPath(locale)}`

    return {
        title,
        description,
        alternates: {
            canonical,
            languages: {
                ko: `${SITE_URL}${calculatorPath('ko')}`,
                en: `${SITE_URL}${calculatorPath('en')}`,
                'x-default': `${SITE_URL}${calculatorPath('ko')}`,
            },
        },
        openGraph: {
            images: buildOgImages(locale),
            title,
            description,
            url: canonical,
            type: 'website',
            locale: locale === 'en' ? 'en_US' : 'ko_KR',
        },
    }
}

export default async function PriceCalculatorLayout({ children, params }: Props) {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'PriceCalculator' })
    const path = calculatorPath(locale)
    const faqs = t.raw('faqs') as Array<{ q: string; a: string }>

    const schemas = [
        buildWebPageSchema({ name: t('metaTitle'), description: t('metaDescription'), path, locale }),
        buildBreadcrumbSchema([
            { name: t('breadcrumbHome'), path: locale === 'en' ? '/en' : '/' },
            { name: t('breadcrumbCalc'), path },
        ]),
        buildFaqPageSchema(
            faqs.map((f, i) => ({ id: i + 1, question: f.q, answer: f.a, category: 'price-calculator' })),
            path
        ),
    ]

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
            <ScopedIntlProvider scope="price-calculator" locale={locale}>
                {children}
            </ScopedIntlProvider>
        </>
    )
}
