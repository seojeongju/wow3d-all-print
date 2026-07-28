import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site-url';

export const metadata: Metadata = {
  title: '문의하기',
  description:
    '3D 프린팅 견적, 제작 기간, 파일 업로드, FDM·SLA·DLP 방식, 시제품 제작, 파트너십 관련 문의를 WOW3D에 접수할 수 있습니다.',
  openGraph: {
    url: `${SITE_URL}/contact`,
    title: '문의하기 | 와우쓰리디 WOW3D',
    description: '3D 프린팅 견적, 제작 기간, 파일 형식, 시제품 제작 관련 문의를 남겨 주세요.',
  },
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
