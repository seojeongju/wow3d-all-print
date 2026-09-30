'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowRight, CornerDownLeft, Loader2, Search, TrendingUp, X } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useRouter } from '@/i18n/navigation'
import { Highlight, SEARCH_TYPE_ICON, fetchPopular, logSearch, useDebouncedSearch } from './search-client'

const MODAL_LIMIT = 8

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function SiteSearchDialog({ open, onOpenChange }: Props) {
    const t = useTranslations('Search')
    const locale = useLocale()
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const [query, setQuery] = useState('')
    /** 방향키로 고른 결과 (-1: 선택 없음 → Enter 시 전체 결과 페이지) */
    const [active, setActive] = useState(-1)
    const [popular, setPopular] = useState<string[] | null>(null)
    const { data, loading, searchedQuery } = useDebouncedSearch(query, locale, MODAL_LIMIT)

    useEffect(() => {
        if (!open) return
        setActive(-1)
        const timer = setTimeout(() => inputRef.current?.focus(), 30)
        if (popular === null) fetchPopular(locale).then(setPopular)
        return () => clearTimeout(timer)
    }, [open, locale, popular])

    useEffect(() => setActive(-1), [data])

    const hits = data?.hits ?? []
    const trimmed = query.trim()
    const suggestions = popular && popular.length >= 3 ? popular : (t.raw('recommendedTerms') as string[])
    const suggestionTitle = popular && popular.length >= 3 ? t('popular') : t('recommended')

    const goToAll = (q = trimmed) => {
        if (!q) return
        onOpenChange(false)
        router.push(`/search?q=${encodeURIComponent(q)}`)
    }

    const openHit = (index: number) => {
        const hit = hits[index]
        if (!hit) return
        void logSearch({ query: searchedQuery || trimmed, resultCount: data?.total ?? hits.length, locale, source: 'modal', clickedUrl: hit.url })
        onOpenChange(false)
        router.push(hit.url)
    }

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.nativeEvent.isComposing) return
        if (e.key === 'ArrowDown' && hits.length > 0) {
            e.preventDefault()
            setActive((i) => (i + 1) % hits.length)
        } else if (e.key === 'ArrowUp' && hits.length > 0) {
            e.preventDefault()
            setActive((i) => (i <= 0 ? hits.length - 1 : i - 1))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (active >= 0 && hits[active] && searchedQuery === trimmed) openHit(active)
            else goToAll()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                overlayClassName="z-[100] bg-black/70 backdrop-blur-sm"
                className="z-[101] top-[12%] translate-y-0 sm:max-w-2xl p-0 gap-0 overflow-hidden bg-slate-950 border-white/10 text-white rounded-2xl"
            >
                <DialogTitle className="sr-only">{t('openLabel')}</DialogTitle>
                <div className="flex items-center gap-3 px-4 sm:px-5 border-b border-white/10">
                    {loading ? (
                        <Loader2 className="w-5 h-5 text-teal-400 animate-spin shrink-0" />
                    ) : (
                        <Search className="w-5 h-5 text-white/40 shrink-0" />
                    )}
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder={t('placeholder')}
                        maxLength={100}
                        className="flex-1 h-14 sm:h-16 bg-transparent outline-none text-base sm:text-lg font-bold placeholder:text-white/25"
                        aria-label={t('openLabel')}
                    />
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10"
                        aria-label={t('close')}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                    {!trimmed && (
                        <div className="p-5">
                            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/40 mb-3">
                                <TrendingUp className="w-3.5 h-3.5" /> {suggestionTitle}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {suggestions.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setQuery(s)}
                                        className="px-3 py-1.5 rounded-full text-[13px] font-bold bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-teal-400/40 hover:bg-teal-400/10"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {trimmed && data && searchedQuery === trimmed && (
                        <>
                            {data.corrected && hits.length > 0 && (
                                <p className="px-5 pt-4 text-[12px] font-bold text-amber-300/90">{t('corrected', { corrected: data.corrected })}</p>
                            )}
                            {hits.length === 0 ? (
                                <div className="p-6 text-center space-y-2">
                                    <p className="text-sm font-bold text-white/80">{t('noResults', { query: searchedQuery })}</p>
                                    <p className="text-[12px] text-white/45 break-keep">{t('noResultsHint')}</p>
                                </div>
                            ) : (
                                <ul className="p-2" role="listbox">
                                    {hits.map((hit, i) => {
                                        const Icon = SEARCH_TYPE_ICON[hit.type]
                                        return (
                                            <li key={hit.id} role="option" aria-selected={i === active}>
                                                <button
                                                    type="button"
                                                    onMouseEnter={() => setActive(i)}
                                                    onClick={() => openHit(i)}
                                                    className={`w-full text-left flex items-start gap-3 px-3 py-3 rounded-xl transition-colors ${
                                                        i === active ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'
                                                    }`}
                                                >
                                                    <span className="mt-0.5 w-8 h-8 rounded-lg bg-teal-400/10 border border-teal-400/20 flex items-center justify-center shrink-0">
                                                        <Icon className="w-4 h-4 text-teal-300" />
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="flex items-center gap-2">
                                                            <span className="text-[14px] font-black text-white truncate">
                                                                <Highlight text={hit.title} terms={data.terms} />
                                                            </span>
                                                            <span className="shrink-0 text-[10px] font-bold text-white/40 border border-white/10 rounded px-1.5 py-0.5">
                                                                {t(`types.${hit.type}`)}
                                                            </span>
                                                        </span>
                                                        <span className="block mt-1 text-[12px] leading-relaxed text-white/50 line-clamp-2 break-keep">
                                                            <Highlight text={hit.snippet} terms={data.terms} />
                                                        </span>
                                                    </span>
                                                </button>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </>
                    )}
                </div>

                {trimmed && (
                    <button
                        type="button"
                        onClick={() => goToAll()}
                        className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-white/10 text-[13px] font-black text-teal-300 hover:bg-white/[0.04]"
                    >
                        <span className="flex items-center gap-2">
                            {t('viewAll')}
                            {data && searchedQuery === trimmed && data.total > 0 && <span className="text-white/40">({data.total})</span>}
                            <ArrowRight className="w-4 h-4" />
                        </span>
                        <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-white/35">
                            <CornerDownLeft className="w-3.5 h-3.5" /> {t('enterHint')}
                        </span>
                    </button>
                )}
            </DialogContent>
        </Dialog>
    )
}
