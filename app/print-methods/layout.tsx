import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
    title: 'FDM, SLA, DLP 3D 프린팅 방식 비교',
    description:
        'FDM, SLA, DLP 3D 프린팅 출력 방식의 차이, 추천 용도, 소재, 표면 품질, 비용 특성을 비교해 어떤 공정이 적합한지 안내합니다.',
    alternates: { canonical: absoluteUrl('/print-methods') },
    openGraph: {
        title: 'FDM, SLA, DLP 3D 프린팅 방식 비교',
        description:
            '기능성 시제품, 정밀 모델, 외관 품질에 따라 어떤 3D 프린팅 방식이 맞는지 WOW3D가 비교 안내합니다.',
        url: absoluteUrl('/print-methods'),
    },
};

export default function PrintMethodsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
