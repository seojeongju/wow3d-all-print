import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// 갤러리 이미지는 인증 없이 공개 제공
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params;
        const r2Key = 'gallery/' + path.join('/');

        const { env } = getCloudflareContext();
        if (!env?.BUCKET) {
            return NextResponse.json({ error: 'R2 BUCKET 없음' }, { status: 503 });
        }

        const object = await env.BUCKET.get(r2Key);
        if (!object) {
            return NextResponse.json({ error: '이미지를 찾을 수 없습니다' }, { status: 404 });
        }

        const headers = new Headers();
        headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
        headers.set('Cache-Control', 'public, max-age=2592000, s-maxage=2592000'); // 30일 캐싱

        return new NextResponse(object.body as any, { headers });
    } catch (e) {
        console.error('GET /api/gallery/image', e);
        return NextResponse.json({ error: '이미지 로드 실패' }, { status: 500 });
    }
}
