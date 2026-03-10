import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';

const ALLOWED = ['pending', 'confirmed', 'production', 'shipping', 'completed', 'cancelled'];

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
                SELECT o.*, u.name as user_name, u.email as user_email
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
                    u.name as user_name, u.email as user_email
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                WHERE o.id = ?
            `).bind(numId).first() as Record<string, unknown> | null;
        }

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        const { results: items } = await env.DB.prepare(`
            SELECT oi.id, oi.quote_id, oi.quantity, oi.unit_price, oi.subtotal, q.file_name, q.file_url, q.print_method
            FROM order_items oi
            LEFT JOIN quotes q ON oi.quote_id = q.id
            WHERE oi.order_id = ?
        `).bind(numId).all();

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
        const check = await env.DB.prepare('SELECT id, store_id FROM orders WHERE id = ?')
            .bind(numId).first() as { id: number; store_id: number | null } | null;
        if (!check) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }
        const orderStoreId = check.store_id;
        const allowUpdate = orderStoreId === null || orderStoreId === storeId;

        if (!allowUpdate) {
            return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 });
        }

        const body = (await req.json()) as { status?: string; admin_note?: string; expert_quote_data?: any };
        const status = body?.status && ALLOWED.includes(body.status) ? body.status : null;
        const adminNote = body?.admin_note !== undefined ? String(body.admin_note) : null;

        // store_id가 NULL인 구 주문은 WHERE id = ? 만 사용
        const whereClause = orderStoreId != null ? 'WHERE id = ? AND store_id = ?' : 'WHERE id = ?';
        const whereBind = orderStoreId != null ? [numId, storeId] : [numId];

        if (status !== null && adminNote !== null) {
            await env.DB.prepare(
                `UPDATE orders SET status = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP ${whereClause}`
            ).bind(status, adminNote, ...whereBind).run();
        } else if (status !== null) {
            await env.DB.prepare(
                `UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP ${whereClause}`
            ).bind(status, ...whereBind).run();
        } else if (adminNote !== null) {
            await env.DB.prepare(
                `UPDATE orders SET admin_note = ?, updated_at = CURRENT_TIMESTAMP ${whereClause}`
            ).bind(adminNote, ...whereBind).run();
        } else if (body?.expert_quote_data) {
            const expertData = JSON.stringify(body.expert_quote_data);
            await env.DB.prepare(
                `UPDATE orders SET expert_quote_data = ?, has_expert_quote = 1, updated_at = CURRENT_TIMESTAMP ${whereClause}`
            ).bind(expertData, ...whereBind).run();
        } else {
            return NextResponse.json({ error: 'status, admin_note or expert_quote_data required' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('PATCH /api/admin/orders/[id]', e);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}
