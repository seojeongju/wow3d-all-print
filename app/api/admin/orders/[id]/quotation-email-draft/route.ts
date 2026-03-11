import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import { correctDisplayAmount } from '@/lib/amount-display';
import { buildDefaultSubject, buildDefaultHtml, buildDefaultText } from '@/lib/quotation-email';

/**
 * GET /api/admin/orders/[id]/quotation-email-draft
 * 발송 전 관리자가 수정할 수 있는 이메일 초안 반환 (수신자, 제목, 본문, PDF 첨부 가능 여부)
 */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    const numId = parseInt(id, 10);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;
    const { storeId } = auth;

    try {
        const order = await env.DB.prepare(
            'SELECT id, user_id, order_number, store_id FROM orders WHERE id = ?'
        ).bind(numId).first() as { id: number; user_id: number | null; order_number: string; store_id: number | null } | null;

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }
        if (order.store_id != null && order.store_id !== storeId) {
            return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 });
        }

        type FullOrderRow = {
            user_id: number | null; guest_email: string | null; order_number: string;
            total_amount: number | null; expert_quote_data?: string | null;
            user_email: string | null;
        };
        let fullOrder: FullOrderRow | null = null;
        try {
            fullOrder = await env.DB.prepare(`
                SELECT o.user_id, o.guest_email, o.order_number, o.total_amount, o.expert_quote_data,
                       u.email as user_email
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                WHERE o.id = ?
            `).bind(numId).first() as FullOrderRow | null;
        } catch {
            fullOrder = await env.DB.prepare(`
                SELECT o.user_id, o.guest_email, o.order_number, o.total_amount,
                       u.email as user_email
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                WHERE o.id = ?
            `).bind(numId).first() as FullOrderRow | null;
        }

        if (!fullOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const url = req.url ? new URL(req.url) : null;
        const itemIdsParam = url?.searchParams?.get('itemIds');
        const selectedItemIds: number[] = itemIdsParam
            ? itemIdsParam.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isInteger(n))
            : [];

        const toEmail = fullOrder.user_email || fullOrder.guest_email || '';
        const requestOrigin = typeof req.url === 'string' ? new URL(req.url).origin : '';
        const envVars = env as unknown as Record<string, string | undefined>;
        const envAppUrl = process.env.NEXT_PUBLIC_APP_URL || envVars.NEXT_PUBLIC_APP_URL || '';
        const isLocalhost = (u: string) => !u || /^https?:\/\/localhost(:\d+)?(\/|$)/i.test(u);
        const baseUrl = !isLocalhost(requestOrigin) ? requestOrigin : (envAppUrl || requestOrigin);
        const estimateUrl = `${baseUrl.replace(/\/$/, '')}/print/estimate/${numId}`;

        type ItemRow = { id?: number; quantity: number; unit_price: number; subtotal: number; file_name: string; print_method: string | null };
        let items: ItemRow[] = [];
        try {
            const itemRes = await env.DB.prepare(`
                SELECT oi.id, oi.quantity, oi.unit_price, oi.subtotal, q.file_name, q.print_method
                FROM order_items oi
                LEFT JOIN quotes q ON oi.quote_id = q.id
                WHERE oi.order_id = ?
            `).bind(numId).all() as { results?: ItemRow[] };
            const allItems = itemRes?.results ?? [];
            items = selectedItemIds.length > 0
                ? allItems.filter((row) => row.id != null && selectedItemIds.includes(row.id))
                : allItems;
        } catch {
            // items stay []
        }

        let totalAmount: number | null = null;
        if (items.length > 0) {
            const supplyTotal = items.reduce((acc, it) => acc + (correctDisplayAmount(Math.round(Number(it.subtotal))) ?? Math.round(Number(it.subtotal))), 0);
            totalAmount = supplyTotal + Math.floor(supplyTotal * 0.1);
        } else if (selectedItemIds.length === 0) {
            if (fullOrder.expert_quote_data) {
                try {
                    const expert = JSON.parse(fullOrder.expert_quote_data) as { total_amount?: number };
                    totalAmount = expert?.total_amount ?? null;
                } catch {
                    totalAmount = fullOrder.total_amount;
                }
            } else {
                totalAmount = fullOrder.total_amount;
            }
        }
        const displayAmount = totalAmount != null ? (correctDisplayAmount(Number(totalAmount)) ?? Number(totalAmount)) : null;
        const amountText = displayAmount != null ? ` (합계: ₩${Number(displayAmount).toLocaleString()})` : '';

        const pdfReady = false;
        const pdfError = '견적서는 인쇄(저장) 후 아래 파일 첨부로 추가해 주세요.';

        const subject = buildDefaultSubject(fullOrder.order_number);
        const html = buildDefaultHtml({
            orderNumber: fullOrder.order_number,
            estimateUrl,
            amountText,
            displayAmount,
            withPdfAttachment: false,
        });
        const text = buildDefaultText({
            orderNumber: fullOrder.order_number,
            estimateUrl,
            amountText,
            displayAmount,
            withPdfAttachment: false,
        });

        return NextResponse.json({
            to: toEmail,
            subject,
            html,
            text,
            pdfReady,
            pdfError,
            order_number: fullOrder.order_number,
        });
    } catch (e) {
        console.error('GET /api/admin/orders/[id]/quotation-email-draft', e);
        return NextResponse.json({ error: 'Failed to load draft' }, { status: 500 });
    }
}
