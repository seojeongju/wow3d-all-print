import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import {
    findInquiryForStore,
    hasAttachmentsColumn,
    hasSameReply,
    isMissingAttachmentsColumn,
    isMissingRepliesSchema,
    listInquiryReplies,
    normalizeReplyBody,
    resendInquiryReply,
    sendInquiryReply,
    toInquiryForReply,
    type InquiryBucket,
    type ReplyAttachmentPayload,
} from '@/lib/inquiry-replies';
import {
    formatFileSize,
    guessAttachmentContentType,
    isAllowedReplyAttachment,
    REPLY_ATTACHMENT_HINT,
    REPLY_ATTACHMENT_MAX_COUNT,
    REPLY_ATTACHMENT_MAX_TOTAL,
    sanitizeAttachmentName,
} from '@/lib/inquiry-reply-attachments';

const SCHEMA_MISSING_MESSAGE =
    '답변 이력 테이블이 아직 없습니다. migrations/schema_inquiry_replies.sql 을 D1에 적용해 주세요.';
const ATTACHMENTS_SCHEMA_MISSING_MESSAGE =
    '첨부파일 기록 컬럼이 아직 없습니다. migrations/schema_inquiry_reply_attachments.sql 을 D1에 적용해 주세요.';

function parseId(raw: string): number | null {
    const n = parseInt(raw, 10);
    return Number.isInteger(n) && n > 0 ? n : null;
}

type ParsedReplyRequest = {
    message?: unknown;
    resendReplyId?: unknown;
    files: File[];
};

async function parseReplyRequest(req: NextRequest): Promise<ParsedReplyRequest | null> {
    const contentType = req.headers.get('content-type') || '';
    try {
        if (contentType.includes('multipart/form-data')) {
            const form = await req.formData();
            const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
            return { message: form.get('message'), files };
        }
        const json = (await req.json()) as { message?: unknown; resendReplyId?: unknown };
        return { message: json.message, resendReplyId: json.resendReplyId, files: [] };
    } catch {
        return null;
    }
}

function validateReplyFiles(files: File[]): string | null {
    if (files.length > REPLY_ATTACHMENT_MAX_COUNT) {
        return `첨부파일은 최대 ${REPLY_ATTACHMENT_MAX_COUNT}개까지 보낼 수 있습니다.`;
    }
    const blocked = files.find((f) => !isAllowedReplyAttachment(f.name));
    if (blocked) {
        return `첨부할 수 없는 파일 형식입니다: ${blocked.name} (허용: ${REPLY_ATTACHMENT_HINT})`;
    }
    const total = files.reduce((sum, f) => sum + f.size, 0);
    if (total > REPLY_ATTACHMENT_MAX_TOTAL) {
        return `첨부파일 합계가 ${formatFileSize(total)}입니다. 메일 첨부는 합계 ${formatFileSize(REPLY_ATTACHMENT_MAX_TOTAL)}까지 가능합니다.`;
    }
    return null;
}

/** 재발송에 쓰도록 R2에 보관하고, 메일 첨부용 base64를 함께 만든다 */
async function storeReplyFiles(
    bucket: InquiryBucket,
    inquiryId: number,
    files: File[]
): Promise<ReplyAttachmentPayload[]> {
    const stamp = Date.now();
    const out: ReplyAttachmentPayload[] = [];
    for (const file of files) {
        const name = sanitizeAttachmentName(file.name);
        const type = guessAttachmentContentType(name, file.type);
        const key = `inquiry-replies/${inquiryId}/${stamp}_${crypto.randomUUID().slice(0, 8)}_${name.replace(/[^\w.\-가-힣]/g, '_')}`;
        const buf = await file.arrayBuffer();
        await bucket.put(key, buf, { httpMetadata: { contentType: type } });
        out.push({
            meta: { key, name, size: file.size, type },
            content: Buffer.from(buf).toString('base64'),
        });
    }
    return out;
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
 * JSON: { message: string } 새 답변 / { resendReplyId: number } 실패한 답변 재발송
 * multipart/form-data: message + files[] (첨부파일은 메일에 직접 첨부, 합계 10MB)
 */
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    const inquiryId = parseId(id);
    if (!inquiryId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;

    const body = await parseReplyRequest(req);
    if (!body) {
        return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
    }
    const fileError = validateReplyFiles(body.files);
    if (fileError) return NextResponse.json({ error: fileError }, { status: 400 });
    if (body.files.length > 0 && !env.BUCKET) {
        return NextResponse.json({ error: '파일 저장소(R2)를 사용할 수 없어 첨부파일을 보낼 수 없습니다.' }, { status: 503 });
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
            const resent = await resendInquiryReply(env.DB, envRecord, inquiry, resendReplyId, env.BUCKET);
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
        // 첨부가 있으면 같은 문구에 다른 파일을 보내는 경우가 있어 중복 검사를 하지 않는다
        if (body.files.length === 0 && (await hasSameReply(env.DB, inquiryId, 'admin_web', message))) {
            return NextResponse.json(
                { error: '같은 내용의 답변을 이미 보냈습니다. 발송 실패 건은 이력에서 재발송해 주세요.' },
                { status: 409 }
            );
        }

        if (body.files.length > 0 && !(await hasAttachmentsColumn(env.DB))) {
            return NextResponse.json({ error: ATTACHMENTS_SCHEMA_MISSING_MESSAGE }, { status: 503 });
        }
        const attachments = body.files.length ? await storeReplyFiles(env.BUCKET, inquiryId, body.files) : [];

        const { reply, result } = await sendInquiryReply(env.DB, envRecord, inquiry, {
            body: message,
            channel: 'admin_web',
            createdBy: auth.userId,
            attachments,
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
        if (isMissingAttachmentsColumn(e)) {
            return NextResponse.json({ error: ATTACHMENTS_SCHEMA_MISSING_MESSAGE }, { status: 503 });
        }
        console.error('POST /api/admin/inquiries/[id]/replies', e);
        return NextResponse.json({ error: '답변 발송 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
