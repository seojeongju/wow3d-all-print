'use client'

import '@/app/globals.css'
import RouteErrorView from '@/components/layout/RouteErrorView'

/**
 * 루트 오류 경계 — app/[locale]·app/admin 레이아웃(<html> 렌더링)까지 대체하므로
 * 여기서 <html>/<body>를 직접 그려야 한다. 없으면 문서에 붙일 수 없어 빈 화면이 된다.
 */
export default function RootError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko" className="dark">
      <body className="antialiased">
        <RouteErrorView {...props} />
      </body>
    </html>
  )
}
