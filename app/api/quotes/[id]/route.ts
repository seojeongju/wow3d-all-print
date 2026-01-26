import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { Env } from '@/env';
import { errorResponse, successResponse, requireAuth } from '@/lib/api-utils';

/**
 * GET /api/quotes/[id] - 특정 견적 조회
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const { env } = getCloudflareContext();

        if (!env?.DB) {
            return errorResponse('데이터베이스를 사용할 수 없습니다', 503);
        }

        const result = await env.DB
            .prepare('SELECT * FROM quotes WHERE id = ?')
            .bind(parseInt(id))
            .first();

        if (!result) {
            return errorResponse('견적을 찾을 수 없습니다', 404);
        }

        return successResponse(result);
    } catch (error: any) {
        console.error('GET /api/quotes/[id] error:', error);
        return errorResponse(error.message || '견적 조회 실패', 500);
    }
}

/**
 * DELETE /api/quotes/[id] - 견적 삭제 (본인만 가능)
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const { env } = getCloudflareContext();

        // 1. 인증 확인
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        if (!env?.DB) {
            return errorResponse('데이터베이스를 사용할 수 없습니다', 503);
        }

        const quoteId = parseInt(id);

        // 2. 소유권 확인 (또는 관리자)
        // 먼저 해당 견적이 존재하는지, 그리고 현재 사용자의 것인지 확인
        const quote = await env.DB
            .prepare('SELECT user_id FROM quotes WHERE id = ?')
            .bind(quoteId)
            .first<{ user_id: number }>();

        if (!quote) {
            return errorResponse('견적을 찾을 수 없습니다', 404);
        }

        // 관리자가 아니고, 본인의 견적이 아니라면 거부
        const isAdmin = await env.DB
            .prepare('SELECT role FROM users WHERE id = ?')
            .bind(auth.userId)
            .first<{ role: string }>()
            .then((res: { role?: string } | null) => res?.role === 'admin');

        if (!isAdmin && quote.user_id !== auth.userId) {
            return errorResponse('삭제 권한이 없습니다', 403);
        }

        // 3. 삭제 실행
        await env.DB
            .prepare('DELETE FROM quotes WHERE id = ?')
            .bind(quoteId)
            .run();

        return successResponse({ id: quoteId }, '견적이 삭제되었습니다');
    } catch (error: any) {
        console.error('DELETE /api/quotes/[id] error:', error);
        return errorResponse(error.message || '견적 삭제 실패', 500);
    }
}
