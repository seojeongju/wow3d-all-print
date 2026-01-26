import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '개인정보처리방침 | WOW3D PRO',
  description: 'WOW3D PRO 개인정보처리방침. (주)와우3D는 개인정보 보호법 및 정보통신망법에 따라 이용자 개인정보를 보호합니다.',
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
