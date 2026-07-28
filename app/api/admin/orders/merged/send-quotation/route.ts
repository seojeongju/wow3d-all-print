import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import { correctDisplayAmount } from '@/lib/amount-display';
import { buildDefaultSubject, buildDefaultHtml, buildDefaultText } from '@/lib/quotation-email';

/**
 * POST /api/admin/orders/merged/send-quotation
 * Body: { orderIds: number[], emailOverride?: string, subject?: string, html?: string, text?: string, extraAttachments?: [] }
 */
export async function POST(req: NextRequest) {
  const { env } = getCloudflareContext();
  if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

  const auth = await requireAdminAuth(req, env.DB);
  if (auth instanceof Response) return auth;
  const { storeId } = auth;

  let body: {
    orderIds?: number[];
    emailOverride?: string;
    subject?: string;
    html?: string;
    text?: string;
    extraAttachments?: { filename: string; content: string }[];
  } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const orderIds = Array.isArray(body.orderIds) ? body.orderIds.filter((n) => typeof n === 'number' && Number.isInteger(n)) : [];
  if (orderIds.length < 1) return NextResponse.json({ error: 'orderIds required' }, { status: 400 });

  const placeholders = orderIds.map(() => '?').join(', ');
  type OrderRow = {
    id: number;
    store_id: number | null;
    user_id: number | null;
    order_number: string;
    guest_email: string | null;
    recipient_name: string | null;
    recipient_phone: string | null;
    shipping_address: string | null;
    created_at: string;
    total_amount: number | null;
    user_email?: string | null;
  };
  const ordersRes = await env.DB.prepare(
    `SELECT o.id, o.store_id, o.user_id, o.order_number, o.guest_email, o.recipient_name, o.recipient_phone,
            o.shipping_address, o.created_at, o.total_amount,
            u.email as user_email
     FROM orders o
     LEFT JOIN users u ON o.user_id = u.id
     WHERE o.id IN (${placeholders})`
  ).bind(...orderIds).all() as { results?: OrderRow[] };
  const orders = ordersRes?.results ?? [];
  if (orders.length !== orderIds.length) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (orders.some((o) => o.store_id != null && o.store_id !== storeId)) {
    return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 });
  }

  // 기본 수신 이메일
  const emails = orders.map((o) => (o.user_email || o.guest_email || '').trim()).filter(Boolean);
  const uniqueEmails = Array.from(new Set(emails));
  if (uniqueEmails.length > 1 && !(body.emailOverride && String(body.emailOverride).trim())) {
    return NextResponse.json({ error: '선택된 주문의 수신 이메일이 서로 다릅니다. 수신 이메일을 직접 입력해 주세요.' }, { status: 400 });
  }

  const toEmail = (body.emailOverride && String(body.emailOverride).trim()) || uniqueEmails[0] || null;
  const customSubject = body?.subject != null && String(body.subject).trim() ? String(body.subject).trim() : null;
  const customHtml = body?.html != null && String(body.html).trim() ? String(body.html).trim() : null;
  const customText = body?.text != null && String(body.text).trim() ? String(body.text).trim() : null;
  const sentAt = new Date().toISOString();

  // 품목 병합
  type ItemRow = { id?: number; order_id: number; quantity: number; unit_price: number; subtotal: number; file_name: string; print_method: string | null };
  const itemsRes = await env.DB.prepare(
    `SELECT oi.id, oi.order_id, oi.quantity, oi.unit_price, oi.subtotal, q.file_name, q.print_method,
            q.fdm_material, q.fdm_infill, q.fdm_layer_height, q.fdm_support,
            q.resin_type, q.layer_thickness, q.post_processing
     FROM order_items oi
     LEFT JOIN quotes q ON oi.quote_id = q.id
     WHERE oi.order_id IN (${placeholders})
     ORDER BY oi.order_id ASC, oi.id ASC`
  ).bind(...orderIds).all() as { results?: ItemRow[] };
  const items = itemsRes?.results ?? [];

  let totalAmount: number = 0;
  for (const o of orders) {
    let orderTotal = o.total_amount || 0;
    if ((o as any).expert_quote_data) {
      try {
        const expert = JSON.parse((o as any).expert_quote_data) as { total_amount?: number };
        if (typeof expert.total_amount === 'number') {
          orderTotal = expert.total_amount;
        }
      } catch {}
    }
    totalAmount += orderTotal;
  }
  const displayAmount = totalAmount != null ? (correctDisplayAmount(Number(totalAmount)) ?? Number(totalAmount)) : null;
  const amountText = displayAmount != null ? ` (합계: ₩${Number(displayAmount).toLocaleString()})` : '';

  // quotation_sent_at 및 상태 갱신(선택된 주문 모두)
  try {
    await env.DB.prepare(
      `UPDATE orders SET quotation_sent_at = ?, status = 'quote_sent', updated_at = CURRENT_TIMESTAMP
       WHERE id IN (${placeholders})`
    ).bind(sentAt, ...orderIds).run();
  } catch (e) {
    console.warn('merged send-quotation: UPDATE failed', e);
  }

  const envVars = env as unknown as Record<string, string | undefined>;
  const resendKey = process.env.RESEND_API_KEY || envVars.RESEND_API_KEY;
  const requestOrigin = typeof req.url === 'string' ? new URL(req.url).origin : '';
  const envAppUrl = process.env.NEXT_PUBLIC_APP_URL || envVars.NEXT_PUBLIC_APP_URL || '';
  const isLocalhost = (u: string) => !u || /^https?:\/\/localhost(:\d+)?(\/|$)/i.test(u);
  const baseUrl = !isLocalhost(requestOrigin) ? requestOrigin : (envAppUrl || requestOrigin);
  const estimateUrl = `${baseUrl.replace(/\/$/, '')}/admin/quotes`;

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

      const subject = customSubject ?? buildDefaultSubject(`MERGED-${orderIds.length}`);
      const hasCustomHtml = customHtml != null;
      const hasCustomText = customText != null;
      const html = customHtml ?? buildDefaultHtml({
        orderNumber: orders.map((o) => o.order_number).join(', '),
        estimateUrl,
        amountText: amountText ?? undefined,
        displayAmount,
        withPdfAttachment: attachments.length > 0,
      });
      const text = customText ?? buildDefaultText({
        orderNumber: orders.map((o) => o.order_number).join(', '),
        estimateUrl,
        amountText: amountText ?? undefined,
        displayAmount,
        withPdfAttachment: attachments.length > 0,
      });

      const payload: Record<string, unknown> = {
        from: fromAddr,
        to: [toEmail],
        reply_to: replyToAddr,
        subject,
        ...(attachments.length > 0 ? { attachments } : {}),
      };
      if (hasCustomText && !hasCustomHtml) payload.text = customText;
      else if (hasCustomHtml && !hasCustomText) payload.html = html;
      else {
        payload.text = text;
        payload.html = html;
      }

      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      emailSent = r.ok;
    } catch (e) {
      console.warn('merged send-quotation: email send failed', e);
      emailSent = false;
    }
  }

  return NextResponse.json({
    success: true,
    message: emailSent ? '선택 견적서가 발송되었습니다.' : '발송 처리되었습니다. (이메일 발송은 설정을 확인해 주세요)',
    emailSent,
    sentAt,
  });
}

