import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { errorResponse, successResponse, requireAdminAuth } from '@/lib/api-utils';
import {
    aggregateCountTrend,
    parseStatsGranularity,
    statsSqlOffsetDays,
    type CountTrendPoint,
} from '@/lib/admin-stats-range';

/**
 * GET /api/admin/users/stats - 회원 가입 추이 (관리자 전용)
 * Query: granularity (day|week|month)
 */
export async function GET(req: NextRequest) {
    try {
        const { env } = getCloudflareContext();
        if (!env?.DB) return errorResponse('DB를 사용할 수 없습니다', 503);

        const auth = await requireAdminAuth(req, env.DB);
        if (auth instanceof Response) return auth;
        const { storeId } = auth;

        const granularity = parseStatsGranularity(req.nextUrl.searchParams.get('granularity'));
        const offsetDays = statsSqlOffsetDays(granularity);
        const sinceExpr =
            granularity === 'month'
                ? `date('now','start of month','-11 months')`
                : granularity === 'week'
                  ? `date('now','-${offsetDays + 6} days')`
                  : `date('now','-${offsetDays} days')`;

        const { results } = (await env.DB.prepare(
            `SELECT date(created_at) AS d, COUNT(*) AS c
             FROM users
             WHERE store_id = ? AND created_at >= ${sinceExpr}
             GROUP BY date(created_at)
             ORDER BY d ASC`
        )
            .bind(storeId)
            .all()) as { results?: { d: string | null; c: number }[] };

        const daily: CountTrendPoint[] = (results || [])
            .filter((r) => r.d)
            .map((r) => ({ date: String(r.d), count: Number(r.c) || 0 }));

        const summary = (await env.DB.prepare(
            `SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN created_at >= date('now') THEN 1 ELSE 0 END) AS today,
                SUM(CASE WHEN created_at >= date('now','-6 days') THEN 1 ELSE 0 END) AS last7,
                SUM(CASE WHEN created_at >= date('now','start of month') THEN 1 ELSE 0 END) AS this_month,
                SUM(CASE WHEN created_at >= date('now','start of month','-1 month')
                          AND created_at < date('now','start of month') THEN 1 ELSE 0 END) AS last_month
             FROM users
             WHERE store_id = ?`
        )
            .bind(storeId)
            .first()) as {
            total?: number;
            today?: number;
            last7?: number;
            this_month?: number;
            last_month?: number;
        } | null;

        const trend = aggregateCountTrend(daily, granularity);

        return successResponse({
            granularity,
            trend,
            periodTotal: trend.reduce((s, p) => s + p.count, 0),
            summary: {
                total: Number(summary?.total ?? 0),
                today: Number(summary?.today ?? 0),
                last7Days: Number(summary?.last7 ?? 0),
                thisMonth: Number(summary?.this_month ?? 0),
                lastMonth: Number(summary?.last_month ?? 0),
            },
        });
    } catch (e) {
        console.error('GET /api/admin/users/stats', e);
        return errorResponse('회원 가입 통계 조회에 실패했습니다', 500);
    }
}
