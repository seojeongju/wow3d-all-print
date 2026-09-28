import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { errorResponse, successResponse, requireAdminAuth } from '@/lib/api-utils';

/** 최근 N분 내 접속 신호가 있으면 현재 접속자로 판정 (클라이언트 heartbeat 60초) */
const ONLINE_WINDOW_MINUTES = 5;

type OnlineRow = { total?: number; members?: number };

/**
 * GET /api/admin/users/online - 현재 접속자 수 (관리자 페이지 제외, 관리자 전용)
 */
export async function GET(req: NextRequest) {
    try {
        const { env } = getCloudflareContext();
        if (!env?.DB) return errorResponse('DB를 사용할 수 없습니다', 503);

        const auth = await requireAdminAuth(req, env.DB);
        if (auth instanceof Response) return auth;

        const windowExpr = `datetime('now','-${ONLINE_WINDOW_MINUTES} minutes')`;
        let row: OnlineRow | null = null;
        let source: 'presence' | 'traffic' = 'presence';

        try {
            row = (await env.DB.prepare(
                `SELECT COUNT(*) AS total,
                        SUM(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END) AS members
                 FROM site_presence
                 WHERE last_seen >= ${windowExpr}`
            ).first()) as OnlineRow | null;
        } catch {
            // site_presence 미적용 환경: 최근 페이지뷰 세션으로 근사
            source = 'traffic';
            row = (await env.DB.prepare(
                `SELECT COUNT(DISTINCT session_id) AS total,
                        COUNT(DISTINCT CASE WHEN user_id IS NOT NULL THEN session_id END) AS members
                 FROM traffic_logs
                 WHERE created_at >= ${windowExpr}`
            ).first()) as OnlineRow | null;
        }

        const total = Number(row?.total ?? 0);
        const members = Math.min(total, Number(row?.members ?? 0));

        return successResponse({
            total,
            members,
            guests: total - members,
            windowMinutes: ONLINE_WINDOW_MINUTES,
            source,
            checkedAt: new Date().toISOString(),
        });
    } catch (e) {
        console.error('GET /api/admin/users/online', e);
        return errorResponse('현재 접속자 조회에 실패했습니다', 500);
    }
}
