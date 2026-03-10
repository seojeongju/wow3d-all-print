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
            'SELECT id, user_id, order_number, store_id FROM orders WHERE id = ?'
        ).bind(numId).first() as { id: number; user_id: number | null; order_number: string; store_id: number | null } | null;

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }
        const orderStoreId = order.store_id;
        if (orderStoreId != null && orderStoreId !== storeId) {
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

        let body: { emailOverride?: string } = {};
        try {
            body = await req.json();
        } catch {
            // body 없으면 그대로 진행
        }

        const toEmail = (body?.emailOverride && String(body.emailOverride).trim()) || fullOrder.user_email || fullOrder.guest_email || null;
        const sentAt = new Date().toISOString();

        let quotationRecorded = false;
        try {
            const whereClause = orderStoreId != null ? 'WHERE id = ? AND store_id = ?' : 'WHERE id = ?';
            const whereBind = orderStoreId != null ? [sentAt, numId, storeId] : [sentAt, numId];
            await env.DB.prepare(
                `UPDATE orders SET quotation_sent_at = ?, updated_at = CURRENT_TIMESTAMP ${whereClause}`
            ).bind(...whereBind).run();
            quotationRecorded = true;
        } catch (updateErr) {
            console.warn('send-quotation: UPDATE quotation_sent_at failed (column may be missing)', updateErr);
        }

        const envVars = env as unknown as Record<string, string | undefined>;
        const resendKey = process.env.RESEND_API_KEY || envVars.RESEND_API_KEY;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || envVars.NEXT_PUBLIC_APP_URL || (typeof req.url === 'string' ? new URL(req.url).origin : '');
        const estimateUrl = `${baseUrl}/print/estimate/${numId}`;

        let totalAmount: number | null = null;
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
        const amountText = totalAmount != null ? ` (합계: ₩${Number(totalAmount).toLocaleString()})` : '';
        let emailSent = false;

        if (resendKey && toEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
            try {
                const fromAddr = process.env.RESEND_FROM || envVars.RESEND_FROM || 'WOW3D 견적서 <onboarding@resend.dev>';
                const emailRes = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${resendKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: fromAddr,
                        to: [toEmail],
                        subject: `[${fullOrder.order_number}] WOW3D 견적서가 준비되었습니다`,
                        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>body{font-family:sans-serif;line-height:1.6;color:#333;max-width:560px;margin:0 auto;padding:20px;} a{color:#2563eb;} .box{background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0;}</style></head>
<body>
<p>안녕하세요, WOW3D입니다.</p>
<p>요청하신 <strong>견적서</strong>가 준비되었습니다.</p>
<div class="box">
  <p style="margin:0 0 8px 0;"><strong>주문번호</strong> ${String(fullOrder.order_number)}</p>
  ${amountText ? `<p style="margin:0;"><strong>견적 합계</strong> ₩${Number(totalAmount!).toLocaleString()}</p>` : ''}
</div>
<p><strong>견적서 보기:</strong> <a href="${estimateUrl}">${estimateUrl}</a></p>
<p>위 링크에서 상세 견적 내용을 확인하실 수 있습니다. 확인 후 결제 또는 문의 부탁드립니다.</p>
<p>감사합니다.<br/>WOW3D</p>
</body>
</html>`.trim(),
                    }),
                });
                if (!emailRes.ok) {
                    const errText = await emailRes.text();
                    console.error('Resend API error:', emailRes.status, errText);
                    let hint = '';
                    try {
                        const errJson = JSON.parse(errText) as { message?: string };
                        const msg = (errJson?.message ?? '').toLowerCase();
                        if (msg.includes('domain') && (msg.includes('not verified') || msg.includes('unverified'))) {
                            hint = ' 발신 도메인이 Resend에서 인증되지 않았습니다. Resend 대시보드(https://resend.com/domains)에서 도메인을 추가·인증하거나, 환경 변수 RESEND_FROM을 인증된 주소(예: onboarding@resend.dev)로 설정해 주세요.';
                        } else if (errJson?.message) {
                            hint = ` (${String(errJson.message).slice(0, 100)})`;
                        }
                    } catch {
                        if (emailRes.status === 403 || emailRes.status === 401) hint = ' (API 키 또는 발신 도메인을 확인해 주세요.)';
                    }
                    const recordMsg = quotationRecorded ? '견적 발송 일시가 기록되었습니다. ' : '견적 발송 일시는 기록되지 않았습니다. ';
                    return NextResponse.json({
                        success: true,
                        message: recordMsg + '이메일 발송에 실패했습니다.' + hint,
                        sentAt,
                        quotationRecorded,
                        emailSent: false,
                    });
                }
                emailSent = true;
            } catch (e) {
                console.error('Send quotation email error:', e);
                const recordMsg = quotationRecorded ? '견적 발송 일시가 기록되었습니다. ' : '견적 발송 일시는 기록되지 않았습니다. ';
                return NextResponse.json({
                    success: true,
                    message: recordMsg + '이메일 발송 중 오류가 발생했습니다. (Resend API 키·네트워크 확인)',
                    sentAt,
                    quotationRecorded,
                    emailSent: false,
                });
            }
        }

        // 이메일 발송을 시도하지 않았거나 발송 실패한 경우
        if (!emailSent) {
            const noEmail = !toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail ?? '');
            const noKey = !resendKey;
            let recordMsg: string;
            if (noKey && noEmail) recordMsg = quotationRecorded ? '견적 발송 일시가 기록되었습니다. (수신 이메일·API 키 없음)' : '발송 일시는 기록되지 않았습니다. (DB 마이그레이션 필요 가능)';
            else if (noKey) recordMsg = quotationRecorded ? '견적 발송 일시만 기록되었습니다. 이메일 발송 설정(API 키)이 없습니다.' : '발송 일시는 기록되지 않았습니다. 이메일 발송 설정(API 키)을 확인해 주세요.';
            else if (noEmail) recordMsg = quotationRecorded ? '견적 발송 일시만 기록되었습니다. 수신 이메일이 없어 발송하지 않았습니다.' : '발송 일시는 기록되지 않았습니다. (DB 마이그레이션 필요 가능)';
            else recordMsg = quotationRecorded ? '견적 발송 일시가 기록되었습니다. 이메일 발송에 실패했습니다.' : '견적 발송 일시는 기록되지 않았습니다. 이메일 발송에 실패했습니다.';
            return NextResponse.json({
                success: true,
                message: recordMsg,
                sentAt,
                quotationRecorded,
                emailSent: false,
            });
        }

        const recordMsg = quotationRecorded ? '견적서 발송 일시가 기록되었고, 고객에게 이메일을 발송했습니다.' : '고객에게 이메일을 발송했습니다. (발송 일시 기록 실패: DB 마이그레이션 필요 가능)';
        return NextResponse.json({
            success: true,
            message: recordMsg,
            sentAt,
            quotationRecorded,
            emailSent: true,
        });
    } catch (e) {
        console.error('POST /api/admin/orders/[id]/send-quotation', e);
        return NextResponse.json({ error: 'Failed to send quotation' }, { status: 500 });
    }
}
