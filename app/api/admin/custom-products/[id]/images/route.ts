import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'
import {
    customProductMediaUrlFromKey,
    extFromImageFile,
    isValidImageRole,
    validateCustomProductImage,
} from '@/lib/custom-products'

type Ctx = { params: Promise<{ id: string }> }

/** 관리자: 상품 이미지 업로드 (role=main|sub|detail) */
export async function POST(request: NextRequest, { params }: Ctx) {
    try {
        const { id: idRaw } = await params
        const productId = Number(idRaw)
        if (!Number.isInteger(productId) || productId < 1) {
            return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })
        }

        const { env } = getCloudflareContext()
        if (!env?.DB || !env.BUCKET) {
            return NextResponse.json({ error: '스토리지 없음' }, { status: 503 })
        }

        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin

        const product = await env.DB.prepare(
            `SELECT id FROM custom_products WHERE store_id = ? AND id = ?`
        )
            .bind(admin.storeId, productId)
            .first<{ id: number }>()
        if (!product) return NextResponse.json({ error: '상품을 찾을 수 없습니다' }, { status: 404 })

        const formData = await request.formData()
        const file = formData.get('image') as File | null
        const roleRaw = String(formData.get('role') || 'sub')
        if (!file) return NextResponse.json({ error: '이미지 파일이 필요합니다' }, { status: 400 })
        if (!isValidImageRole(roleRaw)) {
            return NextResponse.json(
                { error: 'role은 main|sub|detail|content 이어야 합니다' },
                { status: 400 }
            )
        }

        const err = validateCustomProductImage(file)
        if (err) return NextResponse.json({ error: err }, { status: 400 })

        const ext = extFromImageFile(file)
        const r2Key = `custom-products/${admin.storeId}/${productId}/${roleRaw}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const buf = await file.arrayBuffer()
        await env.BUCKET.put(r2Key, buf, {
            httpMetadata: { contentType: file.type || 'image/jpeg' },
        })

        // 에디터 본문용(content): 갤러리(main/sub/detail) UI에는 안 보이지만 R2·DB에 남겨 유실 방지
        if (roleRaw === 'content') {
            const maxSort = await env.DB.prepare(
                `SELECT COALESCE(MAX(sort_order), -1) AS m FROM custom_product_images WHERE product_id = ? AND role = ?`
            )
                .bind(productId, roleRaw)
                .first<{ m: number }>()
            const sortOrder = Number(maxSort?.m ?? -1) + 1
            const inserted = await env.DB.prepare(
                `INSERT INTO custom_product_images (product_id, role, r2_key, mime_type, sort_order)
                 VALUES (?, ?, ?, ?, ?)`
            )
                .bind(productId, roleRaw, r2Key, file.type || 'image/jpeg', sortOrder)
                .run()
            const imageId = Number((inserted.meta as { last_row_id?: number })?.last_row_id || 0)

            await env.DB.prepare(
                `UPDATE custom_products SET updated_at = datetime('now') WHERE id = ?`
            )
                .bind(productId)
                .run()

            return NextResponse.json({
                success: true,
                data: {
                    id: imageId,
                    role: roleRaw,
                    r2Key,
                    url: customProductMediaUrlFromKey(r2Key),
                    sortOrder,
                },
            })
        }

        // main은 1장만 — 기존 main 교체
        if (roleRaw === 'main') {
            const prev = await env.DB.prepare(
                `SELECT id, r2_key FROM custom_product_images WHERE product_id = ? AND role = 'main'`
            )
                .bind(productId)
                .all<{ id: number; r2_key: string }>()
            for (const row of prev.results || []) {
                try {
                    await env.BUCKET.delete(row.r2_key)
                } catch {
                    /* ignore */
                }
                await env.DB.prepare(`DELETE FROM custom_product_images WHERE id = ?`)
                    .bind(row.id)
                    .run()
            }
        }

        const maxSort = await env.DB.prepare(
            `SELECT COALESCE(MAX(sort_order), -1) AS m FROM custom_product_images WHERE product_id = ? AND role = ?`
        )
            .bind(productId, roleRaw)
            .first<{ m: number }>()

        const sortOrder = Number(maxSort?.m ?? -1) + 1

        const inserted = await env.DB.prepare(
            `INSERT INTO custom_product_images (product_id, role, r2_key, mime_type, sort_order)
             VALUES (?, ?, ?, ?, ?)`
        )
            .bind(productId, roleRaw, r2Key, file.type || 'image/jpeg', sortOrder)
            .run()

        const imageId = Number((inserted.meta as { last_row_id?: number })?.last_row_id || 0)

        await env.DB.prepare(
            `UPDATE custom_products SET updated_at = datetime('now') WHERE id = ?`
        )
            .bind(productId)
            .run()

        return NextResponse.json({
            success: true,
            data: {
                id: imageId,
                role: roleRaw,
                r2Key,
                url: customProductMediaUrlFromKey(r2Key),
                sortOrder,
            },
        })
    } catch (e) {
        console.error('POST custom-products images', e)
        return NextResponse.json({ error: '이미지 업로드 실패' }, { status: 500 })
    }
}
