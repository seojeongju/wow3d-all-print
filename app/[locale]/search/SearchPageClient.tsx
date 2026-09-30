'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowRight, Calculator, HelpCircle, Loader2, MessageSquare, Search, TrendingUp } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Link } from '@/i18n/navigation'
import {
    Highlight,
    SEARCH_TYPE_ICON,
    SEARCH_TYPE_ORDER,
    fetchPopular,
    logSearch,
    logSearchClick,
    useDebouncedSearch,
    type SearchDocType,
} from '@/components/search/search-client'

const PAGE_LIMIT = 50

type Props = { initialQuery: string }

export default function SearchPageClient({ initialQuery }: Props) {
    const t = useTranslations('Search')
    const locale = useLocale()
    const [query, setQuery] = useState(initialQuery)
    const [tab, setTab] = useState<'all' | SearchDocType>('all')
    const [popular, setPopular] = useState<string[] | null>(null)
    const { data, loading, searchedQuery } = useDebouncedSearch(query, locale, PAGE_LIMIT, 300)
    const logIdRef = useRef<{ query: string; id: number | null } | null>(null)

    useEffect(() => {
        fetchPopular(locale).then(setPopular)
    }, [locale])

    useEffect(() => {
        setQuery(initialQuery)
    }, [initialQuery])

    useEffect(() => {
        setTab('all')
        const q = searchedQuery
        const current = new URLSearchParams(window.location.search).get('q') ?? ''
        if (q && q !== current) {
            window.history.replaceState(null, '', `${window.location.pathname}?q=${encodeURIComponent(q)}`)
        }
        if (!q || !data || logIdRef.current?.query === q) return
        logIdRef.current = { query: q, id: null }
        logSearch({ query: q, resultCount: data.total, locale, source: 'page' }).then((id) => {
            if (logIdRef.current?.query === q) logIdRef.current.id = id
        })
    }, [searchedQuery, data, locale])

    const hits = useMemo(() => data?.hits ?? [], [data])
    const counts = useMemo(() => {
        const map = new Map<SearchDocType, number>()
        for (const h of hits) map.set(h.type, (map.get(h.type) ?? 0) + 1)
        return map
    }, [hits])
    const tabs = SEARCH_TYPE_ORDER.filter((type) => counts.has(type))
    const visible = tab === 'all' ? hits : hits.filter((h) => h.type === tab)
    const trimmed = query.trim()
    const showResults = !!data && !!searchedQuery && searchedQuery === trimmed
    const suggestions = popular && popular.length >= 3 ? popular : (t.raw('recommendedTerms') as string[])
    const suggestionTitle = popular && popular.length >= 3 ? t('popular') : t('recommended')

    const onResultClick = (url: string) => {
        const log = logIdRef.current
        if (log?.id && log.query === searchedQuery) logSearchClick(log.id, url)
    }

    return (
        <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
            <Header />
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b_0%,#020617_70%)]" />
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-400/5 rounded-full blur-[120px]" />
            </div>

            <div className="pt-32 sm:pt-40 pb-24 container mx-auto px-4 sm:px-6 relative z-10">
                <div className="max-w-3xl mx-auto space-y-8">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-400/10 border border-teal-400/20 text-teal-400 text-[11px] font-black uppercase tracking-[0.3em]">
                            <Search className="w-4 h-4" /> {t('eyebrow')}
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">{t('title')}</h1>
                        <p className="text-white/45 text-sm sm:text-base font-bold break-keep">{t('subtitle')}</p>
                    </div>

                    <form
                        onSubmit={(e) => e.preventDefault()}
                        className="relative group"
                        role="search"
                    >
                        {loading ? (
                            <Loader2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-400 animate-spin" />
                        ) : (
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-teal-400" />
                        )}
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t('placeholder')}
                            maxLength={100}
                            autoFocus={!initialQuery}
                            aria-label={t('openLabel')}
                            className="w-full h-14 sm:h-16 pl-14 pr-5 rounded-2xl bg-white/[0.04] border border-white/10 focus:border-teal-400/50 outline-none text-base sm:text-lg font-bold placeholder:text-white/20"
                        />
                    </form>

                    {!trimmed && (
                        <div>
                            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/40 mb-3">
                                <TrendingUp className="w-3.5 h-3.5" /> {suggestionTitle}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {suggestions.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setQuery(s)}
                                        className="px-3.5 py-2 rounded-full text-[13px] font-bold bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-teal-400/40 hover:bg-teal-400/10"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {showResults && (
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <p className="text-sm font-bold text-white/60">{t('resultCount', { count: data.total })}</p>
                                {data.corrected && hits.length > 0 && (
                                    <p className="text-[13px] font-bold text-amber-300/90">{t('corrected', { corrected: data.corrected })}</p>
                                )}
                            </div>

                            {tabs.length > 1 && (
                                <div className="flex flex-wrap gap-2">
                                    {(['all', ...tabs] as const).map((key) => {
                                        const count = key === 'all' ? hits.length : counts.get(key) ?? 0
                                        const selected = tab === key
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setTab(key)}
                                                className={`h-9 px-4 rounded-xl text-[13px] font-black border transition-colors ${
                                                    selected
                                                        ? 'bg-teal-400 border-teal-400 text-slate-950'
                                                        : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
                                                }`}
                                            >
                                                {key === 'all' ? t('all') : t(`types.${key}`)} <span className="opacity-70">{count}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}

                            {hits.length === 0 ? (
                                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center space-y-5">
                                    <div className="space-y-2">
                                        <p className="text-lg font-black">{t('noResults', { query: searchedQuery })}</p>
                                        <p className="text-sm text-white/45 break-keep">{t('noResultsHint')}</p>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {suggestions.map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setQuery(s)}
                                                className="px-3 py-1.5 rounded-full text-[13px] font-bold bg-white/5 border border-white/10 text-white/70 hover:text-white"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                                        <Link href="/contact" className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-teal-400 text-slate-950 text-sm font-black">
                                            <MessageSquare className="w-4 h-4" /> {t('contactCta')}
                                        </Link>
                                        <Link href="/qna" className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-white/15 text-sm font-black text-white/80 hover:text-white">
                                            <HelpCircle className="w-4 h-4" /> {t('faqCta')}
                                        </Link>
                                        <Link href="/quote" className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-white/15 text-sm font-black text-white/80 hover:text-white">
                                            <Calculator className="w-4 h-4" /> {t('quoteCta')}
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {visible.map((hit) => {
                                        const Icon = SEARCH_TYPE_ICON[hit.type]
                                        return (
                                            <li key={hit.id}>
                                                <Link
                                                    href={hit.url}
                                                    onClick={() => onResultClick(hit.url)}
                                                    className="group flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-teal-400/30 p-4 sm:p-5 transition-colors"
                                                >
                                                    {hit.image ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={hit.image} alt="" loading="lazy" className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 bg-white/5" />
                                                    ) : (
                                                        <span className="w-10 h-10 rounded-xl bg-teal-400/10 border border-teal-400/20 flex items-center justify-center shrink-0">
                                                            <Icon className="w-5 h-5 text-teal-300" />
                                                        </span>
                                                    )}
                                                    <span className="min-w-0 flex-1 space-y-1.5">
                                                        <span className="flex items-center gap-2 text-[11px] font-black text-teal-300/80">
                                                            <Icon className="w-3.5 h-3.5" /> {t(`types.${hit.type}`)}
                                                        </span>
                                                        <span className="block text-base sm:text-lg font-black text-white group-hover:text-teal-200 break-keep">
                                                            <Highlight text={hit.title} terms={data.terms} />
                                                        </span>
                                                        <span className="block text-[13px] sm:text-sm leading-relaxed text-white/55 break-keep">
                                                            <Highlight text={hit.snippet} terms={data.terms} />
                                                        </span>
                                                    </span>
                                                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-teal-300 self-center shrink-0" />
                                                </Link>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </main>
    )
}
