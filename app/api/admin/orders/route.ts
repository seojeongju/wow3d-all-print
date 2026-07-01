import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api-utils';
import { processAutoOrderStatusTransitions } from '@/lib/order-auto-status';
import { ORDER_STATUS_VALUES } from '@/lib/order-status';

/** quotation_sent_at 없을 때: 수정견적만 조회 (같은 WHERE) */
const MAIN_EXPERT_ONLY_SQL = `
    SELECT 
        o.id, o.user_id, o.order_number, o.recipient_name, o.guest_email,
        o.total_amount, o.status, o.created_at,
        o.has_expert_quote,
        o.expert_quote_data,
        u.name as user_name, u.email as user_email, u.role as user_role,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count,
        (SELECT COALESCE(SUM(oi.subtotal), 0) FROM order_items oi WHERE oi.order_id = o.id) as items_total,
        (SELECT JSON_GROUP_ARRAY(JSON_OBJECT('id', oi.id, 'quote_id', oi.quote_id, 'file_name', q.file_name, 'file_url', q.file_url))
         FROM order_items oi JOIN quotes q ON oi.quote_id = q.id WHERE oi.order_id = o.id) as items_summary
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE (o.store_id = ? OR o.store_id IS NULL)
    ORDER BY o.created_at DESC
    LIMIT 500
`;

/** has_expert_quote / expert_quote_data 컬럼이 없을 때 사용 (동일 WHERE, 수정견적 필드 제외) */
const MAIN_SAFE_SQL = `
    SELECT 
        o.id, o.user_id, o.order_number, o.recipient_name, o.guest_email,
        o.total_amount, o.status, o.created_at,
        u.name as user_name, u.email as user_email, u.role as user_role,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count,
        (SELECT COALESCE(SUM(oi.subtotal), 0) FROM order_items oi WHERE oi.order_id = o.id) as items_total,
        (SELECT JSON_GROUP_ARRAY(JSON_OBJECT('id', oi.id, 'quote_id', oi.quote_id, 'file_name', q.file_name, 'file_url', q.file_url))
         FROM order_items oi JOIN quotes q ON oi.quote_id = q.id WHERE oi.order_id = o.id) as items_summary
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE (o.store_id = ? OR o.store_id IS NULL)
    ORDER BY o.created_at DESC
    LIMIT 500
`;

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
        u.role as user_role,
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
    LIMIT 500
`;

/** expert_quote 컬럼이 없는 구 DB용 최소 폴백 */
const FALLBACK_MINIMAL_SQL = `
    SELECT 
        o.id, o.user_id, o.order_number, o.recipient_name, o.guest_email,
        o.total_amount, o.status, o.created_at,
        u.name as user_name, u.email as user_email, u.role as user_role,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count,
        (SELECT COALESCE(SUM(oi.subtotal), 0) FROM order_items oi WHERE oi.order_id = o.id) as items_total,
        (SELECT JSON_GROUP_ARRAY(JSON_OBJECT('id', oi.id, 'quote_id', oi.quote_id, 'file_name', q.file_name, 'file_url', q.file_url))
         FROM order_items oi JOIN quotes q ON oi.quote_id = q.id WHERE oi.order_id = o.id) as items_summary
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
    LIMIT 500
