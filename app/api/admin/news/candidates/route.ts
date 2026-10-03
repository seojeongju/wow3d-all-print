import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'
import { collectNewsCandidates, resolveNaverKeys } from '@/lib/news-sources'

function isMissingTable(e: unknown) {
    return /no such table/i.test(e instanceof Error ? e.message : '')
}

const TABLE_MISSING = {
    error: 'news_candidates 테이블이 없습니다. migrations/schema_news_candidates.sql 을 실행하세요.',
    code: 'TABLE_MISSING',
}

type NewsCandidateRow = {
    id: number
    source_type: string
    source_name: string | null
    title: string
    url: string
    summary: string | null
    language: string
    published_at: string | null
    relevance: number
    status: string
    draft_post_id: number | null
    created_at: string
}

export async function GET(request: NextRequest) {
    try {
        const { env } = getCloudflareContext()
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 })
        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin

        const status = request.nextUrl.searchParams.get('status')
        const st = status === 'hidden' || status === 'drafted' ? status : 'new'
        const { results } = await env.DB.prepare(
            `SELECT id, source_type, source_name, title, url, summary, language, published_at,
                    relevance, status, draft_post_id, created_at
             FROM news_candidates WHERE store_id = ? AND status = ?
             ORDER BY COALESCE(published_at, created_at) DESC, relevance DESC LIMIT 150`
        )
            .bind(admin.storeId, st)
            .all<NewsCandidateRow>()
        const counts = await env.DB.prepare(
            `SELECT status, COUNT(*) AS n FROM news_candidates WHERE store_id = ? GROUP BY status`
        )
            .bind(admin.storeId)
            .all<{ status: string; n: number }>()
        return NextResponse.json({
            success: true,
            data: {
                items: results ?? [],
                counts: Object.fromEntries((counts.results ?? []).map((r: { status: string; n: number }) => [r.status, Number(r.n)])),
                naverConfigured: Boolean(resolveNaverKeys(env as unknown as Record<string, unknown>)),
            },
        })
    } catch (e) {
        if (isMissingTable(e)) return NextResponse.json(TABLE_MISSING, { status: 503 })
        console.error('GET admin news candidates', e)
        return NextResponse.json({ error: '후보 조회 실패' }, { status: 500 })
    }
}

/** 지금 수집 — 크론을 기다리지 않고 관리자가 직접 실행 */
export async function POST(request: NextRequest) {
    try {
        const { env } = getCloudflareContext()
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 })
        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin

        const result = await collectNewsCandidates(
            env.DB,
            admin.storeId,
            resolveNaverKeys(env as unknown as Record<string, unknown>)
        )
        return NextResponse.json({ success: true, data: result })
    } catch (e) {
        if (isMissingTable(e)) return NextResponse.json(TABLE_MISSING, { status: 503 })
        console.error('POST admin news candidates collect', e)
        return NextResponse.json({ error: '수집 실패' }, { status: 500 })
    }
}
