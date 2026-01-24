import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { Env } from '@/env';
import { errorResponse, successResponse } from '@/lib/api-utils';

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
 * DELETE /api/quotes/[id] - 견적 삭제
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const { env } = getCloudflareContext();

        if (!env?.DB) {
            return errorResponse('데이터베이스를 사용할 수 없습니다', 503);
        }

        await env.DB
            .prepare('DELETE FROM quotes WHERE id = ?')
            .bind(parseInt(id))
            .run();

        return successResponse({ id: parseInt(id) }, '견적이 삭제되었습니다');
    } catch (error: any) {
        console.error('DELETE /api/quotes/[id] error:', error);
        return errorResponse(error.message || '견적 삭제 실패', 500);
    }
}
