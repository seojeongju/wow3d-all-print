import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import { resolveQuoteR2KeyCandidates } from '@/lib/r2-quote-file';

/**
 * GET /api/admin/orders/[id]/file - 주문 항목의 모델링 파일 다운로드 (관리자)
 * Query: ?quoteId=
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });
    if (!env?.BUCKET) return NextResponse.json({ error: 'R2 BUCKET not available' }, { status: 503 });

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;

    const { id } = await context.params;
    const numId = parseInt(id, 10);
    if (!Number.isInteger(numId)) {
      return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
    }

    const order = await env.DB.prepare(
      'SELECT id FROM orders WHERE id = ? AND (store_id = ? OR store_id IS NULL)'
    )
      .bind(numId, auth.storeId)
      .first();
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const quoteIdParam = req.nextUrl.searchParams.get('quoteId');
    let quoteId: number | null = null;
    if (quoteIdParam) {
      const parsed = parseInt(quoteIdParam, 10);
      if (Number.isInteger(parsed)) quoteId = parsed;
    }

    let quoteQuery: string;
    let quoteBindings: (string | number)[];
    if (quoteId) {
      quoteQuery = `
                SELECT q.id as quote_id, q.file_url, q.file_name
                FROM order_items oi
                JOIN quotes q ON oi.quote_id = q.id
                WHERE oi.order_id = ? AND q.id = ?
                LIMIT 1
            `;
      quoteBindings = [numId, quoteId];
    } else {
      quoteQuery = `
                SELECT q.id as quote_id, q.file_url, q.file_name
                FROM order_items oi
                JOIN quotes q ON oi.quote_id = q.id
                WHERE oi.order_id = ?
                LIMIT 1
            `;
      quoteBindings = [numId];
    }

    const quote = (await env.DB.prepare(quoteQuery)
      .bind(...quoteBindings)
      .first()) as {
      quote_id?: number;
      file_url?: string | null;
      file_name?: string | null;
    } | null;

    if (!quote?.quote_id) {
      return NextResponse.json({ error: '주문 항목을 찾을 수 없습니다' }, { status: 404 });
    }

    const candidates = resolveQuoteR2KeyCandidates({
      fileUrl: quote.file_url,
      quoteId: quote.quote_id,
      fileName: quote.file_name,
    });

    if (candidates.length === 0) {
      return NextResponse.json({ error: '파일 경로를 찾을 수 없습니다' }, { status: 404 });
    }

    let r2Object: Awaited<ReturnType<NonNullable<typeof env.BUCKET>['get']>> = null;
    let usedKey: string | null = null;
    for (const key of candidates) {
      const obj = await env.BUCKET.get(key);
      if (obj) {
        r2Object = obj;
        usedKey = key;
        break;
      }
    }

    if (!r2Object || !usedKey) {
      return NextResponse.json(
        { error: 'R2에서 파일을 찾을 수 없습니다', tried: candidates.slice(0, 5) },
        { status: 404 }
      );
    }

    // file_url이 비어 있거나 다른 키였다면 DB에 복구
    if (!quote.file_url || quote.file_url !== usedKey) {
      try {
        await env.DB.prepare('UPDATE quotes SET file_url = ? WHERE id = ?')
          .bind(usedKey, quote.quote_id)
          .run();
      } catch (e) {
        console.warn('[admin/orders/file] file_url repair failed', e);
      }
    }

    const fileBody = r2Object.body;
    if (!fileBody) {
      return NextResponse.json({ error: '파일 본문을 읽을 수 없습니다' }, { status: 500 });
    }

    const fileName = quote.file_name || usedKey.split('/').pop() || 'model.stl';
    const headers = new Headers();
    headers.set('Content-Type', r2Object.httpMetadata?.contentType || 'application/octet-stream');
    // RFC 5987: 한글·특수문자 파일명
    headers.set(
      'Content-Disposition',
      `attachment; filename="model.stl"; filename*=UTF-8''${encodeURIComponent(fileName)}`
    );
    const size = r2Object.size ?? r2Object.httpMetadata?.contentLength;
    if (size != null) headers.set('Content-Length', String(size));

    return new NextResponse(fileBody, { headers });
  } catch (e) {
    console.error('GET /api/admin/orders/[id]/file', e);
    return NextResponse.json({ error: '파일 다운로드 실패' }, { status: 500 });
  }
}
