import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * GET /api/assets/[filename]?key=assets/company/xxx.png
 * R2 버킷에서 파일을 읽어 브라우저로 스트리밍 (이미지 브릿지)
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const { env } = getCloudflareContext();
        if (!env?.BUCKET) return new Response('R2 not available', { status: 503 });

        const { filename } = await params;
        const key = req.nextUrl.searchParams.get('key');

        if (!key) return new Response('Key required', { status: 400 });

        const object = await env.BUCKET.get(key);

        if (!object) {
            return new Response('File not found', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('cache-control', 'public, max-age=31536000'); // 1년 캐시

        return new Response(object.body, {
            headers,
        });

    } catch (e) {
        console.error('GET /api/assets error:', e);
        return new Response('Internal Server Error', { status: 500 });
    }
}
