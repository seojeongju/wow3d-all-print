import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'
import { getCollectPreset, parsePresetBody } from '@/lib/news-collect-presets'

type Ctx = { params: Promise<{ id: string }> }

/**
 * PUT /api/admin/news/presets/[id]
 * - { autoCollect } 만 보내면 자동 수집 켜기/끄기
 * - { name, config, autoCollect } 를 보내면 조건 전체 수정
 */
export async function PUT(request: NextRequest, { params }: Ctx) {
    try {
        const { env } = getCloudflareContext()
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 })
        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin

        const id = Number((await params).id)
        const preset = await getCollectPreset(env.DB, admin.storeId, id)
        if (!preset) return NextResponse.json({ error: '수집 조건을 찾을 수 없습니다' }, { status: 404 })

        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
        if (body.config === undefined && body.name === undefined) {
            await env.DB.prepare(
                `UPDATE news_collect_presets SET auto_collect = ?, updated_at = datetime('now') WHERE id = ?`
            )
                .bind(body.autoCollect ? 1 : 0, id)
                .run()
            return NextResponse.json({ success: true })
        }

        const parsed = parsePresetBody(body)
        if (typeof parsed === 'string') return NextResponse.json({ error: parsed }, { status: 400 })
        await env.DB.prepare(
            `UPDATE news_collect_presets
             SET name = ?, config_json = ?, auto_collect = ?, updated_at = datetime('now') WHERE id = ?`
        )
            .bind(parsed.name, JSON.stringify(parsed.config), parsed.autoCollect ? 1 : 0, id)
            .run()
        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('PUT admin news preset', e)
        return NextResponse.json({ error: '수집 조건 수정 실패' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
    try {
        const { env } = getCloudflareContext()
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 })
        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin

        const id = Number((await params).id)
        await env.DB.prepare(`DELETE FROM news_collect_presets WHERE store_id = ? AND id = ?`).bind(admin.storeId, id).run()
        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('DELETE admin news preset', e)
        return NextResponse.json({ error: '수집 조건 삭제 실패' }, { status: 500 })
    }
}
