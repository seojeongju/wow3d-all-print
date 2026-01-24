import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { Env } from '@/env';
import { errorResponse, successResponse, requireAuth } from '@/lib/api-utils';

/**
 * GET /api/auth/me - 현재 사용자 정보 조회
 */
export async function GET(request: NextRequest) {
    try {
        const { env } = getCloudflareContext();

        // 인증 확인
        const auth = await requireAuth(request);
        if (auth instanceof Response) {
            return auth;
        }

        if (!env?.DB) {
            return errorResponse('데이터베이스를 사용할 수 없습니다', 503);
        }

        // 사용자 정보 조회
        const user = await env.DB
            .prepare('SELECT id, email, name, phone, created_at FROM users WHERE id = ?')
            .bind(auth.userId)
            .first();

        if (!user) {
            return errorResponse('사용자를 찾을 수 없습니다', 404);
        }

        return successResponse(user);
    } catch (error: any) {
        console.error('GET /api/auth/me error:', error);
        return errorResponse(error.message || '사용자 정보 조회 실패', 500);
    }
}
