import type { Metadata } from 'next'

/** 내 견적함 — 로그인·세션 기반, 검색 노출 제외 */
export const metadata: Metadata = {
    title: '내 견적',
    robots: { index: false, follow: false },
}

export default function QuotesLayout({ children }: { children: React.ReactNode }) {
    return children
}
