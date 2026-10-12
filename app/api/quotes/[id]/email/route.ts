import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { errorResponse, successResponse, requireAuthOrGuest } from '@/lib/api-utils';
import { sendEmailWithResult } from '@/lib/mail-utils';
import {
    buildQuoteEmail,
    generateQuoteEmailToken,
    normalizeQuoteEmail,
    QUOTE_EMAIL_MAX_PER_ADDRESS_PER_DAY,
    QUOTE_EMAIL_MAX_PER_QUOTE_PER_DAY,
    QUOTE_REMINDER_DELAY_DAYS,
    type QuoteEmailRow,
} from '@/lib/quote-email';

type QuoteOwnerRow = QuoteEmailRow & { user_id: number | null; session_id: string | null };

/**
 * POST /api/quotes/[id]/email - 저장한 견적을 이메일로 발송 (+ 선택 시 3일 뒤 1회 리마인드 예약)
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const quoteId = parseInt(id, 10);
        if (!Number.isInteger(quoteId) || quoteId < 1) return errorResponse('잘못된 견적 번호입니다', 400);

        const auth = await requireAuthOrGuest(request);
        if (auth instanceof Response) return auth;

        const body = (await request.json().catch(() => ({}))) as {
            email?: unknown;
            remindOptIn?: unknown;
            locale?: unknown;
        };
        const email = normalizeQuoteEmail(body.email);
        if (!email) return errorResponse('이메일 주소를 확인해 주세요', 400);
        const remindOptIn = body.remindOptIn === true;
        const locale = body.locale === 'en' ? 'en' : 'ko';

        const { env } = getCloudflareContext();
        if (!env?.DB) return errorResponse('데이터베이스를 사용할 수 없습니다', 503);

        // 소재 표시명 컬럼이 없는 구 DB도 있어 SELECT *
        const quote = await env.DB.prepare('SELECT * FROM quotes WHERE id = ?')
            .bind(quoteId)
            .first<QuoteOwnerRow>();
        if (!quote) return errorResponse('견적을 찾을 수 없습니다', 404);

        const isOwner = auth.isGuest
            ? quote.session_id === auth.sessionId
            : quote.user_id === auth.userId;
        if (!isOwner) return errorResponse('이 견적을 보낼 권한이 없습니다', 403);

        const limits = await env.DB.prepare(
            `SELECT
                SUM(CASE WHEN quote_id = ? THEN 1 ELSE 0 END) AS per_quote,
                SUM(CASE WHEN email = ? THEN 1 ELSE 0 END) AS per_address
             FROM quote_email_requests
             WHERE created_at > datetime('now', '-1 day') AND (quote_id = ? OR email = ?)`
        )
            .bind(quoteId, email, quoteId, email)
            .first<{ per_quote: number | null; per_address: number | null }>();
        if (
            Number(limits?.per_quote ?? 0) >= QUOTE_EMAIL_MAX_PER_QUOTE_PER_DAY ||
            Number(limits?.per_address ?? 0) >= QUOTE_EMAIL_MAX_PER_ADDRESS_PER_DAY
        ) {
            return errorResponse('오늘 보낼 수 있는 견적 메일 수를 넘었습니다. 내일 다시 시도해 주세요.', 429);
        }

        const token = generateQuoteEmailToken();
        const inserted = await env.DB.prepare(
            `INSERT INTO quote_email_requests (
                quote_id, email, locale, remind_opt_in, token, user_id, session_id, remind_after
             ) VALUES (?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 1 THEN datetime('now', ?) ELSE NULL END)`
        )
            .bind(
                quoteId,
                email,
                locale,
                remindOptIn ? 1 : 0,
                token,
                auth.isGuest ? null : auth.userId,
                auth.isGuest ? auth.sessionId : null,
                remindOptIn ? 1 : 0,
                `+${QUOTE_REMINDER_DELAY_DAYS} days`
            )
            .run();
        const requestId = Number(inserted.meta?.last_row_id ?? 0);

        // 같은 견적의 이전 리마인드 예약은 최신 신청 하나만 남김
        if (remindOptIn && requestId > 0) {
            await env.DB.prepare(
                `UPDATE quote_email_requests SET remind_after = NULL
                 WHERE quote_id = ? AND email = ? AND id <> ? AND reminded_at IS NULL`
            )
                .bind(quoteId, email, requestId)
                .run();
        }

        const mail = buildQuoteEmail({
            kind: 'saved',
            locale,
            quote,
            unsubscribeToken: remindOptIn ? token : null,
        });
        const sent = await sendEmailWithResult(
            { to: email, subject: mail.subject, text: mail.text, html: mail.html },
            env as unknown as Record<string, unknown>
        );

        await env.DB.prepare(
            `UPDATE quote_email_requests
             SET sent_at = CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END,
                 send_error = ?,
                 remind_after = CASE WHEN ? = 1 THEN remind_after ELSE NULL END
             WHERE id = ?`
        )
            .bind(sent.ok ? 1 : 0, sent.ok ? null : sent.error, sent.ok ? 1 : 0, requestId)
            .run();

        if (!sent.ok) {
            console.error('견적 메일 발송 실패', quoteId, sent.error);
            return errorResponse('메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.', 502);
        }

        return successResponse({ quoteId, remindOptIn }, '견적 메일을 보냈습니다');
    } catch (error: unknown) {
        console.error('POST /api/quotes/[id]/email error:', error);
        const msg = error instanceof Error ? error.message : '';
        if (msg.includes('no such table')) {
            return errorResponse('견적 메일 기능을 준비 중입니다 (schema_quote_email_requests.sql 적용 필요)', 503);
        }
        return errorResponse('견적 메일 발송 실패', 500);
    }
}
