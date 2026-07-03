import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site-url';

export const metadata: Metadata = {
  title: '문의하기',
  description:
    '와우쓰리디 WOW3D 3D프린팅 견적·시제품제작·기술·파트너십 문의. 전화 02-3144-3137, 이메일 wow3d16@naver.com',
  openGraph: {
    url: `${SITE_URL}/contact`,
    title: '문의하기 | 와우쓰리디 WOW3D',
    description: '3D프린팅 출력·시제품제작·견적 문의. 24시간 이내 답변.',
  },
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
