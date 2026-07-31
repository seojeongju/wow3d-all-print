import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/site-url'

export const metadata: Metadata = {
  title: '3D 프린팅 FAQ · 자주 묻는 질문',
  description:
    '3D 프린팅 견적, FDM·SLA·DLP 차이, STL 업로드, 제작 기간, 후가공 등 WOW3D 고객이 자주 묻는 질문과 답변.',
  alternates: { canonical: absoluteUrl('/qna') },
  openGraph: {
    url: absoluteUrl('/qna'),
    title: '3D 프린팅 FAQ | 와우쓰리디 WOW3D',
    description: '견적·파일·제작·배송 FAQ. STL 업로드와 자동견적 관련 답변을 확인하세요.',
    type: 'website',
  },
}

export default function QnALayout({ children }: { children: React.ReactNode }) {
  return children
}
