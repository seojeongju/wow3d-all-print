'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

/** 같은 탭에서 이 시간 안에 이미 새로고침했다면 다시 하지 않음 (무한 새로고침 방지) */
const CHUNK_RELOAD_KEY = 'wow3d:chunk-reload-at'
const CHUNK_RELOAD_COOLDOWN_MS = 60_000

/** 배포 직후 옛 파일 요청·네트워크 지연으로 JS/CSS 조각을 못 받은 오류 — 새로고침하면 대부분 복구됨 */
function isChunkLoadError(error: Error | undefined): boolean {
  if (!error) return false
  return (
    error.name === 'ChunkLoadError' ||
    /Loading (CSS )?chunk [\w-]+ failed|ChunkLoadError|Failed to fetch dynamically imported module/i.test(error.message ?? '')
  )
}

function reloadOnceForChunkError(): boolean {
  try {
    const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0)
    if (Date.now() - last < CHUNK_RELOAD_COOLDOWN_MS) return false
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()))
  } catch {
    return false
  }
  window.location.reload()
  return true
}

export default function RouteErrorView({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const chunkError = isChunkLoadError(error)

  useEffect(() => {
    console.error('Error boundary:', error)
    if (isChunkLoadError(error)) reloadOnceForChunkError()
  }, [error])

  const retry = () => {
    if (chunkError) window.location.reload()
    else reset()
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-destructive/5 to-transparent pointer-events-none" />

      <div className="relative z-10 container mx-auto px-6 py-16 text-center">
        <div className="max-w-lg mx-auto space-y-10">
          <div className="w-20 h-20 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-destructive/80">오류 발생</p>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic">
              {chunkError ? '페이지를 불러오지 못했습니다' : '문제가 발생했습니다'}
            </h1>
            <p className="text-white/40 text-sm font-medium">
              {chunkError
                ? '네트워크가 느리거나 사이트가 방금 업데이트되었습니다. 다시 시도를 눌러 새로고침해 주세요.'
                : '일시적인 오류가 발생했을 수 있습니다. 다시 시도하거나 홈으로 이동해 주세요.'}
            </p>
            {process.env.NODE_ENV === 'development' && error?.message && (
              <p className="text-left text-xs text-white/30 font-mono mt-4 p-4 rounded-2xl bg-black/40 border border-white/5 truncate" title={error.message}>
                {error.message}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={retry}
              className="h-14 rounded-2xl bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest gap-2 px-8"
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </Button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- 오류 상태에서는 클라이언트 라우팅이 다시 실패할 수 있어 전체 새로 불러오기로 이동 */}
            <a
              href="/"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-8 text-sm font-bold uppercase tracking-widest text-white hover:bg-white/10"
            >
              <Home className="w-4 h-4" />
              홈으로
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
