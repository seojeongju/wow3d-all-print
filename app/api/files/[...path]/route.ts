import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAuthOrGuest } from '@/lib/api-utils';
import { parseInquiryFileUrls } from '@/lib/inquiry-files';
import { meshyJobOwnedBy } from '@/lib/meshy-r2';
import {
    canUserDownloadMeshyStl,
    parseMeshyJobIdFromR2Key,
} from '@/lib/meshy-stl-download';

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

/** meshy/{jobId}/… — 작업 소유자만 프리뷰용 접근, ?download=1 은 제작 중 이후만 */
async function assertMeshyR2Access(
    request: NextRequest,
    r2Key: string,
    db: CloudflareEnv['DB']
): Promise<Response | null> {
    const jobId = parseMeshyJobIdFromR2Key(r2Key);
    if (jobId == null) return null;

    const auth = await requireAuthOrGuest(request);
    if (auth instanceof Response) return auth;

    const job = await db
        .prepare(`SELECT user_id, session_id FROM meshy_jobs WHERE id = ?`)
        .bind(jobId)
        .first<{ user_id: number | null; session_id: string | null }>();
    if (!job) {
        return NextResponse.json({ error: '파일을 찾을 수 없습니다' }, { status: 404 });
    }
    if (!meshyJobOwnedBy(job, auth)) {
        return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    const wantDownload =
        request.nextUrl.searchParams.get('download') === '1' ||
        request.nextUrl.searchParams.get('download') === 'true';
    if (wantDownload) {
        if (auth.isGuest || !auth.userId) {
            return NextResponse.json(
                {
                    error: 'STL 파일 저장은 로그인 후, 출력 주문이 제작 중으로 진행된 뒤에만 가능합니다.',
                    code: 'MESHY_STL_DOWNLOAD_FORBIDDEN',
                },
                { status: 403 }
            );
        }
        const canSave = await canUserDownloadMeshyStl(db, jobId, auth.userId);
        if (!canSave) {
            return NextResponse.json(
                {
                    error: 'STL 파일 저장은 해당 모델의 출력 주문이 「제작 중」으로 진행된 뒤에만 가능합니다.',
                    code: 'MESHY_STL_DOWNLOAD_FORBIDDEN',
                },
                { status: 403 }
            );
        }
    }
    return null;
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
            const meshyDenied = await assertMeshyR2Access(request, r2Key, env.DB);
            if (meshyDenied) return meshyDenied;

            // meshy 경로는 위에서 소유자 검증을 이미 끝냄
            if (parseMeshyJobIdFromR2Key(r2Key) == null) {
                const auth = await requireAuthOrGuest(request);
                if (auth instanceof Response) return auth;
            }
        }

        const object = await env.BUCKET.get(r2Key);
        if (!object) {
            return NextResponse.json({ error: '파일을 찾을 수 없습니다' }, { status: 404 });
        }

        const wantDownload =
            request.nextUrl.searchParams.get('download') === '1' ||
            request.nextUrl.searchParams.get('download') === 'true';
        const isMeshy = parseMeshyJobIdFromR2Key(r2Key) != null;
        const fileName = r2Key.split('/').pop() || 'file';

        const headers = new Headers();
        headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
        headers.set(
            'Cache-Control',
            inquiryAccess || isMeshy
                ? 'private, no-store'
                : 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400'
        );
        if (isMeshy) {
            headers.set(
                'Content-Disposition',
                wantDownload
                    ? `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
                    : `inline; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
            );
        }

        return new NextResponse(object.body as BodyInit, { headers });
    } catch (e) {
        console.error('GET /api/files/[...path]', e);
        return NextResponse.json({ error: '파일 다운로드 실패' }, { status: 500 });
    }
}
