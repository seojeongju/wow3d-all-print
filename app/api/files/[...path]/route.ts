import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAuthOrGuest } from '@/lib/api-utils';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const auth = await requireAuthOrGuest(request);
        if (auth instanceof Response) return auth;

        const { path } = await params;
        const r2Key = path.join('/');

        const { env } = getCloudflareContext();
        if (!env?.BUCKET) {
            return NextResponse.json({ error: 'R2 BUCKET을 사용할 수 없습니다' }, { status: 503 });
        }

        const object = await env.BUCKET.get(r2Key);
        if (!object) {
            return NextResponse.json({ error: '파일을 찾을 수 없습니다' }, { status: 404 });
        }

        const headers = new Headers();
        headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');

        // Cache for 24 hours to improve thumbnail generation performance
        headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400');

        return new NextResponse(object.body as any, { headers });
    } catch (e) {
        console.error('GET /api/files/[...path]', e);
        return NextResponse.json({ error: '파일 다운로드 실패' }, { status: 500 });
    }
}
