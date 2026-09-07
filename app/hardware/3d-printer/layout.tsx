import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/site-url'

export const metadata: Metadata = {
  title: '3D프린터 제품소개 · MSLA-DLP P7 Pro·P10 Pro·P13 Pro',
  description:
    '(주)와우쓰리디 MSLA-DLP P시리즈 Pro 공식 공급. P7 Pro·P10 Pro·P13 Pro 스펙과 도입 안내. 3D프린터 출력·시제품 제작.',
  keywords: [
    '3D프린터',
    'MSLA',
    'DLP',
    'P7 Pro',
    'P10 Pro',
    'P13 Pro',
    '와우쓰리디',
    '3D프린터 제품소개',
  ],
  alternates: { canonical: absoluteUrl('/hardware/3d-printer') },
  openGraph: {
    url: absoluteUrl('/hardware/3d-printer'),
    title: '3D프린터 제품소개 · MSLA-DLP P시리즈 | WOW3D',
    description:
      'P7 Pro·P10 Pro·P13 Pro MSLA-DLP 제품 라인업. (주)와우쓰리디 공식 공급.',
  },
}

export default function Hardware3dPrinterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
