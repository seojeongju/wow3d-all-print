import type { Metadata } from 'next';
import { buildBreadcrumbSchema, buildCollectionPageSchema } from '@/lib/aeo-schema';
import { SITE_URL, absoluteUrl } from '@/lib/site-url';

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
  const schemas = [
    buildCollectionPageSchema({
      name: '3D 프린팅 문의하기',
      description:
        '3D 프린팅 견적, 파일 검토, 제작 기간, 공정 선택, 시제품 제작과 관련된 문의를 접수하는 페이지입니다.',
      path: '/contact',
    }),
    buildBreadcrumbSchema([
      { name: '홈', path: '/' },
      { name: '문의하기', path: '/contact' },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'WOW3D 문의하기',
      description:
        '3D 프린팅 자동견적, 파일 준비, 제작 기간, FDM·SLA·DLP 공정 선택과 관련된 상담을 받을 수 있는 문의 페이지입니다.',
      url: absoluteUrl('/contact'),
    },
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
