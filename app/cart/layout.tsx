import type { Metadata } from 'next'

/** 장바구니·결제 흐름 — 검색 색인 제외 */
export const metadata: Metadata = {
  title: '장바구니',
  robots: { index: false, follow: false },
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children
}
