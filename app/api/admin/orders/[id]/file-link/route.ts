import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import { ADMIN_FILE_LINK_TTL_MS, createSignedOrderFileUrl } from '@/lib/admin-file-link';

const MAX_FILES = 10;

/**
 * POST /api/admin/orders/[id]/file-link - 주문 파일 서명 링크 발급 (관리자)
 * Body: { quoteIds: number[] } — Bambu Studio 실행기가 로그인 없이 파일을 받을 때 사용
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;

    const { id } = await context.params;
    const orderId = parseInt(id, 10);
    if (!Number.isInteger(orderId)) {
      return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as { quoteIds?: unknown };
    const quoteIds = Array.isArray(body.quoteIds)
      ? [...new Set(body.quoteIds.map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, MAX_FILES)
      : [];
    if (quoteIds.length === 0) {
      return NextResponse.json({ error: '열 파일이 없습니다' }, { status: 400 });
    }

    const order = await env.DB.prepare(
      'SELECT id FROM orders WHERE id = ? AND (store_id = ? OR store_id IS NULL)'
    )
      .bind(orderId, auth.storeId)
      .first();
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const placeholders = quoteIds.map(() => '?').join(',');
    const rows = await env.DB.prepare(
      `SELECT quote_id FROM order_items WHERE order_id = ? AND quote_id IN (${placeholders})`
    )
      .bind(orderId, ...quoteIds)
      .all<{ quote_id: number }>();
    const owned = new Set((rows.results ?? []).map((r: { quote_id: number }) => Number(r.quote_id)));

    const origin = req.nextUrl.origin;
    const links: { quoteId: number; url: string }[] = [];
    for (const quoteId of quoteIds) {
      if (!owned.has(quoteId)) continue;
      const url = await createSignedOrderFileUrl(origin, auth.storeId, orderId, quoteId);
      if (!url) {
        return NextResponse.json({ error: '서버 서명 키가 설정되지 않았습니다' }, { status: 500 });
      }
      links.push({ quoteId, url });
    }
    if (links.length === 0) {
      return NextResponse.json({ error: '주문에 해당 파일이 없습니다' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { links, expiresInMs: ADMIN_FILE_LINK_TTL_MS } });
  } catch (e) {
    console.error('POST /api/admin/orders/[id]/file-link', e);
    return NextResponse.json({ error: '링크 발급 실패' }, { status: 500 });
  }
}
