import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { Env } from '@/env';
import { errorResponse, successResponse, requireAuth } from '@/lib/api-utils';

/**
 * GET /api/orders/[id] - 특정 주문 상세 조회
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const { env } = getCloudflareContext();

        // 인증 확인
        const auth = await requireAuth(request);
        if (auth instanceof Response) {
            return auth;
        }

        if (!env?.DB) {
            return errorResponse('데이터베이스를 사용할 수 없습니다', 503);
        }

        // 주문 조회
        const order = await env.DB
            .prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
            .bind(parseInt(id), auth.userId)
            .first();

        if (!order) {
            return errorResponse('주문을 찾을 수 없습니다', 404);
        }

        // 주문 아이템 조회
        const items = await env.DB
            .prepare(`
        SELECT oi.*, q.*
        FROM order_items oi
        JOIN quotes q ON oi.quote_id = q.id
        WHERE oi.order_id = ?
      `)
            .bind(parseInt(id))
            .all();

        // 배송 정보 조회
        const shipment = await env.DB
            .prepare('SELECT * FROM shipments WHERE order_id = ?')
            .bind(parseInt(id))
            .first();

        return successResponse({
            ...order,
            items: items.results || [],
            shipment,
        });
    } catch (error: any) {
        console.error('GET /api/orders/[id] error:', error);
        return errorResponse(error.message || '주문 조회 실패', 500);
    }
}
