/**
 * 최신 동향 후보 기사 수집 — RSS(해외 3D프린팅 전문 매체) + 네이버 뉴스 검색 API
 * AI 호출 없이 키워드 점수로만 거르므로 매일 크론으로 돌려도 비용이 들지 않는다.
 */

type Db = {
    prepare(query: string): {
        bind(...values: unknown[]): {
            run(): Promise<{ meta?: { changes?: number } }>
        }
    }
}

export type CandidateSourceType = 'rss' | 'naver' | 'manual'

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
}

export type CollectResult = {
    scanned: number
    added: number
    errors: string[]
}

const USER_AGENT = 'Mozilla/5.0 (compatible; WOW3D-NewsBot/1.0; +https://www.wow3dp.co.kr)'
const MAX_AGE_DAYS = 14
const MIN_RELEVANCE = 25

export const NEWS_RSS_FEEDS: { name: string; url: string; language: 'en' | 'ko' }[] = [
    { name: '3DPrint.com', url: 'https://3dprint.com/feed/', language: 'en' },
    { name: '3D Printing Industry', url: 'https://3dprintingindustry.com/feed/', language: 'en' },
    { name: 'TCT Magazine', url: 'https://www.tctmagazine.com/rss', language: 'en' },
    { name: '3Dnatives', url: 'https://www.3dnatives.com/en/feed/', language: 'en' },
    { name: 'Engineering.com', url: 'https://www.engineering.com/feed/', language: 'en' },
]

export const NAVER_NEWS_QUERIES = ['3D프린팅', '3D프린터', '적층제조', '3D프린팅 지원사업']

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

function isRecent(utcSql: string | null): boolean {
    if (!utcSql) return true
    const t = new Date(`${utcSql.replace(' ', 'T')}Z`).getTime()
    return Date.now() - t <= MAX_AGE_DAYS * 86400_000
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
            relevance: scoreRelevance(title, summary),
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

function naverSourceName(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, '')
    } catch {
        return '네이버 뉴스'
    }
}

async function collectNaver(keys: NaverKeys | null, errors: string[]): Promise<CollectedItem[]> {
    if (!keys) {
        errors.push('네이버: NAVER_CLIENT_ID/NAVER_CLIENT_SECRET 미설정')
        return []
    }
    const results = await Promise.all(
        NAVER_NEWS_QUERIES.map(async (query) => {
            try {
                const raw = await fetchText(
                    `${NAVER_API_HUB_NEWS_URL}?query=${encodeURIComponent(query)}&display=30&sort=date`,
                    { headers: { 'X-NCP-APIGW-API-KEY-ID': keys.clientId, 'X-NCP-APIGW-API-KEY': keys.clientSecret } }
                )
                const data = JSON.parse(raw) as { items?: NaverNewsItem[] }
                return (data.items ?? []).flatMap((it): CollectedItem[] => {
                    const url = normalizeArticleUrl(it.originallink || it.link)
                    const title = htmlToPlain(it.title)
                    if (!url || !title) return []
                    const summary = htmlToPlain(it.description).slice(0, 600)
                    return [
                        {
                            sourceType: 'naver',
                            sourceName: naverSourceName(url),
                            title: title.slice(0, 300),
                            url,
                            summary,
                            language: 'ko',
                            publishedAt: toUtcSql(it.pubDate),
                            relevance: scoreRelevance(title, summary),
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

export async function insertCandidate(db: Db, storeId: number, it: CollectedItem): Promise<boolean> {
    const res = await db
        .prepare(
            `INSERT OR IGNORE INTO news_candidates
                (store_id, source_type, source_name, title, url, summary, language, published_at, relevance)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(storeId, it.sourceType, it.sourceName, it.title, it.url, it.summary, it.language, it.publishedAt, it.relevance)
        .run()
    return Number(res.meta?.changes ?? 0) > 0
}

export async function collectNewsCandidates(
    db: Db,
    storeId: number,
    naverKeys: NaverKeys | null
): Promise<CollectResult> {
    const errors: string[] = []
    const [rss, naver] = await Promise.all([collectRss(errors), collectNaver(naverKeys, errors)])
    const all = [...rss, ...naver]
    const picked = dedupeByTitle(all.filter((it) => it.relevance >= MIN_RELEVANCE && isRecent(it.publishedAt)))

    let added = 0
    for (const it of picked) {
        if (await insertCandidate(db, storeId, it)) added += 1
    }

    /** 오래된 미사용 후보 정리 — 초안으로 쓴 후보는 이력으로 보존 */
    await db
        .prepare(
            `DELETE FROM news_candidates
             WHERE store_id = ? AND status IN ('new', 'hidden') AND created_at < datetime('now', '-60 days')`
        )
        .bind(storeId)
        .run()

    return { scanned: all.length, added, errors }
}
