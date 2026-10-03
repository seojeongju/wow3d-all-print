'use client'

import { useCallback, useEffect, useState, type KeyboardEvent } from 'react'
import { ChevronDown, Loader2, Play, RefreshCw, RotateCcw, Save, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatNewsDateKo } from '@/lib/news'
import {
    COLLECT_PER_KEYWORD,
    COLLECT_PERIODS,
    COLLECT_SOURCE_LABEL,
    COLLECT_SOURCE_SHORT,
    COLLECT_SOURCES,
    COLLECT_TOPIC_PRESETS,
    DEFAULT_COLLECT_CONFIG,
    describeCollectConfig,
    MAX_COLLECT_KEYWORDS,
    type CollectConfig,
    type CollectSource,
} from '@/lib/news-collect-config'
import type { NewsCollectPreset } from '@/lib/news-collect-presets'

export type CollectResultSummary = {
    scanned: number
    matched: number
    added: number
    byKeyword: Record<string, number>
    dropped?: Record<'excluded' | 'period' | 'keyword' | 'not3d', number>
    bySource?: Record<CollectSource, number>
    errors: string[]
}

const DROP_LABEL: Record<'excluded' | 'period' | 'keyword' | 'not3d', string> = {
    keyword: '키워드 불일치',
    not3d: '3D프린팅 무관',
    period: '기간 밖',
    excluded: '제외 키워드',
}

const selectCls =
    'h-9 rounded-lg border border-white/15 bg-black/30 px-2.5 text-xs text-white focus:border-teal-400/60 focus:outline-none'

function ChipInput({
    label,
    hint,
    values,
    onChange,
    max,
    placeholder,
    tone = 'teal',
}: {
    label: string
    hint?: string
    values: string[]
    onChange: (next: string[]) => void
    max: number
    placeholder: string
    tone?: 'teal' | 'rose'
}) {
    const [draft, setDraft] = useState('')

    const addFrom = (text: string) => {
        const parts = text
            .split(/[,，\n]/)
            .map((s) => s.replace(/\s+/g, ' ').trim().slice(0, 40))
            .filter(Boolean)
        if (!parts.length) return
        const next = [...values]
        for (const p of parts) {
            if (next.length >= max) break
            if (!next.some((v) => v.toLowerCase() === p.toLowerCase())) next.push(p)
        }
        onChange(next)
        setDraft('')
    }

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.nativeEvent.isComposing) return
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addFrom(draft)
        } else if (e.key === 'Backspace' && !draft && values.length) {
            onChange(values.slice(0, -1))
        }
    }

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/70">{label}</span>
                <span className="text-[11px] text-white/35">
                    {values.length}/{max}
                    {values.length ? (
                        <button type="button" className="ml-2 text-white/45 hover:text-white" onClick={() => onChange([])}>
                            모두 지우기
                        </button>
                    ) : null}
                </span>
            </div>
            <div className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 focus-within:border-teal-400/60">
                {values.map((v) => (
                    <span
                        key={v}
                        className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
                            tone === 'teal' ? 'bg-teal-400/15 text-teal-200' : 'bg-rose-400/15 text-rose-200'
                        )}
                    >
                        {v}
                        <button type="button" aria-label={`${v} 삭제`} onClick={() => onChange(values.filter((x) => x !== v))}>
                            <X className="h-3 w-3 opacity-70 hover:opacity-100" />
                        </button>
                    </span>
                ))}
                <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onKeyDown}
                    onBlur={() => addFrom(draft)}
                    disabled={values.length >= max}
                    placeholder={values.length >= max ? '최대 개수에 도달했습니다' : placeholder}
                    className="h-7 min-w-[160px] flex-1 bg-transparent px-1 text-sm text-white placeholder:text-white/30 focus:outline-none"
                />
            </div>
            {hint ? <p className="text-[11px] text-white/35 break-keep">{hint}</p> : null}
        </div>
    )
}

