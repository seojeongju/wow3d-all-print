import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import { correctDisplayAmount } from '@/lib/amount-display';
import { buildDefaultSubject, buildDefaultHtml, buildDefaultText } from '@/lib/quotation-email';

/**
 * GET /api/admin/orders/merged/quotation-email-draft?orderIds=1,2,3
 * 선택한 여러 주문을 하나의 견적서(PDF)로 묶어 발송하기 위한 초안 반환
 */
export async function GET(req: NextRequest) {
  const { env } = getCloudflareContext();
  if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

  const auth = await requireAdminAuth(req, env.DB);
  if (auth instanceof Response) return auth;
  const { storeId } = auth;

  const url = new URL(req.url);
  const orderIdsParam = url.searchParams.get('orderIds') || '';
  const orderIds = orderIdsParam
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isInteger(n));
  if (orderIds.length < 1) return NextResponse.json({ error: 'orderIds required' }, { status: 400 });

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
    expert_quote_data?: string | null;
    user_email?: string | null;
  };

  // 주문 기본 조회 + storeId 검증
  const placeholders = orderIds.map(() => '?').join(', ');
  const orders = await env.DB.prepare(
    `SELECT o.id, o.store_id, o.user_id, o.order_number, o.guest_email, o.recipient_name, o.recipient_phone,
            o.shipping_address, o.created_at, o.total_amount, o.expert_quote_data,
            u.email as user_email
     FROM orders o
     LEFT JOIN users u ON o.user_id = u.id
     WHERE o.id IN (${placeholders})`
  ).bind(...orderIds).all() as { results?: OrderRow[] };
  const list = orders?.results ?? [];
  if (list.length !== orderIds.length) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (list.some((o) => o.store_id != null && o.store_id !== storeId)) {
    return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 });
  }

  // 수신자 이메일 통일 검사
  const emails = list
    .map((o) => (o.user_email || o.guest_email || '').trim())
    .filter(Boolean);
  const uniqueEmails = Array.from(new Set(emails));
  if (uniqueEmails.length > 1) {
    return NextResponse.json({ error: '선택된 주문의 수신 이메일이 서로 다릅니다.' }, { status: 400 });
  }
  const toEmail = uniqueEmails[0] || '';

  // 아이템 병합
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
  for (const o of list) {
    let orderTotal = o.total_amount || 0;
    if (o.expert_quote_data) {
      try {
        const expert = JSON.parse(o.expert_quote_data) as { total_amount?: number };
        if (typeof expert.total_amount === 'number') {
          orderTotal = expert.total_amount;
        }
      } catch {}
    }
    totalAmount += orderTotal;
  }
  const displayAmount = totalAmount != null ? (correctDisplayAmount(Number(totalAmount)) ?? Number(totalAmount)) : null;
  const amountText = displayAmount != null ? ` (합계: ₩${Number(displayAmount).toLocaleString()})` : '';

  const pdfReady = false;
  const pdfError = '견적서는 인쇄(저장) 후 아래 파일 첨부로 추가해 주세요.';

  const requestOrigin = typeof req.url === 'string' ? new URL(req.url).origin : '';
  const envVars = env as unknown as Record<string, string | undefined>;
  const envAppUrl = process.env.NEXT_PUBLIC_APP_URL || envVars.NEXT_PUBLIC_APP_URL || '';
  const isLocalhost = (u: string) => !u || /^https?:\/\/localhost(:\d+)?(\/|$)/i.test(u);
  const baseUrl = !isLocalhost(requestOrigin) ? requestOrigin : (envAppUrl || requestOrigin);
  const estimateUrl = `${baseUrl.replace(/\/$/, '')}/admin/quotes`;

  const subject = buildDefaultSubject(`MERGED-${orderIds.length}`);
  const html = buildDefaultHtml({
    orderNumber: list.map((o) => o.order_number).join(', '),
    estimateUrl,
    amountText,
    displayAmount,
    withPdfAttachment: pdfReady,
  });
  const text = buildDefaultText({
    orderNumber: list.map((o) => o.order_number).join(', '),
    estimateUrl,
    amountText,
    displayAmount,
    withPdfAttachment: pdfReady,
  });

  return NextResponse.json({
    to: toEmail,
    subject,
    html,
    text,
    pdfReady,
    pdfError: pdfError || undefined,
    order_number: list.map((o) => o.order_number).join(', '),
    displayAmount,
    estimateUrl,
  });
}
