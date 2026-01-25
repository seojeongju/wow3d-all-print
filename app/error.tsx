'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error boundary:', error)
  }, [error])

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
            <h1 className="text-4xl font-black uppercase tracking-tighter italic">문제가 발생했습니다</h1>
            <p className="text-white/40 text-sm font-medium">
              일시적인 오류가 발생했을 수 있습니다. 다시 시도하거나 홈으로 이동해 주세요.
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
              onClick={reset}
              className="h-14 rounded-2xl bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest gap-2 px-8"
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </Button>
            <Link href="/">
              <Button
                variant="outline"
                size="lg"
                className="h-14 rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10 font-bold uppercase tracking-widest gap-2 px-8"
              >
                <Home className="w-4 h-4" />
                홈으로
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
