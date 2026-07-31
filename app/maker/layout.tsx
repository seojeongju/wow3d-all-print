import type { Metadata } from 'next'

/** 메이커 도구 — CSR 전용 앱, 검색 노출 제외 */
export const metadata: Metadata = {
    title: '3D 메이커',
    robots: { index: false, follow: false },
}

export default function MakerLayout({ children }: { children: React.ReactNode }) {
    return children
}
