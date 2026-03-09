import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api-utils';

/** store_id / has_expert_quote / quotation_sent_at 등 컬럼이 없는 DB용 폴백 쿼리 */
const FALLBACK_SQL = `
    SELECT 
        o.id,
        o.order_number,
        o.recipient_name,
        o.total_amount,
        o.status,
        o.created_at,
        u.name as user_name,
        u.email as user_email,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count,
        (
            SELECT JSON_GROUP_ARRAY(
                JSON_OBJECT('id', oi.id, 'quote_id', oi.quote_id, 'file_name', q.file_name, 'file_url', q.file_url)
            )
            FROM order_items oi
            JOIN quotes q ON oi.quote_id = q.id
            WHERE oi.order_id = o.id
        ) as items_summary
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
    LIMIT 100
`;

export async function GET(req: NextRequest) {
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;

    const { storeId } = auth;

    try {
        const { results } = await env.DB.prepare(`
            SELECT 
                o.id,
                o.order_number,
                o.recipient_name,
                o.guest_email,
                o.total_amount,
                o.status,
                o.created_at,
                o.has_expert_quote,
                o.expert_quote_data,
                o.quotation_sent_at,
                u.name as user_name,
                u.email as user_email,
                (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count,
                (
                    SELECT JSON_GROUP_ARRAY(
                        JSON_OBJECT(
                            'id', oi.id, 
                            'quote_id', oi.quote_id, 
                            'file_name', q.file_name, 
                            'file_url', q.file_url
                        )
                    )
                    FROM order_items oi
                    JOIN quotes q ON oi.quote_id = q.id
                    WHERE oi.order_id = o.id
                ) as items_summary
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.store_id = ?
            ORDER BY o.created_at DESC
            LIMIT 100
        `).bind(storeId).all();

        return NextResponse.json({ success: true, data: results || [] });
    } catch (e) {
        console.warn('GET /api/admin/orders full query failed, trying fallback', e);
        try {
            const { results } = await env.DB.prepare(FALLBACK_SQL).all();
            const data = (results || []).map((row: Record<string, unknown>) => ({
                ...row,
                guest_email: row.guest_email ?? null,
                has_expert_quote: row.has_expert_quote ?? null,
                expert_quote_data: row.expert_quote_data ?? null,
                quotation_sent_at: row.quotation_sent_at ?? null,
            }));
            return NextResponse.json({ success: true, data });
        } catch (fallbackErr) {
            console.error('GET /api/admin/orders fallback failed', fallbackErr);
            return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
        }
    }
}
