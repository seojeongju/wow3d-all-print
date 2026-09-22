import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'
import { formatQuotePrintSettings } from '@/lib/quote-print-settings'

/**
 * GET /api/admin/quotes/[id]
 * 견적(quotes) 단건 조회 — 주문 연결·장바구니 여부 포함
 */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params
    const { env } = getCloudflareContext()
    if (!env?.DB) return NextResponse.json({ error: 'DB를 사용할 수 없습니다' }, { status: 503 })

    const quoteId = parseInt(id, 10)
    if (!Number.isInteger(quoteId) || quoteId <= 0) {
        return NextResponse.json({ error: '잘못된 견적 ID' }, { status: 400 })
    }

    const auth = await requireAdminAuth(req, env.DB)
    if (auth instanceof Response) return auth

    try {
        let row: Record<string, unknown> | null = null
        try {
            row = await env.DB.prepare(
                `SELECT
                    q.id,
                    q.user_id,
                    q.session_id,
                    q.file_name,
                    q.file_size,
                    q.file_url,
                    q.volume_cm3,
                    q.surface_area_cm2,
                    q.dimensions_x,
                    q.dimensions_y,
                    q.dimensions_z,
                    q.model_transform,
                    q.print_method,
                    COALESCE(q.fdm_material_name, q.fdm_material) AS fdm_material,
                    q.fdm_infill,
                    q.fdm_layer_height,
                    q.fdm_support,
                    COALESCE(q.resin_type_name, q.resin_type) AS resin_type,
                    q.layer_thickness,
                    q.post_processing,
                    q.total_price,
                    q.estimated_time_hours,
                    q.created_at,
                    q.updated_at,
                    u.name AS user_name,
                    u.email AS user_email,
                    (SELECT oi.order_id FROM order_items oi WHERE oi.quote_id = q.id LIMIT 1) AS order_id,
                    (SELECT o.order_number FROM order_items oi
                        JOIN orders o ON o.id = oi.order_id
                        WHERE oi.quote_id = q.id LIMIT 1) AS order_number,
                    (SELECT COUNT(*) FROM cart c WHERE c.quote_id = q.id) AS cart_count
                 FROM quotes q
                 LEFT JOIN users u ON u.id = q.user_id
                 WHERE q.id = ?`
            )
                .bind(quoteId)
                .first<Record<string, unknown>>()
        } catch {
            row = await env.DB.prepare(
                `SELECT
                    q.id,
                    q.user_id,
                    q.session_id,
                    q.file_name,
                    q.file_size,
                    q.file_url,
                    q.volume_cm3,
                    q.surface_area_cm2,
                    q.dimensions_x,
                    q.dimensions_y,
                    q.dimensions_z,
                    q.model_transform,
                    q.print_method,
                    q.fdm_material,
                    q.fdm_infill,
                    q.fdm_layer_height,
                    q.fdm_support,
                    q.resin_type,
                    q.layer_thickness,
                    q.post_processing,
                    q.total_price,
                    q.estimated_time_hours,
                    q.created_at,
                    q.updated_at,
                    u.name AS user_name,
                    u.email AS user_email,
                    (SELECT oi.order_id FROM order_items oi WHERE oi.quote_id = q.id LIMIT 1) AS order_id,
                    (SELECT o.order_number FROM order_items oi
                        JOIN orders o ON o.id = oi.order_id
                        WHERE oi.quote_id = q.id LIMIT 1) AS order_number,
                    (SELECT COUNT(*) FROM cart c WHERE c.quote_id = q.id) AS cart_count
                 FROM quotes q
                 LEFT JOIN users u ON u.id = q.user_id
                 WHERE q.id = ?`
            )
                .bind(quoteId)
                .first<Record<string, unknown>>()
        }

        if (!row) {
            return NextResponse.json({ error: '견적을 찾을 수 없습니다' }, { status: 404 })
        }

        let scalePercent: number | null = null
        try {
            const raw = row.model_transform
            if (typeof raw === 'string' && raw) {
                const parsed = JSON.parse(raw) as { scalePercent?: unknown }
                const n = Number(parsed.scalePercent)
                if (Number.isFinite(n) && n > 0) scalePercent = n
            }
        } catch {
            /* ignore */
        }

        const printMethod = (row.print_method as string) || null
        const printSettings =
            formatQuotePrintSettings({
                print_method: printMethod,
                fdm_material: row.fdm_material as string | null,
                fdm_infill: row.fdm_infill as number | null,
                fdm_layer_height: row.fdm_layer_height as number | null,
                fdm_support: row.fdm_support as number | boolean | null,
                resin_type: row.resin_type as string | null,
                layer_thickness: row.layer_thickness as number | null,
                post_processing: row.post_processing as number | boolean | null,
            }) || null

        const totalPrice = Number(row.total_price)
        return NextResponse.json({
            success: true,
            data: {
                id: Number(row.id),
                userId: row.user_id != null ? Number(row.user_id) : null,
                sessionId: (row.session_id as string) || null,
                fileName: (row.file_name as string) || null,
                fileSize: row.file_size != null ? Number(row.file_size) : null,
                fileUrl: (row.file_url as string) || null,
                volumeCm3: row.volume_cm3 != null ? Number(row.volume_cm3) : null,
                surfaceAreaCm2: row.surface_area_cm2 != null ? Number(row.surface_area_cm2) : null,
                dimensionsX: row.dimensions_x != null ? Number(row.dimensions_x) : null,
                dimensionsY: row.dimensions_y != null ? Number(row.dimensions_y) : null,
                dimensionsZ: row.dimensions_z != null ? Number(row.dimensions_z) : null,
                scalePercent,
                printMethod: printMethod ? printMethod.toUpperCase() : null,
                printSettings,
                totalPrice: Number.isFinite(totalPrice) ? Math.round(totalPrice) : 0,
                estimatedTimeHours:
                    row.estimated_time_hours != null ? Number(row.estimated_time_hours) : null,
                createdAt: String(row.created_at || ''),
                updatedAt: String(row.updated_at || ''),
                userName: (row.user_name as string) || null,
                userEmail: (row.user_email as string) || null,
                orderId: row.order_id != null ? Number(row.order_id) : null,
                orderNumber: (row.order_number as string) || null,
                inCart: Number(row.cart_count) > 0,
            },
        })
    } catch (e) {
        console.error('GET /api/admin/quotes/[id]', e)
        return NextResponse.json({ error: '견적 조회 실패' }, { status: 500 })
    }
}
