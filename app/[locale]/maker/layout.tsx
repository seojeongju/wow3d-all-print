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

function makerPath(locale: AppLocale) {
  return getPathname({ locale, href: '/maker' })
}

/** 메이커 도구 — CSR 전용 앱, 검색 노출 제외 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale = resolveLocale(localeParam)
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'Maker' })

  const title = t('metaTitle')
  const description = t('metaDescription')
  const path = makerPath(locale)
  const canonical = `${SITE_URL}${path}`

  return {
    title,
    description,
    robots: { index: false, follow: false },
    alternates: {
      canonical,
      languages: {
        ko: `${SITE_URL}${makerPath('ko')}`,
        en: `${SITE_URL}${makerPath('en')}`,
        'x-default': `${SITE_URL}${makerPath('ko')}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'ko_KR',
    },
  }
}

export default async function MakerLayout({ children, params }: Props) {
  const { locale: localeParam } = await params
  setRequestLocale(resolveLocale(localeParam))
  return children
}
