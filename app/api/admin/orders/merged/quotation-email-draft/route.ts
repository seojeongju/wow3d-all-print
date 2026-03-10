import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import { correctDisplayAmount } from '@/lib/amount-display';
import { buildQuotationPdf } from '@/lib/quotation-pdf';
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
    `SELECT oi.id, oi.order_id, oi.quantity, oi.unit_price, oi.subtotal, q.file_name, q.print_method
     FROM order_items oi
     LEFT JOIN quotes q ON oi.quote_id = q.id
     WHERE oi.order_id IN (${placeholders})
     ORDER BY oi.order_id ASC, oi.id ASC`
  ).bind(...orderIds).all() as { results?: ItemRow[] };
  const items = itemsRes?.results ?? [];

  let totalAmount: number | null = null;
  if (items.length > 0) {
    const supplyTotal = items.reduce((acc, it) => acc + (correctDisplayAmount(Math.round(Number(it.subtotal))) ?? Math.round(Number(it.subtotal))), 0);
    totalAmount = supplyTotal + Math.floor(supplyTotal * 0.1);
  }
  const displayAmount = totalAmount != null ? (correctDisplayAmount(Number(totalAmount)) ?? Number(totalAmount)) : null;
  const amountText = displayAmount != null ? ` (합계: ₩${Number(displayAmount).toLocaleString()})` : '';

  // PDF 생성 가능 여부 확인
  let pdfReady = false;
  let pdfError: string | undefined;
  try {
    const base = list[0];
    const orderForPdf = {
      order_number: `MERGED-${orderIds.length}`,
      created_at: base.created_at,
      recipient_name: base.recipient_name || '',
      recipient_phone: base.recipient_phone || '',
      shipping_address: base.shipping_address || '',
      user_email: base.user_email,
      guest_email: base.guest_email,
    };
    const itemsForPdf = items.map((it, idx) => {
      const orderNo = list.find((o) => o.id === it.order_id)?.order_number || String(it.order_id);
      const fileName = it.file_name || `Item ${idx + 1}`;
      return {
        file_name: `[${orderNo}] ${fileName}`,
        print_method: it.print_method,
        quantity: Number(it.quantity) || 1,
        unit_price: Math.round(Number(it.unit_price) || 0),
        subtotal: Math.round(Number(it.subtotal) || 0),
      };
    });
    if (itemsForPdf.length > 0) {
      await buildQuotationPdf(orderForPdf, itemsForPdf, 'WOW3D');
      pdfReady = true;
    } else {
      pdfError = '주문 품목이 없어 PDF를 생성할 수 없습니다.';
    }
  } catch (err) {
    pdfError = err instanceof Error ? err.message : String(err);
  }

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
  });
}

