import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '주문/결제',
  robots: { index: false, follow: false },
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}
