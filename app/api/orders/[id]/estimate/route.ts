import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { normalizeEstimateViewToken } from '@/lib/quotation-view-token';

/**
 * GET /api/orders/[id]/estimate
 * 이메일 견적서 링크 전용 퍼블릭 API (보안 토큰 인증)
 * 쿼리 파라미터: ?token=... (orders.view_token과 비교)
 */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const { env } = getCloudflareContext();

    if (!env?.DB) {
        return NextResponse.json({ error: 'DB not available' }, { status: 503 });
    }

    const numId = parseInt(id, 10);
    if (isNaN(numId) || !Number.isInteger(numId)) {
        return NextResponse.json({ error: '유효하지 않은 주문 ID입니다' }, { status: 400 });
    }

    // URL에서 보안 토큰 파싱 (이중 ?token= 링크 대비 정규화)
    const { searchParams } = new URL(req.url);
    const token = normalizeEstimateViewToken(searchParams.get('token'));

    if (!token) {
        return NextResponse.json({ error: '인증 토큰이 누락되었습니다' }, { status: 401 });
    }

    try {
        // 1. 주문 데이터 조회 (민감한 데이터인 admin_note 등은 제외)
        // 비회원의 경우 guest_email, 회원의 경우 users 테이블의 이메일 조회
        const order = await env.DB.prepare(`
            SELECT o.id, o.user_id, o.order_number, o.recipient_name, o.recipient_phone,
                   o.shipping_address, o.shipping_postal_code, o.total_amount, o.status,
                   o.created_at, o.updated_at, o.has_expert_quote, o.expert_quote_data,
                   o.view_token, o.store_id, o.guest_email,
                   u.email as user_email
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.id = ?
        `).bind(numId).first() as {
            id: number; user_id: number | null; order_number: string; recipient_name: string;
            recipient_phone: string; shipping_address: string; shipping_postal_code: string | null;
            total_amount: number; status: string; created_at: string; updated_at: string;
            has_expert_quote: number | null; expert_quote_data: string | null;
            view_token: string | null; store_id: number | null; guest_email: string | null;
            user_email: string | null;
        } | null;

        if (!order) {
            return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 });
        }

        // 2. 보안 토큰(view_token) 일치 여부 검증
        if (!order.view_token || order.view_token !== token) {
            return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 });
        }

        // 3. 주문 품목 조회 (quotes 테이블 조인하여 파일명 및 제작사양 획득)
        const { results: items } = await env.DB.prepare(`
            SELECT oi.id, oi.quote_id, oi.quantity, oi.unit_price, oi.subtotal, 
                   q.file_name, q.print_method, q.material as material_name
            FROM order_items oi
            LEFT JOIN quotes q ON oi.quote_id = q.id
            WHERE oi.order_id = ?
        `).bind(numId).all();

        // 4. 공급자 회사 정보 조회 (견적서에 인쇄될 정보)
        const storeId = order.store_id ?? 1; // 기본 store_id 1 적용
        const company = await env.DB.prepare(
            'SELECT * FROM company_info WHERE store_id = ?'
        ).bind(storeId).first();

        // 보안상 응답 데이터에서 view_token 및 store_id 등 제거
        const { view_token, store_id, ...safeOrder } = order;

        return NextResponse.json({
            success: true,
            data: {
                order: safeOrder,
                items: items || [],
                company: company || null
            }
        });

    } catch (error: any) {
        console.error('GET /api/orders/[id]/estimate error:', error);
        return NextResponse.json({ error: '견적서 조회 실패', reason: error.message }, { status: 500 });
    }
}
