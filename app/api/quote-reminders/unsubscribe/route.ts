import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { escapeHtml } from '@/lib/mail-utils';

type Lang = 'ko' | 'en';

const TEXT: Record<Lang, Record<'confirmTitle' | 'confirmBody' | 'button' | 'doneTitle' | 'doneBody' | 'invalid' | 'home', string>> = {
    ko: {
        confirmTitle: '견적 리마인드 메일 수신거부',
        confirmBody: '아래 버튼을 누르면 이 주소로 견적 리마인드 메일이 더 이상 발송되지 않습니다.',
        button: '수신거부',
        doneTitle: '수신거부가 완료되었습니다',
        doneBody: '앞으로 견적 리마인드 메일을 보내지 않습니다.',
        invalid: '유효하지 않거나 만료된 링크입니다.',
        home: 'WOW3D 홈으로',
    },
    en: {
        confirmTitle: 'Unsubscribe from quote reminders',
        confirmBody: 'Press the button below to stop quote reminder emails to this address.',
        button: 'Unsubscribe',
        doneTitle: 'You have been unsubscribed',
        doneBody: 'We will not send quote reminder emails anymore.',
        invalid: 'This link is invalid or has expired.',
        home: 'Back to WOW3D',
    },
};

function page(lang: Lang, title: string, body: string, form?: string): NextResponse {
    const t = TEXT[lang];
    const html = `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${escapeHtml(title)} | WOW3D</title></head>
<body style="margin:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;color:#e2e8f0;">
<main style="max-width:440px;margin:12vh auto;padding:32px;background:#111827;border:1px solid #1f2937;border-radius:20px;text-align:center;">
<h1 style="font-size:20px;margin:0 0 12px;color:#fff;">${escapeHtml(title)}</h1>
<p style="font-size:14px;line-height:1.6;color:#94a3b8;margin:0 0 24px;">${escapeHtml(body)}</p>
${form ?? ''}
<a href="/" style="display:inline-block;margin-top:16px;font-size:13px;color:#2dd4bf;">${escapeHtml(t.home)}</a>
</main></body></html>`;
    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    });
}

async function findRequest(token: string) {
    if (!/^[0-9a-f]{48}$/.test(token)) return null;
    const { env } = getCloudflareContext();
    if (!env?.DB) return null;
    const row = await env.DB.prepare('SELECT email, locale FROM quote_email_requests WHERE token = ?')
        .bind(token)
        .first<{ email: string; locale: string }>();
    return row ? { db: env.DB, email: row.email, lang: (row.locale === 'en' ? 'en' : 'ko') as Lang } : null;
}

/** GET — 메일 보안 검사기가 링크를 미리 열어도 해지되지 않도록 확인 화면만 보여 줌 */
export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get('token')?.trim() ?? '';
    const found = await findRequest(token).catch(() => null);
    if (!found) return page('ko', TEXT.ko.confirmTitle, TEXT.ko.invalid);
    const t = TEXT[found.lang];
    const form = `<form method="post" action="/api/quote-reminders/unsubscribe?token=${encodeURIComponent(token)}">
<button type="submit" style="padding:12px 28px;border:0;border-radius:12px;background:#14b8a6;color:#0f172a;font-weight:800;font-size:14px;cursor:pointer;">${escapeHtml(t.button)}</button>
</form>`;
    return page(found.lang, t.confirmTitle, t.confirmBody, form);
}

export async function POST(request: NextRequest) {
    const token = request.nextUrl.searchParams.get('token')?.trim() ?? '';
    const found = await findRequest(token).catch(() => null);
    if (!found) return page('ko', TEXT.ko.confirmTitle, TEXT.ko.invalid);
    await found.db
        .prepare(
            `UPDATE quote_email_requests
             SET unsubscribed_at = COALESCE(unsubscribed_at, datetime('now')), remind_after = NULL
             WHERE email = ?`
        )
        .bind(found.email)
        .run();
    const t = TEXT[found.lang];
    return page(found.lang, t.doneTitle, t.doneBody);
}
