import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/site-url'

export const metadata: Metadata = {
  title: '3D프린팅 소재 안전 정보',
  description:
    'WOW3D 3D 프린팅 소재 안전 정보. FDM(PLA, ABS, PETG, TPU) 및 레진(SLA·DLP) 취급 시 주의사항, 환기·보관·폐기 안내.',
  alternates: { canonical: absoluteUrl('/materials/safety') },
  openGraph: {
    title: '소재 안전 정보 | WOW3D',
    description: 'FDM·레진 소재 취급, 환기·보관·폐기 안내.',
    url: absoluteUrl('/materials/safety'),
    type: 'website',
  },
}

export default function MaterialSafetyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
