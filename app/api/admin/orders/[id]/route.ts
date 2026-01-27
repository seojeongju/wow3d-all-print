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
        const order = await env.DB.prepare(`
            SELECT o.*, u.name as user_name, u.email as user_email
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.id = ? AND o.store_id = ?
        `).bind(numId, storeId).first();

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
        // 먼저 해당 주문이 이 스토어 소속인지 확인
        const check = await env.DB.prepare('SELECT id FROM orders WHERE id = ? AND store_id = ?')
            .bind(numId, storeId).first();
        if (!check) {
            return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 });
        }

        const body = (await req.json()) as { status?: string; admin_note?: string };
        const status = body?.status && ALLOWED.includes(body.status) ? body.status : null;
        const adminNote = body?.admin_note !== undefined ? String(body.admin_note) : null;

        if (status !== null && adminNote !== null) {
            await env.DB.prepare(
                'UPDATE orders SET status = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND store_id = ?'
            ).bind(status, adminNote, numId, storeId).run();
        } else if (status !== null) {
            await env.DB.prepare(
                'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND store_id = ?'
            ).bind(status, numId, storeId).run();
        } else if (adminNote !== null) {
            await env.DB.prepare(
                'UPDATE orders SET admin_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND store_id = ?'
            ).bind(adminNote, numId, storeId).run();
        } else {
            return NextResponse.json({ error: 'status or admin_note required' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('PATCH /api/admin/orders/[id]', e);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}
