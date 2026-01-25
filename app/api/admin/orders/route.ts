import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });
    try {
        const { results } = await env.DB.prepare(`
            SELECT 
                o.*, 
                u.name as user_name, 
                u.email as user_email,
                (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT 100
        `).all();
        return NextResponse.json({ success: true, data: results || [] });
    } catch (e) {
        console.error('GET /api/admin/orders', e);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
