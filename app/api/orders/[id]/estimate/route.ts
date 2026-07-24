import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAuth } from '@/lib/api-utils';
import { normalizeEstimateViewToken } from '@/lib/quotation-view-token';

/**
 * GET /api/orders/[id]/estimate
 * 견적서 조회
 * - ?token=... (이메일 링크용 view_token)
 * - 또는 Authorization Bearer (주문 소유자 로그인)
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

    const { searchParams } = new URL(req.url);
    const viewTokenParam = normalizeEstimateViewToken(searchParams.get('token'));

    try {
        const order = await env.DB.prepare(`
            SELECT o.id, o.user_id, o.order_number, o.recipient_name, o.recipient_phone,
                   o.shipping_address, o.shipping_postal_code, o.total_amount, o.status,
                   o.created_at, o.updated_at, o.has_expert_quote, o.expert_quote_data,
                   o.view_token, o.store_id, o.guest_email, o.quotation_sent_at,
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
            quotation_sent_at: string | null; user_email: string | null;
        } | null;

        if (!order) {
            return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 });
        }

        let authorized = false;

        if (viewTokenParam) {
            if (order.view_token && order.view_token === viewTokenParam) {
                authorized = true;
            }
        } else {
            const auth = await requireAuth(req);
            if (!(auth instanceof Response) && order.user_id != null && order.user_id === auth.userId) {
                authorized = true;
            }
        }

        if (!authorized) {
            return NextResponse.json(
                { error: viewTokenParam ? '유효하지 않은 토큰입니다' : '인증이 필요합니다' },
                { status: 401 }
            );
        }

        const { results: items } = await env.DB.prepare(`
            SELECT oi.id, oi.quote_id, oi.quantity, oi.unit_price, oi.subtotal, 
                   q.file_name, q.print_method,
                   COALESCE(q.fdm_material, q.resin_type) as material_name
            FROM order_items oi
            LEFT JOIN quotes q ON oi.quote_id = q.id
            WHERE oi.order_id = ?
        `).bind(numId).all();

        const storeId = order.store_id ?? 1;
        const company = await env.DB.prepare(
            'SELECT * FROM company_info WHERE store_id = ?'
        ).bind(storeId).first();

        const { view_token, store_id, ...safeOrder } = order;

        return NextResponse.json({
            success: true,
            data: {
                order: safeOrder,
                items: items || [],
                company: company || null,
            },
        });
    } catch (error: any) {
        // quotation_sent_at 컬럼 없을 수 있음 → 재시도
        if (String(error?.message || '').includes('quotation_sent_at')) {
            try {
                const order = await env.DB.prepare(`
                    SELECT o.id, o.user_id, o.order_number, o.recipient_name, o.recipient_phone,
                           o.shipping_address, o.shipping_postal_code, o.total_amount, o.status,
                           o.created_at, o.updated_at, o.has_expert_quote, o.expert_quote_data,
                           o.view_token, o.store_id, o.guest_email,
                           u.email as user_email
                    FROM orders o
                    LEFT JOIN users u ON o.user_id = u.id
                    WHERE o.id = ?
                `).bind(numId).first() as any;

                if (!order) {
                    return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 });
                }

                let authorized = false;
                if (viewTokenParam) {
                    if (order.view_token && order.view_token === viewTokenParam) authorized = true;
                } else {
                    const auth = await requireAuth(req);
                    if (!(auth instanceof Response) && order.user_id != null && order.user_id === auth.userId) {
                        authorized = true;
                    }
                }
                if (!authorized) {
                    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
                }

                const { results: items } = await env.DB.prepare(`
                    SELECT oi.id, oi.quote_id, oi.quantity, oi.unit_price, oi.subtotal, 
                           q.file_name, q.print_method,
                           COALESCE(q.fdm_material, q.resin_type) as material_name
                    FROM order_items oi
                    LEFT JOIN quotes q ON oi.quote_id = q.id
                    WHERE oi.order_id = ?
                `).bind(numId).all();

                const company = await env.DB.prepare(
                    'SELECT * FROM company_info WHERE store_id = ?'
                ).bind(order.store_id ?? 1).first();

                const { view_token, store_id, ...safeOrder } = order;
                return NextResponse.json({
                    success: true,
                    data: { order: safeOrder, items: items || [], company: company || null },
                });
            } catch (e2: any) {
                console.error('GET /api/orders/[id]/estimate retry error:', e2);
                return NextResponse.json({ error: '견적서 조회 실패', reason: e2.message }, { status: 500 });
            }
        }
        console.error('GET /api/orders/[id]/estimate error:', error);
        return NextResponse.json({ error: '견적서 조회 실패', reason: error.message }, { status: 500 });
    }
}
