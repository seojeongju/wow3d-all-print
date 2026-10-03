import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'
import { collectNewsCandidates, resolveNaverKeys } from '@/lib/news-sources'
import { normalizeCollectConfig } from '@/lib/news-collect-config'
import { getCollectPreset, markPresetRun } from '@/lib/news-collect-presets'

function isMissingTable(e: unknown) {
    return /no such table/i.test(e instanceof Error ? e.message : '')
}

function isMissingColumn(e: unknown) {
    return /no such column: keyword|has no column named keyword/i.test(e instanceof Error ? e.message : '')
}

const TABLE_MISSING = {
    error: 'news_candidates 테이블이 없습니다. migrations/schema_news_candidates.sql 을 실행하세요.',
    code: 'TABLE_MISSING',
}

const COLUMN_MISSING = {
    error: '수집 조건 기능용 DB 변경이 적용되지 않았습니다. migrations/schema_news_collect_presets.sql 을 실행하세요.',
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
    keyword: string | null
    created_at: string
}

/**
 * GET /api/admin/news/candidates?status=&keyword=&source=&language=&q=
 * 후보 목록 + 상태별 건수 + 키워드 목록(필터용)
 */
export async function GET(request: NextRequest) {
    try {
        const { env } = getCloudflareContext()
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 })
        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin

        const sp = request.nextUrl.searchParams
        const status = sp.get('status')
        const st = status === 'hidden' || status === 'drafted' ? status : 'new'
        const where = ['store_id = ?', 'status = ?']
        const binds: unknown[] = [admin.storeId, st]

        const keyword = sp.get('keyword')?.trim()
        if (keyword) {
            where.push('keyword = ?')
            binds.push(keyword)
        }
        const source = sp.get('source')
        if (source && ['naver', 'bing', 'rss', 'manual'].includes(source)) {
            where.push('source_type = ?')
            binds.push(source)
        }
        const language = sp.get('language')
        if (language === 'ko' || language === 'en') {
            where.push('language = ?')
            binds.push(language)
        }
        const q = sp.get('q')?.trim().slice(0, 50)
        if (q) {
            where.push('(title LIKE ? OR summary LIKE ?)')
            binds.push(`%${q}%`, `%${q}%`)
        }

        const { results } = await env.DB.prepare(
            `SELECT id, source_type, source_name, title, url, summary, language, published_at,
                    relevance, status, draft_post_id, keyword, created_at
             FROM news_candidates WHERE ${where.join(' AND ')}
             ORDER BY COALESCE(published_at, created_at) DESC, relevance DESC LIMIT 200`
        )
            .bind(...binds)
            .all<NewsCandidateRow>()
        const counts = await env.DB.prepare(
            `SELECT status, COUNT(*) AS n FROM news_candidates WHERE store_id = ? GROUP BY status`
        )
            .bind(admin.storeId)
            .all<{ status: string; n: number }>()
        const keywords = await env.DB.prepare(
            `SELECT keyword, COUNT(*) AS n FROM news_candidates
             WHERE store_id = ? AND status = ? AND keyword IS NOT NULL AND keyword != ''
             GROUP BY keyword ORDER BY n DESC LIMIT 50`
        )
            .bind(admin.storeId, st)
            .all<{ keyword: string; n: number }>()

        return NextResponse.json({
            success: true,
            data: {
                items: results ?? [],
                counts: Object.fromEntries((counts.results ?? []).map((r: { status: string; n: number }) => [r.status, Number(r.n)])),
                keywords: (keywords.results ?? []).map((r: { keyword: string; n: number }) => ({ keyword: r.keyword, count: Number(r.n) })),
                naverConfigured: Boolean(resolveNaverKeys(env as unknown as Record<string, unknown>)),
            },
        })
    } catch (e) {
        if (isMissingTable(e)) return NextResponse.json(TABLE_MISSING, { status: 503 })
        if (isMissingColumn(e)) return NextResponse.json(COLUMN_MISSING, { status: 503 })
        console.error('GET admin news candidates', e)
        return NextResponse.json({ error: '후보 조회 실패' }, { status: 500 })
    }
}

/**
 * POST /api/admin/news/candidates — 지금 수집
 * body: { config?: CollectConfig } 또는 { presetId } (없으면 기본 3D프린팅 수집)
 */
export async function POST(request: NextRequest) {
    try {
        const { env } = getCloudflareContext()
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 })
        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin

        const body = (await request.json().catch(() => ({}))) as { config?: unknown; presetId?: number }
        let presetId: number | null = null
        let config = body.config ? normalizeCollectConfig(body.config) : undefined
        if (body.presetId) {
            const preset = await getCollectPreset(env.DB, admin.storeId, Number(body.presetId))
            if (!preset) return NextResponse.json({ error: '수집 조건을 찾을 수 없습니다' }, { status: 404 })
            presetId = preset.id
            config = preset.config
        }

        const result = await collectNewsCandidates(
            env.DB,
            admin.storeId,
            resolveNaverKeys(env as unknown as Record<string, unknown>),
            config
        )
        if (presetId) await markPresetRun(env.DB, presetId, result.added)
        return NextResponse.json({ success: true, data: result })
    } catch (e) {
        if (isMissingTable(e)) return NextResponse.json(TABLE_MISSING, { status: 503 })
        if (isMissingColumn(e)) return NextResponse.json(COLUMN_MISSING, { status: 503 })
        console.error('POST admin news candidates collect', e)
        return NextResponse.json({ error: '수집 실패' }, { status: 500 })
    }
}
