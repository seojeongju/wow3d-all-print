import DocumentShell from '@/components/layout/DocumentShell'
import NotFoundContent from '@/components/layout/NotFoundContent'

/** locale 밖(루트) 404 — 루트 layout은 <html>을 렌더링하지 않으므로 여기서 감싼다 */
export default function NotFound() {
  return (
    <DocumentShell lang="ko">
      <NotFoundContent />
    </DocumentShell>
  )
}
