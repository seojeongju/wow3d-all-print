import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    // 인증 및 store_id 획득
    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth; // 인증 실패 시 에러 응답

    const { storeId } = auth;

    try {
        const { results } = await env.DB.prepare(`
            SELECT 
                o.*, 
                u.name as user_name, 
                u.email as user_email,
                (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.store_id = ?
            ORDER BY o.created_at DESC
            LIMIT 100
        `).bind(storeId).all();

        return NextResponse.json({ success: true, data: results || [] });
    } catch (e) {
        console.error('GET /api/admin/orders', e);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
