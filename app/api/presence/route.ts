import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * POST /api/presence - 현재 접속자 집계용 heartbeat (세션당 last_seen 갱신)
 */
export async function POST(request: NextRequest) {
    try {
        const { env } = getCloudflareContext();
        if (!env?.DB) return errorResponse('DB not available', 503);

        const body = (await request.json().catch(() => ({}))) as {
            sessionId?: string;
            path?: string;
        };
        const sessionId = String(body.sessionId || '').trim().slice(0, 128);
        if (!sessionId) return errorResponse('sessionId가 필요합니다', 400);

        const path = String(body.path || '/').slice(0, 300);
        const userIdHeader = request.headers.get('X-User-ID');
        const userId = userIdHeader ? parseInt(userIdHeader, 10) : NaN;

        await env.DB.prepare(
            `INSERT INTO site_presence (session_id, user_id, path, last_seen)
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(session_id) DO UPDATE SET
                user_id = COALESCE(excluded.user_id, site_presence.user_id),
                path = excluded.path,
                last_seen = CURRENT_TIMESTAMP`
        )
            .bind(sessionId, Number.isFinite(userId) ? userId : null, path)
            .run();

        return successResponse({ ok: true });
    } catch (error) {
        console.error('POST /api/presence error:', error);
        return errorResponse('Failed to record presence', 500);
    }
}
