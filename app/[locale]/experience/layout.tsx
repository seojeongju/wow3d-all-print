import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/site-url'

export const metadata: Metadata = {
    title: '3D프린팅 견적 체험 | 샘플 모델로 바로 확인',
    description:
        '샘플 STL로 와우쓰리디 자동견적을 체험하세요. 파일 업로드 없이 3D 뷰어·가격·출력 옵션 흐름을 미리 확인할 수 있습니다.',
    alternates: { canonical: absoluteUrl('/experience') },
    openGraph: {
        title: '3D프린팅 견적 체험 | WOW3D',
        description: '샘플 모델로 실시간 자동견적·3D 뷰어를 체험해 보세요.',
        url: absoluteUrl('/experience'),
        type: 'website',
    },
}

export default function ExperienceLayout({ children }: { children: React.ReactNode }) {
    return children
}
