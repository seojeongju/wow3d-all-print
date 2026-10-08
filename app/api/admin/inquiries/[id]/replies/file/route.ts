import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import { findInquiryForStore } from '@/lib/inquiry-replies';

/**
 * GET /api/admin/inquiries/[id]/replies/file?key=... - 답변에 첨부한 파일 내려받기 (관리자 전용)
 */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const { env } = getCloudflareContext();
    if (!env?.DB || !env?.BUCKET) {
        return NextResponse.json({ error: '파일 저장소를 사용할 수 없습니다.' }, { status: 503 });
    }

    const inquiryId = parseInt(id, 10);
    if (!Number.isInteger(inquiryId) || inquiryId < 1) {
        return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;

    const key = req.nextUrl.searchParams.get('key') || '';
    if (!key.startsWith(`inquiry-replies/${inquiryId}/`) || key.includes('..')) {
        return NextResponse.json({ error: '잘못된 파일 경로입니다.' }, { status: 400 });
    }

    const inquiry = await findInquiryForStore(env.DB, inquiryId, auth.storeId);
    if (!inquiry) return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });

    const object = await env.BUCKET.get(key);
    if (!object) return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 });

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Cache-Control', 'private, no-store');
    return new NextResponse(object.body as ReadableStream, { headers });
}
