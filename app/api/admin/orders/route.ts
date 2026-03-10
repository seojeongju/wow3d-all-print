import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api-utils';

/** store_id 조건 실패 시 사용하는 폴백 (수정견적 표시를 위해 has_expert_quote, expert_quote_data 포함) */
const FALLBACK_SQL = `
    SELECT 
        o.id,
        o.user_id,
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
        (SELECT COALESCE(SUM(oi.subtotal), 0) FROM order_items oi WHERE oi.order_id = o.id) as items_total,
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

/** expert_quote 컬럼이 없는 구 DB용 최소 폴백 */
const FALLBACK_MINIMAL_SQL = `
    SELECT 
        o.id, o.user_id, o.order_number, o.recipient_name, o.guest_email,
        o.total_amount, o.status, o.created_at,
        u.name as user_name, u.email as user_email,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count,
        (SELECT COALESCE(SUM(oi.subtotal), 0) FROM order_items oi WHERE oi.order_id = o.id) as items_total,
        (SELECT JSON_GROUP_ARRAY(JSON_OBJECT('id', oi.id, 'quote_id', oi.quote_id, 'file_name', q.file_name, 'file_url', q.file_url))
         FROM order_items oi JOIN quotes q ON oi.quote_id = q.id WHERE oi.order_id = o.id) as items_summary
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
                o.user_id,
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
                (SELECT COALESCE(SUM(oi.subtotal), 0) FROM order_items oi WHERE oi.order_id = o.id) as items_total,
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
            WHERE (o.store_id = ? OR o.store_id IS NULL)
            ORDER BY o.created_at DESC
            LIMIT 100
        `).bind(storeId).all();

        const rows = results || [];
        const data = rows.map((row: Record<string, unknown>) => ({
            ...row,
            has_expert_quote: row.has_expert_quote ?? null,
            expert_quote_data: row.expert_quote_data ?? null,
        }));
        return NextResponse.json({ success: true, data });
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
            console.warn('GET /api/admin/orders fallback with expert columns failed, trying minimal', fallbackErr);
            try {
                const { results } = await env.DB.prepare(FALLBACK_MINIMAL_SQL).all();
                const data = (results || []).map((row: Record<string, unknown>) => ({
                    ...row,
                    guest_email: row.guest_email ?? null,
                    has_expert_quote: null,
                    expert_quote_data: null,
                    quotation_sent_at: null,
                }));
                return NextResponse.json({ success: true, data });
            } catch (minimalErr) {
                console.error('GET /api/admin/orders minimal fallback failed', minimalErr);
                return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
            }
        }
    }
}
