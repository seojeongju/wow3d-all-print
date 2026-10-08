import { notifyUserInquiryReplied } from '@/lib/inquiry-user-notify';
import type { SendEmailResult } from '@/lib/mail-utils';
import { parseReplyAttachments, type ReplyAttachmentMeta } from '@/lib/inquiry-reply-attachments';

export type InquiryDb = CloudflareEnv['DB'];
export type InquiryBucket = CloudflareEnv['BUCKET'];

export type InquiryReplyChannel = 'admin_web' | 'email_reply' | 'legacy';
export type InquiryReplySendStatus = 'sent' | 'failed' | 'unknown';

export type InquiryReplyRow = {
    id: number;
    inquiry_id: number;
    channel: InquiryReplyChannel;
    body: string;
    sent_to: string | null;
    send_status: InquiryReplySendStatus;
    send_error: string | null;
    created_by: number | null;
    created_at: string;
    sent_at: string | null;
    attachments: ReplyAttachmentMeta[];
};

export type InquiryForReply = {
    id: number;
    name: string;
    email: string;
    subject: string | null;
    message: string;
    status: string;
};

/** 메일에 첨부할 파일 (content: base64) */
export type ReplyAttachmentPayload = {
    meta: ReplyAttachmentMeta;
    content: string;
};

const REPLY_BODY_MAX = 10000;

export function isMissingRepliesSchema(e: unknown): boolean {
    const msg = e instanceof Error ? e.message : String(e);
    return /no such table:\s*inquiry_replies|no such column:\s*admin_notify/i.test(msg);
}

export function isMissingAttachmentsColumn(e: unknown): boolean {
    const msg = e instanceof Error ? e.message : String(e);
    return /no such column:\s*attachments|has no column named attachments/i.test(msg);
}

/** 메일을 보낸 뒤 이력 저장만 실패하는 일이 없도록 발송 전에 확인 */
export async function hasAttachmentsColumn(db: InquiryDb): Promise<boolean> {
    try {
        await db.prepare('SELECT attachments FROM inquiry_replies LIMIT 0').all();
        return true;
    } catch (e) {
        if (isMissingAttachmentsColumn(e)) return false;
        throw e;
    }
}

export function normalizeReplyBody(raw: unknown): string {
    return typeof raw === 'string' ? raw.replace(/\r\n/g, '\n').trim().slice(0, REPLY_BODY_MAX) : '';
}

const STORE_INQUIRIES = '(store_id = ? OR store_id IS NULL)';

/** 관리자 매장 범위의 문의 1건 (store_id 컬럼이 없는 DB도 지원) */
export async function findInquiryForStore(
    db: InquiryDb,
    inquiryId: number,
    storeId: number
): Promise<Record<string, unknown> | null> {
    try {
        return await db
            .prepare(`SELECT * FROM inquiries WHERE id = ? AND ${STORE_INQUIRIES}`)
            .bind(inquiryId, storeId)
            .first<Record<string, unknown>>();
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!/no such column:\s*store_id/i.test(msg)) throw e;
        return await db
            .prepare('SELECT * FROM inquiries WHERE id = ?')
            .bind(inquiryId)
            .first<Record<string, unknown>>();
    }
}

export function toInquiryForReply(row: Record<string, unknown>): InquiryForReply {
    return {
        id: Number(row.id),
        name: String(row.name || ''),
        email: String(row.email || ''),
        subject: (row.subject as string | null) ?? null,
        message: String(row.message || ''),
        status: String(row.status || ''),
    };
}

/** SELECT * 로 읽어 attachments 컬럼이 아직 없는 DB에서도 동작 */
function toReplyRow(raw: Record<string, unknown>): InquiryReplyRow {
    return {
        id: Number(raw.id),
        inquiry_id: Number(raw.inquiry_id),
        channel: raw.channel as InquiryReplyChannel,
        body: String(raw.body ?? ''),
        sent_to: (raw.sent_to as string | null) ?? null,
        send_status: raw.send_status as InquiryReplySendStatus,
        send_error: (raw.send_error as string | null) ?? null,
        created_by: raw.created_by == null ? null : Number(raw.created_by),
        created_at: String(raw.created_at ?? ''),
        sent_at: (raw.sent_at as string | null) ?? null,
        attachments: parseReplyAttachments(raw.attachments),
    };
}

