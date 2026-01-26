import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '이용약관 | WOW3D PRO',
  description: 'WOW3D PRO 서비스 이용약관. 3D 프린팅 견적·주문·제작·배송에 관한 이용 규정입니다.',
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
