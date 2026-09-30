'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BookOpen, Briefcase, HelpCircle, Layers, Printer, Sparkles, Package, Image as ImageIcon, FileText, type LucideIcon } from 'lucide-react'

export type SearchDocType = 'guide' | 'service' | 'faq' | 'material' | 'method' | 'showcase' | 'product' | 'gallery' | 'page'

export type SearchHit = {
    id: string
    type: SearchDocType
    title: string
    url: string
    snippet: string
    image: string | null
    score: number
}

export type SearchResponse = {
    hits: SearchHit[]
    terms: string[]
    total: number
    corrected: string | null
}

export const SEARCH_TYPE_ORDER: SearchDocType[] = ['guide', 'faq', 'service', 'material', 'method', 'showcase', 'product', 'gallery', 'page']

export const SEARCH_TYPE_ICON: Record<SearchDocType, LucideIcon> = {
    guide: BookOpen,
    service: Briefcase,
    faq: HelpCircle,
    material: Layers,
    method: Printer,
    showcase: Sparkles,
    product: Package,
    gallery: ImageIcon,
    page: FileText,
}

const VISITOR_KEY = 'wow3d_search_vid'

function getVisitorId(): string | null {
    try {
        let id = localStorage.getItem(VISITOR_KEY)
        if (!id) {
            id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
            localStorage.setItem(VISITOR_KEY, id)
        }
        return id
    } catch {
        return null
    }
}

export async function fetchSearch(q: string, locale: string, limit: number, signal?: AbortSignal): Promise<SearchResponse> {
    const params = new URLSearchParams({ q, locale, limit: String(limit) })
    const res = await fetch(`/api/search?${params}`, { signal })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.data) throw new Error(json?.error || 'search failed')
    return json.data as SearchResponse
}

export async function fetchPopular(locale: string): Promise<string[]> {
    try {
        const res = await fetch(`/api/search?popular=1&locale=${locale}`)
        const json = await res.json()
        return Array.isArray(json?.data?.popular) ? json.data.popular : []
    } catch {
        return []
    }
}

/** 검색어 기록. 반환된 id로 이후 클릭한 결과를 연결한다 */
export async function logSearch(input: {
    query: string
    resultCount: number
    locale: string
    source: 'page' | 'modal' | 'robot'
    clickedUrl?: string
}): Promise<number | null> {
    try {
        const res = await fetch('/api/search/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...input, visitorId: getVisitorId() }),
            keepalive: true,
        })
        const json = await res.json().catch(() => null)
        return typeof json?.data?.id === 'number' ? json.data.id : null
    } catch {
        return null
    }
}

export function logSearchClick(logId: number, clickedUrl: string): void {
    fetch('/api/search/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId, clickedUrl, visitorId: getVisitorId() }),
        keepalive: true,
    }).catch(() => undefined)
}

/** 입력이 멈춘 뒤 검색 (이전 요청은 취소) */
export function useDebouncedSearch(query: string, locale: string, limit: number, delay = 220) {
    const [data, setData] = useState<SearchResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [searchedQuery, setSearchedQuery] = useState('')
    const controllerRef = useRef<AbortController | null>(null)

    useEffect(() => {
        const q = query.trim()
        controllerRef.current?.abort()
        if (!q) {
            setData(null)
            setLoading(false)
            setSearchedQuery('')
            return
        }
        setLoading(true)
        const controller = new AbortController()
        controllerRef.current = controller
        const timer = setTimeout(() => {
            fetchSearch(q, locale, limit, controller.signal)
                .then((d) => {
                    setData(d)
                    setSearchedQuery(q)
                })
                .catch((e) => {
                    if ((e as Error).name !== 'AbortError') setData({ hits: [], terms: [], total: 0, corrected: null })
                })
                .finally(() => {
                    if (!controller.signal.aborted) setLoading(false)
                })
        }, delay)
        return () => {
            clearTimeout(timer)
            controller.abort()
        }
    }, [query, locale, limit, delay])

    return { data, loading, searchedQuery }
}

function escapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 검색어 강조 표시 */
export function Highlight({ text, terms, className }: { text: string; terms: string[]; className?: string }): ReactNode {
    const usable = terms.filter((t) => t.trim().length > 0)
    if (usable.length === 0) return text
    const re = new RegExp(`(${usable.map(escapeRegExp).join('|')})`, 'gi')
    const parts = text.split(re)
    return parts.map((part, i) =>
        i % 2 === 1 ? (
            <mark key={i} className={className ?? 'bg-teal-400/25 text-teal-100 rounded px-0.5'}>
                {part}
            </mark>
        ) : (
            part
        )
    )
}
