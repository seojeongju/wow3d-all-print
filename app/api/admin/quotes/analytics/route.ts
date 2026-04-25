import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api-utils';

/**
 * GET /api/admin/quotes/analytics - 모든 견적 유입 내역 조회 (주문 여부 포함)
 */
export async function GET(req: NextRequest) {
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;

    try {
        // 모든 견적 목록을 가져오며, 주문 여부와 장바구니 여부를 판단합니다.
        // 유입 경로(traffic_logs) 정보도 함께 가져옵니다.
        const query = `
            SELECT 
                q.id, q.user_id, q.session_id, q.file_name, q.file_size, q.file_url,
                q.volume_cm3, q.total_price, q.print_method, q.created_at, q.updated_at,
                u.name as user_name, u.email as user_email,
                (SELECT o.order_number FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.quote_id = q.id LIMIT 1) as order_number,
                (SELECT o.status FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.quote_id = q.id LIMIT 1) as order_status,
                (SELECT COUNT(*) FROM cart c WHERE c.quote_id = q.id) as is_in_cart,
                t.source as traffic_source,
                t.medium as traffic_medium
            FROM quotes q
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN (
                SELECT session_id, source, medium
                FROM traffic_logs
                GROUP BY session_id
            ) t ON q.session_id = t.session_id
            ORDER BY q.created_at DESC
            LIMIT 500
        `;

        const { results } = await env.DB.prepare(query).all();

        return NextResponse.json({ 
            success: true, 
            data: results || [] 
        });
    } catch (e: any) {
        console.error('GET /api/admin/quotes/analytics error:', e);
        return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
    }
}
