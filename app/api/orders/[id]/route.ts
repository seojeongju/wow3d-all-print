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

/**
 * DELETE /api/orders/[id] - 주문 취소
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const { env } = getCloudflareContext();

        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        if (!env?.DB) return errorResponse('데이터베이스 오류', 503);

        // 'pending' 상태인 본인 주문만 취소 가능
        const order = await env.DB
            .prepare('SELECT status FROM orders WHERE id = ? AND user_id = ?')
            .bind(parseInt(id), auth.userId)
            .first();

        if (!order) return errorResponse('주문을 찾을 수 없습니다', 404);
        if ((order as any).status !== 'pending') {
            return errorResponse('이미 진행 중인 주문은 취소할 수 없습니다. 고객센터에 문의해 주세요.', 400);
        }

        await env.DB
            .prepare("UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .bind(parseInt(id))
            .run();

        return successResponse(null, '주문이 취소되었습니다');
    } catch (error: any) {
        console.error('DELETE /api/orders/[id] error:', error);
        return errorResponse(error.message || '주문 취소 실패', 500);
    }
}

/**
 * PATCH /api/orders/[id] - 주문 정보 수정
 */
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const { env } = getCloudflareContext();
        const body = await request.json();

        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        if (!env?.DB) return errorResponse('데이터베이스 오류', 503);

        const order: any = await env.DB
            .prepare('SELECT status, total_amount FROM orders WHERE id = ? AND user_id = ?')
            .bind(parseInt(id), auth.userId)
            .first();

        if (!order) return errorResponse('주문을 찾을 수 없습니다', 404);
        if (order.status !== 'pending') {
            return errorResponse('이미 진행 중인 주문은 수정할 수 없습니다.', 400);
        }

        // 수량 수정이 포함된 경우
        if (body.items && Array.isArray(body.items)) {
            let newTotalAmount = 0;
            for (const item of body.items) {
                const subtotal = item.unitPrice * item.quantity;
                newTotalAmount += subtotal;

                await env.DB
                    .prepare('UPDATE order_items SET quantity = ?, subtotal = ? WHERE order_id = ? AND id = ?')
                    .bind(item.quantity, subtotal, parseInt(id), item.id)
                    .run();
            }

            await env.DB
                .prepare('UPDATE orders SET total_amount = ? WHERE id = ?')
                .bind(newTotalAmount, parseInt(id))
                .run();
        }

        // 배송 정보 수정
        await env.DB
            .prepare(`
                UPDATE orders SET 
                    recipient_name = COALESCE(?, recipient_name),
                    recipient_phone = COALESCE(?, recipient_phone),
                    shipping_address = COALESCE(?, shipping_address),
                    shipping_postal_code = COALESCE(?, shipping_postal_code),
                    customer_note = COALESCE(?, customer_note),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `)
            .bind(
                body.recipientName || null,
                body.recipientPhone || null,
                body.shippingAddress || null,
                body.shippingPostalCode || null,
                body.customerNote || null,
                parseInt(id)
            )
            .run();

        return successResponse(null, '주문 정보가 수정되었습니다');
    } catch (error: any) {
        console.error('PATCH /api/orders/[id] error:', error);
        return errorResponse(error.message || '주문 수정 실패', 500);
    }
}
