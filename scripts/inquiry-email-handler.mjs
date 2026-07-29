/**
 * Cloudflare Email Routing → 문의 답장 처리
 */
import PostalMime from 'postal-mime';

function parseReplyAddress(raw) {
    const addr = String(raw || '').trim().toLowerCase();
    const local = addr.includes('@') ? addr.split('@')[0] : addr;
    const match = local.match(/^inquiry-(\d+)-([a-z0-9]{8,32})$/);
    if (!match) return null;
    const inquiryId = parseInt(match[1], 10);
    if (!Number.isInteger(inquiryId) || inquiryId < 1) return null;
    return { inquiryId, token: match[2] };
}

function extractReplyBody(text) {
    if (!text?.trim()) return '';
    let body = text.replace(/\r\n/g, '\n');
    const cutPatterns = [
        /\n-{3,}\s*원본 메시지\s*-{3,}[\s\S]*/i,
        /\n-{3,}\s*Original Message\s*-{3,}[\s\S]*/i,
        /\nOn .+wrote:\s*\n[\s\S]*/i,
        /\n\[신규 문의 #\d+\][\s\S]*/i,
        /\n--- 문의 내용 ---[\s\S]*/i,
    ];
    for (const re of cutPatterns) {
        body = body.replace(re, '');
    }
    const lines = body.split('\n');
    const kept = [];
    for (const line of lines) {
        if (/^>/.test(line)) break;
        kept.push(line);
    }
    return kept.join('\n').trim();
}

function resolveInquiryTarget(message) {
    const candidates = [];
    if (message.to) candidates.push(message.to);
    const toHeader = message.headers?.get('to');
    if (toHeader) candidates.push(toHeader);
    const deliveredTo = message.headers?.get('delivered-to');
    if (deliveredTo) candidates.push(deliveredTo);

    for (const raw of candidates) {
        for (const part of String(raw).split(',')) {
            const email = part.trim().match(/<?([^>\s]+@[^>\s]+)>?/)?.[1] || part.trim();
            const parsed = parseReplyAddress(email);
            if (parsed) return parsed;
        }
    }
    return null;
}

export async function handleInquiryInboundEmail(message, env) {
    const target = resolveInquiryTarget(message);
    if (!target) {
        console.log('inquiry-email: skip non-inquiry address', message.to);
        return;
    }

    let parsed;
    try {
        const rawBuffer = await new Response(message.raw).arrayBuffer();
        parsed = await PostalMime.parse(rawBuffer);
    } catch (e) {
        console.error('inquiry-email: MIME parse failed', e);
        return;
    }

    const replyMessage = extractReplyBody(parsed.text || parsed.html?.replace(/<[^>]+>/g, ' ') || '');
    if (!replyMessage) {
        console.warn('inquiry-email: empty reply body', target.inquiryId);
        return;
    }

    const baseUrl = env.NEXT_PUBLIC_APP_URL || 'https://www.wow3dp.co.kr';
    const secret = env.INQUIRY_EMAIL_SECRET || env.CRON_SECRET || '';
    if (!secret) {
        console.error('inquiry-email: secret not configured');
        return;
    }

    try {
        const res = await fetch(`${String(baseUrl).replace(/\/$/, '')}/api/internal/inquiry-email-reply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-inquiry-email-secret': secret,
            },
            body: JSON.stringify({
                inquiryId: target.inquiryId,
                token: target.token,
                replyMessage,
                fromEmail: message.from,
            }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            console.error('inquiry-email: API error', res.status, json);
            return;
        }
        console.log('inquiry-email: ok', target.inquiryId, json);
    } catch (e) {
        console.error('inquiry-email: fetch failed', e);
    }
}
