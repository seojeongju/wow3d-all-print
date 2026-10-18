import { getTranslations } from 'next-intl/server'
import { getContentDates } from '@/lib/content-dates'
import type { AppLocale } from '@/i18n/routing'

/**
 * 화면에 보이는 작성일·최종 업데이트 표시.
 * Article 스키마의 datePublished/dateModified와 같은 값(lib/content-dates.ts)을 써서 화면과 구조화 데이터를 일치시킨다.
 */
export default async function ContentDatesNote({
    path,
    locale,
    className = '',
}: {
    path: string
    locale: AppLocale
    className?: string
}) {
    const dates = getContentDates(path)
    if (!dates) return null
    const t = await getTranslations({ locale, namespace: 'GuideChrome' })

    return (
        <p className={`text-xs font-bold text-white/45 ${className}`}>
            <span>
                {t('updatedLabel')}{' '}
                <time dateTime={dates.modified}>{dates.modified}</time>
            </span>
            {dates.published !== dates.modified ? (
                <span className="ml-3">
                    {t('publishedLabel')}{' '}
                    <time dateTime={dates.published}>{dates.published}</time>
                </span>
            ) : null}
        </p>
    )
}
