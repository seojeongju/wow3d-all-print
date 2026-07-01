type D1Like = {
    prepare: (query: string) => {
        bind: (...args: unknown[]) => {
            first: () => Promise<unknown>;
            run: () => Promise<unknown>;
        };
    };
};

/** 요청 origin 또는 NEXT_PUBLIC_APP_URL 기준 base URL */
export function resolvePublicBaseUrl(requestUrl: string, envAppUrl?: string): string {
    const requestOrigin = requestUrl ? new URL(requestUrl).origin : '';
    const isLocalhost = (u: string) => !u || /^https?:\/\/localhost(:\d+)?(\/|$)/i.test(u);
    const baseUrl = !isLocalhost(requestOrigin) ? requestOrigin : (envAppUrl || requestOrigin);
    return baseUrl.replace(/\/$/, '');
}

/** orders.view_token 없으면 생성 후 반환 */
export async function ensureOrderViewToken(db: D1Like, orderId: number): Promise<string | null> {
    try {
        const row = (await db
            .prepare('SELECT view_token FROM orders WHERE id = ?')
            .bind(orderId)
            .first()) as { view_token: string | null } | null;

        if (row?.view_token) return row.view_token;

        const viewToken = crypto.randomUUID();
        await db.prepare('UPDATE orders SET view_token = ? WHERE id = ?').bind(viewToken, orderId).run();
        return viewToken;
    } catch (e) {
        console.warn('ensureOrderViewToken failed', e);
        return null;
    }
}

export function buildEstimatePublicUrl(baseUrl: string, orderId: number, viewToken: string): string {
    return `${baseUrl.replace(/\/$/, '')}/print/estimate/${orderId}?token=${encodeURIComponent(viewToken)}`;
}

/** 이메일 초안/본문에 토큰 없는 견적 URL이 있으면 보안 링크로 교체 */
export function injectEstimateUrlInContent(
    content: string,
    orderId: number,
    tokenizedUrl: string,
    baseUrl: string
): string {
    if (!content?.trim()) return content;
    const base = baseUrl.replace(/\/$/, '');
    const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const barePattern = new RegExp(
        `${escapedBase}/print/estimate/${orderId}(?:\\?(?!token=)[^"'\\s>]*)?`,
        'g'
    );
    return content.replace(barePattern, tokenizedUrl);
}
