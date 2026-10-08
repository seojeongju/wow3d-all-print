import { notifyUserInquiryReplied } from '@/lib/inquiry-user-notify';
import type { SendEmailResult } from '@/lib/mail-utils';

export type InquiryDb = CloudflareEnv['DB'];

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
};

export type InquiryForReply = {
    id: number;
    name: string;
    email: string;
    subject: string | null;
    message: string;
    status: string;
};

const REPLY_BODY_MAX = 10000;

export function isMissingRepliesSchema(e: unknown): boolean {
    const msg = e instanceof Error ? e.message : String(e);
    return /no such table:\s*inquiry_replies|no such column:\s*admin_notify/i.test(msg);
}

export function normalizeReplyBody(raw: unknown): string {
    return typeof raw === 'string' ? raw.replace(/\r\n/g, '\n').trim().slice(0, REPLY_BODY_MAX) : '';
}

const STORE_INQUIRIES = '(store_id = ? OR store_id IS NULL)';

/** 愿由ъ옄 留ㅼ옣 踰붿쐞??臾몄쓽 1嫄?(store_id 而щ읆???녿뒗 DB??吏?? */
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

export async function listInquiryReplies(db: InquiryDb, inquiryId: number): Promise<InquiryReplyRow[]> {
    const { results } = await db
        .prepare(
            `SELECT id, inquiry_id, channel, body, sent_to, send_status, send_error, created_by, created_at, sent_at
             FROM inquiry_replies WHERE inquiry_id = ? ORDER BY created_at ASC, id ASC`
        )
        .bind(inquiryId)
        .all<InquiryReplyRow>();
    return results || [];
}

/** 硫붿씪 ?듭옣 ?ъ쟾??Worker ?ъ떆?? ?깆쑝濡?媛숈? 蹂몃Ц???대? 湲곕줉?먮뒗吏 */
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

/**
 * 怨좉컼?먭쾶 ?듬? 硫붿씪??蹂대궡怨?寃곌낵瑜??대젰???④릿??
 * 諛쒖넚???깃났?섎㈃ 臾몄쓽 ?곹깭瑜??뚮떟蹂?꾨즺?띾줈 諛붽씔?? ?대? 硫붾え(admin_note)??嫄대뱶由ъ? ?딅뒗??
 */
export async function sendInquiryReply(
    db: InquiryDb,
    env: Record<string, unknown>,
    inquiry: InquiryForReply,
    input: { body: string; channel: InquiryReplyChannel; createdBy?: number | null }
): Promise<{ reply: InquiryReplyRow | null; result: SendEmailResult }> {
    let result: SendEmailResult;
    try {
        result = await notifyUserInquiryReplied(
            {
                inquiryId: inquiry.id,
                name: inquiry.name,
                email: inquiry.email,
                subject: inquiry.subject,
                message: inquiry.message,
                replyMessage: input.body,
            },
            env
        );
    } catch (e) {
        result = { ok: false, error: e instanceof Error ? e.message : '?듬? 硫붿씪 諛쒖넚 ?ㅽ뙣' };
    }

    const sendStatus: InquiryReplySendStatus = result.ok ? 'sent' : 'failed';
    const sendError = result.ok ? null : result.error;

    const inserted = await db
        .prepare(
            `INSERT INTO inquiry_replies (inquiry_id, channel, body, sent_to, send_status, send_error, created_by, sent_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'sent' THEN CURRENT_TIMESTAMP ELSE NULL END)`
        )
        .bind(
            inquiry.id,
            input.channel,
            input.body,
            inquiry.email,
            sendStatus,
            sendError,
            input.createdBy ?? null,
            sendStatus
        )
        .run();

    if (result.ok && inquiry.status !== 'replied' && inquiry.status !== 'closed') {
        await db
            .prepare(`UPDATE inquiries SET status = 'replied', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
            .bind(inquiry.id)
            .run();
    }

    const replyId = Number(inserted.meta?.last_row_id);
    const reply = replyId
        ? await db
              .prepare(
                  `SELECT id, inquiry_id, channel, body, sent_to, send_status, send_error, created_by, created_at, sent_at
                   FROM inquiry_replies WHERE id = ?`
              )
              .bind(replyId)
              .first<InquiryReplyRow>()
        : null;

    return { reply, result };
}

/** 諛쒖넚 ?ㅽ뙣???듬???媛숈? ?댁슜?쇰줈 ?ㅼ떆 蹂대궦??*/
export async function resendInquiryReply(
    db: InquiryDb,
    env: Record<string, unknown>,
    inquiry: InquiryForReply,
    replyId: number
): Promise<{ reply: InquiryReplyRow | null; result: SendEmailResult } | null> {
    const row = await db
        .prepare(`SELECT id, body, send_status FROM inquiry_replies WHERE id = ? AND inquiry_id = ?`)
        .bind(replyId, inquiry.id)
        .first<{ id: number; body: string; send_status: string }>();
    if (!row) return null;

    let result: SendEmailResult;
    try {
        result = await notifyUserInquiryReplied(
            {
                inquiryId: inquiry.id,
                name: inquiry.name,
                email: inquiry.email,
                subject: inquiry.subject,
                message: inquiry.message,
                replyMessage: row.body,
            },
            env
        );
    } catch (e) {
        result = { ok: false, error: e instanceof Error ? e.message : '?듬? 硫붿씪 諛쒖넚 ?ㅽ뙣' };
    }

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

    const reply = await db
        .prepare(
            `SELECT id, inquiry_id, channel, body, sent_to, send_status, send_error, created_by, created_at, sent_at
             FROM inquiry_replies WHERE id = ?`
        )
        .bind(row.id)
        .first<InquiryReplyRow>();
    return { reply, result };
}

/** 愿由ъ옄 ?뚮┝ 硫붿씪 諛쒖넚 寃곌낵 ???(而щ읆???꾩쭅 ?놁쑝硫?議곗슜??嫄대꼫?) */
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
            console.warn('愿由ъ옄 ?뚮┝ 諛쒖넚 ?곹깭 ????ㅽ뙣', e);
        }
    }
}
