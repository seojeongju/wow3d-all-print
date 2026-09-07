import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/site-url'

export const metadata: Metadata = {
    title: '3D프린팅 시제품 갤러리 | 실제 출력 사례 100+',
    description:
        '와우쓰리디 WOW3D 3D프린팅 시제품·프로토타입 출력 갤러리. FDM·SLA·DLP로 제작한 실제 사례 이미지와 소재·공정 정보를 확인하세요.',
    alternates: { canonical: absoluteUrl('/gallery') },
    openGraph: {
        title: '3D프린팅 시제품 갤러리 | WOW3D 출력 사례',
        description:
            '100여 종의 고품질 3D프린팅 출력·시제품 제작 레퍼런스. 실제 제작 사례를 한눈에 확인하세요.',
        url: absoluteUrl('/gallery'),
        type: 'website',
    },
}

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
    return children
}
