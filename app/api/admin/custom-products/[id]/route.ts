import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'
import {
    isValidCta,
    isValidMethod,
    parseJsonArray,
    type CustomProductOption,
} from '@/lib/custom-products'
import { getAdminCustomProductById } from '@/lib/custom-products-public'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Ctx) {
    try {
        const { id: idRaw } = await params
        const id = Number(idRaw)
        if (!Number.isInteger(id) || id < 1) {
            return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })
        }

        const { env } = getCloudflareContext()
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 })

        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin

        const item = await getAdminCustomProductById(env.DB, admin.storeId, id)
        if (!item) return NextResponse.json({ error: '상품을 찾을 수 없습니다' }, { status: 404 })
        return NextResponse.json({ success: true, data: item })
    } catch (e) {
        console.error('GET admin custom-products/[id]', e)
        return NextResponse.json({ error: '조회 실패' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
    try {
        const { id: idRaw } = await params
        const id = Number(idRaw)
        if (!Number.isInteger(id) || id < 1) {
            return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })
        }

        const { env } = getCloudflareContext()
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 })

        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin

        const existing = await env.DB.prepare(
            `SELECT id FROM custom_products WHERE store_id = ? AND id = ?`
        )
            .bind(admin.storeId, id)
            .first<{ id: number }>()
        if (!existing) return NextResponse.json({ error: '상품을 찾을 수 없습니다' }, { status: 404 })

        const body = await request.json()
        const title = String(body.title || '').trim()
        if (!title) return NextResponse.json({ error: '상품명은 필수입니다' }, { status: 400 })

        let slug = String(body.slug || '').trim().toLowerCase()
        slug = slug.replace(/[^a-z0-9-가-힣]/gi, '-').replace(/^-+|-+$/g, '')
        if (!slug) return NextResponse.json({ error: '슬러그가 올바르지 않습니다' }, { status: 400 })

        const method = isValidMethod(body.method) ? body.method : 'fdm'
        const primaryCta = isValidCta(body.primaryCta) ? body.primaryCta : 'quote'
        const secondaryCta =
            body.secondaryCta == null || body.secondaryCta === ''
                ? null
                : isValidCta(body.secondaryCta)
                  ? body.secondaryCta
                  : null

        const options = Array.isArray(body.options)
            ? (body.options as CustomProductOption[])
            : parseJsonArray<CustomProductOption>(body.options_json, [])
        const highlights = Array.isArray(body.highlights)
            ? body.highlights.map(String)
            : parseJsonArray<string>(body.highlights_json, [])

        const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0
        const isActive = body.isActive === false || body.isActive === 0 ? 0 : 1

        try {
            await env.DB.prepare(
                `UPDATE custom_products SET
                    slug = ?, title = ?, summary = ?, description = ?, detail_body = ?, price_note = ?,
                    method = ?, primary_cta = ?, secondary_cta = ?, options_json = ?, highlights_json = ?,
                    sort_order = ?, is_active = ?, updated_at = datetime('now')
                 WHERE store_id = ? AND id = ?`
            )
                .bind(
                    slug,
                    title,
                    String(body.summary || '').trim() || null,
                    String(body.description || '').trim() || null,
                    String(body.detailBody || '').trim() || null,
                    String(body.priceNote || '').trim() || null,
                    method,
                    primaryCta,
                    secondaryCta,
                    JSON.stringify(options),
                    JSON.stringify(highlights),
                    sortOrder,
                    isActive,
                    admin.storeId,
                    id
                )
                .run()
        } catch (e) {
            const msg = e instanceof Error ? e.message : ''
            if (/UNIQUE/i.test(msg)) {
                return NextResponse.json({ error: '이미 사용 중인 슬러그입니다' }, { status: 409 })
            }
            throw e
        }

        const item = await getAdminCustomProductById(env.DB, admin.storeId, id)
        return NextResponse.json({ success: true, data: item })
    } catch (e) {
        console.error('PUT admin custom-products/[id]', e)
        return NextResponse.json({ error: '수정 실패' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
    try {
        const { id: idRaw } = await params
        const id = Number(idRaw)
        if (!Number.isInteger(id) || id < 1) {
            return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })
        }

        const { env } = getCloudflareContext()
        if (!env?.DB || !env.BUCKET) {
            return NextResponse.json({ error: '스토리지 없음' }, { status: 503 })
        }

        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin

        const existing = await env.DB.prepare(
            `SELECT id FROM custom_products WHERE store_id = ? AND id = ?`
        )
            .bind(admin.storeId, id)
            .first<{ id: number }>()
        if (!existing) return NextResponse.json({ error: '상품을 찾을 수 없습니다' }, { status: 404 })

        const images = await env.DB.prepare(
            `SELECT r2_key FROM custom_product_images WHERE product_id = ?`
        )
            .bind(id)
            .all<{ r2_key: string }>()

        for (const img of images.results || []) {
            try {
                await env.BUCKET.delete(img.r2_key)
            } catch {
                /* ignore */
            }
        }

        await env.DB.prepare(`DELETE FROM custom_product_images WHERE product_id = ?`).bind(id).run()
        await env.DB.prepare(`DELETE FROM custom_products WHERE store_id = ? AND id = ?`)
            .bind(admin.storeId, id)
            .run()

        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('DELETE admin custom-products/[id]', e)
        return NextResponse.json({ error: '삭제 실패' }, { status: 500 })
    }
}
