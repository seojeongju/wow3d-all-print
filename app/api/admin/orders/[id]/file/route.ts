import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAuth } from '@/lib/api-utils';

/**
 * GET /api/admin/orders/[id]/file - 주문 항목의 STL 파일 다운로드 (관리자 전용)
 * Query: ?quoteId= (quote_id 지정, 없으면 첫 번째 항목)
 */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const { id } = await context.params;
        const { env } = getCloudflareContext();
        if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });
        if (!env?.BUCKET) return NextResponse.json({ error: 'R2 BUCKET not available' }, { status: 503 });

        // 관리자 권한 확인
        const me = await env.DB.prepare('SELECT role FROM users WHERE id = ?')
            .bind(auth.userId)
            .first() as { role?: string } | null;
        if (!me || me.role !== 'admin') {
            return NextResponse.json({ error: '관리자만 접근할 수 있습니다' }, { status: 403 });
        }

        const numId = parseInt(id, 10);
        if (!Number.isInteger(numId)) {
            return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
        }

        // 주문 존재 확인
        const order = await env.DB.prepare('SELECT id FROM orders WHERE id = ?')
            .bind(numId)
            .first();
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // quoteId 파라미터 확인
        const searchParams = req.nextUrl.searchParams;
        const quoteIdParam = searchParams.get('quoteId');
        let quoteId: number | null = null;

        if (quoteIdParam) {
            const parsed = parseInt(quoteIdParam, 10);
            if (Number.isInteger(parsed)) quoteId = parsed;
        }

        // 주문 항목 조회
        let quoteQuery: string;
        let quoteBindings: any[];
        if (quoteId) {
            quoteQuery = `
                SELECT q.file_url, q.file_name
                FROM order_items oi
                JOIN quotes q ON oi.quote_id = q.id
                WHERE oi.order_id = ? AND q.id = ?
                LIMIT 1
            `;
            quoteBindings = [numId, quoteId];
        } else {
            quoteQuery = `
                SELECT q.file_url, q.file_name
                FROM order_items oi
                JOIN quotes q ON oi.quote_id = q.id
                WHERE oi.order_id = ?
                LIMIT 1
            `;
            quoteBindings = [numId];
        }

        const quote = await env.DB.prepare(quoteQuery)
            .bind(...quoteBindings)
            .first() as { file_url?: string | null; file_name?: string } | null;

        if (!quote || !quote.file_url) {
            return NextResponse.json({ error: '파일을 찾을 수 없습니다' }, { status: 404 });
        }

        // R2에서 파일 가져오기
        // file_url 형식: "quotes/{quoteId}/{fileName}" 또는 전체 URL 또는 R2 key
        let r2Key: string = quote.file_url;
        
        // URL인 경우 key 추출
        if (quote.file_url.startsWith('http://') || quote.file_url.startsWith('https://')) {
            try {
                const url = new URL(quote.file_url);
                // R2 public URL 또는 custom domain인 경우 pathname에서 key 추출
                const pathParts = url.pathname.split('/').filter(Boolean);
                const quotesIndex = pathParts.findIndex((p) => p === 'quotes');
                if (quotesIndex >= 0 && quotesIndex < pathParts.length - 1) {
                    r2Key = pathParts.slice(quotesIndex).join('/');
                } else {
                    // pathname 전체를 key로 사용 (앞의 / 제거)
                    r2Key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
                }
            } catch {
                // URL 파싱 실패 시 원본 사용
                r2Key = quote.file_url;
            }
        }
        
        // file_url이 없거나 비어있는 경우, quote_id로 key 생성 시도
        if (!r2Key || r2Key.trim() === '') {
            const quoteIdForKey = quoteId || (await env.DB.prepare('SELECT id FROM quotes WHERE id IN (SELECT quote_id FROM order_items WHERE order_id = ?) LIMIT 1').bind(numId).first() as { id?: number } | null)?.id;
            if (quoteIdForKey && quote.file_name) {
                r2Key = `quotes/${quoteIdForKey}/${quote.file_name}`;
            } else {
                return NextResponse.json({ error: '파일 경로를 찾을 수 없습니다' }, { status: 404 });
            }
        }

        // R2에서 파일 가져오기
        const r2Object = await env.BUCKET.get(r2Key);
        if (!r2Object) {
            return NextResponse.json({ error: 'R2에서 파일을 찾을 수 없습니다' }, { status: 404 });
        }

        // 파일 다운로드 응답
        const fileName = quote.file_name || 'model.stl';
        const fileBody = r2Object.body;
        if (!fileBody) {
            return NextResponse.json({ error: '파일 본문을 읽을 수 없습니다' }, { status: 500 });
        }

        const headers = new Headers();
        headers.set('Content-Type', r2Object.httpMetadata?.contentType || 'application/octet-stream');
        headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
        if (r2Object.httpMetadata?.contentLength) {
            headers.set('Content-Length', String(r2Object.httpMetadata.contentLength));
        }

        return new NextResponse(fileBody, { headers });
    } catch (e) {
        console.error('GET /api/admin/orders/[id]/file', e);
        return NextResponse.json({ error: '파일 다운로드 실패' }, { status: 500 });
    }
}
