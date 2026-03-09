import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';

/**
 * POST /api/admin/orders/[id]/send-quotation
 * 견적서 발송: quotation_sent_at 갱신 + (선택) 고객 이메일 발송
 * Body: { emailOverride?: string }
 * 응답: { success, message, sentAt? }
 */
export async function POST(
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
            'SELECT id, user_id, order_number FROM orders WHERE id = ? AND store_id = ?'
        ).bind(numId, storeId).first() as { id: number; user_id: number | null; order_number: string } | null;

        if (!order) {
            return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 });
        }

        const fullOrder = await env.DB.prepare(`
            SELECT o.user_id, o.guest_email, o.order_number,
                   u.email as user_email
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.id = ? AND o.store_id = ?
        `).bind(numId, storeId).first() as { user_id: number | null; guest_email: string | null; order_number: string; user_email: string | null } | null;

        if (!fullOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        let body: { emailOverride?: string } = {};
        try {
            body = await req.json();
        } catch {
            // body 없으면 그대로 진행
        }

        const toEmail = (body?.emailOverride && String(body.emailOverride).trim()) || fullOrder.user_email || fullOrder.guest_email || null;
        const sentAt = new Date().toISOString();

        await env.DB.prepare(
            'UPDATE orders SET quotation_sent_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND store_id = ?'
        ).bind(sentAt, numId, storeId).run();

        const resendKey = process.env.RESEND_API_KEY || (env as Record<string, string>).RESEND_API_KEY;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) || (typeof req.url === 'string' ? new URL(req.url).origin : '');
        const estimateUrl = `${baseUrl}/print/estimate/${numId}`;

        if (resendKey && toEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
            try {
                const emailRes = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${resendKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: process.env.RESEND_FROM || (env as Record<string, string>).RESEND_FROM || '견적서 <onboarding@resend.dev>',
                        to: [toEmail],
                        subject: `[${fullOrder.order_number}] 견적서가 준비되었습니다`,
                        html: `
<p>안녕하세요.</p>
<p>요청하신 견적서가 준비되었습니다.</p>
<p><strong>견적서 보기:</strong> <a href="${estimateUrl}">${estimateUrl}</a></p>
<p>확인 후 결제 또는 문의 부탁드립니다.</p>
                        `.trim(),
                    }),
                });
                if (!emailRes.ok) {
                    const errText = await emailRes.text();
                    console.error('Resend API error:', emailRes.status, errText);
                    return NextResponse.json({
                        success: true,
                        message: '견적 발송 일시가 기록되었습니다. 이메일 발송에 실패했습니다.',
                        sentAt,
                    });
                }
            } catch (e) {
                console.error('Send quotation email error:', e);
                return NextResponse.json({
                    success: true,
                    message: '견적 발송 일시가 기록되었습니다. 이메일 발송 중 오류가 발생했습니다.',
                    sentAt,
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: toEmail ? '견적서 발송 일시가 기록되었고, 고객에게 이메일을 발송했습니다.' : '견적 발송 일시가 기록되었습니다.',
            sentAt,
        });
    } catch (e) {
        console.error('POST /api/admin/orders/[id]/send-quotation', e);
        return NextResponse.json({ error: 'Failed to send quotation' }, { status: 500 });
    }
}
