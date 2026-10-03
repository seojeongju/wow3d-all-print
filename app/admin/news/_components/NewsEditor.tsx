'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    CheckCircle2,
    Circle,
    ExternalLink,
    ImagePlus,
    Loader2,
    Pencil,
    Plus,
    Save,
    Send,
    Trash2,
    X,
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { isProbablyHtml, sanitizeDetailHtml } from '@/lib/sanitize-html'
import {
    evaluateNewsSeo,
    NEWS_CATEGORIES,
    NEWS_CATEGORY_LABEL_KO,
    NEWS_LINK_PRESETS,
    slugifyNewsTitle,
    summaryToLines,
    utcSqlToKstLocal,
    type NewsCategory,
    type NewsFaq,
    type NewsLink,
    type NewsPost,
    type NewsStatus,
} from '@/lib/news'
import DetailSmartEditor from '@/app/admin/custom-products/_components/DetailSmartEditor'

type FormState = {
    title: string
    slug: string
    category: NewsCategory
    tags: string
    summary: string
    bodyHtml: string
    insight: string
    metaDescription: string
    sourceName: string
    sourceUrl: string
    sourcePublishedAt: string
    coverAlt: string
    faqs: NewsFaq[]
    relatedLinks: NewsLink[]
    status: NewsStatus
    publishedAtLocal: string
}

const EMPTY_FORM: FormState = {
    title: '',
    slug: '',
    category: 'industry',
    tags: '',
    summary: '',
    bodyHtml: '',
    insight: '',
    metaDescription: '',
    sourceName: '',
    sourceUrl: '',
    sourcePublishedAt: '',
    coverAlt: '',
    faqs: [],
    relatedLinks: [],
    status: 'draft',
    publishedAtLocal: '',
}

function postToForm(p: NewsPost): FormState {
    return {
        title: p.title,
        slug: p.slug,
        category: p.category,
        tags: p.tags.join(', '),
        summary: p.summary.join('\n'),
        bodyHtml: p.bodyHtml,
        insight: p.insight,
        metaDescription: p.metaDescription,
        sourceName: p.sourceName,
        sourceUrl: p.sourceUrl,
        sourcePublishedAt: p.sourcePublishedAt,
        coverAlt: p.coverAlt,
        faqs: p.faqs,
        relatedLinks: p.relatedLinks,
        status: p.status,
        publishedAtLocal: utcSqlToKstLocal(p.publishedAt),
    }
}

const inputCls =
    'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-teal-400/60 focus:outline-none'

