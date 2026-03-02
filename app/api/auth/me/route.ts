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

/**
 * PATCH /api/auth/me - 내 정보 수정
 */
export async function PATCH(request: NextRequest) {
    try {
        const { env } = getCloudflareContext();
        const body = await request.json();

        // 인증 확인
        const auth = await requireAuth(request);
        if (auth instanceof Response) {
            return auth;
        }

        if (!env?.DB) {
            return errorResponse('데이터베이스를 사용할 수 없습니다', 503);
        }

        const { name, phone } = body;

        // 필수 필드 체크 (최소한 이름은 있어야함)
        if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
            return errorResponse('이름을 입력해주세요', 400);
        }

        await env.DB
            .prepare(`
                UPDATE users 
                SET 
                    name = COALESCE(?, name),
                    phone = COALESCE(?, phone),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `)
            .bind(name || null, phone || null, auth.userId)
            .run();

        // 업데이트된 정보 다시 조회
        const updatedUser = await env.DB
            .prepare('SELECT id, email, name, phone, created_at FROM users WHERE id = ?')
            .bind(auth.userId)
            .first();

        return successResponse(updatedUser, '정보가 수정되었습니다');
    } catch (error: any) {
        console.error('PATCH /api/auth/me error:', error);
        return errorResponse(error.message || '정보 수정 실패', 500);
    }
}
