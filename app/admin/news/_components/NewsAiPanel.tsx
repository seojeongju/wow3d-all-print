'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EyeOff, ExternalLink, Loader2, RefreshCw, RotateCcw, Sparkles, Wand2 } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatNewsDateKo } from '@/lib/news'

type Candidate = {
    id: number
    source_type: string
    source_name: string | null
    title: string
    url: string
    summary: string | null
    language: string
    published_at: string | null
    relevance: number
    status: string
    draft_post_id: number | null
    created_at: string
}

type StatusFilter = 'new' | 'hidden' | 'drafted'

const FILTERS: { id: StatusFilter; label: string }[] = [
    { id: 'new', label: '새 후보' },
    { id: 'drafted', label: '초안 작성됨' },
    { id: 'hidden', label: '숨김' },
]

const SOURCE_LABEL: Record<string, string> = { rss: '해외 RSS', naver: '네이버 뉴스', manual: '직접 입력' }

export default function NewsAiPanel() {
    const router = useRouter()
    const { token } = useAuthStore()
    const { toast } = useToast()
    const [filter, setFilter] = useState<StatusFilter>('new')
    const [items, setItems] = useState<Candidate[]>([])
    const [counts, setCounts] = useState<Record<string, number>>({})
    const [naverConfigured, setNaverConfigured] = useState(true)
    const [loading, setLoading] = useState(true)
    const [collecting, setCollecting] = useState(false)
    const [draftingId, setDraftingId] = useState<number | 'url' | null>(null)
    const [url, setUrl] = useState('')
    const [note, setNote] = useState('')
    const [tableMissing, setTableMissing] = useState(false)

    const headers = useMemo(
        () => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }),
        [token]
    )

    const load = useCallback(async () => {
        if (!token) return
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/news/candidates?status=${filter}`, { headers })
            const j = await res.json()
            if (j.code === 'TABLE_MISSING') {
                setTableMissing(true)
                return
            }
            if (!res.ok) throw new Error(j.error || '조회 실패')
            setItems(j.data.items || [])
            setCounts(j.data.counts || {})
            setNaverConfigured(Boolean(j.data.naverConfigured))
        } catch (e) {
            toast({ title: '오류', description: e instanceof Error ? e.message : '후보를 불러오지 못했습니다', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }, [token, filter, headers, toast])

    useEffect(() => {
        void load()
    }, [load])

    const collect = async () => {
        setCollecting(true)
        try {
            const res = await fetch('/api/admin/news/candidates', { method: 'POST', headers })
            const j = await res.json()
            if (!res.ok) throw new Error(j.error || '수집 실패')
            const { scanned, added, errors } = j.data as { scanned: number; added: number; errors: string[] }
            toast({
                title: `새 후보 ${added}건 추가`,
                description: `기사 ${scanned}건 확인${errors.length ? ` · 일부 실패: ${errors.slice(0, 2).join(', ')}` : ''}`,
            })
            if (filter !== 'new') setFilter('new')
            else await load()
        } catch (e) {
            toast({ title: '수집 실패', description: e instanceof Error ? e.message : '', variant: 'destructive' })
        } finally {
            setCollecting(false)
        }
    }

    const makeDraft = async (payload: { candidateId?: number; url?: string; adminNote?: string }, key: number | 'url') => {
        setDraftingId(key)
        try {
            const res = await fetch('/api/admin/news/ai-draft', { method: 'POST', headers, body: JSON.stringify(payload) })
            const j = await res.json()
            if (!res.ok) throw new Error(j.error || 'AI 초안 생성 실패')
            toast({ title: 'AI 초안을 임시저장했습니다', description: '사실 확인과 실무 관점 보완 후 발행하세요.' })
            router.push(`/admin/news/${j.data.id}`)
        } catch (e) {
            toast({ title: 'AI 초안 실패', description: e instanceof Error ? e.message : '', variant: 'destructive' })
            setDraftingId(null)
        }
    }

    const setStatus = async (c: Candidate, status: 'hidden' | 'new') => {
        const res = await fetch(`/api/admin/news/candidates/${c.id}`, { method: 'PATCH', headers, body: JSON.stringify({ status }) })
        if (!res.ok) {
            toast({ title: '변경 실패', variant: 'destructive' })
            return
        }
        setItems((prev) => prev.filter((x) => x.id !== c.id))
        setCounts((prev) => ({
            ...prev,
            [c.status]: Math.max(0, (prev[c.status] ?? 1) - 1),
            [status]: (prev[status] ?? 0) + 1,
        }))
    }

    const busy = draftingId !== null

    return (
        <div className="space-y-5">
            <Card className="border-teal-400/20 bg-teal-400/[0.04]">
                <CardContent className="space-y-3 p-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-teal-200">
                        <Wand2 className="h-4 w-4" /> 기사 주소로 AI 초안 만들기
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row">
                        <input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://… 기사 주소를 붙여넣으세요"
                            className="h-10 flex-1 rounded-lg border border-white/15 bg-black/30 px-3 text-sm text-white placeholder:text-white/30"
                        />
                        <Button
                            disabled={busy || !url.trim()}
                            onClick={() => makeDraft({ url: url.trim(), adminNote: note.trim() }, 'url')}
                            className="h-10 gap-2 bg-teal-400 font-bold text-slate-950 hover:bg-teal-300"
                        >
                            {draftingId === 'url' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            AI 초안 만들기
                        </Button>
                    </div>
                    <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="(선택) 강조할 관점 메모 — 예: 캡스톤 학생 관점, PC 소재와 비교"
                        className="h-9 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-xs text-white placeholder:text-white/30"
                    />
                    <p className="text-xs leading-relaxed text-white/45">
                        AI는 원문 내용만으로 요약·본문·FAQ·태그·검색 설명 초안을 임시저장합니다. 실무 관점은 [AI 초안] 표시가 붙으며,
                        직접 다듬고 표시를 지워야 발행됩니다. 대표 이미지는 직접 촬영한 사진을 올려 주세요. 생성 1건당 약 20~40초 걸립니다.
                    </p>
                </CardContent>
            </Card>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    {FILTERS.map((f) => (
                        <button
                            key={f.id}
                            type="button"
                            onClick={() => setFilter(f.id)}
                            className={cn(
                                'rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors',
                                filter === f.id
                                    ? 'border-teal-400/50 bg-teal-400/15 text-teal-200'
                                    : 'border-white/10 bg-white/5 text-white/55 hover:text-white'
                            )}
                        >
                            {f.label} {counts[f.id] ?? 0}
                        </button>
                    ))}
                </div>
                <Button variant="outline" disabled={collecting} onClick={collect} className="gap-2 border-white/15">
                    {collecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    지금 수집
                </Button>
            </div>

            {!naverConfigured ? (
                <p className="rounded-lg border border-amber-400/30 bg-amber-400/5 px-4 py-2 text-xs text-amber-200">
                    NAVER API HUB 뉴스 검색 키(NAVER_CLIENT_ID, NAVER_CLIENT_SECRET)가 없어 해외 RSS만 수집합니다.
                </p>
            ) : null}
            {tableMissing ? (
                <p className="rounded-lg border border-amber-400/30 bg-amber-400/5 px-4 py-2 text-xs text-amber-200">
                    news_candidates 테이블이 없습니다. migrations/schema_news_candidates.sql 을 먼저 적용하세요.
                </p>
            ) : null}

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-7 w-7 animate-spin text-teal-400" />
                </div>
            ) : items.length === 0 ? (
                <Card className="border-white/10 bg-white/5">
                    <CardContent className="py-14 text-center text-sm text-white/50">
                        {filter === 'new' ? '새 후보가 없습니다. 매일 자정에 자동 수집되며, [지금 수집]으로 바로 가져올 수 있습니다.' : '항목이 없습니다.'}
                    </CardContent>
                </Card>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-white/10">
                    {items.map((c) => (
                        <div key={c.id} className="flex flex-col gap-3 border-b border-white/10 bg-white/[0.02] p-4 last:border-b-0 md:flex-row md:items-start">
                            <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px]">
                                    <span
                                        className={cn(
                                            'rounded px-1.5 py-0.5 font-bold',
                                            c.relevance >= 60 ? 'bg-teal-400/15 text-teal-300' : c.relevance >= 40 ? 'bg-amber-400/15 text-amber-300' : 'bg-white/10 text-white/55'
                                        )}
                                    >
                                        관련도 {c.relevance}
                                    </span>
                                    <span className="text-white/45">{SOURCE_LABEL[c.source_type] ?? c.source_type}</span>
                                    <span className="text-white/45">{c.source_name}</span>
                                    <span className="text-white/35">{formatNewsDateKo(c.published_at ?? c.created_at)}</span>
                                    {c.language === 'en' ? <span className="rounded bg-sky-400/15 px-1.5 py-0.5 font-bold text-sky-300">영문</span> : null}
                                </div>
                                <a
                                    href={c.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-start gap-1 font-bold text-white hover:text-teal-200"
                                >
                                    <span className="break-keep">{c.title}</span>
                                    <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-white/40" />
                                </a>
                                {c.summary ? <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/45">{c.summary}</p> : null}
                            </div>
                            <div className="flex shrink-0 gap-2">
                                {c.status === 'drafted' && c.draft_post_id ? (
                                    <Button size="sm" variant="outline" className="border-white/15" onClick={() => router.push(`/admin/news/${c.draft_post_id}`)}>
                                        초안 열기
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            size="sm"
                                            disabled={busy}
                                            onClick={() => makeDraft({ candidateId: c.id, adminNote: note.trim() }, c.id)}
                                            className="gap-1 bg-teal-400 font-bold text-slate-950 hover:bg-teal-300"
                                        >
                                            {draftingId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                            AI 초안
                                        </Button>
                                        {c.status === 'hidden' ? (
                                            <Button size="sm" variant="ghost" className="text-white/60" onClick={() => setStatus(c, 'new')}>
                                                <RotateCcw className="h-3.5 w-3.5" />
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="ghost" className="text-white/60" title="숨기기" onClick={() => setStatus(c, 'hidden')}>
                                                <EyeOff className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
