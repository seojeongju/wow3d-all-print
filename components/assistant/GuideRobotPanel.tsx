'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { ArrowRight, Calculator, ExternalLink, HelpCircle, Loader2, Mail, Search, TrendingUp, X } from 'lucide-react'
import { Link, useRouter } from '@/i18n/navigation'
import { NaverTalkTalkIcon } from '@/components/icons/NaverTalkTalkIcon'
import { Highlight, SEARCH_TYPE_ICON, fetchPopular, logSearch, useDebouncedSearch } from '@/components/search/search-client'
import { GUIDE_ROBOT_HEIGHT, GUIDE_ROBOT_IMAGE, GUIDE_ROBOT_WIDTH } from './guide-robot-image'

const RESULT_LIMIT = 5

type Props = {
    onClose: () => void
    talkUrl: string | null
}

export default function GuideRobotPanel({ onClose, talkUrl }: Props) {
    const t = useTranslations('GuideRobot')
    const tSearch = useTranslations('Search')
    const locale = useLocale()
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const [query, setQuery] = useState('')
    const [popular, setPopular] = useState<string[] | null>(null)
    const { data, loading, searchedQuery } = useDebouncedSearch(query, locale, RESULT_LIMIT)

    useEffect(() => {
        const timer = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 60)
        let alive = true
        fetchPopular(locale).then((list) => {
            if (alive) setPopular(list)
        })
        const onKey = (e: globalThis.KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => {
            alive = false
            clearTimeout(timer)
            window.removeEventListener('keydown', onKey)
        }
    }, [locale, onClose])

    const trimmed = query.trim()
    const ready = Boolean(trimmed && data && searchedQuery === trimmed)
    const hits = ready ? (data?.hits ?? []) : []
    const suggestions = popular && popular.length >= 3 ? popular : (tSearch.raw('recommendedTerms') as string[])
    const suggestionTitle = popular && popular.length >= 3 ? tSearch('popular') : tSearch('recommended')

    const goToAll = () => {
        if (!trimmed) return
        onClose()
        router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    }

    const openHit = (url: string) => {
        void logSearch({ query: searchedQuery || trimmed, resultCount: data?.total ?? hits.length, locale, source: 'robot', clickedUrl: url })
        onClose()
        router.push(url)
    }

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.nativeEvent.isComposing) return
        if (e.key === 'Enter') {
            e.preventDefault()
            goToAll()
        }
    }

    const shortcuts = [
        { href: '/quote', label: t('quote'), icon: Calculator },
        { href: '/qna', label: t('faq'), icon: HelpCircle },
        { href: '/contact', label: t('contact'), icon: Mail },
    ]

    return (
        <>
            <motion.div
                className="fixed inset-0 z-[110] bg-black/50 sm:bg-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                aria-hidden
            />
            <motion.div
                role="dialog"
                aria-modal="true"
                aria-label={t('open')}
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                className="fixed z-[111] inset-x-2 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-5 sm:bottom-[8.25rem] sm:w-[390px] max-h-[min(80vh,640px)] flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 backdrop-blur-xl text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:origin-bottom-right"
            >
                <div className="relative flex items-center gap-3 px-5 pt-5 pb-4 bg-gradient-to-br from-teal-500/20 via-teal-500/5 to-transparent">
                    <span className="relative w-12 h-12 shrink-0 rounded-2xl bg-white/10 ring-1 ring-teal-300/30 flex items-end justify-center overflow-hidden">
                        <Image src={GUIDE_ROBOT_IMAGE} alt="" width={GUIDE_ROBOT_WIDTH} height={GUIDE_ROBOT_HEIGHT} className="h-11 w-auto translate-y-1" />
                    </span>
                    <div className="min-w-0 flex-1 pr-6">
                        <p className="text-[15px] font-black leading-tight break-keep">{t('greeting')}</p>
                        <p className="mt-1 text-[12px] leading-snug text-white/55 break-keep">{t('intro')}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('close')}
                        className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-white/45 hover:text-white hover:bg-white/10"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-4 pb-3">
                    <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 focus-within:border-teal-400/50 focus-within:bg-white/[0.08]">
                        {loading ? (
                            <Loader2 className="w-4.5 h-4.5 text-teal-400 animate-spin shrink-0" />
                        ) : (
                            <Search className="w-4.5 h-4.5 text-white/40 shrink-0" />
                        )}
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={onKeyDown}
                            placeholder={t('searchPlaceholder')}
                            maxLength={100}
                            enterKeyHint="search"
                            aria-label={tSearch('openLabel')}
                            className="flex-1 min-w-0 h-12 bg-transparent outline-none text-[15px] font-bold placeholder:text-white/30"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => {
                                    setQuery('')
                                    inputRef.current?.focus()
                                }}
                                aria-label={tSearch('close')}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-white/35 hover:text-white hover:bg-white/10"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4">
                    {!trimmed && (
                        <div className="pb-3">
                            <p className="flex items-center gap-1.5 mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/40">
                                <TrendingUp className="w-3.5 h-3.5" /> {suggestionTitle}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {suggestions.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setQuery(s)}
                                        className="px-2.5 py-1 rounded-full text-[12px] font-bold bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-teal-400/40 hover:bg-teal-400/10"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {ready && data && (
                        <div className="pb-3">
                            {data.corrected && hits.length > 0 && (
                                <p className="mb-2 text-[11px] font-bold text-amber-300/90">{tSearch('corrected', { corrected: data.corrected })}</p>
                            )}
                            {hits.length === 0 ? (
                                <div className="py-4 text-center space-y-1.5">
                                    <p className="text-[13px] font-bold text-white/80 break-keep">{tSearch('noResults', { query: searchedQuery })}</p>
                                    <p className="text-[12px] text-white/45 break-keep">{tSearch('noResultsHint')}</p>
                                </div>
                            ) : (
                                <ul className="space-y-0.5">
                                    {hits.map((hit) => {
                                        const Icon = SEARCH_TYPE_ICON[hit.type]
                                        return (
                                            <li key={hit.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => openHit(hit.url)}
                                                    className="w-full text-left flex items-start gap-2.5 px-2 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors"
                                                >
                                                    <span className="mt-0.5 w-7 h-7 rounded-lg bg-teal-400/10 border border-teal-400/20 flex items-center justify-center shrink-0">
                                                        <Icon className="w-3.5 h-3.5 text-teal-300" />
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block text-[13px] font-black text-white truncate">
                                                            <Highlight text={hit.title} terms={data.terms} />
                                                        </span>
                                                        <span className="mt-0.5 text-[11.5px] leading-relaxed text-white/50 line-clamp-2 break-keep">
                                                            {tSearch(`types.${hit.type}`)} · <Highlight text={hit.snippet} terms={data.terms} />
                                                        </span>
                                                    </span>
                                                </button>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                            {data.total > 0 && (
                                <button
                                    type="button"
                                    onClick={goToAll}
                                    className="mt-1 w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12.5px] font-black text-teal-300 hover:bg-white/[0.05]"
                                >
                                    {t('moreResults', { count: data.total })}
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="border-t border-white/10 px-4 pt-3 pb-4 space-y-3 bg-slate-950/80">
                    {talkUrl && (
                        <a
                            href={talkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={onClose}
                            className="group flex items-center gap-3 rounded-2xl bg-[#03C75A] px-4 py-3 text-white shadow-lg shadow-[#03C75A]/25 hover:brightness-110 transition"
                        >
                            <span className="w-10 h-10 rounded-full bg-white/15 ring-1 ring-white/70 flex items-center justify-center shrink-0">
                                <NaverTalkTalkIcon className="w-5 h-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-[14px] font-black leading-tight">{t('talkTitle')}</span>
                                <span className="block mt-0.5 text-[11.5px] font-bold text-white/85 break-keep">{t('talkDesc')}</span>
                            </span>
                            <ExternalLink className="w-4 h-4 text-white/80 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                    )}
                    <nav aria-label={t('quickLinks')} className="grid grid-cols-3 gap-2">
                        {shortcuts.map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                onClick={onClose}
                                className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-[11.5px] font-bold text-white/75 hover:text-white hover:border-teal-400/40 hover:bg-teal-400/10 transition-colors"
                            >
                                <Icon className="w-4 h-4 text-teal-300" />
                                {label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </motion.div>
        </>
    )
}
