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

function authPath(locale: AppLocale) {
  return getPathname({ locale, href: '/auth' })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale = resolveLocale(localeParam)
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'Auth' })

  const title = t('metaTitle')
  const description = t('metaDescription')
  const path = authPath(locale)
  const canonical = `${SITE_URL}${path}`

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical,
      languages: {
        ko: `${SITE_URL}${authPath('ko')}`,
        en: `${SITE_URL}${authPath('en')}`,
        'x-default': `${SITE_URL}${authPath('ko')}`,
      },
    },
  }
}

export default async function AuthLayout({ children, params }: Props) {
  const { locale: localeParam } = await params
  setRequestLocale(resolveLocale(localeParam))
  return <>{children}</>
}
