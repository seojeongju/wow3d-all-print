import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/site-url'
import { getShowcaseCategories } from '@/lib/showcase-public'
import ExpertPageClient from './ExpertPageClient'

export const metadata: Metadata = {
    title: '제품개발 전문가 | 3D프린팅 시제품·양산 컨설팅',
    description:
        '아이디어 설계부터 시제품·양산까지. 와우쓰리디 제품개발 전문가가 산업·의료·아트·건축 분야 3D프린팅 솔루션과 제작 사례를 제공합니다.',
    alternates: { canonical: absoluteUrl('/expert') },
    openGraph: {
        title: '제품개발 전문가 | WOW3D 3D프린팅',
        description: '설계·시제품·양산 원스톱. 분야별 제작 사례와 전문가 무료 상담.',
        url: absoluteUrl('/expert'),
    },
}

export default async function ExpertServicePage() {
    const cards = await getShowcaseCategories()
    return <ExpertPageClient initialCards={cards} />
}
