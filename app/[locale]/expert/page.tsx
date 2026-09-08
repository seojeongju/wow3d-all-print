import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getShowcaseCategories } from '@/lib/showcase-public'
import { getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site-url'
import ExpertPageClient from './ExpertPageClient'

type Props = {
    params: Promise<{ locale: string }>
}

function resolveLocale(localeParam: string): AppLocale {
    return (routing.locales.includes(localeParam as AppLocale)
        ? localeParam
        : routing.defaultLocale) as AppLocale
}

function expertPath(locale: AppLocale) {
    return getPathname({ locale, href: '/expert' })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'Expert' })

    const title = t('metaTitle')
    const description = t('metaDescription')
    const path = expertPath(locale)
    const canonical = `${SITE_URL}${path}`

    return {
        title,
        description,
        alternates: {
            canonical,
            languages: {
                ko: `${SITE_URL}${expertPath('ko')}`,
                en: `${SITE_URL}${expertPath('en')}`,
                'x-default': `${SITE_URL}${expertPath('ko')}`,
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

export default async function ExpertServicePage({ params }: Props) {
    const { locale: localeParam } = await params
    setRequestLocale(resolveLocale(localeParam))
    const cards = await getShowcaseCategories()
    return <ExpertPageClient initialCards={cards} />
}
