import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'
import { listCollectPresets, MAX_PRESETS, parsePresetBody } from '@/lib/news-collect-presets'

const TABLE_MISSING = {
    error: 'news_collect_presets 테이블이 없습니다. migrations/schema_news_collect_presets.sql 을 실행하세요.',
    code: 'TABLE_MISSING',
}

const isMissingTable = (e: unknown) => /no such table/i.test(e instanceof Error ? e.message : '')

/** GET /api/admin/news/presets — 저장된 수집 조건 목록 */
export async function GET(request: NextRequest) {
    try {
        const { env } = getCloudflareContext()
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 })
        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin
        return NextResponse.json({ success: true, data: await listCollectPresets(env.DB, admin.storeId) })
    } catch (e) {
        if (isMissingTable(e)) return NextResponse.json(TABLE_MISSING, { status: 503 })
        console.error('GET admin news presets', e)
        return NextResponse.json({ error: '수집 조건 조회 실패' }, { status: 500 })
    }
}

/** POST /api/admin/news/presets — 수집 조건 저장 */
export async function POST(request: NextRequest) {
    try {
        const { env } = getCloudflareContext()
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 })
        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin

        const parsed = parsePresetBody(await request.json().catch(() => ({})))
        if (typeof parsed === 'string') return NextResponse.json({ error: parsed }, { status: 400 })

        const count = await env.DB.prepare(`SELECT COUNT(*) AS n FROM news_collect_presets WHERE store_id = ?`)
            .bind(admin.storeId)
            .first<{ n: number }>()
        if (Number(count?.n ?? 0) >= MAX_PRESETS) {
            return NextResponse.json({ error: `수집 조건은 최대 ${MAX_PRESETS}개까지 저장할 수 있습니다` }, { status: 400 })
        }

        const res = await env.DB.prepare(
            `INSERT INTO news_collect_presets (store_id, name, config_json, auto_collect) VALUES (?, ?, ?, ?)`
        )
            .bind(admin.storeId, parsed.name, JSON.stringify(parsed.config), parsed.autoCollect ? 1 : 0)
            .run()
        const id = Number((res.meta as { last_row_id?: number })?.last_row_id || 0)
        return NextResponse.json({ success: true, data: { id } })
    } catch (e) {
        if (isMissingTable(e)) return NextResponse.json(TABLE_MISSING, { status: 503 })
        console.error('POST admin news presets', e)
        return NextResponse.json({ error: '수집 조건 저장 실패' }, { status: 500 })
    }
}
