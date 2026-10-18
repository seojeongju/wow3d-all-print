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

function checkerPath(locale: AppLocale) {
    return getPathname({ locale, href: '/stl-checker' })
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
    const t = await getTranslations({ locale, namespace: 'StlChecker' })

    const title = t('metaTitle')
    const description = t('metaDescription')
    const canonical = `${SITE_URL}${checkerPath(locale)}`

    return {
        title,
        description,
        alternates: {
            canonical,
            languages: {
                ko: `${SITE_URL}${checkerPath('ko')}`,
                en: `${SITE_URL}${checkerPath('en')}`,
                'x-default': `${SITE_URL}${checkerPath('ko')}`,
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

export default async function StlCheckerLayout({ children, params }: Props) {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'StlChecker' })
    const path = checkerPath(locale)
    const faqs = t.raw('faqs') as Array<{ q: string; a: string }>

    const schemas = [
        buildWebPageSchema({ name: t('metaTitle'), description: t('metaDescription'), path, locale }),
        buildBreadcrumbSchema([
            { name: t('breadcrumbHome'), path: locale === 'en' ? '/en' : '/' },
            { name: t('breadcrumbChecker'), path },
        ]),
        buildFaqPageSchema(
            faqs.map((f, i) => ({ id: i + 1, question: f.q, answer: f.a, category: 'stl-checker' })),
            path
        ),
    ]

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
            <ScopedIntlProvider scope="stl-checker" locale={locale}>
                {children}
            </ScopedIntlProvider>
        </>
    )
}
