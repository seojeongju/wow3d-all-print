import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'

type Ctx = { params: Promise<{ imageId: string }> }

export async function DELETE(request: NextRequest, { params }: Ctx) {
    try {
        const { imageId: idRaw } = await params
        const imageId = Number(idRaw)
        if (!Number.isInteger(imageId) || imageId < 1) {
            return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })
        }

        const { env } = getCloudflareContext()
        if (!env?.DB || !env.BUCKET) {
            return NextResponse.json({ error: '스토리지 없음' }, { status: 503 })
        }

        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin

        const row = await env.DB.prepare(
            `SELECT i.id, i.r2_key, i.product_id
             FROM custom_product_images i
             JOIN custom_products p ON p.id = i.product_id
             WHERE i.id = ? AND p.store_id = ?`
        )
            .bind(imageId, admin.storeId)
            .first<{ id: number; r2_key: string; product_id: number }>()

        if (!row) return NextResponse.json({ error: '이미지를 찾을 수 없습니다' }, { status: 404 })

        try {
            await env.BUCKET.delete(row.r2_key)
        } catch {
            /* ignore */
        }

        await env.DB.prepare(`DELETE FROM custom_product_images WHERE id = ?`).bind(imageId).run()
        await env.DB.prepare(
            `UPDATE custom_products SET updated_at = datetime('now') WHERE id = ?`
        )
            .bind(row.product_id)
            .run()

        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('DELETE custom-product image', e)
        return NextResponse.json({ error: '이미지 삭제 실패' }, { status: 500 })
    }
}
