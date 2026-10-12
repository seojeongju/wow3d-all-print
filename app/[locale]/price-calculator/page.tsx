import { setRequestLocale } from 'next-intl/server'
import PriceCalculatorClient from '@/components/price-calculator/PriceCalculatorClient'
import { routing, type AppLocale } from '@/i18n/routing'

type Props = { params: Promise<{ locale: string }> }

export default async function PriceCalculatorPage({ params }: Props) {
    const { locale: localeParam } = await params
    const locale = (routing.locales.includes(localeParam as AppLocale)
        ? localeParam
        : routing.defaultLocale) as AppLocale
    setRequestLocale(locale)
    return <PriceCalculatorClient />
}
