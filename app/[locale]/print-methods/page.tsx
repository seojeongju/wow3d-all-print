import { setRequestLocale } from 'next-intl/server'
import PrintMethodsClient from '@/components/print-methods/PrintMethodsClient'
import WorkPhotosSection from '@/components/seo/WorkPhotosSection'
import { pickWorkPhotos } from '@/lib/seo-work-photos'
import { routing, type AppLocale } from '@/i18n/routing'

type Props = { params: Promise<{ locale: string }> }

export default async function PrintMethodsPage({ params }: Props) {
    const { locale: localeParam } = await params
    const locale = (routing.locales.includes(localeParam as AppLocale)
        ? localeParam
        : routing.defaultLocale) as AppLocale
    setRequestLocale(locale)
    return (
        <PrintMethodsClient
            workPhotos={
                <WorkPhotosSection
                    photos={pickWorkPhotos({ seed: 'print-methods', locale, count: 8 })}
                    locale={locale}
                />
            }
        />
    )
}
