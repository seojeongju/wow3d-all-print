import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
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

/** 견적서 인쇄 — 검색 노출 제외 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale = resolveLocale(localeParam)
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'Print' })

  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false },
  }
}

export default async function PrintLayout({ children, params }: Props) {
  const { locale: localeParam } = await params
  setRequestLocale(resolveLocale(localeParam))
  return children
}
