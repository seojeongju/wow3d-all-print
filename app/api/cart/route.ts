import { NextRequest } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import type { Env } from '@/env';
import { errorResponse, successResponse, generateSessionId } from '@/lib/api-utils';

export const runtime = 'edge';

/**
 * GET /api/cart - 장바구니 조회
 */
export async function GET(request: NextRequest) {
    try {
        const { env } = getRequestContext() as any;
        const sessionId = request.headers.get('X-Session-ID');
        const userId = request.headers.get('X-User-ID');

        if (!sessionId && !userId) {
            return errorResponse('세션 ID 또는 사용자 ID가 필요합니다', 400);
        }

        if (!env.DB) {
            return successResponse([]);
        }

        let query: string;
        let bindings: any[];

        if (userId) {
            query = `
        SELECT c.*, q.* 
        FROM cart c 
        JOIN quotes q ON c.quote_id = q.id 
        WHERE c.user_id = ? 
        ORDER BY c.created_at DESC
      `;
            bindings = [parseInt(userId)];
        } else {
            query = `
        SELECT c.*, q.* 
        FROM cart c 
        JOIN quotes q ON c.quote_id = q.id 
        WHERE c.session_id = ? 
        ORDER BY c.created_at DESC
      `;
            bindings = [sessionId];
        }

        const result = await env.DB.prepare(query).bind(...bindings).all();
        return successResponse(result.results || []);
    } catch (error: any) {
        console.error('GET /api/cart error:', error);
        return errorResponse(error.message || '장바구니 조회 실패', 500);
    }
}

/**
 * POST /api/cart - 장바구니에 추가
 */
export async function POST(request: NextRequest) {
    try {
        const { env } = getRequestContext() as any;
        const body = await request.json();

        if (!body.quoteId) {
            return errorResponse('견적 ID가 필요합니다', 400);
        }

        let sessionId = request.headers.get('X-Session-ID');
        const userId = request.headers.get('X-User-ID');

        if (!sessionId && !userId) {
            sessionId = generateSessionId();
        }

        if (!env.DB) {
            return successResponse(
                { id: Math.floor(Math.random() * 10000), sessionId },
                '장바구니에 추가되었습니다 (개발 모드)'
            );
        }

        // 이미 장바구니에 있는지 확인
        const checkQuery = userId
            ? 'SELECT * FROM cart WHERE quote_id = ? AND user_id = ?'
            : 'SELECT * FROM cart WHERE quote_id = ? AND session_id = ?';

        const existingItem = await env.DB
            .prepare(checkQuery)
            .bind(body.quoteId, userId ? parseInt(userId) : sessionId)
            .first();

        if (existingItem) {
            // 수량 업데이트
            const updateQuery = 'UPDATE cart SET quantity = quantity + ? WHERE id = ?';
            await env.DB
                .prepare(updateQuery)
                .bind(body.quantity || 1, (existingItem as any).id)
                .run();

            return successResponse(
                { id: (existingItem as any).id },
                '수량이 업데이트되었습니다'
            );
        }

        // 새로 추가
        const insertQuery = `
      INSERT INTO cart (user_id, session_id, quote_id, quantity)
      VALUES (?, ?, ?, ?)
    `;

        const result = await env.DB
            .prepare(insertQuery)
            .bind(
                userId ? parseInt(userId) : null,
                sessionId,
                body.quoteId,
                body.quantity || 1
            )
            .run();

        return successResponse(
            {
                id: result.meta.last_row_id,
                sessionId: sessionId || undefined
            },
            '장바구니에 추가되었습니다'
        );
    } catch (error: any) {
        console.error('POST /api/cart error:', error);
        return errorResponse(error.message || '장바구니 추가 실패', 500);
    }
}

/**
 * DELETE /api/cart - 장바구니 비우기
 */
export async function DELETE(request: NextRequest) {
    try {
        const { env } = getRequestContext() as any;
        const sessionId = request.headers.get('X-Session-ID');
        const userId = request.headers.get('X-User-ID');

        if (!sessionId && !userId) {
            return errorResponse('세션 ID 또는 사용자 ID가 필요합니다', 400);
        }

        if (!env.DB) {
            return successResponse({}, '장바구니가 비워졌습니다 (개발 모드)');
        }

        const query = userId
            ? 'DELETE FROM cart WHERE user_id = ?'
            : 'DELETE FROM cart WHERE session_id = ?';

        await env.DB
            .prepare(query)
            .bind(userId ? parseInt(userId) : sessionId)
            .run();

        return successResponse({}, '장바구니가 비워졌습니다');
    } catch (error: any) {
        console.error('DELETE /api/cart error:', error);
        return errorResponse(error.message || '장바구니 비우기 실패', 500);
    }
}
