import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import { normalizeAmountBeforeSave } from '@/lib/amount-display';
import { processAutoOrderStatusTransitions, statusTimestampSql } from '@/lib/order-auto-status';
import { isOrderStatus } from '@/lib/order-status';

type ExpertQuoteItem = {
    unit_price?: number;
    quantity?: number;
    [k: string]: unknown;
};

type ExpertQuoteData = {
    items?: ExpertQuoteItem[];
    total_amount?: number;
    [k: string]: unknown;
};

type PatchOrderBody = {
    status?: string;
    admin_note?: string;
    expert_quote_data?: ExpertQuoteData;
};

/**
 * GET /api/admin/orders/[id] - 주문 상세 (항목, 배송, 관리자메모)
 */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    const numId = parseInt(id, 10);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });

    // 인증 및 store_id 획득
    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;
    const { storeId } = auth;

    try {
        let order: Record<string, unknown> | null = null;
        try {
            order = await env.DB.prepare(`
                SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                WHERE o.id = ? AND o.store_id = ?
            `).bind(numId, storeId).first() as Record<string, unknown> | null;
        } catch {
            order = await env.DB.prepare(`
                SELECT o.id, o.user_id, o.order_number, o.recipient_name, o.recipient_phone,
                    o.shipping_address, o.shipping_postal_code, o.total_amount, o.status,
                    o.payment_method, o.payment_status, o.customer_note, o.admin_note,
                    o.created_at, o.updated_at,
                    u.name as user_name, u.email as user_email, u.phone as user_phone
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                WHERE o.id = ?
            `).bind(numId).first() as Record<string, unknown> | null;
        }

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        let items: Record<string, unknown>[] = [];
        try {
            const withNames = await env.DB.prepare(`
                SELECT oi.id, oi.quote_id, oi.quantity, oi.unit_price, oi.subtotal,
                       q.file_name, q.file_url, q.print_method, q.guide_source, q.guide_topic,
                       COALESCE(q.fdm_material_name, q.fdm_material) as fdm_material,
                       q.fdm_infill, q.fdm_layer_height, q.fdm_support,
                       COALESCE(q.resin_type_name, q.resin_type) as resin_type,
                       q.layer_thickness, q.post_processing,
                       q.volume_cm3, q.estimated_time_hours, q.total_price
                FROM order_items oi
                LEFT JOIN quotes q ON oi.quote_id = q.id
                WHERE oi.order_id = ?
            `).bind(numId).all();
            items = (withNames.results || []) as Record<string, unknown>[];
        } catch {
            const fallback = await env.DB.prepare(`
                SELECT oi.id, oi.quote_id, oi.quantity, oi.unit_price, oi.subtotal,
                       q.file_name, q.file_url, q.print_method,
                       q.fdm_material, q.fdm_infill, q.fdm_layer_height, q.fdm_support,
                       q.resin_type, q.layer_thickness, q.post_processing,
                       q.volume_cm3, q.estimated_time_hours, q.total_price
                FROM order_items oi
                LEFT JOIN quotes q ON oi.quote_id = q.id
                WHERE oi.order_id = ?
            `).bind(numId).all();
            items = (fallback.results || []) as Record<string, unknown>[];
        }

        const shipment = await env.DB.prepare(
            'SELECT * FROM shipments WHERE order_id = ? ORDER BY id DESC LIMIT 1'
        ).bind(numId).first();

        return NextResponse.json({
            success: true,
            data: { order, items: items || [], shipment: shipment || null },
        });
    } catch (e) {
        console.error('GET /api/admin/orders/[id]', e);
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/orders/[id] - 주문 상태·관리자메모 변경
 * Body: { status?: string, admin_note?: string }
 */
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    const numId = parseInt(id, 10);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });

    // 인증 및 store_id 획득
    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;
    const { storeId } = auth;

    try {
        // 해당 주문 존재 여부 확인 (store_id 일치 또는 NULL인 구 주문 포함)
        const check = await env.DB.prepare('SELECT id, store_id, status FROM orders WHERE id = ?')
            .bind(numId).first() as { id: number; store_id: number | null; status: string } | null;
        if (!check) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }
        const orderStoreId = check.store_id;
        const allowUpdate = orderStoreId === null || orderStoreId === storeId;

        if (!allowUpdate) {
            return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 });
        }

        const body = (await req.json()) as PatchOrderBody;
        const status = body?.status && isOrderStatus(body.status) ? body.status : null;
        const adminNote = body?.admin_note !== undefined ? String(body.admin_note) : null;
        const prevStatus = check.status;

        // store_id가 NULL인 구 주문은 WHERE id = ? 만 사용
        const whereClause = orderStoreId != null ? 'WHERE id = ? AND store_id = ?' : 'WHERE id = ?';
        const whereBind = orderStoreId != null ? [numId, storeId] : [numId];

        if (status !== null && adminNote !== null) {
            const { setClause } = statusTimestampSql(status, prevStatus);
            await env.DB.prepare(
                `UPDATE orders SET status = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP${setClause} ${whereClause}`
            ).bind(status, adminNote, ...whereBind).run();
        } else if (status !== null) {
            const { setClause } = statusTimestampSql(status, prevStatus);
            await env.DB.prepare(
                `UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP${setClause} ${whereClause}`
            ).bind(status, ...whereBind).run();
        } else if (adminNote !== null) {
            await env.DB.prepare(
                `UPDATE orders SET admin_note = ?, updated_at = CURRENT_TIMESTAMP ${whereClause}`
            ).bind(adminNote, ...whereBind).run();
        } else if (body?.expert_quote_data) {
            const raw = body.expert_quote_data;
            const items = Array.isArray(raw.items)
                ? raw.items.map((it) => {
                    const unitPrice = normalizeAmountBeforeSave(it.unit_price);
                    const qty = Math.max(1, Number(it.quantity) || 1);
                    return { ...it, unit_price: unitPrice, subtotal: unitPrice * qty };
                })
                : raw.items;
            const total_amount = normalizeAmountBeforeSave(raw.total_amount);
            const expertData = JSON.stringify({ ...raw, items, total_amount });
            await env.DB.prepare(
                `UPDATE orders SET expert_quote_data = ?, has_expert_quote = 1, updated_at = CURRENT_TIMESTAMP ${whereClause}`
            ).bind(expertData, ...whereBind).run();
        } else {
            return NextResponse.json({ error: 'status, admin_note or expert_quote_data required' }, { status: 400 });
        }

        await processAutoOrderStatusTransitions(env.DB);

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        console.error('PATCH /api/admin/orders/[id]', e);
        const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : '';
        if (/no such column|has_expert_quote|expert_quote_data/i.test(msg)) {
            return NextResponse.json({
                success: false,
                error: '수정견적 저장에 필요한 DB 컬럼이 없습니다. migrations/schema_orders_expert_quote.sql 마이그레이션을 실행하세요.',
            }, { status: 500 });
        }
        return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
    }
}
