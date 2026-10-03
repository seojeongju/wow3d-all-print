/**
 * 최신 동향 후보 기사 수집 — 네이버 뉴스(API HUB) · Bing 뉴스 RSS(국내·해외) · 해외 3D프린팅 전문 매체 RSS
 * 관리자가 고른 수집 조건(키워드·제외어·소스·기간·매칭·정렬·개수·3D프린팅 필터)으로 거른다.
 * AI 호출 없이 키워드 점수로만 거르므로 매일 크론으로 돌려도 비용이 들지 않는다.
 */

import {
    DEFAULT_3D_KEYWORDS,
    DEFAULT_COLLECT_CONFIG,
    type CollectConfig,
    type CollectSource,
} from '@/lib/news-collect-config'

type Stmt = {
    bind(...values: unknown[]): Stmt
    run(): Promise<{ meta?: { changes?: number } }>
}
type Db = {
    prepare(query: string): Stmt
    batch(statements: Stmt[]): Promise<{ meta?: { changes?: number } }[]>
}

export type CandidateSourceType = 'rss' | 'naver' | 'bing' | 'manual'

export type CollectedItem = {
    sourceType: CandidateSourceType
    sourceName: string
    title: string
    url: string
    summary: string
    language: 'ko' | 'en'
    /** UTC SQL */
    publishedAt: string | null
    relevance: number
    /** 이 기사를 찾은(일치한) 수집 키워드 */
    keyword?: string | null
}

export type CollectResult = {
    scanned: number
    matched: number
    added: number
    /** 키워드별 새로 추가된 건수 */
    byKeyword: Record<string, number>
    /** 조건에서 빠진 사유별 건수 */
    dropped: Record<'excluded' | 'period' | 'keyword' | 'not3d', number>
    /** 소스별 받아온 기사 수 */
    bySource: Record<CollectSource, number>
    errors: string[]
}

const USER_AGENT = 'Mozilla/5.0 (compatible; WOW3D-NewsBot/1.0; +https://www.wow3dp.co.kr)'
const MIN_3D_RELEVANCE = 25

export const NEWS_RSS_FEEDS: { name: string; url: string; language: 'en' | 'ko' }[] = [
    { name: '3DPrint.com', url: 'https://3dprint.com/feed/', language: 'en' },
    { name: '3D Printing Industry', url: 'https://3dprintingindustry.com/feed/', language: 'en' },
    { name: 'TCT Magazine', url: 'https://www.tctmagazine.com/rss', language: 'en' },
    { name: '3Dnatives', url: 'https://www.3dnatives.com/en/feed/', language: 'en' },
    { name: 'Engineering.com', url: 'https://www.engineering.com/feed/', language: 'en' },
]

/** 네이버 개발자센터 검색 API 신규 신청 종료(2026-07-31) — NAVER API HUB(네이버 클라우드) 발급 키 사용 */
const NAVER_API_HUB_NEWS_URL = 'https://naverapihub.apigw.ntruss.com/search/v1/news'

/** 관련도 가중치 — 소문자 비교 */
const STRONG_TERMS = [
    '3d프린팅', '3d 프린팅', '3d프린터', '3d 프린터', '적층제조', '적층 제조',
    '3d printing', '3d printer', '3d-printed', '3d printed', 'additive manufacturing',
]
const TOPIC_TERMS = [
    '필라멘트', 'filament', '레진', 'resin', 'fdm', 'sla', 'dlp', 'sls', 'mjf', 'pla', 'petg', 'abs',
    '폴리카보네이트', 'polycarbonate', '나일론', 'nylon', 'tpu', '금속 3d', 'metal 3d',
    '시제품', 'prototype', 'prototyping', '양산', 'production', '소재', 'material',
    'bambu', 'formlabs', 'prusa', 'stratasys', 'eos', 'hp ', 'creality', 'markforged', 'desktop metal',
    '지원사업', '바우처', '공모', '캡스톤', '메이커', 'maker',
]
const NEGATIVE_TERMS = [
    '특징주', '주가', '주식', '상한가', '하한가', '코스닥', '테마주', '증시', '코인',
    'stock', 'shares', 'nasdaq', 'earnings call', 'dividend',
    '부고', '인사]', '[인사', '사설', '오늘의 운세',
]

