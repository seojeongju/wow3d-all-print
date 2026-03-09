'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft, Boxes } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="relative z-10 container mx-auto px-6 py-16 text-center">
        <div className="max-w-lg mx-auto space-y-10">
          <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto">
            <Boxes className="w-10 h-10 text-white/30" />
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">404</p>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic">페이지를 찾을 수 없습니다</h1>
            <p className="text-white/40 text-sm font-medium">
              요청하신 주소의 페이지가 없거나 이동되었을 수 있습니다.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/">
              <Button
                size="lg"
                className="h-14 rounded-2xl bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest gap-2 px-8"
              >
                <Home className="w-4 h-4" />
                홈으로
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="h-14 rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10 font-bold uppercase tracking-widest gap-2 px-8"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4" />
              이전으로
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
