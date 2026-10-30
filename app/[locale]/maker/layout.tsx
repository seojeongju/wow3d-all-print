import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import {
  buildBreadcrumbSchema,
  buildFaqPageSchema,
  buildWebPageSchema,
} from '@/lib/aeo-schema'
import MakerSeoSection from '@/components/seo/MakerSeoSection'
import { getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { EN_SITE_NAME, SITE_URL, buildOgImages } from '@/lib/site-url'
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

function makerPath(locale: AppLocale) {
  return getPathname({ locale, href: '/maker' })
}

/** 네임택 스튜디오 · AI 3D Maker — CSR 앱 + 서버 SEO 섹션 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale = resolveLocale(localeParam)
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'Maker' })

  const title = t('metaTitle')
  const description = t('metaDescription')
  const path = makerPath(locale)
  const canonical = `${SITE_URL}${path}`
  const keywords = t.raw('metaKeywords') as string[]

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
      languages: {
        ko: `${SITE_URL}${makerPath('ko')}`,
        en: `${SITE_URL}${makerPath('en')}`,
        'x-default': `${SITE_URL}${makerPath('ko')}`,
      },
    },
    openGraph: {
      images: buildOgImages(locale),
      title,
      description,
      url: canonical,
      type: 'website',
      siteName: locale === 'en' ? EN_SITE_NAME : '(주)와우쓰리디',
      locale: locale === 'en' ? 'en_US' : 'ko_KR',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function MakerLayout({ children, params }: Props) {
  const { locale: localeParam } = await params
  const locale = resolveLocale(localeParam)
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'Maker' })

  const title = t('metaTitle')
  const description = t('metaDescription')
  const path = makerPath(locale)
  const faqs = t.raw('faqs') as Array<{ q: string; a: string }>

  const schemas = [
    buildWebPageSchema({
      name: title,
      description,
      path,
      locale,
    }),
    buildBreadcrumbSchema([
      { name: t('breadcrumbHome'), path: locale === 'en' ? '/en' : '/' },
      { name: t('breadcrumbMaker'), path },
    ]),
    buildFaqPageSchema(
      faqs.map((f, i) => ({ id: i + 1, question: f.q, answer: f.a, category: 'maker' })),
      path
    ),
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      <ScopedIntlProvider scope="maker" locale={locale}>
        {children}
      </ScopedIntlProvider>
      <MakerSeoSection locale={locale} />
    </>
  )
}
