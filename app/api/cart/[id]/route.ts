import { NextRequest } from 'next/server';
import type { Env } from '@/env';
import { errorResponse, successResponse } from '@/lib/api-utils';

export const runtime = 'edge';

/**
 * PATCH /api/cart/[id] - 장바구니 아이템 수량 수정
 */
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const env = (process.env as any) as Env;
        const body = await request.json();

        if (!body.quantity || body.quantity < 1) {
            return errorResponse('유효한 수량을 입력해주세요', 400);
        }

        if (!env.DB) {
            return successResponse({ id: parseInt(id) }, '수량이 수정되었습니다 (개발 모드)');
        }

        await env.DB
            .prepare('UPDATE cart SET quantity = ? WHERE id = ?')
            .bind(body.quantity, parseInt(id))
            .run();

        return successResponse({ id: parseInt(id) }, '수량이 수정되었습니다');
    } catch (error: any) {
        console.error('PATCH /api/cart/[id] error:', error);
        return errorResponse(error.message || '수량 수정 실패', 500);
    }
}

/**
 * DELETE /api/cart/[id] - 장바구니 아이템 삭제
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const env = (process.env as any) as Env;

        if (!env.DB) {
            return successResponse({ id: parseInt(id) }, '아이템이 삭제되었습니다 (개발 모드)');
        }

        await env.DB
            .prepare('DELETE FROM cart WHERE id = ?')
            .bind(parseInt(id))
            .run();

        return successResponse({ id: parseInt(id) }, '아이템이 삭제되었습니다');
    } catch (error: any) {
        console.error('DELETE /api/cart/[id] error:', error);
        return errorResponse(error.message || '아이템 삭제 실패', 500);
    }
}
