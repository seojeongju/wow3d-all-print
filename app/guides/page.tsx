import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site-url';
import { buildArticleSchema, buildBreadcrumbSchema, buildCollectionPageSchema } from '@/lib/aeo-schema';
import GuidesHubClient from '@/components/guides/GuidesHubClient';

export const metadata: Metadata = {
    title: '3D 프린팅 가이드 모음',
    description:
        '3D 프린팅 견적 계산, 가격 절감, FDM·SLA 비교, 인필, STL 오류, 벽 두께, 서포트, 공차, 대형 분할, 졸업작품 체크리스트까지 WOW3D 가이드.',
    alternates: { canonical: absoluteUrl('/guides') },
};

const schemas = [
    buildCollectionPageSchema({
        name: '3D 프린팅 가이드 모음',
        description:
            '견적 계산, 출력 방식 비교, 파일 준비, 납기, 소재 비교, 용도별 소재 추천 등 WOW3D의 3D 프린팅 가이드 인덱스 페이지입니다.',
        path: '/guides',
    }),
    buildArticleSchema({
        headline: '3D 프린팅 가이드 모음',
        description:
            '3D 프린팅 견적과 제작 준비, 소재 선택, 출력 방식 비교에 필요한 핵심 정보를 한곳에 모은 가이드 허브입니다.',
        path: '/guides',
    }),
    buildBreadcrumbSchema([
        { name: '홈', path: '/' },
        { name: '가이드', path: '/guides' },
    ]),
];

export default function GuidesIndexPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
            />
            <GuidesHubClient />
        </>
    );
}
