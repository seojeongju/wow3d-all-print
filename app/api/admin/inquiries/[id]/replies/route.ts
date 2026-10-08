import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import {
    findInquiryForStore,
    hasSameReply,
    isMissingRepliesSchema,
    listInquiryReplies,
    normalizeReplyBody,
    resendInquiryReply,
    sendInquiryReply,
    toInquiryForReply,
} from '@/lib/inquiry-replies';

const SCHEMA_MISSING_MESSAGE =
    '답변 이력 테이블이 아직 없습니다. migrations/schema_inquiry_replies.sql 을 D1에 적용해 주세요.';

function parseId(raw: string): number | null {
    const n = parseInt(raw, 10);
    return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * GET /api/admin/inquiries/[id]/replies - 답변 이력 + 관리자 알림 발송 상태
 */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    const inquiryId = parseId(id);
    if (!inquiryId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;

    try {
        const row = await findInquiryForStore(env.DB, inquiryId, auth.storeId);
        if (!row) return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });

        let replies: Awaited<ReturnType<typeof listInquiryReplies>> = [];
        let schemaReady = true;
        try {
            replies = await listInquiryReplies(env.DB, inquiryId);
        } catch (e) {
            if (!isMissingRepliesSchema(e)) throw e;
            schemaReady = false;
        }

        return NextResponse.json({
            success: true,
            data: {
                replies,
                schemaReady,
                adminNotify: {
                    status: (row.admin_notify_status as string | null) ?? null,
                    error: (row.admin_notify_error as string | null) ?? null,
                    notifiedAt: (row.admin_notified_at as string | null) ?? null,
                    attempts: Number(row.admin_notify_attempts ?? 0),
                },
            },
        });
    } catch (e) {
        console.error('GET /api/admin/inquiries/[id]/replies', e);
        return NextResponse.json({ error: '답변 이력을 불러오지 못했습니다.' }, { status: 500 });
    }
}

/**
 * POST /api/admin/inquiries/[id]/replies - 고객에게 답변 발송
 * Body: { message: string } 새 답변 / { resendReplyId: number } 실패한 답변 재발송
 */
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    const inquiryId = parseId(id);
    if (!inquiryId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;

    let body: { message?: unknown; resendReplyId?: unknown } = {};
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const envRecord = env as unknown as Record<string, unknown>;

    try {
        const row = await findInquiryForStore(env.DB, inquiryId, auth.storeId);
        if (!row) return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
        const inquiry = toInquiryForReply(row);
        if (!inquiry.email) {
            return NextResponse.json({ error: '고객 이메일 주소가 없어 답변을 보낼 수 없습니다.' }, { status: 400 });
        }

        const resendReplyId = Number(body.resendReplyId);
        if (Number.isInteger(resendReplyId) && resendReplyId > 0) {
            const resent = await resendInquiryReply(env.DB, envRecord, inquiry, resendReplyId);
            if (!resent) return NextResponse.json({ error: '답변 기록을 찾을 수 없습니다.' }, { status: 404 });
            return NextResponse.json({
                success: resent.result.ok,
                data: { reply: resent.reply },
                error: resent.result.ok ? undefined : resent.result.error,
            });
        }

        const message = normalizeReplyBody(body.message);
        if (message.length < 2) {
            return NextResponse.json({ error: '답변 내용을 입력해 주세요.' }, { status: 400 });
        }
        if (await hasSameReply(env.DB, inquiryId, 'admin_web', message)) {
            return NextResponse.json(
                { error: '같은 내용의 답변을 이미 보냈습니다. 발송 실패 건은 이력에서 재발송해 주세요.' },
                { status: 409 }
            );
        }

        const { reply, result } = await sendInquiryReply(env.DB, envRecord, inquiry, {
            body: message,
            channel: 'admin_web',
            createdBy: auth.userId,
        });

        return NextResponse.json({
            success: result.ok,
            data: { reply },
            error: result.ok ? undefined : result.error,
        });
    } catch (e) {
        if (isMissingRepliesSchema(e)) {
            return NextResponse.json({ error: SCHEMA_MISSING_MESSAGE }, { status: 503 });
        }
        console.error('POST /api/admin/inquiries/[id]/replies', e);
        return NextResponse.json({ error: '답변 발송 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