`;

const ORDERS_SELECT_BODY = `
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
                u.role as user_role,
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
            LEFT JOIN users u ON o.user_id = u.id`;

function likePattern(raw: string): string {
    const t = raw.trim().replace(/[%_\\]/g, '');
    if (!t) return '';
    return `%${t}%`;
}

/** 주문번호·수령인·이메일·품목 파일명 검색 */
function orderSearchSql(): string {
    return ` AND (
                LOWER(COALESCE(o.order_number, '')) LIKE LOWER(?)
                OR LOWER(COALESCE(o.recipient_name, '')) LIKE LOWER(?)
                OR LOWER(COALESCE(o.guest_email, '')) LIKE LOWER(?)
                OR LOWER(COALESCE(u.email, '')) LIKE LOWER(?)
                OR EXISTS (
                    SELECT 1 FROM order_items oi
                    JOIN quotes q ON oi.quote_id = q.id
                    WHERE oi.order_id = o.id AND LOWER(COALESCE(q.file_name, '')) LIKE LOWER(?)
                )
            )`;
}

const ORDER_STATUS_FILTER_SET = new Set<string>(ORDER_STATUS_VALUES);

export async function GET(req: NextRequest) {
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    await processAutoOrderStatusTransitions(env.DB);

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;

    const { storeId, userId } = auth;
    const paginated = req.nextUrl.searchParams.get('paginated') === '1';

    if (paginated) {
        const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1', 10) || 1);
        const limitRaw = parseInt(req.nextUrl.searchParams.get('limit') || '20', 10) || 20;
        const limit = Math.min(100, Math.max(1, limitRaw));
        const offset = (page - 1) * limit;
        const pattern = likePattern(req.nextUrl.searchParams.get('q') || '');

        const statusParam = (req.nextUrl.searchParams.get('status') || '').trim();
        const statusFilter =
            statusParam && statusParam !== 'all' && ORDER_STATUS_FILTER_SET.has(statusParam) ? statusParam : '';
        const mineOnly = req.nextUrl.searchParams.get('mine') === '1';

        const storeWhere = '(o.store_id = ? OR o.store_id IS NULL)';
        const mineSql = mineOnly ? ' AND o.user_id = ?' : '';
        const statusSql = statusFilter ? ' AND o.status = ?' : '';
        const searchSql = pattern ? orderSearchSql() : '';
        const baseFrom = `FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE ${storeWhere}${mineSql}${statusSql}${searchSql}`;

        try {
            const countSql = `SELECT COUNT(*) as cnt ${baseFrom}`;
            const listSql = `SELECT ${ORDERS_SELECT_BODY} WHERE ${storeWhere}${mineSql}${statusSql}${searchSql} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;

            const searchBinds = pattern ? [pattern, pattern, pattern, pattern, pattern] : [];
            const filterBinds: (string | number)[] = [storeId];
            if (mineOnly) filterBinds.push(userId);
            if (statusFilter) filterBinds.push(statusFilter);
            filterBinds.push(...searchBinds);
            const countBinds = [...filterBinds];
            const listBinds: (string | number)[] = [...filterBinds, limit, offset];

            const countRow = await env.DB.prepare(countSql).bind(...countBinds).first();
            const filteredTotal = Number((countRow as { cnt?: number })?.cnt ?? 0);
            const totalPages = Math.max(1, Math.ceil(filteredTotal / limit));

            const { results } = await env.DB.prepare(listSql).bind(...listBinds).all();
            const items = (results || []).map((row: Record<string, unknown>) => normalizeOrderRow(row));

            return NextResponse.json({
                success: true,
                data: {
                    items,
                    pagination: { page, limit, total: filteredTotal, totalPages },
                },
            });
        } catch (e) {
            console.error('GET /api/admin/orders paginated error:', e);
            return NextResponse.json({ error: 'Failed to fetch orders (paginated)' }, { status: 500 });
        }
    }

    try {
        const { results } = await env.DB.prepare(`
            SELECT ${ORDERS_SELECT_BODY}
            WHERE (o.store_id = ? OR o.store_id IS NULL)
            ORDER BY o.created_at DESC
            LIMIT 500
        `).bind(storeId).all();

        const rows = results || [];
        const data = rows.map((row: Record<string, unknown>) => normalizeOrderRow(row));
        return NextResponse.json({ success: true, data });
    } catch (e) {
        console.warn('GET /api/admin/orders full query failed, trying expert-only', e);
        try {
            const { results } = await env.DB.prepare(MAIN_EXPERT_ONLY_SQL).bind(storeId).all();
            const rows = results || [];
            const data = rows.map((row: Record<string, unknown>) => ({ ...normalizeOrderRow(row), quotation_sent_at: null }));
            return NextResponse.json({ success: true, data });
        } catch (expertErr) {
            console.warn('GET /api/admin/orders expert-only failed, trying safe main', expertErr);
            try {
                const { results } = await env.DB.prepare(MAIN_SAFE_SQL).bind(storeId).all();
                const rows = results || [];
                const data = rows.map((row: Record<string, unknown>) => ({
                    ...normalizeOrderRow(row),
                    has_expert_quote: null,
                    expert_quote_data: null,
                }));
                return NextResponse.json({ success: true, data });
            } catch (safeErr) {
                console.warn('GET /api/admin/orders safe main failed, trying fallback', safeErr);
                try {
                    const { results } = await env.DB.prepare(FALLBACK_SQL).all();
                    const data = (results || []).map((row: Record<string, unknown>) => normalizeOrderRow(row));
                    return NextResponse.json({ success: true, data });
                } catch (fallbackErr) {
                    console.warn('GET /api/admin/orders fallback failed, trying minimal', fallbackErr);
                    try {
                        const { results } = await env.DB.prepare(FALLBACK_MINIMAL_SQL).all();
                        const data = (results || []).map((row: Record<string, unknown>) => ({
                            ...normalizeOrderRow(row),
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
    }
}

function normalizeOrderRow(row: Record<string, unknown>) {
    const r = row as Record<string, unknown> & { hasExpertQuote?: unknown; expertQuoteData?: unknown };
    return {
        ...row,
        guest_email: row.guest_email ?? null,
        has_expert_quote: row.has_expert_quote ?? r.hasExpertQuote ?? null,
        expert_quote_data: row.expert_quote_data ?? r.expertQuoteData ?? null,
        quotation_sent_at: row.quotation_sent_at ?? null,
    };
}
