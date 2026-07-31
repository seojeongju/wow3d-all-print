import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/site-url'

export const metadata: Metadata = {
    title: '3D프린팅 소재 안내 | PLA·ABS·PETG·레진',
    description:
        '와우쓰리디 WOW3D 3D프린팅 소재 가이드. FDM(PLA, ABS, PETG, TPU)과 SLA·DLP 레진의 특징, 용도, 선택 기준을 확인하세요.',
    alternates: { canonical: absoluteUrl('/materials') },
    openGraph: {
        title: '3D프린팅 소재 안내 | WOW3D',
        description: 'PLA·ABS·PETG·TPU 및 레진 소재 비교. 시제품·기능 부품에 맞는 소재를 고르세요.',
        url: absoluteUrl('/materials'),
        type: 'website',
    },
}

export default function MaterialsLayout({ children }: { children: React.ReactNode }) {
    return children
}
