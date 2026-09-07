import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/site-url'

export const metadata: Metadata = {
    title: '스마트상점 기술보급 사업 | MSLA-DLP P시리즈 공식 공급',
    description:
        '소상공인시장진흥공단 스마트상점 기술보급 사업과 (주)와우쓰리디 MSLA-DLP P7 Pro·P10 Pro·P13 Pro 공식 공급. 3D프린터 스마트기술 도입을 안내합니다.',
    keywords: [
        '스마트상점 기술보급 사업',
        '소상공인시장진흥공단',
        '스마트상점',
        '3D프린터',
        'MSLA',
        'DLP',
        'P7 Pro',
        'P10 Pro',
        'P13 Pro',
        '와우쓰리디',
    ],
    alternates: { canonical: absoluteUrl('/partnership/smart-store') },
    openGraph: {
        title: '스마트상점 기술보급 사업 · MSLA-DLP 공식 공급 | WOW3D',
        description:
            '(주)와우쓰리디는 MSLA-DLP P7 Pro·P10 Pro·P13 Pro 공식 공급업체로서 스마트상점 기술보급 사업 연계 도입을 지원합니다.',
        url: absoluteUrl('/partnership/smart-store'),
        type: 'website',
    },
}

export default function SmartStoreLayout({ children }: { children: React.ReactNode }) {
    return children
}
