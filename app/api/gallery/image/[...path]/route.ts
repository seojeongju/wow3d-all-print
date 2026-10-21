import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { GALLERY_THUMB_WIDTHS } from '@/lib/gallery-image-url';

/** 축소 변환 대상 (SVG·GIF 등은 원본 그대로) */
const RESIZABLE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const CACHE_CONTROL = 'public, max-age=2592000, s-maxage=2592000'; // 30일 캐싱

// 갤러리 이미지는 인증 없이 공개 제공
// ?w=640 처럼 너비를 주면 축소 WebP 썸네일을 제공 — 처음 한 번만 Images 바인딩으로 변환해 R2(gallery-thumb/)에 저장
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params;
        const r2Key = 'gallery/' + path.join('/');

        const { env } = getCloudflareContext();
        if (!env?.BUCKET) {
            return NextResponse.json({ error: 'R2 BUCKET 없음' }, { status: 503 });
        }

        const w = Number(request.nextUrl.searchParams.get('w'));
        const width = (GALLERY_THUMB_WIDTHS as readonly number[]).includes(w) ? w : null;
        const thumbKey = width ? `gallery-thumb/w${width}/${path.join('/')}.webp` : null;

        if (thumbKey) {
            const thumb = await env.BUCKET.get(thumbKey);
            if (thumb) {
                return new NextResponse(thumb.body as unknown as BodyInit, {
                    headers: { 'Content-Type': 'image/webp', 'Cache-Control': CACHE_CONTROL },
                });
            }
        }

        const object = await env.BUCKET.get(r2Key);
        if (!object) {
            // 404 콘솔 오류 방지: R2에 실제 이미지가 없는 경우 기본 이미지(OG image)로 우회합니다.
            return NextResponse.redirect(new URL('/og-naver-v2.jpg', request.url));
        }
        const contentType = object.httpMetadata?.contentType || 'image/jpeg';

        if (thumbKey && width && env.IMAGES && RESIZABLE_TYPES.has(contentType)) {
            try {
                const result = await env.IMAGES.input(object.body)
                    .transform({ width, fit: 'scale-down' })
                    .output({ format: 'image/webp', quality: 80 });
                const buf = await result.response().arrayBuffer();
                await env.BUCKET.put(thumbKey, buf, { httpMetadata: { contentType: 'image/webp' } });
                return new NextResponse(buf, {
                    headers: { 'Content-Type': 'image/webp', 'Cache-Control': CACHE_CONTROL },
                });
            } catch (e) {
                // 변환 실패 시 원본으로 대체 (스트림을 이미 읽었으므로 다시 가져옴)
                console.error('갤러리 썸네일 변환 실패', r2Key, e);
                const again = await env.BUCKET.get(r2Key);
                if (again) {
                    return new NextResponse(again.body as unknown as BodyInit, {
                        headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' },
                    });
                }
                return NextResponse.redirect(new URL('/og-naver-v2.jpg', request.url));
            }
        }

        const headers = new Headers();
        headers.set('Content-Type', contentType);
        headers.set('Cache-Control', CACHE_CONTROL);

        return new NextResponse(object.body as unknown as BodyInit, { headers });
    } catch (e) {
        console.error('GET /api/gallery/image', e);
        return NextResponse.json({ error: '이미지 로드 실패' }, { status: 500 });
    }
}
