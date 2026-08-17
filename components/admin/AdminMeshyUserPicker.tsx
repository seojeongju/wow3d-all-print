'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Search, User, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MeshyUserOption = {
    id: number
    email: string
    name: string | null
    phone?: string | null
    jobCount?: number
    lastJobAt?: string | null
    bonusRemaining?: number
    usedToday?: number
    remainingDaily?: number
    remainingTotal?: number
}

type Props = {
    token: string | null
    value: number | null
    onChange: (user: MeshyUserOption | null) => void
    /** 최근 Meshy 작업 등 빠른 선택 후보 */
    suggestions?: MeshyUserOption[]
    disabled?: boolean
    className?: string
}

const SEARCH_DEBOUNCE_MS = 320

function displayName(u: MeshyUserOption): string {
    return u.name?.trim() || u.email.split('@')[0] || `회원 #${u.id}`
}

function quotaSummary(u: MeshyUserOption): string {
    const daily = u.remainingDaily ?? Math.max(0, 1 - (u.usedToday ?? 0))
    const bonus = u.bonusRemaining ?? 0
    const total = u.remainingTotal ?? daily + bonus
    return `오늘 ${daily} · 보너스 ${bonus} · 합계 ${total}`
}

export default function AdminMeshyUserPicker({
    token,
    value,
    onChange,
    suggestions = [],
    disabled,
    className,
}: Props) {
    const listboxId = useId()
    const rootRef = useRef<HTMLDivElement>(null)
    const [query, setQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [scope, setScope] = useState<'meshy' | 'all'>('meshy')
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<MeshyUserOption[]>([])
    const [selected, setSelected] = useState<MeshyUserOption | null>(null)
    const [activeIndex, setActiveIndex] = useState(-1)

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS)
        return () => clearTimeout(t)
    }, [query])

    const fetchUsers = useCallback(
        async (q: string, searchScope: 'meshy' | 'all') => {
            setLoading(true)
            try {
                const params = new URLSearchParams({
                    limit: '15',
                    scope: searchScope,
                })
                if (q) params.set('q', q)

                const res = await fetch(`/api/admin/meshy/users?${params}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    cache: 'no-store',
                })
                const json = await res.json()
                if (!res.ok || !json.success) {
                    setResults([])
                    return
                }
                setResults(Array.isArray(json.data?.items) ? json.data.items : [])
            } catch {
                setResults([])
            } finally {
                setLoading(false)
            }
        },
        [token]
    )

    useEffect(() => {
        if (!open) return
        void fetchUsers(debouncedQuery, scope)
    }, [open, debouncedQuery, scope, fetchUsers])

    useEffect(() => {
        if (value == null) {
            setSelected(null)
            return
        }
        if (selected?.id === value) return

        const fromSuggestion = suggestions.find((s) => s.id === value)
        if (fromSuggestion) {
            setSelected(fromSuggestion)
            return
        }

        let cancelled = false
        ;(async () => {
            try {
                const res = await fetch(`/api/admin/meshy/users?q=${value}&scope=all&limit=1`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    cache: 'no-store',
                })
                const json = await res.json()
                if (cancelled || !json.success) return
                const item = json.data?.items?.[0] as MeshyUserOption | undefined
                if (item?.id === value) setSelected(item)
            } catch {
                /* ignore */
            }
        })()

        return () => {
            cancelled = true
        }
    }, [value, selected?.id, suggestions, token])

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', onDocClick)
        return () => document.removeEventListener('mousedown', onDocClick)
    }, [])

    const pick = (user: MeshyUserOption) => {
        setSelected(user)
        onChange(user)
        setQuery('')
        setOpen(false)
        setActiveIndex(-1)
    }

    const clear = () => {
        setSelected(null)
        onChange(null)
        setQuery('')
        setActiveIndex(-1)
    }

    const visibleResults = results.length > 0 ? results : debouncedQuery ? [] : suggestions

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
            setOpen(true)
            return
        }
        if (!open || visibleResults.length === 0) return

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActiveIndex((i) => (i + 1) % visibleResults.length)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIndex((i) => (i <= 0 ? visibleResults.length - 1 : i - 1))
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault()
            pick(visibleResults[activeIndex])
        } else if (e.key === 'Escape') {
            setOpen(false)
        }
    }

    return (
        <div ref={rootRef} className={cn('space-y-2 min-w-[min(100%,20rem)] flex-1', className)}>
            {selected ? (
                <div className="flex items-start gap-2 rounded-xl border border-teal-400/25 bg-teal-500/10 px-3 py-2.5">
                    <div className="w-9 h-9 rounded-lg bg-teal-400/20 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-teal-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-white truncate">{displayName(selected)}</p>
                        <p className="text-[11px] text-white/55 font-bold truncate">{selected.email}</p>
                        <p className="text-[10px] text-teal-200/80 font-bold mt-1">
                            ID #{selected.id}
                            {selected.phone ? ` · ${selected.phone}` : ''}
                        </p>
                        {(selected.remainingTotal != null || selected.usedToday != null) && (
                            <p className="text-[10px] text-white/45 font-bold mt-0.5">{quotaSummary(selected)}</p>
                        )}
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8 text-white/50 hover:text-white"
                        onClick={clear}
                        disabled={disabled}
                        aria-label="선택 해제"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none" />
                    <Input
                        role="combobox"
                        aria-expanded={open}
                        aria-controls={listboxId}
                        aria-autocomplete="list"
                        placeholder="이메일·이름·연락처·회원 ID 검색"
                        value={query}
                        disabled={disabled}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setOpen(true)
                            setActiveIndex(-1)
                        }}
                        onFocus={() => setOpen(true)}
                        onKeyDown={onKeyDown}
                        className="pl-9 pr-9 bg-black/40 border-white/15"
                    />
                    <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/70"
                        onClick={() => setOpen((v) => !v)}
                        tabIndex={-1}
                        aria-label="검색 목록 열기"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
                        )}
                    </button>

                    {open && (
                        <div
                            id={listboxId}
                            role="listbox"
                            className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-xl border border-white/15 bg-slate-950/95 backdrop-blur-xl shadow-2xl"
                        >
                            <div className="sticky top-0 flex gap-1 p-2 border-b border-white/10 bg-slate-950/95">
                                <button
                                    type="button"
                                    onClick={() => setScope('meshy')}
                                    className={cn(
                                        'flex-1 rounded-lg px-2 py-1.5 text-[10px] font-black transition-colors',
                                        scope === 'meshy'
                                            ? 'bg-teal-500/20 text-teal-200'
                                            : 'text-white/45 hover:bg-white/5'
                                    )}
                                >
                                    AI 사용 회원
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setScope('all')}
                                    className={cn(
                                        'flex-1 rounded-lg px-2 py-1.5 text-[10px] font-black transition-colors',
                                        scope === 'all'
                                            ? 'bg-teal-500/20 text-teal-200'
                                            : 'text-white/45 hover:bg-white/5'
                                    )}
                                >
                                    전체 회원
                                </button>
                            </div>

                            {loading && visibleResults.length === 0 ? (
                                <div className="flex items-center gap-2 px-3 py-4 text-[12px] text-white/45 font-bold">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    검색 중…
                                </div>
                            ) : visibleResults.length === 0 ? (
                                <p className="px-3 py-4 text-[12px] text-white/45 font-bold break-keep">
                                    {debouncedQuery
                                        ? '검색 결과가 없습니다. 「전체 회원」 탭을 확인해 보세요.'
                                        : scope === 'meshy'
                                          ? '최근 AI 3D를 사용한 회원이 없습니다.'
                                          : '검색어를 입력하세요.'}
                                </p>
                            ) : (
                                visibleResults.map((u, idx) => (
                                    <button
                                        key={u.id}
                                        type="button"
                                        role="option"
                                        aria-selected={activeIndex === idx}
                                        onMouseEnter={() => setActiveIndex(idx)}
                                        onClick={() => pick(u)}
                                        className={cn(
                                            'w-full text-left px-3 py-2.5 border-b border-white/5 last:border-0 transition-colors',
                                            activeIndex === idx ? 'bg-white/10' : 'hover:bg-white/5'
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-black text-white truncate">
                                                    {displayName(u)}
                                                </p>
                                                <p className="text-[11px] text-white/50 font-bold truncate">
                                                    {u.email}
                                                </p>
                                                <p className="text-[10px] text-white/35 font-bold mt-0.5">
                                                    #{u.id}
                                                    {u.phone ? ` · ${u.phone}` : ''}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                {(u.remainingTotal ?? 0) === 0 ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[9px] border-amber-400/40 text-amber-200 bg-amber-500/10"
                                                    >
                                                        횟수 소진
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[9px] border-teal-400/30 text-teal-200 bg-teal-500/10"
                                                    >
                                                        잔여 {u.remainingTotal}
                                                    </Badge>
                                                )}
                                                {(u.jobCount ?? 0) > 0 && (
                                                    <span className="text-[9px] text-white/30 font-bold">
                                                        작업 {u.jobCount}건
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}

            {!selected && suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] text-white/35 font-black uppercase tracking-wider self-center">
                        빠른 선택
                    </span>
                    {suggestions.slice(0, 6).map((u) => (
                        <button
                            key={u.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => pick(u)}
                            className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-white/70 hover:border-teal-400/40 hover:text-teal-200 transition-colors truncate max-w-[12rem]"
                            title={u.email}
                        >
                            {displayName(u)} · #{u.id}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
