import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { Env } from '@/env';
import { errorResponse, successResponse, requireAuth, requireAuthOrGuest, generateOrderNumber } from '@/lib/api-utils';

/**
 * GET /api/orders - 주문 목록 조회
 */
export async function GET(request: NextRequest) {
    try {
        let env: { DB?: Env['DB'] } | undefined;
        try {
            env = getCloudflareContext().env;
        } catch {
            env = undefined;
        }

        // 인증 확인
        const auth = await requireAuth(request);
        if (auth instanceof Response) {
            return auth;
        }

        if (!env?.DB) {
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

        // 데이터 변환 (snake_case -> camelCase)
        const formattedOrders = await Promise.all(
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
                    id: order.id,
                    userId: order.user_id,
                    orderNumber: order.order_number,
                    recipientName: order.recipient_name,
                    recipientPhone: order.recipient_phone,
                    shippingAddress: order.shipping_address,
                    shippingPostalCode: order.shipping_postal_code,
                    totalAmount: order.total_amount,
                    status: order.status,
                    paymentMethod: order.payment_method,
                    paymentStatus: order.payment_status,
                    customerNote: order.customer_note,
                    adminNote: order.admin_note,
                    createdAt: order.created_at,
                    updatedAt: order.updated_at,
                    items: (items.results || []).map((item: any) => ({
                        id: item.id,
                        orderId: item.order_id,
                        quoteId: item.quote_id,
                        quantity: item.quantity,
                        unitPrice: item.unit_price,
                        subtotal: item.subtotal,
                        createdAt: item.created_at,
                        quote: {
                            id: item.quote_id, // items 조회 시 quotes 테이블과 조인했으므로 quote 정보도 포함됨
                            fileName: item.file_name,
                            fileSize: item.file_size,
                            fileUrl: item.file_url,
                            printMethod: item.print_method,
                            totalPrice: item.total_price,
                            // 필요한 경우 다른 quote 필드도 추가
                        }
                    })),
                };
            })
        );

        return successResponse(formattedOrders);
    } catch (error: any) {
        console.error('GET /api/orders error:', error);
        return errorResponse(error.message || '주문 목록 조회 실패', 500);
    }
}

/**
 * POST /api/orders - 주문 생성 (회원·비회원 공용)
 * - 회원: Authorization + X-User-ID, user_id로 저장
 * - 비회원: X-Session-ID, guest_email 필수, user_id=null, session_id 저장
 */
export async function POST(request: NextRequest) {
    try {
        const { env } = getCloudflareContext();

        const auth = await requireAuthOrGuest(request);
        if (auth instanceof Response) return auth;

        const body = await request.json();

        if (!body.recipientName || !body.recipientPhone || !body.shippingAddress) {
            return errorResponse('배송 정보를 모두 입력해주세요', 400);
        }
        if (!body.cartItems || body.cartItems.length === 0) {
            return errorResponse('주문할 상품이 없습니다', 400);
        }
        if (auth.isGuest && !(body.guestEmail && String(body.guestEmail).trim())) {
            return errorResponse('비회원 주문 시 연락용 이메일을 입력해주세요', 400);
        }

        if (!env?.DB) {
            return errorResponse('데이터베이스를 사용할 수 없습니다', 503);
        }

        const orderNumber = generateOrderNumber();
        const totalAmount = body.cartItems.reduce(
            (sum: number, item: any) => sum + item.totalPrice * item.quantity,
            0
        );

        const isGuest = auth.isGuest;
        const orderResult = await env.DB
            .prepare(`
        INSERT INTO orders (
          user_id, session_id, guest_email, order_number,
          recipient_name, recipient_phone, shipping_address, shipping_postal_code,
          total_amount, customer_note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
            .bind(
                isGuest ? null : auth.userId,
                isGuest ? auth.sessionId : null,
                isGuest ? String(body.guestEmail).trim() : null,
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
        if (!orderId) return errorResponse('주문 생성 실패', 500);

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

        // 주문한 quote_id만 장바구니에서 삭제 (선택 주문 지원)
        const quoteIds = [...new Set((body.cartItems as { quoteId: number }[]).map((x) => x.quoteId))];
        if (quoteIds.length > 0) {
            const placeholders = quoteIds.map(() => '?').join(',');
            if (isGuest) {
                await env.DB.prepare(`DELETE FROM cart WHERE session_id = ? AND quote_id IN (${placeholders})`)
                    .bind(auth.sessionId, ...quoteIds)
                    .run();
            } else {
                await env.DB.prepare(`DELETE FROM cart WHERE user_id = ? AND quote_id IN (${placeholders})`)
                    .bind(auth.userId, ...quoteIds)
                    .run();
            }
        }

        await env.DB.prepare('INSERT INTO shipments (order_id) VALUES (?)').bind(orderId).run();

        return successResponse(
            { orderId, orderNumber, totalAmount, isGuest },
            '주문이 완료되었습니다'
        );
    } catch (error: any) {
        console.error('POST /api/orders error:', error);
        return errorResponse(error.message || '주문 생성 실패', 500);
    }
}
