import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api-utils';

const FILTER_WHITELIST = ['all', 'ordered', 'incart', 'abandoned', 'draft'] as const;
type FilterKey = (typeof FILTER_WHITELIST)[number];

const FILTER_SQL: Record<FilterKey, string> = {
    all: '1=1',
    ordered: 'EXISTS (SELECT 1 FROM order_items oi WHERE oi.quote_id = q.id)',
    incart:
        'NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.quote_id = q.id) AND (SELECT COUNT(*) FROM cart c WHERE c.quote_id = q.id) > 0',
    abandoned:
        'NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.quote_id = q.id) AND (SELECT COUNT(*) FROM cart c WHERE c.quote_id = q.id) = 0 AND COALESCE(q.total_price,0) > 0',
    draft: 'COALESCE(q.total_price,0) = 0',
};

const TRAFFIC_JOIN = `
            LEFT JOIN (
                SELECT session_id, source, medium
                FROM traffic_logs
                GROUP BY session_id
            ) t ON q.session_id = t.session_id`;

const SELECT_LIST = `
            SELECT 
                q.id, q.user_id, q.session_id, q.file_name, q.file_size, q.file_url,
                q.volume_cm3, q.total_price, q.print_method, q.guide_source, q.guide_topic, q.created_at, q.updated_at,
                u.name as user_name, u.email as user_email, u.role as user_role,
                (SELECT o.order_number FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.quote_id = q.id LIMIT 1) as order_number,
                (SELECT o.status FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.quote_id = q.id LIMIT 1) as order_status,
                (SELECT COUNT(*) FROM cart c WHERE c.quote_id = q.id) as is_in_cart,
                t.source as traffic_source,
                t.medium as traffic_medium
            FROM quotes q
            LEFT JOIN users u ON q.user_id = u.id
            ${TRAFFIC_JOIN}`;

function parseFilter(v: string | null): FilterKey {
    if (v && FILTER_WHITELIST.includes(v as FilterKey)) return v as FilterKey;
    return 'all';
}

function likePattern(raw: string): string {
    const t = raw.trim().replace(/[%_\\]/g, '');
    if (!t) return '';
    return `%${t}%`;
}

/**
 * GET /api/admin/quotes/analytics
 * Query: filter=all|ordered|incart|abandoned|draft, page=1, limit=20, q=검색어
 */