function Section({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
    return (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <div>
                <h2 className="text-base font-bold text-white">{title}</h2>
                {desc ? <p className="mt-1 text-xs text-white/45 break-keep">{desc}</p> : null}
            </div>
            {children}
        </section>
    )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
    return (
        <label className="block space-y-1.5">
            <span className="text-xs font-bold text-white/70">{label}</span>
            {children}
            {hint ? <span className="block text-[11px] text-white/35 break-keep">{hint}</span> : null}
        </label>
    )
}

export default function NewsEditor({ postId: initialId }: { postId?: number }) {
    const router = useRouter()
    const { token } = useAuthStore()
    const { toast } = useToast()
    const [postId, setPostId] = useState<number | null>(initialId ?? null)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [coverUrl, setCoverUrl] = useState<string | null>(null)
    const [savedStatus, setSavedStatus] = useState<NewsStatus>('draft')
    const [savedSlug, setSavedSlug] = useState('')
    const [loading, setLoading] = useState(Boolean(initialId))
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [editorOpen, setEditorOpen] = useState(false)
    const coverInputRef = useRef<HTMLInputElement>(null)
    const postIdRef = useRef<number | null>(postId)
    postIdRef.current = postId

    const authHeader = useMemo(
        () => (token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>)),
        [token]
    )

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm((f) => ({ ...f, [key]: value }))

    const load = useCallback(async () => {
        if (!token || !initialId) return
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/news/${initialId}`, { headers: authHeader })
            const j = await res.json()
            if (!res.ok) throw new Error(j.error || '조회 실패')
            const p = j.data as NewsPost
            setForm(postToForm(p))
            setCoverUrl(p.coverUrl)
            setSavedStatus(p.status)
            setSavedSlug(p.slug)
        } catch (e) {
            toast({
                title: '불러오기 실패',
                description: e instanceof Error ? e.message : '게시글을 불러오지 못했습니다.',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }, [token, initialId, authHeader, toast])

    useEffect(() => {
        void load()
    }, [load])

    const buildPayload = (f: FormState, status: NewsStatus) => ({
        ...f,
        status,
        tags: f.tags,
        slug: f.slug || slugifyNewsTitle(f.title),
    })

    /** 저장 후 게시글 ID 반환. 신규면 생성 후 주소창만 교체(편집기 상태 유지) */
    const save = async (status: NewsStatus, opts?: { quiet?: boolean; override?: FormState }): Promise<number | null> => {
        const f = opts?.override ?? form
        if (!f.title.trim()) {
            toast({ title: '제목을 입력하세요', variant: 'destructive' })
            return null
        }
        setSaving(true)
        try {
            const id = postIdRef.current
            const res = await fetch(id ? `/api/admin/news/${id}` : '/api/admin/news', {
                method: id ? 'PUT' : 'POST',
                headers: { ...authHeader, 'Content-Type': 'application/json' },
                body: JSON.stringify(buildPayload(f, status)),
            })
            const j = await res.json()
            if (!res.ok) throw new Error(j.error || '저장 실패')
            const newId = Number(j.data.id)
            setPostId(newId)
            postIdRef.current = newId
            setSavedStatus(status)
            setSavedSlug(j.data.slug)
            setForm((cur) => ({ ...cur, slug: j.data.slug, status }))
            if (!id) window.history.replaceState(null, '', `/admin/news/${newId}`)
            if (!opts?.quiet) {
                toast({ title: status === 'published' ? '발행했습니다' : '임시저장했습니다' })
            }
            return newId
        } catch (e) {
            toast({
                title: '저장 실패',
                description: e instanceof Error ? e.message : '저장에 실패했습니다.',
                variant: 'destructive',
            })
            return null
        } finally {
            setSaving(false)
        }
    }

    const ensureId = async (): Promise<number | null> =>
        postIdRef.current ?? (await save(savedStatus, { quiet: true }))

    const uploadImage = async (role: 'cover' | 'content', file: File): Promise<string | null> => {
        const id = await ensureId()
        if (!id) return null
        setUploading(true)
        try {
            const fd = new FormData()
            fd.append('image', file)
            fd.append('role', role)
            const res = await fetch(`/api/admin/news/${id}/images`, {
                method: 'POST',
                headers: authHeader,
                body: fd,
            })
            const j = await res.json()
            if (!res.ok) throw new Error(j.error || '업로드 실패')
            if (role === 'cover') setCoverUrl(j.data.url)
            return j.data.url as string
        } catch (e) {
            toast({
                title: '이미지 업로드 실패',
                description: e instanceof Error ? e.message : '업로드에 실패했습니다.',
                variant: 'destructive',
            })
            return null
        } finally {
            setUploading(false)
        }
    }

    const removeCover = async () => {
        const id = postIdRef.current
        if (!id || !confirm('대표 이미지를 삭제할까요?')) return
        const res = await fetch(`/api/admin/news/${id}`, {
            method: 'PUT',
            headers: { ...authHeader, 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...buildPayload(form, savedStatus), removeCover: true }),
        })
        if (res.ok) setCoverUrl(null)
        else toast({ title: '삭제 실패', variant: 'destructive' })
    }

    const deletePost = async () => {
        const id = postIdRef.current
        if (!id || !confirm(`「${form.title}」 글을 삭제할까요? 이미지도 함께 삭제됩니다.`)) return
        const res = await fetch(`/api/admin/news/${id}`, { method: 'DELETE', headers: authHeader })
        if (!res.ok) {
            toast({ title: '삭제 실패', variant: 'destructive' })
            return
        }
        toast({ title: '삭제했습니다' })
        router.replace('/admin/news')
    }

    const summaryLines = summaryToLines(form.summary)
    const checks = evaluateNewsSeo({
        title: form.title,
        summaryLines,
        insight: form.insight,
        metaDescription: form.metaDescription,
        hasCover: Boolean(coverUrl),
        coverAlt: form.coverAlt,
        sourceUrl: form.sourceUrl,
        category: form.category,
        relatedCount: form.relatedLinks.length,
        faqCount: form.faqs.filter((f) => f.q.trim() && f.a.trim()).length,
    })
    const passed = checks.filter((c) => c.ok).length

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
            </div>
        )
    }

    return (
        <div className="space-y-6 p-4 lg:p-6">
            <div className="flex flex-wrap items-center gap-3">
                <Link href="/admin/news" className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white">
                    <ArrowLeft className="h-4 w-4" /> 목록
                </Link>
                <h1 className="text-2xl font-bold text-white">{postId ? '최신 동향 수정' : '최신 동향 작성'}</h1>
                <span
                    className={cn(
                        'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                        savedStatus === 'published' ? 'bg-teal-400/15 text-teal-300' : 'bg-white/10 text-white/60'
                    )}
                >
                    {savedStatus === 'published' ? '발행됨' : '임시저장'}
                </span>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-5 min-w-0">
                    <Section title="기본 정보">
                        <Field label="제목" hint="검색 결과에서 잘리지 않도록 15~60자 권장">
                            <input
                                className={inputCls}
                                value={form.title}
                                maxLength={200}
                                onChange={(e) => set('title', e.target.value)}
                                placeholder="예: 뱀부랩, PC 전용 고온 노즐 출시 — 엔지니어링 소재 출력 쉬워진다"
                            />
                        </Field>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="분류">
                                <select
                                    className={inputCls}
                                    value={form.category}
                                    onChange={(e) => set('category', e.target.value as NewsCategory)}
                                >
                                    {NEWS_CATEGORIES.map((c) => (
                                        <option key={c} value={c} className="bg-slate-900">
                                            {NEWS_CATEGORY_LABEL_KO[c]}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="주소(슬러그)" hint="영문 소문자·숫자·하이픈 권장. 비우면 제목으로 자동 생성">
                                <div className="flex gap-2">
                                    <input
                                        className={inputCls}
                                        value={form.slug}
                                        onChange={(e) => set('slug', e.target.value)}
                                        placeholder="bambu-pc-nozzle-release"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="shrink-0 border-white/15"
                                        onClick={() => set('slug', slugifyNewsTitle(form.title))}
                                    >
                                        자동
                                    </Button>
                                </div>
                            </Field>
                        </div>
                        <Field label="태그" hint="쉼표로 구분 (예: PC, 고온 소재, 뱀부랩)">
                            <input className={inputCls} value={form.tags} onChange={(e) => set('tags', e.target.value)} />
                        </Field>
                    </Section>

                    <Section
                        title="핵심 요약"
                        desc="한 줄에 하나씩 3~5줄. 기사 문장을 복사하지 말고 직접 쓴 문장으로 작성하세요. AI 답변 서비스가 가장 많이 인용하는 부분입니다."
                    >
                        <textarea
                            className={cn(inputCls, 'min-h-[130px] leading-relaxed')}
                            value={form.summary}
                            onChange={(e) => set('summary', e.target.value)}
                            placeholder={'PC 출력에 필요한 300℃ 노즐이 기본 구성으로 포함됐다\n기존 장비도 노즐 교체만으로 대응 가능하다\n…'}
                        />
                        <p className="text-[11px] text-white/40">현재 {summaryLines.length}줄</p>
                    </Section>

                    <Section title="대표 이미지" desc="직접 촬영·제작한 이미지를 사용하세요. 기사 사진은 저작권 문제로 사용하면 안 됩니다.">
                        <div className="flex flex-col gap-4 md:flex-row">
                            <div className="flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/30 md:w-64">
                                {coverUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={coverUrl} alt={form.coverAlt} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-xs text-white/30">이미지 없음</span>
                                )}
                            </div>
                            <div className="flex-1 space-y-3">
                                <input
                                    ref={coverInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        e.target.value = ''
                                        if (file) await uploadImage('cover', file)
                                    }}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="gap-1.5 border-white/15"
                                        disabled={uploading}
                                        onClick={() => coverInputRef.current?.click()}
                                    >
                                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                                        {coverUrl ? '이미지 교체' : '이미지 업로드'}
                                    </Button>
                                    {coverUrl ? (
                                        <Button type="button" variant="ghost" className="text-rose-300" onClick={removeCover}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    ) : null}
                                </div>
                                <Field label="대체 텍스트(alt)" hint="이미지 내용을 한 문장으로 설명 — 이미지 검색·접근성에 사용">
                                    <input className={inputCls} value={form.coverAlt} onChange={(e) => set('coverAlt', e.target.value)} />
                                </Field>
                            </div>
                        </div>
                    </Section>

                    <Section title="본문" desc="배경 설명, 주요 내용, 수치 등을 직접 정리합니다. 이미지·표·유튜브를 넣을 수 있습니다.">
                        <div className="min-h-[120px] max-h-[360px] overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-4">
                            {form.bodyHtml.trim() ? (
                                isProbablyHtml(form.bodyHtml) ? (
                                    <div
                                        className="space-y-2 text-sm text-white/70 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-white [&_img]:max-h-40 [&_img]:rounded-lg [&_ul]:list-disc [&_ul]:pl-5"
                                        dangerouslySetInnerHTML={{ __html: sanitizeDetailHtml(form.bodyHtml) }}
                                    />
                                ) : (
                                    <p className="whitespace-pre-line text-sm text-white/70">{form.bodyHtml}</p>
                                )
                            ) : (
                                <p className="text-sm text-white/30">아직 본문이 없습니다.</p>
                            )}
                        </div>
                        <Button type="button" className="gap-1.5 bg-teal-500 text-slate-950 hover:bg-teal-400" onClick={() => setEditorOpen(true)}>
                            <Pencil className="h-4 w-4" /> 본문 편집기 열기
                        </Button>
                    </Section>

                    <Section
                        title="와우3D 실무 관점"
                        desc="이 소식이 고객에게 어떤 의미인지, 와우3D 장비·소재·견적에 어떤 영향이 있는지 직접 경험을 바탕으로 작성하세요. 검색엔진이 가장 중요하게 보는 차별화 부분입니다."
                    >
                        <textarea
                            className={cn(inputCls, 'min-h-[140px] leading-relaxed')}
                            value={form.insight}
                            onChange={(e) => set('insight', e.target.value)}
                            placeholder="예: 와우3D는 P2S 장비로 PC 출력을 지원합니다. 노즐 온도가 높아 출력 시간이 PLA보다 약 20% 늘어나며…"
                        />
                        <p className="text-[11px] text-white/40">현재 {form.insight.trim().length}자</p>
                    </Section>

                    <Section title="원문 출처" desc="외부 기사·발표를 바탕으로 했다면 반드시 출처를 표기합니다.">
                        <div className="grid gap-4 md:grid-cols-[1fr_1.6fr_170px]">
                            <Field label="출처 이름">
                                <input className={inputCls} value={form.sourceName} onChange={(e) => set('sourceName', e.target.value)} placeholder="예: 3D Printing Industry" />
                            </Field>
                            <Field label="원문 링크">
                                <input className={inputCls} value={form.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} placeholder="https://" />
                            </Field>
                            <Field label="원문 날짜">
                                <input
                                    type="date"
                                    className={cn(inputCls, '[color-scheme:dark]')}
                                    value={form.sourcePublishedAt}
                                    onChange={(e) => set('sourcePublishedAt', e.target.value)}
                                />
                            </Field>
                        </div>
                    </Section>

                    <Section title="관련 페이지 링크" desc="가이드·소재·서비스 페이지로 연결하면 기존 페이지의 검색 순위에도 도움이 됩니다.">
                        <select
                            className={inputCls}
                            value=""
                            onChange={(e) => {
                                const preset = NEWS_LINK_PRESETS.find((p) => p.href === e.target.value)
                                if (preset && !form.relatedLinks.some((l) => l.href === preset.href)) {
                                    set('relatedLinks', [...form.relatedLinks, preset])
                                }
                            }}
                        >
                            <option value="" className="bg-slate-900">+ 사이트 내 페이지 빠르게 추가…</option>
                            {NEWS_LINK_PRESETS.map((p) => (
                                <option key={p.href} value={p.href} className="bg-slate-900">
                                    {p.title} ({p.href})
                                </option>
                            ))}
                        </select>
                        <div className="space-y-2">
                            {form.relatedLinks.map((l, i) => (
                                <div key={i} className="flex gap-2">
                                    <input
                                        className={inputCls}
                                        value={l.title}
                                        placeholder="링크 제목"
                                        onChange={(e) =>
                                            set('relatedLinks', form.relatedLinks.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))
                                        }
                                    />
                                    <input
                                        className={inputCls}
                                        value={l.href}
                                        placeholder="/guides/... 또는 https://"
                                        onChange={(e) =>
                                            set('relatedLinks', form.relatedLinks.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)))
                                        }
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="shrink-0 text-white/40 hover:text-rose-300"
                                        onClick={() => set('relatedLinks', form.relatedLinks.filter((_, j) => j !== i))}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="gap-1.5 border-white/15"
                            onClick={() => set('relatedLinks', [...form.relatedLinks, { title: '', href: '' }])}
                        >
                            <Plus className="h-4 w-4" /> 직접 추가
                        </Button>
                    </Section>

                    <Section title="자주 묻는 질문(FAQ)" desc="고객이 실제로 물어볼 만한 질문 1~3개. 검색 결과와 AI 답변에 질문·답변 형태로 노출될 수 있습니다.">
                        <div className="space-y-3">
                            {form.faqs.map((f, i) => (
                                <div key={i} className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
                                    <div className="flex gap-2">
                                        <input
                                            className={inputCls}
                                            value={f.q}
                                            placeholder="질문"
                                            onChange={(e) => set('faqs', form.faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="shrink-0 text-white/40 hover:text-rose-300"
                                            onClick={() => set('faqs', form.faqs.filter((_, j) => j !== i))}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <textarea
                                        className={cn(inputCls, 'min-h-[80px]')}
                                        value={f.a}
                                        placeholder="답변"
                                        onChange={(e) => set('faqs', form.faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))}
                                    />
                                </div>
                            ))}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="gap-1.5 border-white/15"
                            onClick={() => set('faqs', [...form.faqs, { q: '', a: '' }])}
                        >
                            <Plus className="h-4 w-4" /> 질문 추가
                        </Button>
                    </Section>

                    <Section title="검색 설명(메타 설명)" desc="검색 결과 제목 아래에 보이는 문장입니다. 비우면 핵심 요약으로 자동 생성됩니다.">
                        <textarea
                            className={cn(inputCls, 'min-h-[80px]')}
                            value={form.metaDescription}
                            maxLength={300}
                            onChange={(e) => set('metaDescription', e.target.value)}
                        />
                        <p className="text-[11px] text-white/40">현재 {form.metaDescription.trim().length}자 (50~160자 권장)</p>
                    </Section>
                </div>

                <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
                    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
                        <h2 className="text-base font-bold text-white">발행</h2>
                        <Field label="발행 일시 (한국 시간)" hint="비우면 발행 버튼을 누른 시각. 미래 시각이면 그때 자동 공개(예약 발행)">
                            <input
                                type="datetime-local"
                                className={cn(inputCls, '[color-scheme:dark]')}
                                value={form.publishedAtLocal}
                                onChange={(e) => set('publishedAtLocal', e.target.value)}
                            />
                        </Field>
                        <div className="grid gap-2">
                            <Button
                                type="button"
                                disabled={saving}
                                className="gap-1.5 bg-teal-400 font-bold text-slate-950 hover:bg-teal-300"
                                onClick={() => save('published')}
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                {savedStatus === 'published' ? '수정 내용 발행' : '발행하기'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={saving}
                                className="gap-1.5 border-white/15"
                                onClick={() => save('draft')}
                            >
                                <Save className="h-4 w-4" />
                                {savedStatus === 'published' ? '발행 취소(임시저장으로)' : '임시저장'}
                            </Button>
                            {savedStatus === 'published' && savedSlug ? (
                                <a
                                    href={`/news/${encodeURIComponent(savedSlug)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center gap-1.5 rounded-md border border-white/15 px-3 py-2 text-sm text-white/70 hover:text-white"
                                >
                                    <ExternalLink className="h-4 w-4" /> 공개 페이지 보기
                                </a>
                            ) : null}
                            {postId ? (
                                <Button type="button" variant="ghost" className="gap-1.5 text-rose-300 hover:text-rose-200" onClick={deletePost}>
                                    <Trash2 className="h-4 w-4" /> 삭제
                                </Button>
                            ) : null}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-white">SEO·AEO 점검</h2>
                            <span
                                className={cn(
                                    'text-sm font-black',
                                    passed === checks.length ? 'text-teal-300' : passed >= 5 ? 'text-amber-300' : 'text-rose-300'
                                )}
                            >
                                {passed}/{checks.length}
                            </span>
                        </div>
                        <ul className="space-y-2.5">
                            {checks.map((c) => (
                                <li key={c.id} className="flex gap-2">
                                    {c.ok ? (
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                                    ) : (
                                        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-white/25" />
                                    )}
                                    <div>
                                        <p className={cn('text-sm font-bold', c.ok ? 'text-white/80' : 'text-white/55')}>{c.label}</p>
                                        <p className="text-[11px] text-white/35 break-keep">{c.hint}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                </aside>
            </div>

            {editorOpen ? (
                <DetailSmartEditor
                    initialHtml={form.bodyHtml}
                    productTitle={form.title}
                    onClose={() => setEditorOpen(false)}
                    onUploadImage={(file) => uploadImage('content', file)}
                    onRegister={async (html) => {
                        const next = { ...form, bodyHtml: html }
                        setForm(next)
                        setEditorOpen(false)
                        if (postIdRef.current) await save(savedStatus, { quiet: true, override: next })
                    }}
                />
            ) : null}
        </div>
    )
}
