import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { buildBreadcrumbSchema, buildCollectionPageSchema, buildFaqPageSchema } from '@/lib/aeo-schema'
import { getPublishedQnas, localizeQnas, pickVisibleFaqItems } from '@/lib/qna'
import QnAPageClient from './QnAPageClient'
import { getPathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site-url'

/** 화면 1페이지(기본)에 보이는 개수와 FAQ JSON-LD를 맞춤. 사진(이미지)→3D 항목은 상단에 고정 */
const FAQ_SCHEMA_VISIBLE_COUNT = 8

type Props = { params: Promise<{ locale: string }> }

function resolveLocale(localeParam: string): AppLocale {
  return (routing.locales.includes(localeParam as AppLocale)
    ? localeParam
    : routing.defaultLocale) as AppLocale
}

function qnaPath(locale: AppLocale) {
  return getPathname({ locale, href: '/qna' })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale = resolveLocale(localeParam)
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'QnAPage' })

  const title = t('metaTitle')
  const description = t('metaDescription')
  const path = qnaPath(locale)
  const canonical = `${SITE_URL}${path}`

  return {
    title,
    description,
    keywords: t.raw('metaKeywords') as string[],
    alternates: {
      canonical,
      languages: {
        ko: `${SITE_URL}${qnaPath('ko')}`,
        en: `${SITE_URL}${qnaPath('en')}`,
        'x-default': `${SITE_URL}${qnaPath('ko')}`,
      },
    },
    openGraph: {
      url: canonical,
      title: t('ogTitle'),
      description: t('ogDescription'),
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'ko_KR',
    },
  }
}

export default async function QnAPage({ params }: Props) {
  const { locale: localeParam } = await params
  const locale = resolveLocale(localeParam)
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'QnAPage' })
  const qnas = localizeQnas(pickVisibleFaqItems(await getPublishedQnas(), Number.MAX_SAFE_INTEGER), locale)
  const visibleForSchema = qnas.slice(0, FAQ_SCHEMA_VISIBLE_COUNT)
  const path = qnaPath(locale)
  const homePath = getPathname({ locale, href: '/' })

  const faqSchema = visibleForSchema.length > 0 ? buildFaqPageSchema(visibleForSchema, path) : null
  const collectionSchema = buildCollectionPageSchema({
    name: t('collectionName'),
    description: t('collectionDescription'),
    path,
  })
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: t('breadcrumbHome'), path: homePath },
    { name: t('breadcrumbFaq'), path },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            [faqSchema, collectionSchema, breadcrumbSchema].filter(Boolean)
          ),
        }}
      />
      <QnAPageClient initialQnas={qnas} />
    </>
  )
}