async function getReplyRow(db: InquiryDb, replyId: number): Promise<InquiryReplyRow | null> {
    const raw = await db
        .prepare('SELECT * FROM inquiry_replies WHERE id = ?')
        .bind(replyId)
        .first<Record<string, unknown>>();
    return raw ? toReplyRow(raw) : null;
}

export async function listInquiryReplies(db: InquiryDb, inquiryId: number): Promise<InquiryReplyRow[]> {
    const { results } = await db
        .prepare('SELECT * FROM inquiry_replies WHERE inquiry_id = ? ORDER BY created_at ASC, id ASC')
        .bind(inquiryId)
        .all<Record<string, unknown>>();
    return (results || []).map(toReplyRow);
}

/** 메일 답장 재전송(Worker 재시도 등)으로 같은 본문이 이미 기록됐는지 */
export async function hasSameReply(
    db: InquiryDb,
    inquiryId: number,
    channel: InquiryReplyChannel,
    body: string
): Promise<boolean> {
    const row = await db
        .prepare(`SELECT id FROM inquiry_replies WHERE inquiry_id = ? AND channel = ? AND body = ? LIMIT 1`)
        .bind(inquiryId, channel, body)
        .first<{ id: number }>();
    return Boolean(row);
}

async function sendReplyMail(
    env: Record<string, unknown>,
    inquiry: InquiryForReply,
    body: string,
    attachments: ReplyAttachmentPayload[]
): Promise<SendEmailResult> {
    try {
        return await notifyUserInquiryReplied(
            {
                inquiryId: inquiry.id,
                name: inquiry.name,
                email: inquiry.email,
                subject: inquiry.subject,
                message: inquiry.message,
                replyMessage: body,
                attachments: attachments.map((a) => ({ filename: a.meta.name, content: a.content })),
            },
            env
        );
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : '답변 메일 발송 실패' };
    }
}

/**
 * 고객에게 답변 메일을 보내고 결과를 이력에 남긴다.
 * 발송에 성공하면 문의 상태를 「답변완료」로 바꾼다. 내부 메모(admin_note)는 건드리지 않는다.
 */
