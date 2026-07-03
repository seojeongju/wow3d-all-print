import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site-url';

export const metadata: Metadata = {
  title: '자주 묻는 질문 (FAQ)',
  description:
    '와우쓰리디 WOW3D 3D프린팅 견적, 파일 형식, 출력 방식, 시제품제작, 배송 등 자주 묻는 질문과 답변을 확인하세요.',
  openGraph: {
    url: `${SITE_URL}/qna`,
    title: '자주 묻는 질문 | 와우쓰리디 WOW3D',
    description: '3D프린팅 견적·제작·기술 FAQ. STL 업로드, 자동견적, 시제품제작 관련 답변.',
  },
  alternates: { canonical: `${SITE_URL}/qna` },
};

export default function QnALayout({ children }: { children: React.ReactNode }) {
  return children;
}
