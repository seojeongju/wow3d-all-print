import { notifyUserInquiryReplied } from '@/lib/inquiry-user-notify';

type D1Like = {
    prepare: (query: string) => {
        bind: (...args: unknown[]) => {
            first: () => Promise<Record<string, unknown> | null>;
            run: () => Promise<unknown>;
        };
    };
};

export type ProcessInquiryEmailReplyInput = {
    inquiryId: number;
    token: string;
    replyMessage: string;
    fromEmail: string;
};

export type ProcessInquiryEmailReplyResult =
    | { ok: true; userNotified: boolean; alreadyReplied: boolean }
    | { ok: false; error: string; status: number };

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

export function getAllowedAdminEmails(env: Record<string, unknown>): string[] {
    const raw =
        (env.ADMIN_EMAIL as string | undefined) ||
        process.env.ADMIN_EMAIL ||
        'wow3d16@naver.com';
    const extra =
        (env.INQUIRY_REPLY_ALLOWED_FROM as string | undefined) ||
        process.env.INQUIRY_REPLY_ALLOWED_FROM ||
        '';
    const list = [raw, ...extra.split(',')]
        .map((s) => normalizeEmail(s))
        .filter(Boolean);
    return [...new Set(list)];
}

export async function processInquiryEmailReply(
    db: D1Like,
    env: Record<string, unknown>,
    input: ProcessInquiryEmailReplyInput
): Promise<ProcessInquiryEmailReplyResult> {
    const replyMessage = input.replyMessage?.trim();
    if (!replyMessage || replyMessage.length < 2) {
        return { ok: false, error: '답장 본문이 비어 있습니다.', status: 400 };
    }

    const allowedFrom = getAllowedAdminEmails(env);
    const fromNormRaw = input.fromEmail;
    const fromNorm = (() => {
        const m = fromNormRaw.match(/<([^>]+)>/);
        return normalizeEmail(m ? m[1] : fromNormRaw);
    })();
    if (!allowedFrom.includes(fromNorm)) {
        return { ok: false, error: '허용되지 않은 발신 주소입니다.', status: 403 };
    }

    let row: Record<string, unknown> | null = null;
    try {
        row = await db
            .prepare(
                `SELECT id, name, email, subject, message, status, admin_note, reply_token
                 FROM inquiries WHERE id = ?`
            )
            .bind(input.inquiryId)
            .first();
    } catch (e) {
        console.error('processInquiryEmailReply select failed', e);
        return { ok: false, error: '문의 조회 실패', status: 500 };
    }

    if (!row) {
        return { ok: false, error: '문의를 찾을 수 없습니다.', status: 404 };
    }

    const storedToken = String(row.reply_token || '');
    if (!storedToken || storedToken !== input.token) {
        return { ok: false, error: '유효하지 않은 답장 토큰입니다.', status: 403 };
    }

    const prevStatus = String(row.status || '');
    const prevNote = String(row.admin_note || '');
    const alreadyReplied = prevStatus === 'replied' && prevNote === replyMessage;

    if (!alreadyReplied) {
        try {
            await db
                .prepare(
                    `UPDATE inquiries SET status = 'replied', admin_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
                )
                .bind(replyMessage, input.inquiryId)
                .run();
        } catch (e) {
            console.error('processInquiryEmailReply update failed', e);
            return { ok: false, error: '문의 상태 업데이트 실패', status: 500 };
        }
    }

    let userNotified = false;
    if (!alreadyReplied) {
        try {
            userNotified = await notifyUserInquiryReplied(
                {
                    inquiryId: input.inquiryId,
                    name: String(row.name || ''),
                    email: String(row.email || ''),
                    subject: row.subject as string | null,
                    message: String(row.message || ''),
                    replyMessage,
                },
                env
            );
        } catch (e) {
            console.error('processInquiryEmailReply user notify failed', e);
        }
    }

    return { ok: true, userNotified, alreadyReplied };
}
