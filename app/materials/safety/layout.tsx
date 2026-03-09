import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '소재 안전 정보 | WOW3D PRO',
  description: 'WOW3D PRO 3D 프린팅 소재 안전 정보. FDM(PLA, ABS, PETG, TPU) 및 레진(SLA·DLP) 취급 시 주의사항, 환기·보관·폐기 안내.',
}

export default function MaterialSafetyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
