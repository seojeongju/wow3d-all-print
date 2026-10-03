import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'

type Ctx = { params: Promise<{ id: string }> }

/** 후보 숨기기·복원 */
export async function PATCH(request: NextRequest, { params }: Ctx) {
    try {
        const { env } = getCloudflareContext()
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 })
        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin

        const id = Number((await params).id)
        if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })
        const body = (await request.json().catch(() => ({}))) as { status?: string }
        const status = body.status === 'hidden' ? 'hidden' : 'new'

        await env.DB.prepare(`UPDATE news_candidates SET status = ? WHERE store_id = ? AND id = ? AND status != 'drafted'`)
            .bind(status, admin.storeId, id)
            .run()
        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('PATCH admin news candidate', e)
        return NextResponse.json({ error: '변경 실패' }, { status: 500 })
    }
}
