import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import { resolveQuoteR2KeyCandidates } from '@/lib/r2-quote-file';
import {
    parseMeshyJobIdFromFileName,
    resolveMeshyR2KeyCandidates,
} from '@/lib/meshy-r2';
import { bakeStlToTargetMm, parseModelTransformJson, quoteSizedFileName } from '@/lib/stl-bake';

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
                SELECT q.id as quote_id, q.file_url, q.file_name,
                       q.dimensions_x, q.dimensions_y, q.dimensions_z, q.model_transform
                FROM order_items oi
                JOIN quotes q ON oi.quote_id = q.id
                WHERE oi.order_id = ? AND q.id = ?
                LIMIT 1
            `;
      quoteBindings = [numId, quoteId];
    } else {
      quoteQuery = `
                SELECT q.id as quote_id, q.file_url, q.file_name,
                       q.dimensions_x, q.dimensions_y, q.dimensions_z, q.model_transform
                FROM order_items oi
                JOIN quotes q ON oi.quote_id = q.id
                WHERE oi.order_id = ?
                LIMIT 1
            `;
      quoteBindings = [numId];
    }

    let quote: {
      quote_id?: number;
      file_url?: string | null;
      file_name?: string | null;
      dimensions_x?: number | null;
      dimensions_y?: number | null;
      dimensions_z?: number | null;
      model_transform?: string | null;
    } | null = null;
    try {
      quote = (await env.DB.prepare(quoteQuery).bind(...quoteBindings).first()) as typeof quote;
    } catch {
      const fallbackQuery = quoteQuery.replace(', q.model_transform', '');
      quote = (await env.DB.prepare(fallbackQuery).bind(...quoteBindings).first()) as typeof quote;
    }

    if (!quote?.quote_id) {
      return NextResponse.json({ error: '주문 항목을 찾을 수 없습니다' }, { status: 404 });
    }

    const candidates = resolveQuoteR2KeyCandidates({
      fileUrl: quote.file_url,
      quoteId: quote.quote_id,
      fileName: quote.file_name,
    });

    const meshyJobIdFromName = parseMeshyJobIdFromFileName(quote.file_name);
    let meshyResultKey: string | null = null;
    try {
      const meshyJob = await env.DB.prepare(
        `SELECT result_file_key, result_file_name FROM meshy_jobs
         WHERE quote_id = ? OR id = ?
         ORDER BY CASE WHEN quote_id = ? THEN 0 ELSE 1 END, id DESC
         LIMIT 1`
      )
        .bind(quote.quote_id, meshyJobIdFromName ?? -1, quote.quote_id)
        .first<{ result_file_key?: string | null; result_file_name?: string | null }>();
      meshyResultKey = meshyJob?.result_file_key ?? null;
    } catch {
      /* meshy_jobs 없음 */
    }

    for (const key of resolveMeshyR2KeyCandidates({
      fileUrl: quote.file_url,
      fileName: quote.file_name,
      resultFileKey: meshyResultKey,
    })) {
      if (!candidates.includes(key)) candidates.push(key);
    }

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

    const target = {
      x: Number(quote.dimensions_x) || 0,
      y: Number(quote.dimensions_y) || 0,
      z: Number(quote.dimensions_z) || 0,
    };
    let outBody: BodyInit = fileBody as BodyInit;
    let outLen = r2Object.size ?? r2Object.httpMetadata?.contentLength;
    let fileName = quote.file_name || usedKey.split('/').pop() || 'model.stl';

    if (target.x > 0.05 && target.y > 0.05 && target.z > 0.05) {
      try {
        const raw = await new Response(fileBody as BodyInit).arrayBuffer();
        const baked = bakeStlToTargetMm(raw, target, parseModelTransformJson(quote.model_transform));
        outBody = baked;
        outLen = baked.byteLength;
        fileName = quoteSizedFileName(quote.file_name || fileName, target);
      } catch (e) {
        console.warn('[admin/orders/file] STL bake failed, returning original', e);
      }
    }

    const headers = new Headers();
    headers.set('Content-Type', r2Object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set(
      'Content-Disposition',
      `attachment; filename="model.stl"; filename*=UTF-8''${encodeURIComponent(fileName)}`
    );
    if (outLen != null) headers.set('Content-Length', String(outLen));

    return new NextResponse(outBody, { headers });
  } catch (e) {
    console.error('GET /api/admin/orders/[id]/file', e);
    return NextResponse.json({ error: '파일 다운로드 실패' }, { status: 500 });
  }
}
