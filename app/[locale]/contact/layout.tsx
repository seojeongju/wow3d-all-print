import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { buildBreadcrumbSchema, buildCollectionPageSchema } from '@/lib/aeo-schema'
import { getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL, absoluteUrl } from '@/lib/site-url'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

function resolveLocale(localeParam: string): AppLocale {
  return (routing.locales.includes(localeParam as AppLocale)
    ? localeParam
    : routing.defaultLocale) as AppLocale
}

function contactPath(locale: AppLocale) {
  return getPathname({ locale, href: '/contact' })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale = resolveLocale(localeParam)
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'Contact' })

  const title = t('metaTitle')
  const description = t('metaDescription')
  const path = contactPath(locale)
  const canonical = `${SITE_URL}${path}`

  return {
    title,
    description,
    openGraph: {
      url: canonical,
      title: t('ogTitle'),
      description: t('ogDescription'),
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'ko_KR',
    },
    alternates: {
      canonical,
      languages: {
        ko: `${SITE_URL}${contactPath('ko')}`,
        en: `${SITE_URL}${contactPath('en')}`,
        'x-default': `${SITE_URL}${contactPath('ko')}`,
      },
    },
  }
}

export default async function ContactLayout({ children, params }: Props) {
  const { locale: localeParam } = await params
  const locale = resolveLocale(localeParam)
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'Contact' })

  const path = contactPath(locale)
  const homePath = getPathname({ locale, href: '/' })

  const schemas = [
    buildCollectionPageSchema({
      name: t('collectionName'),
      description: t('collectionDescription'),
      path,
    }),
    buildBreadcrumbSchema([
      { name: t('breadcrumbHome'), path: homePath },
      { name: t('breadcrumbContact'), path },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: t('contactPageName'),
      description: t('contactPageDescription'),
      url: absoluteUrl(path),
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      {children}
    </>
  )
}
