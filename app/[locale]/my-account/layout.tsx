import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '주문조회 · 마이페이지',
  robots: { index: false, follow: false },
}

export default function MyAccountLayout({ children }: { children: React.ReactNode }) {
  return children
}
