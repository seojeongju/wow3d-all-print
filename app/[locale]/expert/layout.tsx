import { setRequestLocale } from 'next-intl/server'
import { routing, type AppLocale } from '@/i18n/routing'
import ScopedIntlProvider from '@/components/i18n/ScopedIntlProvider'

type Props = {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}

function resolveLocale(localeParam: string): AppLocale {
    return (routing.locales.includes(localeParam as AppLocale)
        ? localeParam
        : routing.defaultLocale) as AppLocale
}

export default async function ExpertLayout({ children, params }: Props) {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    return <ScopedIntlProvider scope="expert" locale={locale}>{children}</ScopedIntlProvider>
}
