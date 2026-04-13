import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

/** 공개 쇼케이스 미디어 (R2 showcase/...) */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params;
        const r2Key = 'showcase/' + path.join('/');
        if (path.some((p) => p.includes('..') || p.startsWith('/'))) {
            return NextResponse.json({ error: '잘못된 경로' }, { status: 400 });
        }

        const { env } = getCloudflareContext();
        if (!env?.BUCKET) {
            return NextResponse.json({ error: 'R2 BUCKET 없음' }, { status: 503 });
        }

        const object = await env.BUCKET.get(r2Key);
        if (!object) {
            return NextResponse.redirect(new URL('/placeholder-3d.svg', request.url));
        }

        const headers = new Headers();
        const ct = object.httpMetadata?.contentType || 'application/octet-stream';
        headers.set('Content-Type', ct);
        headers.set('Cache-Control', 'public, max-age=2592000, s-maxage=2592000');

        return new NextResponse(object.body as BodyInit, { headers });
    } catch (e) {
        console.error('GET /api/showcase/media', e);
        return NextResponse.json({ error: '미디어 로드 실패' }, { status: 500 });
    }
}
