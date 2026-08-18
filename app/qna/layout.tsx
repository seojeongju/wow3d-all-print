import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/site-url'

export const metadata: Metadata = {
  title: '3D 프린팅 FAQ · 사진(이미지) 3D 모델링 · 자주 묻는 질문',
  description:
    '사진(이미지)을 3D 모델링으로 변환하는 방법, 3D 프린팅 견적, FDM·SLA·DLP 차이, STL 업로드, 제작 기간 등 WOW3D 자주 묻는 질문.',
  keywords: ['사진(이미지) 3D 모델링', '이미지 3D 변환', '사진(이미지)으로 3D 프린팅', '3D 프린팅 FAQ', 'AI 3D 모델링'],
  alternates: { canonical: absoluteUrl('/qna') },
  openGraph: {
    url: absoluteUrl('/qna'),
    title: '3D 프린팅 FAQ | 사진(이미지) 3D 모델링 | 와우쓰리디 WOW3D',
    description: '사진·이미지를 3D 모델로 변환하는 방법, 견적·파일·제작 FAQ를 확인하세요.',
    type: 'website',
  },
}

export default function QnALayout({ children }: { children: React.ReactNode }) {
  return children
}
