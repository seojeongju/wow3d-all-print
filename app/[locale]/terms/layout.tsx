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

function termsPath(locale: AppLocale) {
  return getPathname({ locale, href: '/terms' })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale = resolveLocale(localeParam)
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'Terms' })

  const title = t('metaTitle')
  const description = t('metaDescription')
  const path = termsPath(locale)
  const canonical = `${SITE_URL}${path}`

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ko: `${SITE_URL}${termsPath('ko')}`,
        en: `${SITE_URL}${termsPath('en')}`,
        'x-default': `${SITE_URL}${termsPath('ko')}`,
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

export default async function TermsLayout({ children, params }: Props) {
  const { locale: localeParam } = await params
  setRequestLocale(resolveLocale(localeParam))
  return <>{children}</>
}