/** 3D프린팅 관련도 0~100 */
export function scoreRelevance(title: string, summary: string): number {
    const t = title.toLowerCase()
    const s = summary.toLowerCase()
    let score = 0
    for (const term of STRONG_TERMS) {
        if (t.includes(term)) score += 30
        else if (s.includes(term)) score += 15
    }
    let topicHits = 0
    for (const term of TOPIC_TERMS) {
        if (t.includes(term) || s.includes(term)) topicHits += 1
    }
    score += Math.min(topicHits, 5) * 8
    for (const term of NEGATIVE_TERMS) {
        if (t.includes(term) || s.includes(term)) score -= 40
    }
    return Math.max(0, Math.min(100, score))
}

export function decodeEntities(s: string): string {
    return s
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
        .replace(/&quot;/g, '"')
        .replace(/&apos;|&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
}

export function htmlToPlain(s: string): string {
    return decodeEntities(decodeEntities(s).replace(/<[^>]+>/g, ' '))
        .replace(/\s+/g, ' ')
        .trim()
}

function toUtcSql(raw: string | null | undefined): string | null {
    if (!raw) return null
    const d = new Date(raw.trim())
    if (Number.isNaN(d.getTime())) return null
    return d.toISOString().slice(0, 19).replace('T', ' ')
}

function isWithinDays(utcSql: string | null, days: number): boolean {
    if (!utcSql) return true
    const t = new Date(`${utcSql.replace(' ', 'T')}Z`).getTime()
    return Date.now() - t <= days * 86400_000
}

function tagValue(block: string, tag: string): string {
    const m = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i').exec(block)
    return m ? m[1] : ''
}

/** 추적 파라미터 제거 — 같은 기사 중복 저장 방지 */
export function normalizeArticleUrl(raw: string): string | null {
    try {
        const u = new URL(raw.trim())
        if (!/^https?:$/.test(u.protocol)) return null
        for (const k of [...u.searchParams.keys()]) {
            if (/^(utm_|fbclid|gclid|mc_)/i.test(k)) u.searchParams.delete(k)
        }
        u.hash = ''
        return u.toString()
    } catch {
        return null
    }
}

function hostName(url: string, fallback: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, '')
    } catch {
        return fallback
    }
}

export function parseFeed(xml: string, feed: { name: string; language: 'en' | 'ko' }): CollectedItem[] {
    const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ?? []
    const items: CollectedItem[] = []
    for (const block of blocks) {
        const title = htmlToPlain(tagValue(block, 'title'))
        let link = decodeEntities(tagValue(block, 'link')).trim()
        if (!link) {
            const href = /<link[^>]*href="([^"]+)"/i.exec(block)
            link = href ? decodeEntities(href[1]) : ''
        }
        const url = normalizeArticleUrl(link)
        if (!title || !url) continue
        const summary = htmlToPlain(
            tagValue(block, 'description') || tagValue(block, 'summary') || tagValue(block, 'content')
        ).slice(0, 600)
        const publishedAt = toUtcSql(
            tagValue(block, 'pubDate') || tagValue(block, 'published') || tagValue(block, 'updated') || tagValue(block, 'dc:date')
        )
        items.push({
            sourceType: 'rss',
            sourceName: feed.name,
            title: title.slice(0, 300),
            url,
            summary,
            language: feed.language,
            publishedAt,
            relevance: 0,
        })
    }
    return items
}

