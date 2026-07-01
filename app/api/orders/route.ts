import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { Env } from '@/env';
import { errorResponse, successResponse, requireAuth, requireAuthOrGuest, generateOrderNumber } from '@/lib/api-utils';
import { normalizeAmountBeforeSave } from '@/lib/amount-display';
import { sendEmail, escapeHtml } from '@/lib/mail-utils';
import { processAutoOrderStatusTransitions } from '@/lib/order-auto-status';

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

        await processAutoOrderStatusTransitions(env.DB);

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

        // 사전 검증: quoteId가 유효한 주문 항목만 허용
        const validCartItems = (body.cartItems as any[]).filter((item) => {
            const quoteId = Number(item?.quoteId);
            return Number.isInteger(quoteId) && quoteId > 0;
        });
        if (validCartItems.length === 0) {
            return errorResponse('유효한 주문 항목이 없습니다. 장바구니를 다시 확인해 주세요.', 400);
        }

        const orderNumber = generateOrderNumber();
        const totalAmount = normalizeAmountBeforeSave(
            validCartItems.reduce((sum: number, item: any) => {
                const unitPrice = normalizeAmountBeforeSave(item.totalPrice);
                const qty = Math.max(1, Number(item.quantity) || 1);
                return sum + unitPrice * qty;
            }, 0)
        );

        // [추가] 사전 검증: 모든 quoteId가 유효한지 확인
        const itemIds = [...new Set(validCartItems.map((i: any) => Number(i.quoteId)))];
        const checkQuotes = await env.DB.prepare(
            `SELECT id FROM quotes WHERE id IN (${itemIds.map(() => '?').join(',')})`
        ).bind(...itemIds).all();
        
        const existingQuoteIds = new Set((checkQuotes.results || []).map((q: any) => q.id));
        const missingIds = itemIds.filter((id: number) => !existingQuoteIds.has(id));
        
        if (missingIds.length > 0) {
            console.error('존재하지 않는 견적 참조 시도:', missingIds);
            return errorResponse(`일부 견적 정보(${missingIds.join(', ')})가 소실되어 주문을 진행할 수 없습니다. 다시 견적을 내주세요.`, 400);
        }

        const isGuest = auth.isGuest;
        const viewToken = crypto.randomUUID();
        const orderResult = await env.DB
            .prepare(`
        INSERT INTO orders (
          user_id, session_id, guest_email, order_number,
          recipient_name, recipient_phone, shipping_address, shipping_postal_code,
          total_amount, customer_note, view_token
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                body.customerNote || null,
                viewToken
            )
            .run();

        const orderId = orderResult.meta?.last_row_id || orderResult.meta?.lastRowId;
        if (!orderId) {
            console.error('주문 생성 후 ID 추출 실패:', orderResult);
            return errorResponse('주문 생성 실패 (ID 생성 오류)', 500);
        }

        const statements = [];

        // 1. 주문 항목 삽입
        for (const item of validCartItems) {
            const qty = Math.max(1, Number(item.quantity) || 1);
            const unitPrice = normalizeAmountBeforeSave(item.totalPrice);
            const subtotal = unitPrice * qty;
            statements.push(
                env.DB.prepare(`
                    INSERT INTO order_items (order_id, quote_id, quantity, unit_price, subtotal)
                    VALUES (?, ?, ?, ?, ?)
                `).bind(orderId, item.quoteId, qty, unitPrice, subtotal)
            );
        }

        // 2. 장바구니 삭제
        const quoteIds = [...new Set(validCartItems.map((x: any) => Number(x.quoteId)))];
        if (quoteIds.length > 0) {
            const placeholders = quoteIds.map(() => '?').join(',');
            if (isGuest) {
                statements.push(
                    env.DB.prepare(`DELETE FROM cart WHERE session_id = ? AND quote_id IN (${placeholders})`)
                        .bind(auth.sessionId, ...quoteIds)
                );
            } else {
                statements.push(
                    env.DB.prepare(`DELETE FROM cart WHERE user_id = ? AND quote_id IN (${placeholders})`)
                        .bind(auth.userId, ...quoteIds)
                );
            }
        }

        // 배치 실행
        const batchResults = await env.DB.batch(statements);
        const failedStep = batchResults.findIndex((r: any) => r?.success === false || !!r?.error);
        if (failedStep !== -1) {
            console.error('주문 처리 단계 실패:', batchResults[failedStep]);
            throw new Error(`상세 주문 처리 중 오류 발생 (단계: ${failedStep})`);
        }

        // 배송 정보 초기화 (환경별 스키마 누락으로 주문 전체 실패하지 않도록 분리)
        try {
            await env.DB.prepare('INSERT INTO shipments (order_id) VALUES (?)').bind(orderId).run();
        } catch (shipmentError) {
            console.warn('shipments 초기화 실패(주문은 정상 접수됨):', shipmentError);
        }

        // 8. 관리자에게 알림 메일을 전송 (Cloudflare 환경 안정성을 위해 await 적용)
        try {
            const adminEmail = (env as any).ADMIN_EMAIL || 'wow3d16@naver.com';
            const orderDate = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
            
            const htmlBody = `
                <div style="font-family: 'Pretendard', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border: 1px solid #f0f0f0; border-radius: 24px;">
                    <div style="margin-bottom: 32px;">
                        <span style="display: inline-block; padding: 6px 12px; background-color: #2dd4bf; color: #ffffff; font-size: 11px; font-weight: 800; border-radius: 8px; text-transform: uppercase; letter-spacing: 1px;">New Order</span>
                        <h2 style="margin: 16px 0 8px 0; font-size: 24px; font-weight: 900; color: #111111;">새로운 주문이 접수되었습니다</h2>
                        <p style="margin: 0; font-size: 14px; color: #666666;">${orderDate} 접수</p>
                    </div>

                    <div style="padding: 24px; background-color: #f8fafc; border-radius: 16px; margin-bottom: 24px;">
                        <div style="margin-bottom: 16px;">
                            <span style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">주문 정보</span>
                            <div style="font-size: 16px; font-weight: 700; color: #111111;">${orderNumber}</div>
                        </div>
                        <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 20px;">
                            <div>
                                <span style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">주문자</span>
                                <div style="font-size: 14px; font-weight: 600; color: #111111;">${escapeHtml(body.recipientName)}</div>
                            </div>
                            <div>
                                <span style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">연락처</span>
                                <div style="font-size: 14px; font-weight: 600; color: #111111;">${escapeHtml(body.recipientPhone)}</div>
                            </div>
                        </div>
                    </div>

                    <div style="margin-bottom: 32px;">
                        <span style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">배송지 정보</span>
                        <div style="font-size: 14px; color: #334155; line-height: 1.6;">
                            [${body.shippingPostalCode || '-'}] ${escapeHtml(body.shippingAddress)}
                        </div>
                    </div>

                    <div style="padding-top: 24px; border-top: 1px solid #f1f5f9;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 14px; font-weight: 700; color: #111111;">총 결제 예정 금액</span>
                            <span style="font-size: 20px; font-weight: 900; color: #2dd4bf;">₩${totalAmount.toLocaleString()}</span>
                        </div>
                    </div>

                    <div style="margin-top: 40px; text-align: center;">
                        <a href="https://wow3dp.co.kr/admin/orders" style="display: inline-block; padding: 14px 28px; background-color: #111111; color: #ffffff; font-size: 13px; font-weight: 800; text-decoration: none; border-radius: 12px; letter-spacing: 0.5px;">주문 상세 확인하기</a>
                    </div>

                    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center;">
                        <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 500;">본 메일은 WOW3D 시스템에서 자동으로 발송되었습니다.</p>
                    </div>
                </div>
            `;

            const textBody = `[새 주문 알림]\n주문번호: ${orderNumber}\n주문자: ${body.recipientName}\n연락처: ${body.recipientPhone}\n금액: ₩${totalAmount.toLocaleString()}\n상세 확인: https://wow3dp.co.kr/admin/orders`;

            await sendEmail({
                to: adminEmail,
                subject: `[신규주문] ${body.recipientName}님의 주문 (${orderNumber})`,
                text: textBody,
                html: htmlBody,
                reply_to: isGuest ? body.guestEmail : undefined
            }, env);
        } catch (err) {
            console.warn('관리자 알림 메일 발송 실패:', err);
        }

        return successResponse(
            { orderId, orderNumber, totalAmount, isGuest },
            '주문이 완료되었습니다'
        );
    } catch (error: any) {
        console.error('POST /api/orders error:', error);
        return errorResponse(error.message || '주문 생성 실패', 500);
    }
}
