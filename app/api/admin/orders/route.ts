import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { env } = getCloudflareContext();
    try {
        // Fetch users alongside orders for easier display
        const { results } = await env.DB.prepare(`
            SELECT 
                o.*, 
                u.name as user_name, 
                u.email as user_email,
                (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT 50
        `).all();

        return NextResponse.json({ success: true, data: results });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
