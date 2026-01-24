import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

const ALLOWED = ['pending', 'confirmed', 'production', 'shipping', 'completed', 'cancelled'];

/**
 * PATCH /api/admin/orders/[id] - 주문 상태 변경
 * Body: { status: string }
 */
export async function PATCH(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const { env } = getCloudflareContext();
    if (!env?.DB) {
        return NextResponse.json({ error: 'DB not available' }, { status: 503 });
    }

    try {
        const body = await _req.json() as { status?: string };
        const status = body?.status && ALLOWED.includes(body.status) ? body.status : null;
        if (!status) {
            return NextResponse.json({ error: 'Invalid status. Use one of: ' + ALLOWED.join(', ') }, { status: 400 });
        }

        const numId = parseInt(id, 10);
        if (Number.isNaN(numId)) {
            return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
        }

        const res = await env.DB.prepare(
            'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(status, numId).run() as { meta?: { changes?: number } };

        if ((res?.meta?.changes ?? 0) === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, status });
    } catch (e) {
        console.error('PATCH /api/admin/orders/[id]', e);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}