export default function NewsCollectPanel({
    headers,
    naverConfigured,
    onCollected,
}: {
    headers: Record<string, string>
    naverConfigured: boolean
    onCollected: () => void | Promise<void>
}) {
    const { toast } = useToast()
    const [open, setOpen] = useState(false)
    const [config, setConfig] = useState<CollectConfig>({ ...DEFAULT_COLLECT_CONFIG, keywords: [], require3d: false })
    const [presets, setPresets] = useState<NewsCollectPreset[]>([])
    const [presetsMissing, setPresetsMissing] = useState(false)
    const [loadedPresetId, setLoadedPresetId] = useState<number | null>(null)
    const [collecting, setCollecting] = useState<'config' | 'default' | number | null>(null)
    const [saveOpen, setSaveOpen] = useState(false)
    const [saveName, setSaveName] = useState('')
    const [saveAuto, setSaveAuto] = useState(true)
    const [saving, setSaving] = useState(false)

    const set = <K extends keyof CollectConfig>(key: K, value: CollectConfig[K]) => setConfig((c) => ({ ...c, [key]: value }))

    const loadPresets = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/news/presets', { headers })
            const j = await res.json()
            if (j.code === 'TABLE_MISSING') {
                setPresetsMissing(true)
                return
            }
            if (res.ok) setPresets(j.data || [])
        } catch {
            /* 목록 실패는 수집 기능에 영향 없음 */
        }
    }, [headers])

    useEffect(() => {
        if (headers.Authorization) void loadPresets()
    }, [headers, loadPresets])

    const runCollect = async (payload: Record<string, unknown>, key: 'config' | 'default' | number) => {
        setCollecting(key)
        try {
            const res = await fetch('/api/admin/news/candidates', { method: 'POST', headers, body: JSON.stringify(payload) })
            const j = await res.json()
            if (!res.ok) throw new Error(j.error || '수집 실패')
            const r = j.data as CollectResultSummary
            const top = Object.entries(r.byKeyword)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([k, n]) => `${k} ${n}`)
                .join(', ')
            const sources = r.bySource
                ? (Object.entries(r.bySource) as [CollectSource, number][])
                      .filter(([s, n]) => n > 0 || (key === 'config' && config.sources.includes(s)))
                      .map(([s, n]) => `${COLLECT_SOURCE_SHORT[s]} ${n}`)
                      .join(' · ')
                : ''
            const drops = r.dropped
                ? (Object.entries(r.dropped) as [keyof typeof DROP_LABEL, number][])
                      .filter(([, n]) => n > 0)
                      .map(([k, n]) => `${DROP_LABEL[k]} ${n}`)
                      .join(', ')
                : ''
            const existing = Math.max(0, r.matched - r.added)
            toast({
                title: `새 후보 ${r.added}건 추가`,
                description: [
                    `기사 ${r.scanned}건 확인${sources ? ` (${sources})` : ''} → 조건 일치 ${r.matched}건${existing ? ` · 이미 수집됨 ${existing}건` : ''}`,
                    drops ? `제외: ${drops}` : '',
                    top ? `키워드별 추가: ${top}` : '',
                    r.matched === 0 && r.dropped?.keyword
                        ? '팁: 키워드를 띄어 쓰거나 짧게(예: "AI 동향"), 일치 기준을 "제목·요약에 포함"으로 바꿔 보세요.'
                        : '',
                    r.errors.length ? `일부 실패: ${r.errors.slice(0, 2).join(', ')}` : '',
                ]
                    .filter(Boolean)
                    .join('\n'),
            })
            await onCollected()
            if (typeof key === 'number') void loadPresets()
        } catch (e) {
            toast({ title: '수집 실패', description: e instanceof Error ? e.message : '', variant: 'destructive' })
        } finally {
            setCollecting(null)
        }
    }

    const collectWithConfig = () => {
        if (!config.keywords.length && !config.sources.every((s) => s === 'rss')) {
            toast({ title: '키워드를 1개 이상 입력하세요', description: '주제 빠른 추가 버튼으로 바로 넣을 수 있습니다.', variant: 'destructive' })
            return
        }
        void runCollect({ config }, 'config')
    }

    const addTopic = (keywords: string[]) => {
        const next = [...config.keywords]
        for (const k of keywords) {
            if (next.length >= MAX_COLLECT_KEYWORDS) break
            if (!next.includes(k)) next.push(k)
        }
        set('keywords', next)
        if (keywords.some((k) => /^[a-z0-9\s-]+$/i.test(k)) && !config.sources.includes('bing_en')) {
            set('sources', [...config.sources, 'bing_en'])
        }
    }

    const toggleSource = (s: CollectSource) => {
        const has = config.sources.includes(s)
        if (has && config.sources.length === 1) return
        set('sources', has ? config.sources.filter((x) => x !== s) : [...config.sources, s])
    }

    const savePreset = async (overwrite: boolean) => {
        if (!config.keywords.length) {
            toast({ title: '키워드를 1개 이상 입력하세요', variant: 'destructive' })
            return
        }
        const name = saveName.trim()
        if (!name) {
            toast({ title: '조건 이름을 입력하세요', variant: 'destructive' })
            return
        }
        setSaving(true)
        try {
            const url = overwrite && loadedPresetId ? `/api/admin/news/presets/${loadedPresetId}` : '/api/admin/news/presets'
            const res = await fetch(url, {
                method: overwrite && loadedPresetId ? 'PUT' : 'POST',
                headers,
                body: JSON.stringify({ name, config, autoCollect: saveAuto }),
            })
            const j = await res.json()
            if (!res.ok) throw new Error(j.error || '저장 실패')
            if (!overwrite && j.data?.id) setLoadedPresetId(Number(j.data.id))
            toast({ title: overwrite ? '수집 조건을 수정했습니다' : '수집 조건을 저장했습니다', description: saveAuto ? '매일 자정 자동 수집에 포함됩니다.' : undefined })
            setSaveOpen(false)
            await loadPresets()
        } catch (e) {
            toast({ title: '저장 실패', description: e instanceof Error ? e.message : '', variant: 'destructive' })
        } finally {
            setSaving(false)
        }
    }

    const loadPreset = (p: NewsCollectPreset) => {
        setConfig(p.config)
        setLoadedPresetId(p.id)
        setSaveName(p.name)
        setSaveAuto(p.autoCollect)
        setOpen(true)
        toast({ title: `「${p.name}」 조건을 불러왔습니다` })
    }

    const toggleAuto = async (p: NewsCollectPreset) => {
        const res = await fetch(`/api/admin/news/presets/${p.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ autoCollect: !p.autoCollect }),
        })
        if (res.ok) setPresets((prev) => prev.map((x) => (x.id === p.id ? { ...x, autoCollect: !p.autoCollect } : x)))
        else toast({ title: '변경 실패', variant: 'destructive' })
    }

    const deletePreset = async (p: NewsCollectPreset) => {
        if (!confirm(`「${p.name}」 수집 조건을 삭제할까요? 이미 수집된 후보 기사는 그대로 남습니다.`)) return
        const res = await fetch(`/api/admin/news/presets/${p.id}`, { method: 'DELETE', headers })
        if (!res.ok) {
            toast({ title: '삭제 실패', variant: 'destructive' })
            return
        }
        if (loadedPresetId === p.id) setLoadedPresetId(null)
        setPresets((prev) => prev.filter((x) => x.id !== p.id))
    }

    const busy = collecting !== null

    return (
        <Card className="border-white/10 bg-white/[0.03]">
            <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 text-left">
                        <SlidersHorizontal className="h-4 w-4 text-teal-300" />
                        <span className="text-sm font-bold text-white">수집 조건 · 키워드 수집</span>
                        <ChevronDown className={cn('h-4 w-4 text-white/50 transition-transform', open && 'rotate-180')} />
                    </button>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() => runCollect({}, 'default')}
                            className="gap-2 border-white/15"
                            title="3D프린팅 기본 키워드 + 전문 매체로 수집"
                        >
                            {collecting === 'default' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            기본 수집(3D프린팅)
                        </Button>
                        {!open ? (
                            <Button onClick={() => setOpen(true)} className="gap-2 bg-teal-400 font-bold text-slate-950 hover:bg-teal-300">
                                <SlidersHorizontal className="h-4 w-4" /> 키워드로 수집
                            </Button>
                        ) : null}
                    </div>
                </div>

                {open ? (
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <span className="text-xs font-bold text-white/70">주제 빠른 추가</span>
                            <div className="flex flex-wrap gap-1.5">
                                {COLLECT_TOPIC_PRESETS.map((t) => (
                                    <button
                                        key={t.label}
                                        type="button"
                                        onClick={() => addTopic(t.keywords)}
                                        title={t.keywords.join(', ')}
                                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold text-white/65 transition-colors hover:border-teal-400/50 hover:text-teal-200"
                                    >
                                        + {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <ChipInput
                            label="수집 키워드"
                            hint="키워드마다 따로 검색합니다. 띄어쓴 단어는 모두 들어간 기사만 고릅니다(예: '시제품 제작'). 해외(영문) 소스에는 영어 키워드를 넣으세요."
                            values={config.keywords}
                            onChange={(v) => set('keywords', v)}
                            max={MAX_COLLECT_KEYWORDS}
                            placeholder="키워드 입력 후 Enter (쉼표로 여러 개)"
                        />

                        <ChipInput
                            label="제외 키워드"
                            hint="제목·요약에 이 단어가 있으면 수집하지 않습니다. 주식·인사·부고 기사 등을 거를 때 사용합니다."
                            values={config.excludeKeywords}
                            onChange={(v) => set('excludeKeywords', v)}
                            max={30}
                            placeholder="예: 주가, 채용, 광고"
                            tone="rose"
                        />

                        <div className="space-y-2">
                            <span className="text-xs font-bold text-white/70">수집 소스</span>
                            <div className="flex flex-wrap gap-1.5">
                                {COLLECT_SOURCES.map((s) => {
                                    const on = config.sources.includes(s)
                                    const disabled = s === 'naver' && !naverConfigured
                                    return (
                                        <button
                                            key={s}
                                            type="button"
                                            disabled={disabled}
                                            onClick={() => toggleSource(s)}
                                            className={cn(
                                                'rounded-full border px-3 py-1 text-xs font-bold transition-colors disabled:opacity-40',
                                                on
                                                    ? 'border-teal-300 bg-teal-400/15 text-teal-100'
                                                    : 'border-white/15 text-white/55 hover:text-white'
                                            )}
                                        >
                                            {on ? '✓ ' : ''}
                                            {COLLECT_SOURCE_LABEL[s]}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <label className="space-y-1.5">
                                <span className="block text-xs font-bold text-white/70">기간</span>
                                <select
                                    className={cn(selectCls, 'w-full')}
                                    value={config.periodDays}
                                    onChange={(e) => set('periodDays', Number(e.target.value) as CollectConfig['periodDays'])}
                                >
                                    {COLLECT_PERIODS.map((d) => (
                                        <option key={d} value={d} className="bg-slate-900">
                                            최근 {d}일
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="space-y-1.5">
                                <span className="block text-xs font-bold text-white/70">키워드 일치</span>
                                <select
                                    className={cn(selectCls, 'w-full')}
                                    value={config.match}
                                    onChange={(e) => set('match', e.target.value as CollectConfig['match'])}
                                >
                                    <option value="title" className="bg-slate-900">제목에 포함 (정확)</option>
                                    <option value="any" className="bg-slate-900">제목·요약에 포함 (넓게)</option>
                                </select>
                            </label>
                            <label className="space-y-1.5">
                                <span className="block text-xs font-bold text-white/70">정렬</span>
                                <select
                                    className={cn(selectCls, 'w-full')}
                                    value={config.sort}
                                    onChange={(e) => set('sort', e.target.value as CollectConfig['sort'])}
                                >
                                    <option value="date" className="bg-slate-900">최신순</option>
                                    <option value="sim" className="bg-slate-900">정확도순</option>
                                </select>
                            </label>
                            <label className="space-y-1.5">
                                <span className="block text-xs font-bold text-white/70">키워드당 검색 개수</span>
                                <select
                                    className={cn(selectCls, 'w-full')}
                                    value={config.perKeyword}
                                    onChange={(e) => set('perKeyword', Number(e.target.value) as CollectConfig['perKeyword'])}
                                >
                                    {COLLECT_PER_KEYWORD.map((n) => (
                                        <option key={n} value={n} className="bg-slate-900">
                                            {n}건
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <label className="flex cursor-pointer items-start gap-2.5">
                            <input
                                type="checkbox"
                                checked={config.require3d}
                                onChange={(e) => set('require3d', e.target.checked)}
                                className="mt-0.5 h-4 w-4 accent-teal-400"
                            />
                            <span>
                                <span className="block text-sm font-bold text-white/80">3D프린팅 관련 기사만</span>
                                <span className="block text-[11px] text-white/40 break-keep">
                                    끄면 키워드에 맞는 다양한 분야(제조·창업·기술 등) 기사를 모두 수집합니다.
                                </span>
                            </span>
                        </label>

                        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
                            <Button
                                disabled={busy}
                                onClick={collectWithConfig}
                                className="gap-2 bg-teal-400 font-bold text-slate-950 hover:bg-teal-300"
                            >
                                {collecting === 'config' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                                이 조건으로 수집
                            </Button>
                            <Button
                                variant="outline"
                                disabled={presetsMissing}
                                onClick={() => setSaveOpen((v) => !v)}
                                className="gap-2 border-white/15"
                            >
                                <Save className="h-4 w-4" /> 조건 저장
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setConfig({ ...DEFAULT_COLLECT_CONFIG, keywords: [], require3d: false })
                                    setLoadedPresetId(null)
                                    setSaveName('')
                                }}
                                className="gap-2 text-white/55"
                            >
                                <RotateCcw className="h-4 w-4" /> 초기화
                            </Button>
                        </div>

                        {saveOpen ? (
                            <div className="space-y-3 rounded-xl border border-teal-400/25 bg-teal-400/[0.05] p-4">
                                <input
                                    value={saveName}
                                    maxLength={40}
                                    onChange={(e) => setSaveName(e.target.value)}
                                    placeholder="조건 이름 (예: 제조혁신·스마트팩토리)"
                                    className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm text-white placeholder:text-white/30"
                                />
                                <label className="flex cursor-pointer items-center gap-2 text-xs text-white/70">
                                    <input
                                        type="checkbox"
                                        checked={saveAuto}
                                        onChange={(e) => setSaveAuto(e.target.checked)}
                                        className="h-4 w-4 accent-teal-400"
                                    />
                                    매일 자정 자동 수집에 포함
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <Button size="sm" disabled={saving} onClick={() => savePreset(false)} className="bg-teal-400 font-bold text-slate-950 hover:bg-teal-300">
                                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                        새 조건으로 저장
                                    </Button>
                                    {loadedPresetId ? (
                                        <Button size="sm" variant="outline" disabled={saving} onClick={() => savePreset(true)} className="border-white/15">
                                            불러온 조건에 덮어쓰기
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}
                    </div>
                ) : null}

                {presetsMissing ? (
                    <p className="rounded-lg border border-amber-400/30 bg-amber-400/5 px-4 py-2 text-xs text-amber-200">
                        수집 조건 저장용 테이블이 없습니다. migrations/schema_news_collect_presets.sql 을 먼저 적용하세요.
                    </p>
                ) : presets.length ? (
                    <div className="space-y-2">
                        <span className="text-xs font-bold text-white/70">저장된 수집 조건</span>
                        <div className="overflow-hidden rounded-xl border border-white/10">
                            {presets.map((p) => (
                                <div
                                    key={p.id}
                                    className={cn(
                                        'flex flex-col gap-2 border-b border-white/10 p-3 last:border-b-0 md:flex-row md:items-center',
                                        loadedPresetId === p.id ? 'bg-teal-400/[0.06]' : 'bg-white/[0.02]'
                                    )}
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-white">{p.name}</p>
                                        <p className="truncate text-[11px] text-white/45">{describeCollectConfig(p.config)}</p>
                                        {p.lastRunAt ? (
                                            <p className="text-[11px] text-white/35">
                                                마지막 수집 {formatNewsDateKo(p.lastRunAt)} · 새 후보 {p.lastAdded ?? 0}건
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => toggleAuto(p)}
                                            className={cn(
                                                'rounded-full border px-2.5 py-1 text-[11px] font-bold',
                                                p.autoCollect ? 'border-teal-300 bg-teal-400/15 text-teal-100' : 'border-white/15 text-white/45'
                                            )}
                                            title="매일 자정 자동 수집 켜기/끄기"
                                        >
                                            매일 자동 {p.autoCollect ? 'ON' : 'OFF'}
                                        </button>
                                        <Button size="sm" variant="outline" className="h-8 border-white/15" onClick={() => loadPreset(p)}>
                                            불러오기
                                        </Button>
                                        <Button
                                            size="sm"
                                            disabled={busy}
                                            className="h-8 gap-1 bg-teal-400 font-bold text-slate-950 hover:bg-teal-300"
                                            onClick={() => runCollect({ presetId: p.id }, p.id)}
                                        >
                                            {collecting === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                                            수집
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-8 text-white/45 hover:text-rose-300" onClick={() => deletePreset(p)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    )
}
