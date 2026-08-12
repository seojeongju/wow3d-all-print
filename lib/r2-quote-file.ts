/**
 * R2 키/파일명에 쓰면 깨지기 쉬운 문자 정리 (# → URL fragment 이슈 등)
 */
export function sanitizeR2FileName(name: string): string {
  const base = (name || 'model.stl').trim() || 'model.stl'
  return base
    .replace(/[\\/]/g, '_')
    .replace(/#/g, '_')
    .replace(/\?/g, '_')
    .replace(/\0/g, '')
    .slice(0, 200)
}

export function buildQuoteR2Key(quoteId: number, fileName: string): string {
  return `quotes/${quoteId}/${sanitizeR2FileName(fileName)}`
}

/** file_url(절대 URL·키)에서 R2 오브젝트 키 후보들을 만듦 */
export function resolveQuoteR2KeyCandidates(opts: {
  fileUrl?: string | null
  quoteId?: number | null
  fileName?: string | null
}): string[] {
  const candidates: string[] = []
  const push = (k?: string | null) => {
    const t = (k || '').trim()
    if (!t) return
    if (!candidates.includes(t)) candidates.push(t)
  }

  const raw = opts.fileUrl?.trim() || ''
  if (raw) {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      try {
        const url = new URL(raw)
        const pathParts = url.pathname.split('/').filter(Boolean)
        const quotesIndex = pathParts.findIndex((p) => p === 'quotes')
        if (quotesIndex >= 0) {
          push(pathParts.slice(quotesIndex).map(decodeURIComponent).join('/'))
          push(pathParts.slice(quotesIndex).join('/'))
        } else {
          push(url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname)
        }
      } catch {
        push(raw)
      }
    } else {
      push(raw)
      try {
        push(decodeURIComponent(raw))
      } catch {
        /* ignore */
      }
    }
  }

  if (opts.quoteId && opts.fileName) {
    push(buildQuoteR2Key(opts.quoteId, opts.fileName))
    // 과거 업로드: sanitize 없이 원본 파일명으로 저장된 키
    push(`quotes/${opts.quoteId}/${opts.fileName}`)
    // # 이 잘린 키 (HTTP/도구에서 fragment로 잘린 경우)
    const hashCut = opts.fileName.split('#')[0]
    if (hashCut && hashCut !== opts.fileName) {
      push(`quotes/${opts.quoteId}/${hashCut}`)
      push(buildQuoteR2Key(opts.quoteId, hashCut))
    }
  }

  return candidates
}
