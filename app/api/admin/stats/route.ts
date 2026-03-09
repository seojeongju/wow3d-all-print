import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * GET /api/admin/stats - 대시보드 집계 (총 매출, 신규 주문, 사용자, 매출 추이, 최근 주문, 가동률)
 */
export async function GET(_req: NextRequest) {
    const { env } = getCloudflareContext();
    if (!env?.DB) {
        return NextResponse.json({ error: 'DB not available' }, { status: 503 });
    }

    try {
        // 1) 매출·주문 집계 (이번 달, 지난 달, 신규 주문 수, 대기 건수)
        const agg = await env.DB.prepare(`
            SELECT 
                COALESCE(SUM(CASE WHEN status != 'cancelled' AND created_at >= date('now','start of month') THEN total_amount ELSE 0 END), 0) as total_sales_this_month,
                COALESCE(SUM(CASE WHEN status != 'cancelled' AND created_at >= date('now','start of month','-1 month') AND created_at < date('now','start of month') THEN total_amount ELSE 0 END), 0) as total_sales_last_month,
                SUM(CASE WHEN created_at >= date('now','start of month') THEN 1 ELSE 0 END) as new_orders_count,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders_count
            FROM orders
        `).first() as Record<string, unknown> | null;

        const totalSalesThisMonth = Number(agg?.total_sales_this_month ?? 0);
        const totalSalesLastMonth = Number(agg?.total_sales_last_month ?? 1);
        const salesChangePercent = totalSalesLastMonth > 0
            ? Math.round(((totalSalesThisMonth - totalSalesLastMonth) / totalSalesLastMonth) * 1000) / 10
            : (totalSalesThisMonth > 0 ? 100 : 0);
        const newOrdersCount = Number(agg?.new_orders_count ?? 0);
        const pendingOrdersCount = Number(agg?.pending_orders_count ?? 0);

        // 2) 사용자: 전체, 이번 달 신규 가입
        const userTotal = await env.DB.prepare('SELECT COUNT(*) as c FROM users').first() as { c: number } | null;
        const userNew = await env.DB.prepare(`
            SELECT COUNT(*) as c FROM users WHERE created_at >= date('now','start of month')
        `).first() as { c: number } | null;
        const totalUsers = Number(userTotal?.c ?? 0);
        const newSignupsCount = Number(userNew?.c ?? 0);

        // 3) 최근 14일 매출 추이 (일별)
        const { results: trendRows } = await env.DB.prepare(`
            SELECT date(created_at) as d, SUM(total_amount) as amount
            FROM orders
            WHERE status != 'cancelled' AND created_at >= date('now','-14 days')
            GROUP BY d
            ORDER BY d ASC
        `).all() as { results: { d: string; amount: number }[] };

        const salesTrend = (trendRows || []).map((r: { d: string; amount: number }) => ({
            date: r.d,
            amount: Number(r.amount ?? 0),
        }));

        // 4) 최근 주문 5건 (id 포함, 상세 링크용)
        const { results: recentRows } = await env.DB.prepare(`
            SELECT id, order_number, recipient_name, created_at, total_amount
            FROM orders
            ORDER BY created_at DESC
            LIMIT 5
        `).all() as { results: { id: number; order_number: string; recipient_name: string; created_at: string; total_amount: number }[] };

        const recentOrders = (recentRows || []).map((r: { id: number; order_number: string; recipient_name: string; created_at: string; total_amount: number }) => ({
            id: Number(r.id),
            orderNumber: r.order_number,
            recipientName: r.recipient_name,
            createdAt: r.created_at,
            totalAmount: Number(r.total_amount ?? 0),
        }));

        // 5) 이번 달 견적 요청, 미확인 문의
        let quotesThisMonth = 0;
        let inquiriesNew = 0;
        try {
            const qRow = await env.DB.prepare(`SELECT COUNT(*) as c FROM quotes WHERE created_at >= date('now','start of month')`).first() as { c: number } | null;
            quotesThisMonth = Number(qRow?.c ?? 0);
        } catch { /* quotes 테이블 없을 수 있음 */ }
        try {
            const iRow = await env.DB.prepare(`SELECT COUNT(*) as c FROM inquiries WHERE status = 'new'`).first() as { c: number } | null;
            inquiriesNew = Number(iRow?.c ?? 0);
        } catch { /* inquiries 테이블 없을 수 있음 */ }

        // 6) 가동률 (print_settings 또는 기본값)
        let operatingRate = 82;
        let operatingDetail = '프린터 12/15대 가동중';
        try {
            const opRate = await env.DB.prepare("SELECT value FROM print_settings WHERE key = 'operating_rate'").first() as { value: string } | null;
            const opDetail = await env.DB.prepare("SELECT value FROM print_settings WHERE key = 'operating_detail'").first() as { value: string } | null;
            if (opRate?.value) operatingRate = parseFloat(opRate.value);
            if (opDetail?.value) operatingDetail = opDetail.value;
        } catch { /* print_settings 없을 수 있음 */ }

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
            },
        });
    } catch (e) {
        console.error('GET /api/admin/stats', e);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
