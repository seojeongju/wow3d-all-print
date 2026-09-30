import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { routing, type AppLocale } from '@/i18n/routing'
import SearchPageClient from './SearchPageClient'

type Props = {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ q?: string | string[] }>
}

function resolveLocale(localeParam: string): AppLocale {
    return (routing.locales.includes(localeParam as AppLocale) ? localeParam : routing.defaultLocale) as AppLocale
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'Search' })
    return {
        title: t('metaTitle'),
        description: t('metaDescription'),
        robots: { index: false, follow: true },
    }
}

export default async function SearchPage({ params, searchParams }: Props) {
    const { locale: localeParam } = await params
    setRequestLocale(resolveLocale(localeParam))
    const { q } = await searchParams
    const initialQuery = (Array.isArray(q) ? q[0] : q)?.slice(0, 100) ?? ''
    return <SearchPageClient initialQuery={initialQuery} />
}
