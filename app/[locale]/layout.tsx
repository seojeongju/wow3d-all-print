import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { buildOgImages, EN_BRAND_SUFFIX, EN_SITE_NAME } from '@/lib/site-url'
import { hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import SessionValidator from '@/components/auth/SessionValidator'
import EducationQuickMenu from '@/components/layout/EducationQuickMenu'
import SitePopup from '@/components/popup/SitePopup'
import GuideRobot from '@/components/assistant/GuideRobot'
import { pickClientMessages } from '@/i18n/pick-client-messages'
import DocumentShell from '@/components/layout/DocumentShell'

type Props = {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }))
}

/** 루트 layout의 한국어 제목 템플릿·사이트명을 언어별로 덮어씀 */
export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
    const { locale } = await params
    if (locale !== 'en') return {}
    const t = await getTranslations({ locale, namespace: 'Home' })
    return {
        title: {
            default: t('metaTitle'),
            template: `%s | ${EN_BRAND_SUFFIX}`,
        },
        description: t('metaDescription'),
        openGraph: {
            type: 'website',
            locale: 'en_US',
            siteName: EN_SITE_NAME,
            images: buildOgImages('en'),
        },
    }
}

export default async function LocaleLayout({ children, params }: Props) {
    const { locale } = await params
    if (!hasLocale(routing.locales, locale)) {
        notFound()
    }

    setRequestLocale(locale)
    const messages = await getMessages()

    /** 공통 위젯용 문구만 — 페이지 문구는 세그먼트 layout의 ScopedIntlProvider가 넘긴다 */
    return (
        <DocumentShell lang={locale}>
            <NextIntlClientProvider messages={pickClientMessages(messages, 'root')}>
                <SessionValidator />
                {children}
                <EducationQuickMenu />
                <GuideRobot />
                <SitePopup />
            </NextIntlClientProvider>
        </DocumentShell>
    )
}
