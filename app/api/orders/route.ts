import { NextRequest } from 'next/server';
import type { Env } from '@/env';
import { errorResponse, successResponse, requireAuth, generateOrderNumber } from '@/lib/api-utils';

export const runtime = 'edge';

/**
 * GET /api/orders - 주문 목록 조회
 */
export async function GET(request: NextRequest) {
    try {
        const env = (process.env as any) as Env;

        // 인증 확인
        const auth = await requireAuth(request);
        if (auth instanceof Response) {
            return auth;
        }

        if (!env.DB) {
            return successResponse([]);
        }

        // 주문 목록 조회
        const orders = await env.DB
            .prepare(`
        SELECT * FROM orders 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `)
            .bind(auth.userId)
            .all();

        // 각 주문의 아이템 조회
        const ordersWithItems = await Promise.all(
            (orders.results || []).map(async (order: any) => {
                const items = await env.DB!
                    .prepare(`
            SELECT oi.*, q.*
            FROM order_items oi
            JOIN quotes q ON oi.quote_id = q.id
            WHERE oi.order_id = ?
          `)
                    .bind(order.id)
                    .all();

                return {
                    ...order,
                    items: items.results || [],
                };
            })
        );

        return successResponse(ordersWithItems);
    } catch (error: any) {
        console.error('GET /api/orders error:', error);
        return errorResponse(error.message || '주문 목록 조회 실패', 500);
    }
}

/**
 * POST /api/orders - 주문 생성
 */
export async function POST(request: NextRequest) {
    try {
        const env = (process.env as any) as Env;

        // 인증 확인
        const auth = await requireAuth(request);
        if (auth instanceof Response) {
            return auth;
        }

        const body = await request.json();

        // 필수 필드 검증
        if (!body.recipientName || !body.recipientPhone || !body.shippingAddress) {
            return errorResponse('배송 정보를 모두 입력해주세요', 400);
        }

        if (!body.cartItems || body.cartItems.length === 0) {
            return errorResponse('주문할 상품이 없습니다', 400);
        }

        if (!env.DB) {
            return errorResponse('데이터베이스를 사용할 수 없습니다', 503);
        }

        // 주문 번호 생성
        const orderNumber = generateOrderNumber();

        // 총 금액 계산
        const totalAmount = body.cartItems.reduce(
            (sum: number, item: any) => sum + item.totalPrice * item.quantity,
            0
        );

        // 주문 생성
        const orderResult = await env.DB
            .prepare(`
        INSERT INTO orders (
          user_id, order_number, 
          recipient_name, recipient_phone, shipping_address, shipping_postal_code,
          total_amount, customer_note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
            .bind(
                auth.userId,
                orderNumber,
                body.recipientName,
                body.recipientPhone,
                body.shippingAddress,
                body.shippingPostalCode || null,
                totalAmount,
                body.customerNote || null
            )
            .run();

        const orderId = orderResult.meta.last_row_id;

        if (!orderId) {
            return errorResponse('주문 생성 실패', 500);
        }

        // 주문 아이템 생성
        for (const item of body.cartItems) {
            await env.DB
                .prepare(`
          INSERT INTO order_items (order_id, quote_id, quantity, unit_price, subtotal)
          VALUES (?, ?, ?, ?, ?)
        `)
                .bind(
                    orderId,
                    item.quoteId,
                    item.quantity,
                    item.totalPrice,
                    item.totalPrice * item.quantity
                )
                .run();
        }

        // 장바구니 비우기
        await env.DB
            .prepare('DELETE FROM cart WHERE user_id = ?')
            .bind(auth.userId)
            .run();

        // 배송 추적 레코드 생성
        await env.DB
            .prepare('INSERT INTO shipments (order_id) VALUES (?)')
            .bind(orderId)
            .run();

        return successResponse(
            {
                orderId,
                orderNumber,
                totalAmount,
            },
            '주문이 완료되었습니다'
        );
    } catch (error: any) {
        console.error('POST /api/orders error:', error);
        return errorResponse(error.message || '주문 생성 실패', 500);
    }
}
