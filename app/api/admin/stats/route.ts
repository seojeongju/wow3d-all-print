import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { correctDisplayAmount } from '@/lib/amount-display';
import { requireAdminAuth } from '@/lib/api-utils';

const STORE_ORDERS = '(o.store_id = ? OR o.store_id IS NULL)';
const STORE_INQUIRIES = '(store_id = ? OR store_id IS NULL)';
const STORE_USERS = '(store_id = ? OR store_id IS NULL)';

/**
 * GET /api/admin/stats — 대시보드 집계 (스토어 기준)
 * 설정·집계 불가 필드는 null → 클라이언트에서 "없음" 표시
 */
export async function GET(req: NextRequest) {
    const { env } = getCloudflareContext();
    if (!env?.DB) {
        return NextResponse.json({ error: 'DB not available' }, { status: 503 });
    }

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;
    const { storeId } = auth;

    try {
        let totalSalesThisMonth = 0;
        let totalSalesLastMonth = 0;
        let salesChangePercent: number | null = null;
        let newOrdersCount = 0;
        let pendingOrdersCount = 0;

        try {
            const agg = await env.DB.prepare(`
            SELECT 
                COALESCE(SUM(CASE WHEN o.status != 'cancelled' AND o.created_at >= date('now','start of month') THEN o.total_amount ELSE 0 END), 0) as total_sales_this_month,
                COALESCE(SUM(CASE WHEN o.status != 'cancelled' AND o.created_at >= date('now','start of month','-1 month') AND o.created_at < date('now','start of month') THEN o.total_amount ELSE 0 END), 0) as total_sales_last_month,
                SUM(CASE WHEN o.created_at >= date('now','start of month') THEN 1 ELSE 0 END) as new_orders_count,
                SUM(CASE WHEN o.status = 'pending' THEN 1 ELSE 0 END) as pending_orders_count
            FROM orders o
            WHERE ${STORE_ORDERS}
        `)
                .bind(storeId)
                .first() as Record<string, unknown> | null;
            totalSalesThisMonth = Number(agg?.total_sales_this_month ?? 0);
            totalSalesLastMonth = Number(agg?.total_sales_last_month ?? 0);
            newOrdersCount = Number(agg?.new_orders_count ?? 0);
            pendingOrdersCount = Number(agg?.pending_orders_count ?? 0);
        } catch {
            const agg = await env.DB.prepare(`
            SELECT 
                COALESCE(SUM(CASE WHEN status != 'cancelled' AND created_at >= date('now','start of month') THEN total_amount ELSE 0 END), 0) as total_sales_this_month,
                COALESCE(SUM(CASE WHEN status != 'cancelled' AND created_at >= date('now','start of month','-1 month') AND created_at < date('now','start of month') THEN total_amount ELSE 0 END), 0) as total_sales_last_month,
                SUM(CASE WHEN created_at >= date('now','start of month') THEN 1 ELSE 0 END) as new_orders_count,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders_count
            FROM orders
        `).first() as Record<string, unknown> | null;
            totalSalesThisMonth = Number(agg?.total_sales_this_month ?? 0);
            totalSalesLastMonth = Number(agg?.total_sales_last_month ?? 0);
            newOrdersCount = Number(agg?.new_orders_count ?? 0);
            pendingOrdersCount = Number(agg?.pending_orders_count ?? 0);
        }

        if (totalSalesLastMonth > 0) {
            salesChangePercent = Math.round(((totalSalesThisMonth - totalSalesLastMonth) / totalSalesLastMonth) * 1000) / 10;
        } else if (totalSalesThisMonth > 0) {
            salesChangePercent = 100;
        }

        let totalUsers = 0;
        let newSignupsCount = 0;
        try {
            const userTotal = await env.DB.prepare(`SELECT COUNT(*) as c FROM users WHERE ${STORE_USERS}`)
                .bind(storeId)
                .first() as { c: number } | null;
            const userNew = await env.DB.prepare(`
                SELECT COUNT(*) as c FROM users WHERE ${STORE_USERS} AND created_at >= date('now','start of month')
            `)
                .bind(storeId)
                .first() as { c: number } | null;
            totalUsers = Number(userTotal?.c ?? 0);
            newSignupsCount = Number(userNew?.c ?? 0);
        } catch {
            const userTotal = await env.DB.prepare('SELECT COUNT(*) as c FROM users').first() as { c: number } | null;
            const userNew = await env.DB.prepare(`
                SELECT COUNT(*) as c FROM users WHERE created_at >= date('now','start of month')
            `).first() as { c: number } | null;
            totalUsers = Number(userTotal?.c ?? 0);
            newSignupsCount = Number(userNew?.c ?? 0);
        }

        let salesTrend: {
            date: string;
            orderCount: number;
            amount: number;
            paidAmount: number;
            outstandingAmount: number;
        }[] = [];

        const trendSql = (storeFilter: boolean) => `
            SELECT date(o.created_at) as d,
                SUM(CASE WHEN o.status != 'cancelled' THEN 1 ELSE 0 END) as order_count,
                COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0) as amount,
                COALESCE(SUM(CASE
                    WHEN o.status != 'cancelled' AND (
                        o.payment_status = 'paid'
                        OR o.status IN ('payment_confirmed', 'production', 'shipping', 'delivered', 'completed')
                    ) THEN o.total_amount ELSE 0 END), 0) as paid_amount,
                COALESCE(SUM(CASE
                    WHEN o.status != 'cancelled'
                        AND IFNULL(o.payment_status, 'pending') != 'paid'
                        AND o.status NOT IN ('payment_confirmed', 'production', 'shipping', 'delivered', 'completed')
                    THEN o.total_amount ELSE 0 END), 0) as outstanding_amount
            FROM orders o
            WHERE o.created_at >= date('now', '-13 days')
              ${storeFilter ? `AND ${STORE_ORDERS}` : ''}
            GROUP BY d
            ORDER BY d ASC
        `;

        try {
            const { results: trendRows } = await env.DB.prepare(trendSql(true))
                .bind(storeId)
                .all() as {
                results: {
                    d: string;
                    order_count: number;
                    amount: number;
                    paid_amount: number;
                    outstanding_amount: number;
                }[];
            };
            salesTrend = (trendRows || []).map((r) => ({
                date: r.d,
                orderCount: Number(r.order_count ?? 0),
                amount: Number(r.amount ?? 0),
                paidAmount: Number(r.paid_amount ?? 0),
                outstandingAmount: Number(r.outstanding_amount ?? 0),
            }));
        } catch {
            try {
                const { results: trendRows } = await env.DB.prepare(trendSql(false)).all() as {
                    results: {
                        d: string;
                        order_count: number;
                        amount: number;
                        paid_amount: number;
                        outstanding_amount: number;
                    }[];
                };
                salesTrend = (trendRows || []).map((r) => ({
                    date: r.d,
                    orderCount: Number(r.order_count ?? 0),
                    amount: Number(r.amount ?? 0),
                    paidAmount: Number(r.paid_amount ?? 0),
                    outstandingAmount: Number(r.outstanding_amount ?? 0),
                }));
            } catch {
                salesTrend = [];
            }
        }

        type RecentRow = {
            id: number;
            order_number: string;
            recipient_name: string;
            created_at: string;
            total_amount: number;
            status: string;
            has_expert_quote?: number;
            expert_quote_data?: string | null;
        };
        let recentRows: RecentRow[] = [];
        try {
            const r = await env.DB.prepare(`
                SELECT o.id, o.order_number, o.recipient_name, o.created_at, o.total_amount, o.status, o.has_expert_quote, o.expert_quote_data
                FROM orders o
                WHERE ${STORE_ORDERS}
                ORDER BY o.created_at DESC
                LIMIT 5
            `)
                .bind(storeId)
                .all() as { results: RecentRow[] };
            recentRows = r.results ?? [];
        } catch {
            try {
                const r = await env.DB.prepare(`
                SELECT o.id, o.order_number, o.recipient_name, o.created_at, o.total_amount, o.status
                FROM orders o
                WHERE ${STORE_ORDERS}
                ORDER BY o.created_at DESC
                LIMIT 5
            `)
                    .bind(storeId)
                    .all() as { results: RecentRow[] };
                recentRows = r.results ?? [];
            } catch {
                try {
                    const r = await env.DB.prepare(`
                    SELECT id, order_number, recipient_name, created_at, total_amount, status, has_expert_quote, expert_quote_data
                    FROM orders ORDER BY created_at DESC LIMIT 5
                `).all() as { results: RecentRow[] };
                    recentRows = r.results ?? [];
                } catch {
                    const r = await env.DB.prepare(`
                    SELECT id, order_number, recipient_name, created_at, total_amount, status
                    FROM orders ORDER BY created_at DESC LIMIT 5
                `).all() as { results: RecentRow[] };
                    recentRows = r.results ?? [];
                }
            }
        }

        const recentOrders = recentRows.map((r: RecentRow) => {
            let amount = Number(r.total_amount ?? 0);
            if (r.has_expert_quote && r.expert_quote_data) {
                try {
                    const expert = JSON.parse(r.expert_quote_data) as { total_amount?: number };
                    if (expert?.total_amount != null) amount = Number(expert.total_amount);
                } catch {
                    /* ignore */
                }
            }
            const displayAmount = correctDisplayAmount(amount) ?? Math.round(amount);
            return {
                id: Number(r.id),
                orderNumber: r.order_number,
                recipientName: r.recipient_name ?? '',
                createdAt: r.created_at,
                totalAmount: displayAmount,
                status: r.status || 'pending',
            };
        });

        let quotesThisMonth: number | null = null;
        try {
            const qRow = await env.DB.prepare(`
                SELECT COUNT(DISTINCT q.id) as c
                FROM quotes q
                WHERE q.created_at >= date('now','start of month')
                  AND EXISTS (
                    SELECT 1 FROM order_items oi
                    JOIN orders o ON o.id = oi.order_id
                    WHERE oi.quote_id = q.id AND ${STORE_ORDERS}
                  )
            `)
                .bind(storeId)
                .first() as { c: number } | null;
            quotesThisMonth = Number(qRow?.c ?? 0);
        } catch {
            try {
                const qRow = await env.DB.prepare(
                    `SELECT COUNT(*) as c FROM quotes WHERE created_at >= date('now','start of month')`
                ).first() as { c: number } | null;
                quotesThisMonth = Number(qRow?.c ?? 0);
            } catch {
                quotesThisMonth = null;
            }
        }

        let inquiriesNew: number | null = null;
        try {
            const iRow = await env.DB.prepare(`
                SELECT COUNT(*) as c FROM inquiries WHERE status = 'new' AND ${STORE_INQUIRIES}
            `)
                .bind(storeId)
                .first() as { c: number } | null;
            inquiriesNew = Number(iRow?.c ?? 0);
        } catch {
            try {
                const iRow = await env.DB.prepare(`SELECT COUNT(*) as c FROM inquiries WHERE status = 'new'`).first() as {
                    c: number;
                } | null;
                inquiriesNew = Number(iRow?.c ?? 0);
            } catch {
                inquiriesNew = null;
            }
        }

        let operatingRate: number | null = null;
        let operatingDetail: string | null = null;
        try {
            const opRate = await env.DB.prepare(
                `SELECT value FROM print_settings WHERE key = 'operating_rate' AND store_id = ?`
            )
                .bind(storeId)
                .first() as { value: string } | null;
            const opDetail = await env.DB.prepare(
                `SELECT value FROM print_settings WHERE key = 'operating_detail' AND store_id = ?`
            )
                .bind(storeId)
                .first() as { value: string } | null;
            if (opRate?.value != null && String(opRate.value).trim() !== '') {
                const n = parseFloat(String(opRate.value));
                if (!Number.isNaN(n)) operatingRate = n;
            }
            if (opDetail?.value != null && String(opDetail.value).trim() !== '') {
                operatingDetail = String(opDetail.value);
            }
        } catch {
            try {
                const opRate = await env.DB.prepare("SELECT value FROM print_settings WHERE key = 'operating_rate'").first() as {
                    value: string;
                } | null;
                const opDetail = await env.DB.prepare("SELECT value FROM print_settings WHERE key = 'operating_detail'").first() as {
                    value: string;
                } | null;
                if (opRate?.value != null && String(opRate.value).trim() !== '') {
                    const n = parseFloat(String(opRate.value));
                    if (!Number.isNaN(n)) operatingRate = n;
                }
                if (opDetail?.value != null && String(opDetail.value).trim() !== '') {
                    operatingDetail = String(opDetail.value);
                }
            } catch {
                operatingRate = null;
                operatingDetail = null;
            }
        }

        let trafficSources: { source: string; count: number }[] = [];
        try {
            const { results: sourceRows } = await env.DB.prepare(`
                SELECT source, COUNT(*) as count
                FROM traffic_logs
                WHERE created_at >= date('now', '-30 days')
                GROUP BY source
                ORDER BY count DESC
            `).all() as { results: { source: string; count: number }[] };
            trafficSources = sourceRows || [];
        } catch {
            trafficSources = [];
        }

        let visitorTrend: {
            date: string;
            pageViews: number;
            uniqueSessions: number;
            memberSessions: number;
            quotePageViews: number;
        }[] = [];

        try {
            const { results: visitorRows } = await env.DB.prepare(`
                SELECT date(created_at) as d,
                    COUNT(*) as page_views,
                    COUNT(DISTINCT session_id) as unique_sessions,
                    COUNT(DISTINCT CASE WHEN user_id IS NOT NULL THEN session_id END) as member_sessions,
                    SUM(CASE
                        WHEN path LIKE '/quote%'
                          OR path LIKE '/experience%'
                          OR path = '/quotes'
                        THEN 1 ELSE 0 END) as quote_page_views
                FROM traffic_logs
                WHERE created_at >= date('now', '-13 days')
                GROUP BY d
                ORDER BY d ASC
            `).all() as {
                results: {
                    d: string;
                    page_views: number;
                    unique_sessions: number;
                    member_sessions: number;
                    quote_page_views: number;
                }[];
            };
            visitorTrend = (visitorRows || []).map((r) => ({
                date: r.d,
                pageViews: Number(r.page_views ?? 0),
                uniqueSessions: Number(r.unique_sessions ?? 0),
                memberSessions: Number(r.member_sessions ?? 0),
                quotePageViews: Number(r.quote_page_views ?? 0),
            }));
        } catch {
            visitorTrend = [];
        }

        const dailyVisitors = visitorTrend.map((v) => ({
            date: v.date,
            count: v.uniqueSessions,
        }));

        let quoteFunnelTrend: {
            date: string;
            totalQuotes: number;
            ordered: number;
            incart: number;
            abandoned: number;
            draft: number;
        }[] = [];

        try {
            const { results: funnelRows } = await env.DB.prepare(`
                SELECT date(q.created_at) as d,
                    COUNT(*) as total_quotes,
                    SUM(CASE WHEN EXISTS (SELECT 1 FROM order_items oi WHERE oi.quote_id = q.id) THEN 1 ELSE 0 END) as ordered_cnt,
                    SUM(CASE WHEN NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.quote_id = q.id)
                        AND (SELECT COUNT(*) FROM cart c WHERE c.quote_id = q.id) > 0 THEN 1 ELSE 0 END) as incart_cnt,
                    SUM(CASE WHEN NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.quote_id = q.id)
                        AND (SELECT COUNT(*) FROM cart c WHERE c.quote_id = q.id) = 0
                        AND COALESCE(q.total_price, 0) > 0 THEN 1 ELSE 0 END) as abandoned_cnt,
                    SUM(CASE WHEN COALESCE(q.total_price, 0) = 0 THEN 1 ELSE 0 END) as draft_cnt
                FROM quotes q
                WHERE q.created_at >= date('now', '-13 days')
                GROUP BY d
                ORDER BY d ASC
            `).all() as {
                results: {
                    d: string;
                    total_quotes: number;
                    ordered_cnt: number;
                    incart_cnt: number;
                    abandoned_cnt: number;
                    draft_cnt: number;
                }[];
            };
            quoteFunnelTrend = (funnelRows || []).map((r) => ({
                date: r.d,
                totalQuotes: Number(r.total_quotes ?? 0),
                ordered: Number(r.ordered_cnt ?? 0),
                incart: Number(r.incart_cnt ?? 0),
                abandoned: Number(r.abandoned_cnt ?? 0),
                draft: Number(r.draft_cnt ?? 0),
            }));
        } catch {
            quoteFunnelTrend = [];
        }

        const quoteFunnelTotals = quoteFunnelTrend.reduce(
            (acc, p) => ({
                total: acc.total + p.totalQuotes,
                ordered: acc.ordered + p.ordered,
                incart: acc.incart + p.incart,
                abandoned: acc.abandoned + p.abandoned,
                draft: acc.draft + p.draft,
            }),
            { total: 0, ordered: 0, incart: 0, abandoned: 0, draft: 0 }
        );
        const quoteFunnelSummary = {
            ...quoteFunnelTotals,
            conversionRate:
                quoteFunnelTotals.total > 0
                    ? Math.round((quoteFunnelTotals.ordered / quoteFunnelTotals.total) * 1000) / 10
                    : 0,
        };

        let quoteTrafficSources: { source: string; count: number }[] = [];
        try {
            const { results: qSourceRows } = await env.DB.prepare(`
                SELECT COALESCE(NULLIF(TRIM(t.source), ''), 'direct') as source, COUNT(*) as cnt
                FROM quotes q
                LEFT JOIN (
                    SELECT session_id, source FROM traffic_logs GROUP BY session_id
                ) t ON q.session_id = t.session_id
                WHERE q.created_at >= date('now', '-13 days')
                GROUP BY source
                ORDER BY cnt DESC
                LIMIT 6
            `).all() as { results: { source: string; cnt: number }[] };
            quoteTrafficSources = (qSourceRows || []).map((r) => ({
                source: r.source || 'direct',
                count: Number(r.cnt ?? 0),
            }));
        } catch {
            quoteTrafficSources = [];
        }

        return NextResponse.json({
            success: true,
            data: {
                totalSales: Math.round(totalSalesThisMonth),
                salesChangePercent,
                newOrdersCount,
                pendingOrdersCount,
                totalUsers,
                newSignupsCount,
                quotesThisMonth,
                inquiriesNew,
                operatingRate,
                operatingDetail,
                salesTrend,
                recentOrders,
                trafficSources,
                visitorTrend,
                dailyVisitors,
                quoteFunnelTrend,
                quoteFunnelSummary,
                quoteTrafficSources,
            },
        });
    } catch (e) {
        console.error('GET /api/admin/stats', e);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
