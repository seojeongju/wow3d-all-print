import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import { correctDisplayAmount } from '@/lib/amount-display';
import { buildDefaultSubject, buildDefaultHtml, buildDefaultText } from '@/lib/quotation-email';
import {
    buildEstimatePublicUrl,
    ensureOrderViewToken,
    injectEstimateUrlInContent,
    resolvePublicBaseUrl,
} from '@/lib/quotation-view-token';

/**
 * POST /api/admin/orders/[id]/send-quotation
 * 견적서 발송: quotation_sent_at 갱신 + (선택) 고객 이메일 발송
 * Body: { emailOverride?: string, subject?: string, html?: string }  (관리자 편집 본문 반영)
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
            'SELECT id, user_id, order_number, store_id, view_token FROM orders WHERE id = ?'
        ).bind(numId).first() as { id: number; user_id: number | null; order_number: string; store_id: number | null; view_token: string | null } | null;

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

        let body: { emailOverride?: string; subject?: string; html?: string; text?: string; extraAttachments?: { filename: string; content: string }[]; itemIds?: number[] } = {};
        try {
            body = await req.json();
        } catch {
            // body 없으면 그대로 진행
        }

        const toEmail = (body?.emailOverride && String(body.emailOverride).trim()) || fullOrder.user_email || fullOrder.guest_email || null;
        const customSubject = body?.subject != null && String(body.subject).trim() ? String(body.subject).trim() : null;
        const customHtml = body?.html != null && String(body.html).trim() ? String(body.html).trim() : null;
        const customText = body?.text != null && String(body.text).trim() ? String(body.text).trim() : null;
        const selectedItemIds = Array.isArray(body?.itemIds) ? body.itemIds.filter((id: unknown) => typeof id === 'number' && Number.isInteger(id)) : [];
        const sentAt = new Date().toISOString();

        let quotationRecorded = false;
        try {
            const whereClause = orderStoreId != null ? 'WHERE id = ? AND store_id = ?' : 'WHERE id = ?';
            const whereBind = orderStoreId != null ? [sentAt, numId, storeId] : [sentAt, numId];
            await env.DB.prepare(
                `UPDATE orders SET quotation_sent_at = ?, status = 'quote_sent', updated_at = CURRENT_TIMESTAMP ${whereClause}`
            ).bind(...whereBind).run();
            quotationRecorded = true;
        } catch (updateErr) {
            console.warn('send-quotation: UPDATE quotation_sent_at failed (column may be missing)', updateErr);
        }

        const envVars = env as unknown as Record<string, string | undefined>;
        const resendKey = process.env.RESEND_API_KEY || envVars.RESEND_API_KEY;
        const envAppUrl = process.env.NEXT_PUBLIC_APP_URL || envVars.NEXT_PUBLIC_APP_URL || '';
        const baseUrl = resolvePublicBaseUrl(typeof req.url === 'string' ? req.url : '', envAppUrl);

        let viewToken = order?.view_token;
        if (!viewToken) {
            viewToken = await ensureOrderViewToken(env.DB, numId);
        }
        const estimateUrl = viewToken
            ? buildEstimatePublicUrl(baseUrl, numId, viewToken)
            : `${baseUrl}/print/estimate/${numId}`;

        type ItemRow = { id?: number; quantity: number; unit_price: number; subtotal: number; file_name: string; print_method: string | null };
        let itemsForPdf: ItemRow[] = [];
        try {
            const orderRow = await env.DB.prepare(
                'SELECT recipient_name, recipient_phone, shipping_address, created_at FROM orders WHERE id = ?'
            ).bind(numId).first() as { recipient_name: string; recipient_phone: string; shipping_address: string; created_at: string } | null;
            const itemRes = await env.DB.prepare(`
                SELECT oi.id, oi.quantity, oi.unit_price, oi.subtotal, q.file_name, q.print_method
                FROM order_items oi
                LEFT JOIN quotes q ON oi.quote_id = q.id
                WHERE oi.order_id = ?
            `).bind(numId).all() as { results?: ItemRow[] };
            const allItems = itemRes?.results ?? [];
            itemsForPdf = selectedItemIds.length > 0
                ? allItems.filter((row) => row.id != null && selectedItemIds.includes(row.id))
                : allItems;
        } catch {
            // itemsForPdf stays []
        }

        let totalAmount: number | null = null;
        if (selectedItemIds.length > 0) {
            if (itemsForPdf.length > 0) {
                totalAmount = itemsForPdf.reduce((acc, it) => acc + (correctDisplayAmount(Math.round(Number(it.subtotal))) ?? Math.round(Number(it.subtotal))), 0);
            }
        } else {
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
        let emailSent = false;

        if (resendKey && toEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
            try {
                const fromAddr = process.env.RESEND_FROM || envVars.RESEND_FROM || 'WOW3D 견적서 <onboarding@resend.dev>';
                const replyToAddr = process.env.RESEND_REPLY_TO || envVars.RESEND_REPLY_TO || 'wow3d16@naver.com';
                let attachments: { filename: string; content: string }[] = [];
                const extra = body.extraAttachments;
                if (Array.isArray(extra) && extra.length > 0) {
                    for (const a of extra) {
                        if (a && typeof a.filename === 'string' && typeof a.content === 'string' && a.filename.trim()) {
                            attachments.push({ filename: a.filename.trim().slice(0, 200), content: a.content });
                        }
                    }
                }
                const subject = customSubject ?? buildDefaultSubject(fullOrder.order_number);
                const hasCustomHtml = customHtml != null;
                const hasCustomText = customText != null;
                let html = customHtml ?? buildDefaultHtml({
                    orderNumber: fullOrder.order_number,
                    estimateUrl,
                    amountText: amountText ?? undefined,
                    displayAmount,
                    withPdfAttachment: attachments.length > 0,
                });
                let text = customText ?? buildDefaultText({
                    orderNumber: fullOrder.order_number,
                    estimateUrl,
                    amountText: amountText ?? undefined,
                    displayAmount,
                    withPdfAttachment: attachments.length > 0,
                });
                if (viewToken) {
                    if (hasCustomHtml && customHtml) {
                        html = injectEstimateUrlInContent(customHtml, numId, estimateUrl, baseUrl);
                    }
                    if (hasCustomText && customText) {
                        text = injectEstimateUrlInContent(customText, numId, estimateUrl, baseUrl);
                    }
                }
                const payload: Record<string, unknown> = {
                    from: fromAddr,
                    to: [toEmail],
                    reply_to: replyToAddr,
                    subject,
                    ...(attachments.length > 0 ? { attachments } : {}),
                };
                if (hasCustomText && !hasCustomHtml) {
                    payload.text = customText;
                } else if (hasCustomHtml && !hasCustomText) {
                    payload.html = html;
                } else {
                    payload.text = text;
                    payload.html = html;
                }
                const emailRes = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${resendKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
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
