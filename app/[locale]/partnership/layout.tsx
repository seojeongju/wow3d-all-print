import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/site-url'

export const metadata: Metadata = {
    title: '3D프린터 파트너십·대리점 제휴',
    description:
        '와우쓰리디 3D프린터·AI 자동견적 파트너십. 하드웨어 공급, 견적 시스템 제휴, 대리점 문의는 WOW3D에 연락하세요.',
    alternates: { canonical: absoluteUrl('/partnership') },
    openGraph: {
        title: '파트너십·대리점 제휴 | WOW3D',
        description: '3D프린터 공급·AI 자동견적 제휴. 파트너사 전용 혜택과 문의 안내.',
        url: absoluteUrl('/partnership'),
        type: 'website',
    },
}

export default function PartnershipLayout({ children }: { children: React.ReactNode }) {
    return children
}
