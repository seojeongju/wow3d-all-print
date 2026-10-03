'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Eye, Loader2, Newspaper, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { evaluateNewsSeo, formatNewsDateKo, NEWS_CATEGORY_LABEL_KO, type NewsPost } from '@/lib/news'
import NewsAiPanel from './_components/NewsAiPanel'

type Filter = 'all' | 'published' | 'scheduled' | 'draft'

function isScheduled(p: NewsPost): boolean {
    if (p.status !== 'published' || !p.publishedAt) return false
    return new Date(`${p.publishedAt.replace(' ', 'T')}Z`).getTime() > Date.now()
}

function seoScore(p: NewsPost): { passed: number; total: number } {
    const checks = evaluateNewsSeo({
        title: p.title,
        summaryLines: p.summary,
        insight: p.insight,
        metaDescription: p.metaDescription,
        hasCover: Boolean(p.coverUrl),
        coverAlt: p.coverAlt,
        sourceUrl: p.sourceUrl,
        category: p.category,
        relatedCount: p.relatedLinks.length,
        faqCount: p.faqs.length,
    })
    return { passed: checks.filter((c) => c.ok).length, total: checks.length }
}

export default function AdminNewsPage() {
    const { token } = useAuthStore()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [items, setItems] = useState<NewsPost[]>([])
    const [filter, setFilter] = useState<Filter>('all')
    const [tableMissing, setTableMissing] = useState(false)
    const [tab, setTab] = useState<'posts' | 'ai'>('posts')

    const authHeader = useMemo(
        () => (token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>)),
        [token]
    )

    const load = useCallback(async () => {
        if (!token) return
        setLoading(true)
        try {
            const res = await fetch('/api/admin/news', { headers: authHeader })
            const j = await res.json()
            if (j.code === 'TABLE_MISSING') {
                setTableMissing(true)
                return
            }
            if (!res.ok) throw new Error(j.error || '조회 실패')
            setItems(j.data.items || [])
        } catch (e) {
            toast({
                title: '오류',
                description: e instanceof Error ? e.message : '목록을 불러오지 못했습니다.',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }, [token, authHeader, toast])

    useEffect(() => {
        void load()
    }, [load])

    const remove = async (p: NewsPost) => {
        if (!confirm(`「${p.title}」 글을 삭제할까요? 이미지도 함께 삭제됩니다.`)) return
        const res = await fetch(`/api/admin/news/${p.id}`, { method: 'DELETE', headers: authHeader })
        if (!res.ok) {
            toast({ title: '삭제 실패', variant: 'destructive' })
            return
        }
        toast({ title: '삭제했습니다' })
        await load()
    }

    const counts = {
        all: items.length,
        published: items.filter((p) => p.status === 'published' && !isScheduled(p)).length,
        scheduled: items.filter(isScheduled).length,
        draft: items.filter((p) => p.status === 'draft').length,
    }
    const visible = items.filter((p) =>
        filter === 'all'
            ? true
            : filter === 'scheduled'
              ? isScheduled(p)
              : filter === 'published'
                ? p.status === 'published' && !isScheduled(p)
                : p.status === 'draft'
    )

    const FILTERS: { id: Filter; label: string }[] = [
        { id: 'all', label: '전체' },
        { id: 'published', label: '공개 중' },
        { id: 'scheduled', label: '예약' },
        { id: 'draft', label: '임시저장' },
    ]

    return (
        <div className="space-y-6 p-4 lg:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">최신 동향</h1>
                    <p className="mt-1 text-sm text-white/50">
                        3D프린팅 업계 소식을 와우3D 관점으로 정리해 `/news`에 게시합니다. 주 1~2편 꾸준한 발행을 권장합니다.
                    </p>
                </div>
                <Link href="/admin/news/new">
                    <Button className="gap-2 bg-teal-400 font-bold text-slate-950 hover:bg-teal-300">
                        <Plus className="h-4 w-4" /> 새 글 작성
                    </Button>
                </Link>
            </div>

            <div className="flex gap-1 border-b border-white/10">
                {(
                    [
                        { id: 'posts', label: '게시글', icon: Newspaper },
                        { id: 'ai', label: 'AI 후보 · 초안', icon: Sparkles },
                    ] as const
                ).map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        className={cn(
                            '-mb-px inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-bold transition-colors',
                            tab === t.id ? 'border-teal-400 text-teal-200' : 'border-transparent text-white/50 hover:text-white'
                        )}
                    >
                        <t.icon className="h-4 w-4" /> {t.label}
                    </button>
                ))}
            </div>

            {tab === 'ai' ? <NewsAiPanel /> : null}

            {tab === 'posts' && tableMissing ? (
                <Card className="border-amber-400/30 bg-amber-400/5">
                    <CardContent className="py-6 text-sm text-amber-200">
                        news_posts 테이블이 없습니다. <code>migrations/schema_news.sql</code> 마이그레이션을 먼저 적용하세요.
                    </CardContent>
                </Card>
            ) : null}

            {tab === 'posts' ? (
            <>
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
                        {f.label} {counts[f.id]}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
                </div>
            ) : visible.length === 0 ? (
                <Card className="border-white/10 bg-white/5">
                    <CardContent className="space-y-4 py-16 text-center">
                        <p className="text-white/50">게시글이 없습니다.</p>
                        <Link href="/admin/news/new">
                            <Button className="gap-2 bg-teal-400 font-bold text-slate-950 hover:bg-teal-300">
                                <Plus className="h-4 w-4" /> 첫 글 작성하기
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-white/10">
                    {visible.map((p) => {
                        const score = seoScore(p)
                        const scheduled = isScheduled(p)
                        return (
                            <div
                                key={p.id}
                                className="flex flex-col gap-3 border-b border-white/10 bg-white/[0.02] p-4 last:border-b-0 md:flex-row md:items-center"
                            >
                                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                                    {p.coverUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={p.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                                    ) : null}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px]">
                                        <span
                                            className={cn(
                                                'rounded px-1.5 py-0.5 font-bold',
                                                p.status === 'draft'
                                                    ? 'bg-white/10 text-white/60'
                                                    : scheduled
                                                      ? 'bg-amber-400/15 text-amber-300'
                                                      : 'bg-teal-400/15 text-teal-300'
                                            )}
                                        >
                                            {p.status === 'draft' ? '임시저장' : scheduled ? '예약' : '공개 중'}
                                        </span>
                                        <span className="text-white/45">{NEWS_CATEGORY_LABEL_KO[p.category]}</span>
                                        <span className="text-white/35">
                                            {formatNewsDateKo(p.publishedAt ?? p.createdAt)}
                                        </span>
                                        <span
                                            className={cn(
                                                'font-bold',
                                                score.passed === score.total ? 'text-teal-300' : score.passed >= 5 ? 'text-amber-300' : 'text-rose-300'
                                            )}
                                        >
                                            SEO {score.passed}/{score.total}
                                        </span>
                                    </div>
                                    <p className="truncate font-bold text-white">{p.title}</p>
                                    <p className="truncate font-mono text-xs text-white/35">/news/{p.slug}</p>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <Link href={`/admin/news/${p.id}`}>
                                        <Button size="sm" variant="outline" className="border-white/15">
                                            <Pencil className="mr-1 h-3.5 w-3.5" /> 수정
                                        </Button>
                                    </Link>
                                    {p.status === 'published' && !scheduled ? (
                                        <a href={`/news/${encodeURIComponent(p.slug)}`} target="_blank" rel="noreferrer">
                                            <Button size="sm" variant="outline" className="border-white/15">
                                                <Eye className="mr-1 h-3.5 w-3.5" /> 보기
                                            </Button>
                                        </a>
                                    ) : null}
                                    <Button size="sm" variant="ghost" className="text-rose-300 hover:text-rose-200" onClick={() => remove(p)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
            </>
            ) : null}
        </div>
    )
}
