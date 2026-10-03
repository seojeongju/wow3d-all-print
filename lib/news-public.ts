import { getCloudflareContext } from '@opennextjs/cloudflare'
import {
    isNewsCategory,
    newsMediaUrlFromKey,
    normalizeNewsSlug,
    parseJsonList,
    summaryToLines,
    NEWS_PAGE_SIZE,
    type NewsCategory,
    type NewsFaq,
    type NewsLink,
    type NewsPost,
} from '@/lib/news'

const DEFAULT_STORE_ID = 1

type Db = {
    prepare(query: string): {
        bind(...values: unknown[]): {
            all<T>(): Promise<{ results?: T[] }>
            first<T>(): Promise<T | null>
        }
    }
}

export type NewsRow = {
    id: number
    slug: string
    title: string
    category: string
    summary: string | null
    body_html: string | null
    insight: string | null
    meta_description: string | null
    source_name: string | null
    source_url: string | null
    source_published_at: string | null
    cover_r2_key: string | null
    cover_alt: string | null
    tags_json: string | null
    faq_json: string | null
    related_links_json: string | null
    status: string
    published_at: string | null
    created_at: string
    updated_at: string
}

/** 공개 노출 조건 — 예약 발행 시각이 지난 published 글만 */
const PUBLIC_WHERE = `store_id = ? AND status = 'published' AND published_at IS NOT NULL AND published_at <= datetime('now')`

export function mapNewsRow(row: NewsRow): NewsPost {
    return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        category: isNewsCategory(row.category) ? row.category : 'industry',
        summary: summaryToLines(row.summary),
        bodyHtml: row.body_html || '',
        insight: row.insight || '',
        metaDescription: row.meta_description || '',
        sourceName: row.source_name || '',
        sourceUrl: row.source_url || '',
        sourcePublishedAt: row.source_published_at || '',
        coverUrl: newsMediaUrlFromKey(row.cover_r2_key),
        coverR2Key: row.cover_r2_key,
        coverAlt: row.cover_alt || '',
        tags: parseJsonList<string>(row.tags_json, []).map(String).filter(Boolean),
        faqs: parseJsonList<NewsFaq>(row.faq_json, []).filter((f) => f && f.q && f.a),
        relatedLinks: parseJsonList<NewsLink>(row.related_links_json, []).filter((l) => l && l.title && l.href),
        status: row.status === 'published' ? 'published' : 'draft',
        publishedAt: row.published_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }
}

async function getDb(): Promise<Db | null> {
    try {
        const { env } = await getCloudflareContext({ async: true })
        return (env?.DB as unknown as Db) ?? null
    } catch {
        return null
    }
}

function isMissingTable(e: unknown): boolean {
    return /no such table/i.test(e instanceof Error ? e.message : String(e))
}

export type NewsListResult = { items: NewsPost[]; total: number; page: number; pageCount: number }

export async function getPublishedNewsList(opts: {
    page?: number
    category?: NewsCategory | null
    limit?: number
}): Promise<NewsListResult> {
    const limit = opts.limit ?? NEWS_PAGE_SIZE
    const page = Math.max(1, Math.floor(opts.page ?? 1))
    const empty = { items: [], total: 0, page, pageCount: 0 }
    const db = await getDb()
    if (!db) return empty
    try {
        const catWhere = opts.category ? ' AND category = ?' : ''
        const binds: unknown[] = opts.category ? [DEFAULT_STORE_ID, opts.category] : [DEFAULT_STORE_ID]
        const countRow = await db
            .prepare(`SELECT COUNT(*) AS n FROM news_posts WHERE ${PUBLIC_WHERE}${catWhere}`)
            .bind(...binds)
            .first<{ n: number }>()
        const total = Number(countRow?.n ?? 0)
        const res = await db
            .prepare(
                `SELECT * FROM news_posts WHERE ${PUBLIC_WHERE}${catWhere}
                 ORDER BY published_at DESC, id DESC LIMIT ? OFFSET ?`
            )
            .bind(...binds, limit, (page - 1) * limit)
            .all<NewsRow>()
        return {
            items: (res.results ?? []).map(mapNewsRow),
            total,
            page,
            pageCount: Math.ceil(total / limit),
        }
    } catch (e) {
        if (!isMissingTable(e)) console.warn('getPublishedNewsList', e)
        return empty
    }
}

export async function getLatestNews(limit = 3, excludeId?: number): Promise<NewsPost[]> {
    const db = await getDb()
    if (!db) return []
    try {
        const res = await db
            .prepare(
                `SELECT * FROM news_posts WHERE ${PUBLIC_WHERE} AND id != ?
                 ORDER BY published_at DESC, id DESC LIMIT ?`
            )
            .bind(DEFAULT_STORE_ID, excludeId ?? -1, limit)
            .all<NewsRow>()
        return (res.results ?? []).map(mapNewsRow)
    } catch (e) {
        if (!isMissingTable(e)) console.warn('getLatestNews', e)
        return []
    }
}

export async function getPublishedNewsBySlug(slugRaw: string): Promise<NewsPost | null> {
    const slug = normalizeNewsSlug(slugRaw)
    if (!slug) return null
    const db = await getDb()
    if (!db) return null
    try {
        const row = await db
            .prepare(`SELECT * FROM news_posts WHERE ${PUBLIC_WHERE} AND slug = ?`)
            .bind(DEFAULT_STORE_ID, slug)
            .first<NewsRow>()
        return row ? mapNewsRow(row) : null
    } catch (e) {
        if (!isMissingTable(e)) console.warn('getPublishedNewsBySlug', e)
        return null
    }
}

/** 사이트맵·RSS·llms.txt·검색용 — 본문 제외 경량 목록 */
export async function getAllPublishedNews(limit = 500): Promise<NewsPost[]> {
    const db = await getDb()
    if (!db) return []
    try {
        const res = await db
            .prepare(
                `SELECT * FROM news_posts WHERE ${PUBLIC_WHERE}
                 ORDER BY published_at DESC, id DESC LIMIT ?`
            )
            .bind(DEFAULT_STORE_ID, limit)
            .all<NewsRow>()
        return (res.results ?? []).map(mapNewsRow)
    } catch (e) {
        if (!isMissingTable(e)) console.warn('getAllPublishedNews', e)
        return []
    }
}

export async function getAdminNewsList(db: unknown, storeId: number): Promise<NewsPost[]> {
    const res = await (db as Db)
        .prepare(`SELECT * FROM news_posts WHERE store_id = ? ORDER BY COALESCE(published_at, created_at) DESC, id DESC`)
        .bind(storeId)
        .all<NewsRow>()
    return (res.results ?? []).map(mapNewsRow)
}

export async function getAdminNewsById(db: unknown, storeId: number, id: number): Promise<NewsPost | null> {
    const row = await (db as Db)
        .prepare(`SELECT * FROM news_posts WHERE store_id = ? AND id = ?`)
        .bind(storeId, id)
        .first<NewsRow>()
    return row ? mapNewsRow(row) : null
}
