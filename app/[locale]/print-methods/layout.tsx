import type { Metadata } from 'next';
import { buildBreadcrumbSchema, buildCollectionPageSchema } from '@/lib/aeo-schema';
import { absoluteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
    title: 'FDM, SLA, DLP 3D 프린팅 방식 비교',
    description:
        'WOW3D 제공 FDM·SLA·DLP와 분말 소결(SLS/SLM/DMLS), 재료 분사(PolyJet/MJP) 등 3D 프린팅 공정의 차이, 추천 용도, 소재, 표면 품질을 비교 안내합니다.',
    alternates: { canonical: absoluteUrl('/print-methods') },
    openGraph: {
        title: 'FDM, SLA, DLP 3D 프린팅 방식 비교',
        description:
            'FDM·SLA·DLP 제작 공정과 SLS/SLM/DMLS, PolyJet/MJP 등 업계 주요 3D 프린팅 방식을 WOW3D가 비교 안내합니다.',
        url: absoluteUrl('/print-methods'),
    },
};

export default function PrintMethodsLayout({ children }: { children: React.ReactNode }) {
    const schemas = [
        buildCollectionPageSchema({
            name: 'FDM, SLA, DLP 3D 프린팅 방식 비교',
            description:
                'WOW3D 제공 FDM·SLA·DLP와 분말 소결(SLS/SLM/DMLS), 재료 분사(PolyJet/MJP) 등 3D 프린팅 공정의 차이와 추천 용도를 비교하는 안내 페이지입니다.',
            path: '/print-methods',
        }),
        buildBreadcrumbSchema([
            { name: '홈', path: '/' },
            { name: '출력 방식 비교', path: '/print-methods' },
        ]),
    ];

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
            />
            {children}
        </>
    );
}
