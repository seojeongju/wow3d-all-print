import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'
import { getAdminNewsList } from '@/lib/news-public'
import { newsTableMissingResponseBody, parseNewsWriteBody } from '@/lib/news-admin'
import { isPublishedNow, newsIndexNowUrls, queueIndexNow } from '@/lib/indexnow'

function isMissingTable(e: unknown) {
    return /no such table/i.test(e instanceof Error ? e.message : '')
}

export async function GET(request: NextRequest) {
    try {
        const { env } = getCloudflareContext()
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 })
        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin

        const items = await getAdminNewsList(env.DB, admin.storeId)
        return NextResponse.json({ success: true, data: { items } })
    } catch (e) {
        if (isMissingTable(e)) return NextResponse.json(newsTableMissingResponseBody(), { status: 503 })
        console.error('GET admin news', e)
        return NextResponse.json({ error: '목록 조회 실패' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { env } = getCloudflareContext()
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 })
        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin

        const input = parseNewsWriteBody(await request.json())
        if ('error' in input) return NextResponse.json({ error: input.error }, { status: 400 })

        const publishedAt =
            input.status === 'published'
                ? input.publishedAt ?? new Date().toISOString().slice(0, 19).replace('T', ' ')
                : input.publishedAt

        try {
            const inserted = await env.DB.prepare(
                `INSERT INTO news_posts (
                    store_id, slug, title, category, summary, body_html, insight, meta_description,
                    source_name, source_url, source_published_at, cover_alt,
                    tags_json, faq_json, related_links_json, status, published_at, updated_at
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
            )
                .bind(
                    admin.storeId,
                    input.slug,
                    input.title,
                    input.category,
                    input.summary,
                    input.bodyHtml,
                    input.insight,
                    input.metaDescription,
                    input.sourceName,
                    input.sourceUrl,
                    input.sourcePublishedAt,
                    input.coverAlt,
                    input.tagsJson,
                    input.faqJson,
                    input.relatedLinksJson,
                    input.status,
                    publishedAt
                )
                .run()
            const id = Number((inserted.meta as { last_row_id?: number })?.last_row_id || 0)
            const indexNow = isPublishedNow(input.status, publishedAt) && queueIndexNow(newsIndexNowUrls(input.slug))
            return NextResponse.json({ success: true, data: { id, slug: input.slug, indexNow } })
        } catch (e) {
            if (/UNIQUE/i.test(e instanceof Error ? e.message : '')) {
                return NextResponse.json({ error: '이미 사용 중인 주소(슬러그)입니다' }, { status: 409 })
            }
            throw e
        }
    } catch (e) {
        if (isMissingTable(e)) return NextResponse.json(newsTableMissingResponseBody(), { status: 503 })
        console.error('POST admin news', e)
        return NextResponse.json({ error: '등록 실패' }, { status: 500 })
    }
}
