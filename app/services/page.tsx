import type { Metadata } from 'next'
import ServicesHubClient from '@/components/services/ServicesHubClient'
import { absoluteUrl } from '@/lib/site-url'
import { buildBreadcrumbSchema, buildCollectionPageSchema } from '@/lib/aeo-schema'

export const metadata: Metadata = {
    title: '3D프린팅출력·3D프린터출력 서비스 | 출력대행·시제품·FDM·SLA',
    description:
        '3D프린팅출력, 3D프린터출력, 시제품 제작, FDM·SLA 출력, 사진(이미지)→AI 3D, 졸업작품, 소량생산, 3D 모델링 의뢰까지 WOW3D PRO 핵심서비스를 한곳에서 확인하세요.',
    alternates: { canonical: absoluteUrl('/services') },
    openGraph: {
        title: 'WOW3D PRO 핵심서비스 | 3D프린팅',
        description: '업로드부터 자동견적·제작·배송까지. 목적별 3D프린팅 서비스를 확인하세요.',
        url: absoluteUrl('/services'),
    },
}

const schemas = [
    buildCollectionPageSchema({
        name: 'WOW3D PRO 핵심서비스',
        description:
            '출력대행, 시제품, FDM, SLA, 사진(이미지)→AI 3D, 졸업작품, 소량생산, 모델링 등 WOW3D PRO 핵심서비스',
        path: '/services',
    }),
    buildBreadcrumbSchema([
        { name: '홈', path: '/' },
        { name: '서비스', path: '/services' },
    ]),
]

export default function ServicesHubPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
            />
            {/*
              검색·키워드 랜딩 분리에 대한 내부 SEO 메모는 화면에 노출하지 않습니다.
              키워드 유입용 상세 랜딩은 /services/[slug] 및 metadata에만 유지합니다.
            */}
            <ServicesHubClient />
        </>
    )
}
