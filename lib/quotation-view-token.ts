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

/**
 * 이메일 초안/본문의 견적 URL을 보안 링크로 교체.
 * 이미 ?token= 이 있어도 경로만 매칭되지 않도록 쿼리 전체까지 교체한다.
 * (이전 버그: 경로만 교체 → .../38?token=A?token=A 이중 토큰)
 */
export function injectEstimateUrlInContent(
    content: string,
    orderId: number,
    tokenizedUrl: string,
    baseUrl: string
): string {
    if (!content?.trim()) return content;
    const base = baseUrl.replace(/\/$/, '');
    const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(
        `${escapedBase}/print/estimate/${orderId}(?:\\?[^"'\\s>]*)?`,
        'g'
    );
    return content.replace(pattern, tokenizedUrl);
}

/** URL에서 읽은 token 값 정규화 (?token=... 가 값에 섞인 경우 대비) */
export function normalizeEstimateViewToken(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    // ...uuid?token=uuid 형태로 들어온 경우 앞쪽 UUID만 사용
    const qIdx = trimmed.indexOf('?');
    const cleaned = (qIdx >= 0 ? trimmed.slice(0, qIdx) : trimmed).trim();
    return cleaned || null;
}
