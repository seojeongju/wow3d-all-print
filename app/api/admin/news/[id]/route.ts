import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'
import { getAdminNewsById } from '@/lib/news-public'
import { newsTableMissingResponseBody, parseNewsWriteBody } from '@/lib/news-admin'

type Ctx = { params: Promise<{ id: string }> }

function isMissingTable(e: unknown) {
    return /no such table/i.test(e instanceof Error ? e.message : '')
}

async function parseId(params: Ctx['params']): Promise<number | null> {
    const { id } = await params
    const n = Number(id)
    return Number.isInteger(n) && n > 0 ? n : null
}

export async function GET(request: NextRequest, { params }: Ctx) {
    try {
        const id = await parseId(params)
        if (!id) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })
        const { env } = getCloudflareContext()
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 })
        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin

        const post = await getAdminNewsById(env.DB, admin.storeId, id)
        if (!post) return NextResponse.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 })
        return NextResponse.json({ success: true, data: post })
    } catch (e) {
        if (isMissingTable(e)) return NextResponse.json(newsTableMissingResponseBody(), { status: 503 })
        console.error('GET admin news/[id]', e)
        return NextResponse.json({ error: '조회 실패' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
    try {
        const id = await parseId(params)
        if (!id) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })
        const { env } = getCloudflareContext()
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 })
        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin

        const existing = await env.DB.prepare(
            `SELECT published_at, cover_r2_key FROM news_posts WHERE store_id = ? AND id = ?`
        )
            .bind(admin.storeId, id)
            .first<{ published_at: string | null; cover_r2_key: string | null }>()
        if (!existing) return NextResponse.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 })

        const body = (await request.json()) as Record<string, unknown>
        const input = parseNewsWriteBody(body)
        if ('error' in input) return NextResponse.json({ error: input.error }, { status: 400 })

        // 재발행 시 최초 발행일 유지 — 명시 입력이 있을 때만 변경
        const publishedAt =
            input.publishedAt ??
            existing.published_at ??
            (input.status === 'published' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null)

        let coverKey = existing.cover_r2_key
        if (body.removeCover === true && coverKey) {
            if (env.BUCKET) {
                try {
                    await env.BUCKET.delete(coverKey)
                } catch {
                    /* 무시 */
                }
            }
            coverKey = null
        }

        try {
            await env.DB.prepare(
                `UPDATE news_posts SET
                    slug = ?, title = ?, category = ?, summary = ?, body_html = ?, insight = ?,
                    meta_description = ?, source_name = ?, source_url = ?, source_published_at = ?,
                    cover_alt = ?, cover_r2_key = ?, tags_json = ?, faq_json = ?, related_links_json = ?,
                    status = ?, published_at = ?, updated_at = datetime('now')
                 WHERE store_id = ? AND id = ?`
            )
                .bind(
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
                    coverKey,
                    input.tagsJson,
                    input.faqJson,
                    input.relatedLinksJson,
                    input.status,
                    publishedAt,
                    admin.storeId,
                    id
                )
                .run()
        } catch (e) {
            if (/UNIQUE/i.test(e instanceof Error ? e.message : '')) {
                return NextResponse.json({ error: '이미 사용 중인 주소(슬러그)입니다' }, { status: 409 })
            }
            throw e
        }

        return NextResponse.json({ success: true, data: { id, slug: input.slug } })
    } catch (e) {
        if (isMissingTable(e)) return NextResponse.json(newsTableMissingResponseBody(), { status: 503 })
        console.error('PUT admin news/[id]', e)
        return NextResponse.json({ error: '저장 실패' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
    try {
        const id = await parseId(params)
        if (!id) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })
        const { env } = getCloudflareContext()
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 })
        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin

        const res = await env.DB.prepare(`DELETE FROM news_posts WHERE store_id = ? AND id = ?`)
            .bind(admin.storeId, id)
            .run()
        if (!res.meta?.changes) return NextResponse.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 })

        if (env.BUCKET) {
            try {
                const listed = await env.BUCKET.list({ prefix: `news/${admin.storeId}/${id}/` })
                const keys = listed.objects.map((o: { key: string }) => o.key)
                if (keys.length) await env.BUCKET.delete(keys)
            } catch (e) {
                console.warn('news 이미지 정리 실패', e)
            }
        }
        return NextResponse.json({ success: true })
    } catch (e) {
        if (isMissingTable(e)) return NextResponse.json(newsTableMissingResponseBody(), { status: 503 })
        console.error('DELETE admin news/[id]', e)
        return NextResponse.json({ error: '삭제 실패' }, { status: 500 })
    }
}
