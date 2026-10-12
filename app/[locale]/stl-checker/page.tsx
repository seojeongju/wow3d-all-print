import { setRequestLocale } from 'next-intl/server'
import StlCheckerClient from '@/components/stl-checker/StlCheckerClient'
import { routing, type AppLocale } from '@/i18n/routing'

type Props = { params: Promise<{ locale: string }> }

export default async function StlCheckerPage({ params }: Props) {
    const { locale: localeParam } = await params
    const locale = (routing.locales.includes(localeParam as AppLocale)
        ? localeParam
        : routing.defaultLocale) as AppLocale
    setRequestLocale(locale)
    return <StlCheckerClient />
}