export async function GET(req: NextRequest) {
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;

    const url = req.nextUrl.searchParams;
    const filter = parseFilter(url.get('filter'));
    const page = Math.max(1, parseInt(url.get('page') || '1', 10) || 1);
    const limitRaw = parseInt(url.get('limit') || '20', 10) || 20;
    const limit = Math.min(100, Math.max(1, limitRaw));
    const offset = (page - 1) * limit;
    const searchRaw = (url.get('q') || '').trim();
    const pattern = likePattern(searchRaw);

    const filterSql = FILTER_SQL[filter];

    try {
        const statsRow = await env.DB.prepare(
            `
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN EXISTS (SELECT 1 FROM order_items oi WHERE oi.quote_id = q.id) THEN 1 ELSE 0 END) AS ordered_cnt,
                SUM(CASE WHEN NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.quote_id = q.id)
                    AND (SELECT COUNT(*) FROM cart c WHERE c.quote_id = q.id) > 0 THEN 1 ELSE 0 END) AS incart_cnt,
                SUM(CASE WHEN COALESCE(q.total_price,0) = 0 THEN 1 ELSE 0 END) AS draft_cnt
            FROM quotes q
        `
        ).first() as {
            total: number;
            ordered_cnt: number;
            incart_cnt: number;
            draft_cnt: number;
        } | null;

        const totalAll = Number(statsRow?.total ?? 0);
        const ordered = Number(statsRow?.ordered_cnt ?? 0);
        const incart = Number(statsRow?.incart_cnt ?? 0);
        const draft = Number(statsRow?.draft_cnt ?? 0);
        const abandoned = Math.max(0, totalAll - ordered - incart - draft);

        const { results: guideSourceRows } = await env.DB.prepare(
            `
            SELECT
                COALESCE(NULLIF(TRIM(q.guide_source), ''), 'unknown') AS guide_source,
                COALESCE(NULLIF(TRIM(q.guide_topic), ''), COALESCE(NULLIF(TRIM(q.guide_source), ''), 'unknown')) AS guide_topic,
                COUNT(*) AS quote_count,
                SUM(CASE WHEN EXISTS (SELECT 1 FROM order_items oi WHERE oi.quote_id = q.id) THEN 1 ELSE 0 END) AS ordered_count,
                SUM(CASE WHEN NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.quote_id = q.id)
                    AND (SELECT COUNT(*) FROM cart c WHERE c.quote_id = q.id) > 0 THEN 1 ELSE 0 END) AS incart_count,
                SUM(CASE WHEN COALESCE(q.total_price,0) = 0 THEN 1 ELSE 0 END) AS draft_count
            FROM quotes q
            WHERE COALESCE(NULLIF(TRIM(q.guide_source), ''), NULLIF(TRIM(q.guide_topic), '')) IS NOT NULL
            GROUP BY 1, 2
            ORDER BY quote_count DESC, ordered_count DESC, guide_topic ASC
            LIMIT 10
        `
        ).all() as {
            results?: Array<{
                guide_source: string;
                guide_topic: string;
                quote_count: number;
                ordered_count: number;
                incart_count: number;
                draft_count: number;
            }>;
        };

        let countSql = `SELECT COUNT(*) as cnt FROM quotes q LEFT JOIN users u ON q.user_id = u.id WHERE ${filterSql}`;
        const countBinds: (string | number)[] = [];

        if (pattern) {
            countSql += ` AND (
                LOWER(q.file_name) LIKE LOWER(?)
                OR LOWER(COALESCE(u.name, '')) LIKE LOWER(?)
                OR LOWER(COALESCE((SELECT o.order_number FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.quote_id = q.id LIMIT 1), ''))) LIKE LOWER(?)
            )`;
            countBinds.push(pattern, pattern, pattern);
        }

        const countResult = await env.DB.prepare(countSql).bind(...countBinds).first();
        const filteredTotal = Number((countResult as { cnt?: number })?.cnt ?? 0);
        const totalPages = Math.max(1, Math.ceil(filteredTotal / limit));

        let listSql = `${SELECT_LIST} WHERE ${filterSql}`;
        const listBinds: (string | number)[] = [];

        if (pattern) {
            listSql += ` AND (
                LOWER(q.file_name) LIKE LOWER(?)
                OR LOWER(COALESCE(u.name, '')) LIKE LOWER(?)
                OR LOWER(COALESCE((SELECT o.order_number FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.quote_id = q.id LIMIT 1), ''))) LIKE LOWER(?)
            )`;
            listBinds.push(pattern, pattern, pattern);
        }

        listSql += ` ORDER BY q.created_at DESC LIMIT ? OFFSET ?`;
        listBinds.push(limit, offset);

        const { results } = await env.DB.prepare(listSql).bind(...listBinds).all();

        return NextResponse.json({
            success: true,
            data: {
                items: results || [],
                stats: {
                    total: totalAll,
                    ordered,
                    incart,
                    abandoned,
                    draft,
                    guideSources: (guideSourceRows || []).map((row) => {
                        const quoteCount = Number(row.quote_count || 0);
                        const orderedCount = Number(row.ordered_count || 0);
                        const incartCount = Number(row.incart_count || 0);
                        const draftCount = Number(row.draft_count || 0);
                        const abandonedCount = Math.max(0, quoteCount - orderedCount - incartCount - draftCount);
                        return {
                            guideSource: row.guide_source,
                            guideTopic: row.guide_topic,
                            quoteCount,
                            orderedCount,
                            incartCount,
                            abandonedCount,
                            draftCount,
                            orderRate: quoteCount > 0 ? orderedCount / quoteCount : 0,
                        };
                    }),
                },
                pagination: {
                    page,
                    limit,
                    total: filteredTotal,
                    totalPages,
                },
            },
        });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('GET /api/admin/quotes/analytics error:', e);
        return NextResponse.json({ error: 'Failed to fetch analytics data', detail: msg }, { status: 500 });
    }
}
