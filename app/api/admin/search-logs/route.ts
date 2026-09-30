import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { errorResponse, successResponse, requireAdminAuth } from '@/lib/api-utils';

const PERIODS = new Set([7, 30, 90, 365]);
const RANK_LIMIT = 30;
const RECENT_LIMIT = 20;

/**
 * GET /api/admin/search-logs - 사이트 검색어 분석
 * Query: days=7|30|90|365, page(최근 검색 목록)
 */
export async function GET(req: NextRequest) {
    try {
        const { env } = getCloudflareContext();
        if (!env?.DB) return errorResponse('DB를 사용할 수 없습니다', 503);

        const auth = await requireAdminAuth(req, env.DB);
        if (auth instanceof Response) return auth;

        const params = req.nextUrl.searchParams;
        const daysParam = parseInt(params.get('days') || '30', 10);
        const days = PERIODS.has(daysParam) ? daysParam : 30;
        const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
        const since = `-${days} days`;

        const [summary, topQueries, zeroQueries, topClicks, recentCount, recent] = await Promise.all([
            env.DB.prepare(
                `SELECT
                    COUNT(*) AS total,
                    COUNT(DISTINCT visitor_id) AS visitors,
                    COUNT(DISTINCT normalized) AS queries,
                    SUM(CASE WHEN result_count = 0 THEN 1 ELSE 0 END) AS zero_count,
                    SUM(CASE WHEN clicked_url IS NOT NULL THEN 1 ELSE 0 END) AS click_count
                 FROM search_logs WHERE created_at > datetime('now', ?)`
            )
                .bind(since)
                .first<Record<string, number | null>>(),
            env.DB.prepare(
                `SELECT normalized AS query, COUNT(*) AS count,
                    COUNT(DISTINCT visitor_id) AS visitors,
                    ROUND(AVG(result_count), 1) AS avg_results,
                    SUM(CASE WHEN clicked_url IS NOT NULL THEN 1 ELSE 0 END) AS clicks
                 FROM search_logs WHERE created_at > datetime('now', ?)
                 GROUP BY normalized ORDER BY count DESC, visitors DESC LIMIT ?`
            )
                .bind(since, RANK_LIMIT)
                .all(),
            env.DB.prepare(
                `SELECT normalized AS query, COUNT(*) AS count,
                    COUNT(DISTINCT visitor_id) AS visitors, MAX(created_at) AS last_at
                 FROM search_logs WHERE result_count = 0 AND created_at > datetime('now', ?)
                 GROUP BY normalized ORDER BY count DESC, last_at DESC LIMIT ?`
            )
                .bind(since, RANK_LIMIT)
                .all(),
            env.DB.prepare(
                `SELECT clicked_url AS url, COUNT(*) AS count
                 FROM search_logs WHERE clicked_url IS NOT NULL AND created_at > datetime('now', ?)
                 GROUP BY clicked_url ORDER BY count DESC LIMIT 15`
            )
                .bind(since)
                .all(),
            env.DB.prepare(`SELECT COUNT(*) AS cnt FROM search_logs WHERE created_at > datetime('now', ?)`)
                .bind(since)
                .first<{ cnt: number }>(),
            env.DB.prepare(
                `SELECT id, query, result_count, locale, source, clicked_url, created_at
                 FROM search_logs WHERE created_at > datetime('now', ?)
                 ORDER BY id DESC LIMIT ? OFFSET ?`
            )
                .bind(since, RECENT_LIMIT, (page - 1) * RECENT_LIMIT)
                .all(),
        ]);

        const total = Number(summary?.total ?? 0);
        const recentTotal = Number(recentCount?.cnt ?? 0);
        return successResponse({
            days,
            summary: {
                total,
                visitors: Number(summary?.visitors ?? 0),
                queries: Number(summary?.queries ?? 0),
                zeroCount: Number(summary?.zero_count ?? 0),
                clickCount: Number(summary?.click_count ?? 0),
            },
            topQueries: topQueries.results || [],
            zeroQueries: zeroQueries.results || [],
            topClicks: topClicks.results || [],
            recent: recent.results || [],
            pagination: { page, limit: RECENT_LIMIT, total: recentTotal, totalPages: Math.max(1, Math.ceil(recentTotal / RECENT_LIMIT)) },
        });
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('no such table')) {
            return errorResponse('검색 기록 테이블이 아직 없습니다 (schema_search_logs.sql 적용 필요)', 503);
        }
        console.error('GET /api/admin/search-logs', e);
        return errorResponse('검색어 분석 조회 실패', 500);
    }
}
