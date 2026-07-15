import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAuthOrGuest } from '@/lib/api-utils';
import { parseInquiryFileUrls } from '@/lib/inquiry-files';

async function hasInquiryAttachmentAccess(
    request: NextRequest,
    r2Key: string,
    db: CloudflareEnv['DB']
): Promise<boolean> {
    const token = request.nextUrl.searchParams.get('inquiry_token')?.trim();
    const match = r2Key.match(/^inquiries\/(\d+)\//);
    if (!token || !match) return false;

    const inquiryId = Number(match[1]);
    if (!Number.isInteger(inquiryId) || inquiryId < 1) return false;

    const inquiry = await db
        .prepare('SELECT reply_token, file_url FROM inquiries WHERE id = ?')
        .bind(inquiryId)
        .first<{ reply_token?: string | null; file_url?: string | null }>();

    if (!inquiry?.reply_token || inquiry.reply_token !== token) return false;
    return parseInquiryFileUrls(inquiry.file_url).includes(r2Key);
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params;
        const r2Key = path.join('/');

        const { env } = getCloudflareContext();
        if (!env?.BUCKET || !env?.DB) {
            return NextResponse.json({ error: '파일 스토리지를 사용할 수 없습니다' }, { status: 503 });
        }

        const inquiryAccess = await hasInquiryAttachmentAccess(request, r2Key, env.DB);
        if (!inquiryAccess) {
            const auth = await requireAuthOrGuest(request);
            if (auth instanceof Response) return auth;
        }

        const object = await env.BUCKET.get(r2Key);
        if (!object) {
            return NextResponse.json({ error: '파일을 찾을 수 없습니다' }, { status: 404 });
        }

        const headers = new Headers();
        headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
        headers.set(
            'Cache-Control',
            inquiryAccess
                ? 'private, no-store'
                : 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400'
        );

        return new NextResponse(object.body as any, { headers });
    } catch (e) {
        console.error('GET /api/files/[...path]', e);
        return NextResponse.json({ error: '파일 다운로드 실패' }, { status: 500 });
    }
}
