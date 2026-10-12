import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { sendEmailWithResult } from '@/lib/mail-utils';
import {
    buildQuoteEmail,
    QUOTE_EMAIL_RETENTION_DAYS,
    QUOTE_REMINDER_MAX_AGE_DAYS,
    type QuoteEmailRow,
} from '@/lib/quote-email';

/** 한 번 실행에 보내는 최대 리마인드 수 (Worker 실행 시간·Resend 한도 보호) */
const MAX_REMINDERS_PER_RUN = 50;

function isAuthorizedCron(req: NextRequest, envSecret?: string): boolean {
    const headerSecret = req.headers.get('x-cron-secret');
    const authHeader = req.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const secret = envSecret || process.env.CRON_SECRET || '';
    if (!secret) return false;
    return headerSecret === secret || bearer === secret;
}

type DueReminderRow = QuoteEmailRow & {
    request_id: number;
    email: string;
    locale: string;
    token: string;
};

/**
 * POST /api/cron/quote-reminders
 * 견적 메일 신청 후 3일이 지났고 아직 주문하지 않은 손님에게 리마인드 1회 발송 + 보유 기간 지난 기록 파기
 */
export async function POST(req: NextRequest) {
    const { env } = getCloudflareContext();
    if (!env?.DB) {
        return NextResponse.json({ error: 'DB not available' }, { status: 503 });
    }
    if (!isAuthorizedCron(req, (env as { CRON_SECRET?: string }).CRON_SECRET)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let due: DueReminderRow[] = [];
    try {
        const result = await env.DB.prepare(
            `SELECT q.*, r.id AS request_id, r.email, r.locale, r.token
             FROM quote_email_requests r
             JOIN quotes q ON q.id = r.quote_id
             WHERE r.remind_opt_in = 1
               AND r.sent_at IS NOT NULL
               AND r.reminded_at IS NULL
               AND r.unsubscribed_at IS NULL
               AND r.remind_after IS NOT NULL
               AND r.remind_after <= datetime('now')
               AND r.created_at > datetime('now', ?)
               AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.quote_id = r.quote_id)
               AND NOT (r.user_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM orders o WHERE o.user_id = r.user_id AND o.created_at >= r.created_at))
               AND NOT (r.session_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM order_items oi
                    JOIN quotes q2 ON q2.id = oi.quote_id
                    JOIN orders o ON o.id = oi.order_id
                    WHERE q2.session_id = r.session_id AND o.created_at >= r.created_at))
             ORDER BY r.created_at DESC
             LIMIT ?`
        )
            .bind(`-${QUOTE_REMINDER_MAX_AGE_DAYS} days`, MAX_REMINDERS_PER_RUN)
            .all<DueReminderRow>();
        due = result.results ?? [];
    } catch (e) {
        console.warn('quote reminders skipped', e);
        return NextResponse.json({ success: true, sent: 0, failed: 0, skipped: 0, purged: 0 });
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const emailed = new Set<string>();

    for (const row of due) {
        // 같은 주소로 여러 견적이 기다리면 가장 최근 견적 하나만 알림
        if (emailed.has(row.email)) {
            await env.DB.prepare(
                `UPDATE quote_email_requests SET reminded_at = datetime('now'), remind_error = 'skipped_duplicate' WHERE id = ?`
            )
                .bind(row.request_id)
                .run();
            skipped += 1;
            continue;
        }
        emailed.add(row.email);

        const mail = buildQuoteEmail({
            kind: 'reminder',
            locale: row.locale === 'en' ? 'en' : 'ko',
            quote: row,
            unsubscribeToken: row.token,
        });
        const result = await sendEmailWithResult(
            { to: row.email, subject: mail.subject, text: mail.text, html: mail.html },
            env as unknown as Record<string, unknown>
        );
        // 실패해도 재시도하지 않음 — 리마인드는 1회만
        await env.DB.prepare(
            `UPDATE quote_email_requests SET reminded_at = datetime('now'), remind_error = ? WHERE id = ?`
        )
            .bind(result.ok ? null : result.error, row.request_id)
            .run();
        if (result.ok) sent += 1;
        else failed += 1;
    }

    // 개인정보처리방침 제3조: 견적 메일 신청 기록 보유 기간 90일
    let purged = 0;
    try {
        const purge = await env.DB.prepare(
            `DELETE FROM quote_email_requests WHERE created_at < datetime('now', ?)`
        )
            .bind(`-${QUOTE_EMAIL_RETENTION_DAYS} days`)
            .run();
        purged = Number((purge.meta as { changes?: number })?.changes ?? 0);
    } catch (e) {
        console.warn('quote_email_requests purge skipped', e);
    }

    return NextResponse.json({ success: true, sent, failed, skipped, purged });
}
