import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site-url'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

function resolveLocale(localeParam: string): AppLocale {
  return (routing.locales.includes(localeParam as AppLocale)
    ? localeParam
    : routing.defaultLocale) as AppLocale
}

function hardwarePath(locale: AppLocale) {
  return getPathname({ locale, href: '/hardware/3d-printer' })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale = resolveLocale(localeParam)
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'Hardware' })

  const title = t('metaTitle')
  const description = t('metaDescription')
  const path = hardwarePath(locale)
  const canonical = `${SITE_URL}${path}`

  return {
    title,
    description,
    keywords: t.raw('keywords') as string[],
    alternates: {
      canonical,
      languages: {
        ko: `${SITE_URL}${hardwarePath('ko')}`,
        en: `${SITE_URL}${hardwarePath('en')}`,
        'x-default': `${SITE_URL}${hardwarePath('ko')}`,
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

export default async function Hardware3dPrinterLayout({ children, params }: Props) {
  const { locale: localeParam } = await params
  setRequestLocale(resolveLocale(localeParam))
  return children
}