export async function sendInquiryReply(
    db: InquiryDb,
    env: Record<string, unknown>,
    inquiry: InquiryForReply,
    input: {
        body: string;
        channel: InquiryReplyChannel;
        createdBy?: number | null;
        attachments?: ReplyAttachmentPayload[];
    }
): Promise<{ reply: InquiryReplyRow | null; result: SendEmailResult }> {
    const attachments = input.attachments || [];
    const result = await sendReplyMail(env, inquiry, input.body, attachments);

    const sendStatus: InquiryReplySendStatus = result.ok ? 'sent' : 'failed';
    const sendError = result.ok ? null : result.error;
    const baseValues = [
        inquiry.id,
        input.channel,
        input.body,
        inquiry.email,
        sendStatus,
        sendError,
        input.createdBy ?? null,
    ];

    const inserted = attachments.length
        ? await db
              .prepare(
                  `INSERT INTO inquiry_replies (inquiry_id, channel, body, sent_to, send_status, send_error, created_by, attachments, sent_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'sent' THEN CURRENT_TIMESTAMP ELSE NULL END)`
              )
              .bind(...baseValues, JSON.stringify(attachments.map((a) => a.meta)), sendStatus)
              .run()
        : await db
              .prepare(
                  `INSERT INTO inquiry_replies (inquiry_id, channel, body, sent_to, send_status, send_error, created_by, sent_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'sent' THEN CURRENT_TIMESTAMP ELSE NULL END)`
              )
              .bind(...baseValues, sendStatus)
              .run();

    if (result.ok && inquiry.status !== 'replied' && inquiry.status !== 'closed') {
        await db
            .prepare(`UPDATE inquiries SET status = 'replied', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
            .bind(inquiry.id)
            .run();
    }

    const replyId = Number(inserted.meta?.last_row_id);
    const reply = replyId ? await getReplyRow(db, replyId) : null;
    return { reply, result };
}

/** R2에 보관한 답변 첨부를 다시 읽어 메일 첨부용 base64로 만든다 */
async function loadStoredAttachments(
    bucket: InquiryBucket | undefined,
    metas: ReplyAttachmentMeta[]
): Promise<ReplyAttachmentPayload[] | { error: string }> {
    if (metas.length === 0) return [];
    if (!bucket) return { error: '파일 저장소(R2)를 사용할 수 없어 첨부파일을 다시 보낼 수 없습니다.' };
    const out: ReplyAttachmentPayload[] = [];
    for (const meta of metas) {
        const obj = await bucket.get(meta.key);
        if (!obj) return { error: `첨부파일을 찾을 수 없습니다: ${meta.name}` };
        const buf = await obj.arrayBuffer();
        out.push({ meta, content: Buffer.from(buf).toString('base64') });
    }
    return out;
}

/** 발송 실패한 답변을 같은 내용(첨부 포함)으로 다시 보낸다 */
export async function resendInquiryReply(
    db: InquiryDb,
    env: Record<string, unknown>,
    inquiry: InquiryForReply,
    replyId: number,
    bucket?: InquiryBucket
): Promise<{ reply: InquiryReplyRow | null; result: SendEmailResult } | null> {
    const raw = await db
        .prepare('SELECT * FROM inquiry_replies WHERE id = ? AND inquiry_id = ?')
        .bind(replyId, inquiry.id)
        .first<Record<string, unknown>>();
    if (!raw) return null;
    const row = toReplyRow(raw);

    const loaded = await loadStoredAttachments(bucket, row.attachments);
    const result: SendEmailResult =
        'error' in loaded ? { ok: false, error: loaded.error } : await sendReplyMail(env, inquiry, row.body, loaded);

    if (result.ok) {
        await db
            .prepare(
                `UPDATE inquiry_replies SET send_status = 'sent', send_error = NULL, sent_to = ?, sent_at = CURRENT_TIMESTAMP WHERE id = ?`
            )
            .bind(inquiry.email, row.id)
            .run();
        if (inquiry.status !== 'replied' && inquiry.status !== 'closed') {
            await db
                .prepare(`UPDATE inquiries SET status = 'replied', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
                .bind(inquiry.id)
                .run();
        }
    } else {
        await db
            .prepare(`UPDATE inquiry_replies SET send_status = 'failed', send_error = ? WHERE id = ?`)
            .bind(result.error, row.id)
            .run();
    }

    return { reply: await getReplyRow(db, row.id), result };
}

/** 관리자 알림 메일 발송 결과 저장 (컬럼이 아직 없으면 조용히 건너뜀) */
export async function recordAdminNotifyResult(
    db: InquiryDb,
    inquiryId: number,
    result: SendEmailResult
): Promise<void> {
    try {
        await db
            .prepare(
                `UPDATE inquiries
                 SET admin_notify_status = ?,
                     admin_notify_error = ?,
                     admin_notified_at = CASE WHEN ? = 'sent' THEN CURRENT_TIMESTAMP ELSE admin_notified_at END,
                     admin_notify_attempts = COALESCE(admin_notify_attempts, 0) + 1
                 WHERE id = ?`
            )
            .bind(
                result.ok ? 'sent' : 'failed',
                result.ok ? null : result.error,
                result.ok ? 'sent' : 'failed',
                inquiryId
            )
            .run();
    } catch (e) {
        if (!isMissingRepliesSchema(e)) {
            console.warn('관리자 알림 발송 상태 저장 실패', e);
        }
    }
}
