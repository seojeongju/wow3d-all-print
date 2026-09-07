import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
    locales: ['ko', 'en'],
    defaultLocale: 'ko',
    /** KO는 prefix 없음, EN만 /en */
    localePrefix: 'as-needed',
    /** Accept-Language 자동 리다이렉트 비활성 — 사용자가 직접 EN 선택 */
    localeDetection: false,
})

export type AppLocale = (typeof routing.locales)[number]
