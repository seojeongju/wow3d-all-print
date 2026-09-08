import { setRequestLocale } from 'next-intl/server'
import { routing, type AppLocale } from '@/i18n/routing'

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
    setRequestLocale(resolveLocale(localeParam))
    return children
}
