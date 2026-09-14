import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'
import {
    isValidCta,
    isValidMethod,
    parseJsonArray,
    slugifyTitle,
    type CustomProductOption,
} from '@/lib/custom-products'
import { getAdminCustomProductList } from '@/lib/custom-products-public'

export async function GET(request: NextRequest) {
    try {
        const { env } = getCloudflareContext()
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 })

        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin

        const items = await getAdminCustomProductList(env.DB, admin.storeId)
        return NextResponse.json({ success: true, data: { items } })
    } catch (e) {
        const msg = e instanceof Error ? e.message : ''
        if (/no such table/i.test(msg)) {
            return NextResponse.json(
                {
                    error:
                        'custom_products 테이블이 없습니다. migrations/schema_custom_products.sql 을 실행하세요.',
                    code: 'TABLE_MISSING',
                },
                { status: 503 }
            )
        }
        console.error('GET admin custom-products', e)
        return NextResponse.json({ error: '목록 조회 실패' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { env } = getCloudflareContext()
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 })

        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin

        const body = await request.json()
        const title = String(body.title || '').trim()
        if (!title) return NextResponse.json({ error: '상품명은 필수입니다' }, { status: 400 })

        let slug = String(body.slug || '').trim().toLowerCase()
        if (!slug) slug = slugifyTitle(title)
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
            const inserted = await env.DB.prepare(
                `INSERT INTO custom_products (
                    store_id, slug, title, summary, description, detail_body, price_note,
                    method, primary_cta, secondary_cta, options_json, highlights_json,
                    sort_order, is_active, updated_at
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
            )
                .bind(
                    admin.storeId,
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
                    isActive
                )
                .run()

            const id = Number((inserted.meta as { last_row_id?: number })?.last_row_id || 0)
            return NextResponse.json({ success: true, data: { id, slug } })
        } catch (e) {
            const msg = e instanceof Error ? e.message : ''
            if (/UNIQUE/i.test(msg)) {
                return NextResponse.json({ error: '이미 사용 중인 슬러그입니다' }, { status: 409 })
            }
            throw e
        }
    } catch (e) {
        const msg = e instanceof Error ? e.message : ''
        if (/no such table/i.test(msg)) {
            return NextResponse.json(
                {
                    error:
                        'custom_products 테이블이 없습니다. migrations/schema_custom_products.sql 을 실행하세요.',
                },
                { status: 503 }
            )
        }
        console.error('POST admin custom-products', e)
        return NextResponse.json({ error: '상품 등록 실패' }, { status: 500 })
    }
}
