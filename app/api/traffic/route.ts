import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * POST /api/traffic - 사용자 유입 정보 기록
 */
export async function POST(request: NextRequest) {
    try {
        const { env } = getCloudflareContext();
        if (!env?.DB) {
            return errorResponse('DB not available', 503);
        }

        const body = await request.json();
        const {
            source,
            medium,
            campaign,
            referrerUrl,
            path,
            sessionId
        } = body;

        // X-User-ID 헤더에서 사용자 ID 추출 (로그인 상태인 경우)
        const userIdHeader = request.headers.get('X-User-ID');
        const userId = userIdHeader ? parseInt(userIdHeader, 10) : null;

        // 방문자 IP (Cloudflare 헤더 활용)
        const ipAddress = request.headers.get('cf-connecting-ip') || 
                          request.headers.get('x-forwarded-for') || 
                          null;

        await env.DB.prepare(`
            INSERT INTO traffic_logs (
                session_id, user_id, source, medium, campaign, 
                referrer_url, path, ip_address
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            sessionId || null,
            userId && !isNaN(userId) ? userId : null,
            source || 'direct',
            medium || 'none',
            campaign || null,
            referrerUrl || null,
            path || '/',
            ipAddress
        ).run();

        return successResponse({ recorded: true });
    } catch (error: any) {
        console.error('POST /api/traffic error:', error);
        return errorResponse(error.message || 'Failed to record traffic', 500);
    }
}