async function fetchText(url: string, init?: RequestInit, timeoutMs = 15000): Promise<string> {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
        const res = await fetch(url, {
            ...init,
            headers: { 'User-Agent': USER_AGENT, ...(init?.headers ?? {}) },
            signal: ctrl.signal,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return await res.text()
    } finally {
        clearTimeout(timer)
    }
}

async function collectRss(errors: string[]): Promise<CollectedItem[]> {
    const results = await Promise.all(
        NEWS_RSS_FEEDS.map(async (feed) => {
            try {
                return parseFeed(await fetchText(feed.url), feed)
            } catch (e) {
                errors.push(`${feed.name}: ${e instanceof Error ? e.message : String(e)}`)
                return []
            }
        })
    )
    return results.flat()
}

export type NaverKeys = { clientId: string; clientSecret: string }

type NaverNewsItem = { title: string; originallink?: string; link: string; description: string; pubDate: string }

async function collectNaver(
    keys: NaverKeys | null,
    keywords: string[],
    cfg: CollectConfig,
    errors: string[]
): Promise<CollectedItem[]> {
    if (!keys) {
        errors.push('네이버: NAVER_CLIENT_ID/NAVER_CLIENT_SECRET 미설정')
        return []
    }
    const results = await Promise.all(
        keywords.map(async (query) => {
            try {
                const raw = await fetchText(
                    `${NAVER_API_HUB_NEWS_URL}?query=${encodeURIComponent(query)}&display=${cfg.perKeyword}&sort=${cfg.sort}`,
                    { headers: { 'X-NCP-APIGW-API-KEY-ID': keys.clientId, 'X-NCP-APIGW-API-KEY': keys.clientSecret } }
                )
                const data = JSON.parse(raw) as { items?: NaverNewsItem[] }
                return (data.items ?? []).flatMap((it): CollectedItem[] => {
                    const url = normalizeArticleUrl(it.originallink || it.link)
                    const title = htmlToPlain(it.title)
                    if (!url || !title) return []
                    return [
                        {
                            sourceType: 'naver',
                            sourceName: hostName(url, '네이버 뉴스'),
                            title: title.slice(0, 300),
                            url,
                            summary: htmlToPlain(it.description).slice(0, 600),
                            language: 'ko',
                            publishedAt: toUtcSql(it.pubDate),
                            relevance: 0,
                            keyword: query,
                        },
                    ]
                })
            } catch (e) {
                errors.push(`네이버(${query}): ${e instanceof Error ? e.message : String(e)}`)
                return []
            }
        })
    )
    return results.flat()
}

/** Bing 뉴스 RSS 링크(apiclick.aspx?url=...)에서 실제 기사 주소를 꺼낸다 */
function bingArticleUrl(link: string): string | null {
    try {
        const u = new URL(link)
        const real = u.searchParams.get('url')
        return normalizeArticleUrl(real || link)
    } catch {
        return null
    }
}

async function collectBing(
    market: 'ko' | 'en',
    keywords: string[],
    cfg: CollectConfig,
    errors: string[]
): Promise<CollectedItem[]> {
    const mkt = market === 'ko' ? 'ko-KR' : 'en-US'
    const results = await Promise.all(
        keywords.map(async (query) => {
            try {
                const sortParam = cfg.sort === 'date' ? `&qft=${encodeURIComponent('sortbydate="1"')}` : ''
                const xml = await fetchText(
                    `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss&mkt=${mkt}&setlang=${mkt}${sortParam}`
                )
                const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? []
                return blocks.slice(0, cfg.perKeyword).flatMap((block): CollectedItem[] => {
                    const title = htmlToPlain(tagValue(block, 'title'))
                    const url = bingArticleUrl(decodeEntities(tagValue(block, 'link')).trim())
                    if (!title || !url) return []
                    const publisher = htmlToPlain(tagValue(block, 'News:Source'))
                    return [
                        {
                            sourceType: 'bing',
                            sourceName: (publisher || hostName(url, 'Bing 뉴스')).slice(0, 120),
                            title: title.slice(0, 300),
                            url,
                            summary: htmlToPlain(tagValue(block, 'description')).slice(0, 600),
                            language: market,
                            publishedAt: toUtcSql(tagValue(block, 'pubDate')),
                            relevance: 0,
                            keyword: query,
                        },
                    ]
                })
            } catch (e) {
                errors.push(`Bing ${market === 'ko' ? '국내' : '해외'}(${query}): ${e instanceof Error ? e.message : String(e)}`)
                return []
            }
        })
    )
    return results.flat()
}

/** 띄어쓰기 차이("3D프린팅"/"3D 프린팅")를 무시하고 비교 */
const squash = (s: string) => s.toLowerCase().replace(/\s+/g, '')

/**
 * 키워드를 비교용 단어로 쪼갠다
 * - 띄어쓰기 + 영문·숫자/한글 경계: "AI최신동향" → ai, 최신동향
 * - 붙여 쓴 4자 이상 한글은 2자씩 추가 분해: 최신동향 → 최신, 동향 (기사에는 "최신 AI 동향"처럼 떨어져 나오는 경우가 많음)
 */
function keywordTokens(keyword: string): string[] {
    const out: string[] = []
    for (const word of keyword.toLowerCase().split(/\s+/).filter(Boolean)) {
        for (const part of word.match(/[a-z0-9.+#-]+|[가-힣]+|[^\sa-z0-9가-힣]+/g) ?? []) {
            if (/^[가-힣]{4,}$/.test(part)) {
                for (let i = 0; i < part.length; i += 2) {
                    const chunk = part.slice(i, i + 2)
                    out.push(chunk.length === 1 && out.length ? `${out.pop()}${chunk}` : chunk)
                }
            } else if (part.length >= 2 || /[a-z0-9]/.test(part)) {
                out.push(part)
            }
        }
    }
    return [...new Set(out)]
}

/** 'full': 키워드 전체(띄어쓰기 무시)가 그대로 있음 / 'all': 모든 단어 / 'partial': 절반 이상 / 'weak': 1개 이상 / null: 불일치 */
type MatchLevel = 'full' | 'all' | 'partial' | 'weak' | null

function matchLevel(haystack: string, keyword: string): MatchLevel {
    const h = squash(haystack)
    if (h.includes(squash(keyword))) return 'full'
    const tokens = keywordTokens(keyword)
    if (!tokens.length) return null
    const hits = tokens.filter((t) => h.includes(t)).length
    if (hits === tokens.length) return 'all'
    if (hits >= Math.ceil(tokens.length / 2) && hits > 0) return 'partial'
    return hits > 0 ? 'weak' : null
}

/** 제외어는 단어가 모두 들어 있을 때만 제외(과잉 제외 방지) */
function excludedBy(haystack: string, word: string): boolean {
    const level = matchLevel(haystack, word)
    return level === 'full' || level === 'all'
}

export type DropReason = 'excluded' | 'period' | 'keyword' | 'not3d'

/**
 * 수집 조건으로 기사 1건을 평가 — 통과하면 관련도·일치 키워드를 채워 돌려준다
 * - 제외어 포함 시 제외, 기간 밖이면 제외
 * - 검색(네이버·Bing) 결과는 검색엔진이 이미 키워드로 찾은 기사이므로 단어 절반 이상 일치하면 통과
 * - 전문 매체 RSS(키워드 검색 아님)는 키워드 단어가 모두 있어야 통과
 * - 3D프린팅 필터(관련도 25 이상)
 */
function evaluateItem(
    it: CollectedItem,
    cfg: CollectConfig,
    keywords: string[]
): { item: CollectedItem } | { drop: DropReason } {
    const hay = `${it.title} ${it.summary}`
    if (cfg.excludeKeywords.some((x) => excludedBy(hay, x))) return { drop: 'excluded' }
    if (!isWithinDays(it.publishedAt, cfg.periodDays)) return { drop: 'period' }

    const target = cfg.match === 'title' ? it.title : hay
    const ordered = it.keyword ? [it.keyword, ...keywords.filter((k) => k !== it.keyword)] : keywords
    const fromSearch = Boolean(it.keyword)

    let matched: string | null = null
    let level: MatchLevel = null
    for (const k of ordered) {
        const l = matchLevel(target, k)
        /** 검색엔진이 이 키워드로 찾아 준 기사: 정확(제목)=단어 절반 이상, 넓게=단어 1개 이상 */
        const ownSearch = fromSearch && k === it.keyword
        const enough =
            l === 'full' ||
            l === 'all' ||
            (ownSearch && l === 'partial') ||
            (ownSearch && l === 'weak' && cfg.match === 'any')
        if (enough) {
            matched = k
            level = l
            break
        }
    }

    const r3d = scoreRelevance(it.title, it.summary)
    if (cfg.require3d && r3d < MIN_3D_RELEVANCE) return { drop: 'not3d' }
    /** 전문 매체 RSS는 3D프린팅 필터가 켜져 있으면 키워드 없이도 통과(영문 매체에 한글 키워드가 안 맞는 문제) */
    if (!matched && !(cfg.require3d && it.sourceType === 'rss')) return { drop: 'keyword' }

    const inTitle = matched ? matchLevel(it.title, matched) : null
    const kwScore = !matched
        ? 0
        : inTitle === 'full' || inTitle === 'all'
          ? 75
          : level === 'full' || level === 'all'
            ? 55
            : inTitle === 'partial'
              ? 45
              : level === 'partial'
                ? 35
                : 20
    const relevance = Math.max(0, Math.min(100, Math.max(r3d, kwScore) + (kwScore && r3d ? 10 : 0)))
    return { item: { ...it, keyword: matched, relevance } }
}

/** 제목이 거의 같은 기사(여러 언론 동시 보도)는 관련도 높은 1건만 남김 */
function dedupeByTitle(items: CollectedItem[]): CollectedItem[] {
    const key = (t: string) => t.toLowerCase().replace(/[^0-9a-z가-힣]/g, '').slice(0, 40)
    const best = new Map<string, CollectedItem>()
    for (const it of items) {
        const k = key(it.title)
        const prev = best.get(k)
        if (!prev || it.relevance > prev.relevance) best.set(k, it)
    }
    return [...best.values()]
}

export function resolveNaverKeys(env: Record<string, unknown>): NaverKeys | null {
    const pick = (k: string) =>
        ((typeof process !== 'undefined' ? process.env?.[k] : undefined) || (env[k] as string | undefined) || '').trim()
    const clientId = pick('NAVER_CLIENT_ID')
    const clientSecret = pick('NAVER_CLIENT_SECRET')
    return clientId && clientSecret ? { clientId, clientSecret } : null
}

function insertStatement(db: Db, storeId: number, it: CollectedItem): Stmt {
    return db
        .prepare(
            `INSERT OR IGNORE INTO news_candidates
                (store_id, source_type, source_name, title, url, summary, language, published_at, relevance, keyword)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
            storeId,
            it.sourceType,
            it.sourceName,
            it.title,
            it.url,
            it.summary,
            it.language,
            it.publishedAt,
            it.relevance,
            it.keyword ?? null
        )
}

export async function collectNewsCandidates(
    db: Db,
    storeId: number,
    naverKeys: NaverKeys | null,
    config: CollectConfig = DEFAULT_COLLECT_CONFIG
): Promise<CollectResult> {
    const errors: string[] = []
    const keywords = config.keywords.length ? config.keywords : DEFAULT_3D_KEYWORDS
    const has = (s: CollectSource) => config.sources.includes(s)

    const batches = await Promise.all([
        has('naver') ? collectNaver(naverKeys, keywords, config, errors) : Promise.resolve([]),
        has('bing_ko') ? collectBing('ko', keywords, config, errors) : Promise.resolve([]),
        has('bing_en') ? collectBing('en', keywords, config, errors) : Promise.resolve([]),
        has('rss') ? collectRss(errors) : Promise.resolve([]),
    ])
    const all = batches.flat()
    const dropped: Record<DropReason, number> = { excluded: 0, period: 0, keyword: 0, not3d: 0 }
    const passed: CollectedItem[] = []
    for (const it of all) {
        const r = evaluateItem(it, config, keywords)
        if ('item' in r) passed.push(r.item)
        else dropped[r.drop] += 1
    }
    const picked = dedupeByTitle(passed)

    let added = 0
    const byKeyword: Record<string, number> = {}
    for (let i = 0; i < picked.length; i += 50) {
        const chunk = picked.slice(i, i + 50)
        const results = await db.batch(chunk.map((it) => insertStatement(db, storeId, it)))
        results.forEach((r, j) => {
            if (Number(r.meta?.changes ?? 0) > 0) {
                added += 1
                const k = chunk[j].keyword || '전문 매체'
                byKeyword[k] = (byKeyword[k] ?? 0) + 1
            }
        })
    }

    /** 오래된 미사용 후보 정리 — 초안으로 쓴 후보는 이력으로 보존 */
    await db
        .prepare(
            `DELETE FROM news_candidates
             WHERE store_id = ? AND status IN ('new', 'hidden') AND created_at < datetime('now', '-60 days')`
        )
        .bind(storeId)
        .run()

    return {
        scanned: all.length,
        matched: picked.length,
        added,
        byKeyword,
        dropped,
        bySource: {
            naver: batches[0].length,
            bing_ko: batches[1].length,
            bing_en: batches[2].length,
            rss: batches[3].length,
        },
        errors,
    }
}
