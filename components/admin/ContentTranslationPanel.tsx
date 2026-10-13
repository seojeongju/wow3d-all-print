'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Languages, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/hooks/use-toast'

type Props = {
    type: 'gallery' | 'custom_product'
}

type Status = { total: number; remaining: number }

/** 영문 페이지용 자동 번역 현황 + 일괄 번역 (Workers AI) */
export default function ContentTranslationPanel({ type }: Props) {
    const { token } = useAuthStore()
    const { toast } = useToast()
    const [status, setStatus] = useState<Status | null>(null)
    const [running, setRunning] = useState(false)
    const stopRef = useRef(false)

    const loadStatus = useCallback(async () => {
        if (!token) return
        try {
            const res = await fetch(`/api/admin/content-translations?type=${type}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const j = await res.json()
            if (res.ok && j.success) setStatus(j.data)
        } catch {
            /* 현황은 부가 정보 — 실패해도 화면은 그대로 */
        }
    }, [token, type])

    useEffect(() => {
        void loadStatus()
    }, [loadStatus])

    const run = async () => {
        if (!token) return
        setRunning(true)
        stopRef.current = false
        let done = 0
        try {
            while (!stopRef.current) {
                const res = await fetch('/api/admin/content-translations', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type, limit: 10 }),
                })
                const j = await res.json()
                if (!res.ok) throw new Error(j.error || '번역 실패')
                const r = j.data as { total: number; translated: number; remaining: number }
                done += r.translated
                setStatus({ total: r.total, remaining: r.remaining })
                // 더 진행되지 않으면(전부 실패) 같은 항목에서 반복하지 않도록 멈춘다
                if (r.remaining === 0 || r.translated === 0) break
            }
            toast({ title: '영문 번역 완료', description: `${done}건을 번역했습니다.` })
        } catch (e) {
            toast({
                title: '영문 번역 중단',
                description: e instanceof Error ? e.message : '번역에 실패했습니다.',
                variant: 'destructive',
            })
        } finally {
            setRunning(false)
            void loadStatus()
        }
    }

    const translated = status ? status.total - status.remaining : 0

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-start gap-2.5 min-w-0">
                <Languages className="w-4 h-4 mt-0.5 shrink-0 text-teal-300" />
                <div className="min-w-0">
                    <p className="text-sm font-bold text-white">
                        영문 페이지 번역{' '}
                        {status ? (
                            <span className="text-teal-300">
                                {translated} / {status.total}
                            </span>
                        ) : null}
                    </p>
                    <p className="text-xs text-white/45 mt-0.5">
                        새로 올리거나 수정한 항목은 영문 페이지 첫 방문 시 자동 번역됩니다. 미리 채우려면 일괄 번역을 누르세요.
                    </p>
                </div>
            </div>
            {running ? (
                <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 border-white/15 gap-2"
                    onClick={() => {
                        stopRef.current = true
                    }}
                >
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> 번역 중… 멈추기
                </Button>
            ) : (
                <Button
                    size="sm"
                    className="shrink-0 gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold"
                    disabled={!status || status.remaining === 0}
                    onClick={run}
                >
                    <Languages className="w-3.5 h-3.5" />
                    {status && status.remaining === 0 ? '모두 번역됨' : `일괄 번역${status ? ` (${status.remaining}건)` : ''}`}
                </Button>
            )}
        </div>
    )
}
