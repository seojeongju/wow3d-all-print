const REPLY_LOCAL_PREFIX = 'inquiry';

export function getInquiryReplyDomain(env?: Record<string, unknown>): string {
    const fromEnv =
        (env?.INQUIRY_REPLY_DOMAIN as string | undefined) ||
        process.env.INQUIRY_REPLY_DOMAIN ||
        'wow3dp.co.kr';
    return fromEnv.replace(/^@/, '').trim().toLowerCase();
}

export function generateInquiryReplyToken(): string {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

export function buildInquiryReplyAddress(inquiryId: number, token: string, env?: Record<string, unknown>): string {
    const domain = getInquiryReplyDomain(env);
    return `${REPLY_LOCAL_PREFIX}-${inquiryId}-${token}@${domain}`;
}

/** 수신 주소에서 문의 ID·토큰 추출 */
export function parseInquiryReplyAddress(address: string): { inquiryId: number; token: string } | null {
    const raw = (address || '').trim().toLowerCase();
    const local = raw.includes('@') ? raw.split('@')[0] : raw;
    const match = local.match(/^inquiry-(\d+)-([a-z0-9]{8,32})$/);
    if (!match) return null;
    const inquiryId = parseInt(match[1], 10);
    if (!Number.isInteger(inquiryId) || inquiryId < 1) return null;
    return { inquiryId, token: match[2] };
}

/** MIME 파싱 결과 또는 plain text에서 관리자 답장 본문만 추출 */
export function extractInquiryReplyBody(text: string): string {
    if (!text?.trim()) return '';

    let body = text.replace(/\r\n/g, '\n');

    const cutPatterns = [
        /\n-{3,}\s*원본 메시지\s*-{3,}[\s\S]*/i,
        /\n-{3,}\s*Original Message\s*-{3,}[\s\S]*/i,
        /\nOn .+wrote:\s*\n[\s\S]*/i,
        /\n\d{4}년 .+ 작성:\s*\n[\s\S]*/i,
        /\n_{3,}[\s\S]*/i,
        /\n\[신규 문의 #\d+\][\s\S]*/i,
        /\n--- 문의 내용 ---[\s\S]*/i,
    ];
    for (const re of cutPatterns) {
        body = body.replace(re, '');
    }

    const lines = body.split('\n');
    const kept: string[] = [];
    for (const line of lines) {
        if (/^>/.test(line)) break;
        if (/^From:\s/i.test(line) && kept.length > 2) break;
        kept.push(line);
    }

    return kept.join('\n').trim();
}

type D1Like = {
    prepare: (query: string) => {
        bind: (...args: unknown[]) => {
            first: () => Promise<{ reply_token?: string | null } | null>;
            run: () => Promise<unknown>;
        };
    };
};

/** DB에 reply_token이 없으면 생성·저장 */
export async function ensureInquiryReplyToken(db: D1Like, inquiryId: number): Promise<string | null> {
    try {
        const row = await db
            .prepare('SELECT reply_token FROM inquiries WHERE id = ?')
            .bind(inquiryId)
            .first();
        if (row?.reply_token) return row.reply_token;

        const token = generateInquiryReplyToken();
        await db.prepare('UPDATE inquiries SET reply_token = ? WHERE id = ?').bind(token, inquiryId).run();
        return token;
    } catch (e) {
        console.warn('ensureInquiryReplyToken failed (column may be missing)', e);
        return null;
    }
}
