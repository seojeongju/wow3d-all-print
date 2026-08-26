/**
 * 주문 직전: 로컬 장바구니와 DB cart 불일치 보정
 * - 소유한 견적에 대해 cart 행이 없으면 생성
 * - 세션(비회원) cart를 로그인 사용자로 승계
 */

type D1Like = {
    prepare: (sql: string) => {
        bind: (...args: unknown[]) => {
            first: <T = Record<string, unknown>>() => Promise<T | null>
            run: () => Promise<unknown>
        }
    }
}

export type EnsureCartItem = {
    quoteId: number
    quantity?: number
}

export type EnsureCartAuth = {
    isGuest: boolean
    userId?: number
    sessionId?: string | null
}

export type EnsureCartResult =
    | { ok: true }
    | { ok: false; error: string; status: number }

type QuoteRow = {
    id: number
    user_id: number | null
    session_id: string | null
}

type CartRow = {
    id: number
    user_id: number | null
    session_id: string | null
    quantity: number
}

function canAccessQuote(
    quote: QuoteRow,
    auth: { userId: number | null; sessionId: string | null }
): boolean {
    if (auth.userId != null && quote.user_id != null && Number(quote.user_id) === auth.userId) {
        return true
    }
    if (auth.sessionId && quote.session_id && quote.session_id === auth.sessionId) {
        return true
    }
    return false
}

async function findCartRow(
    db: D1Like,
    quoteId: number,
    userId: number | null,
    sessionId: string | null
): Promise<CartRow | null> {
    if (userId != null && sessionId) {
        return db
            .prepare(
                `SELECT id, user_id, session_id, quantity FROM cart
                 WHERE quote_id = ? AND (user_id = ? OR session_id = ?)
                 ORDER BY CASE WHEN user_id = ? THEN 0 ELSE 1 END
                 LIMIT 1`
            )
            .bind(quoteId, userId, sessionId, userId)
            .first<CartRow>()
    }
    if (userId != null) {
        return db
            .prepare(
                `SELECT id, user_id, session_id, quantity FROM cart
                 WHERE quote_id = ? AND user_id = ? LIMIT 1`
            )
            .bind(quoteId, userId)
            .first<CartRow>()
    }
    return db
        .prepare(
            `SELECT id, user_id, session_id, quantity FROM cart
             WHERE quote_id = ? AND session_id = ? LIMIT 1`
        )
        .bind(quoteId, sessionId)
        .first<CartRow>()
}

/**
 * 주문 요청 quoteId들이 DB cart에 있도록 보장
 */
export async function ensureCartRowsForOrder(
    db: D1Like,
    items: EnsureCartItem[],
    auth: EnsureCartAuth
): Promise<EnsureCartResult> {
    const userId =
        !auth.isGuest && auth.userId != null && Number.isFinite(auth.userId)
            ? Number(auth.userId)
            : null
    const sessionId = auth.sessionId?.trim() || null

    if (auth.isGuest && !sessionId) {
        return { ok: false, error: '비회원 주문에는 세션 정보가 필요합니다.', status: 400 }
    }
    if (!auth.isGuest && userId == null) {
        return { ok: false, error: '회원 주문에는 사용자 정보가 필요합니다.', status: 400 }
    }

    const seen = new Set<number>()

    for (const item of items) {
        const quoteId = Number(item.quoteId)
        if (!Number.isInteger(quoteId) || quoteId <= 0 || seen.has(quoteId)) continue
        seen.add(quoteId)

        const qty = Math.max(1, Math.floor(Number(item.quantity) || 1))

        const quote = await db
            .prepare(`SELECT id, user_id, session_id FROM quotes WHERE id = ?`)
            .bind(quoteId)
            .first<QuoteRow>()

        if (!quote) {
            return {
                ok: false,
                error: `견적(#${quoteId})을 찾을 수 없습니다. 견적을 다시 저장해 주세요.`,
                status: 404,
            }
        }

        let cartRow = await findCartRow(db, quoteId, userId, sessionId)

        // 이미 장바구니에 있으면 승계·수량만 맞추고 통과 (로컬↔DB 불일치 복구)
        if (cartRow) {
            const nextQty = Math.max(Number(cartRow.quantity) || 1, qty)
            if (userId != null) {
                await db
                    .prepare(
                        `UPDATE cart SET user_id = ?, quantity = ?, session_id = COALESCE(session_id, ?) WHERE id = ?`
                    )
                    .bind(userId, nextQty, sessionId, cartRow.id)
                    .run()
            } else {
                await db
                    .prepare(`UPDATE cart SET quantity = ? WHERE id = ?`)
                    .bind(nextQty, cartRow.id)
                    .run()
            }
            continue
        }

        // cart에 없을 때만 견적 소유권 확인 후 삽입
        if (!canAccessQuote(quote, { userId, sessionId })) {
            return {
                ok: false,
                error: '이 견적에 대한 주문 권한이 없습니다. 장바구니에 다시 담아 주세요.',
                status: 403,
            }
        }

        await db
            .prepare(
                `INSERT INTO cart (user_id, session_id, quote_id, quantity) VALUES (?, ?, ?, ?)`
            )
            .bind(userId, sessionId, quoteId, qty)
            .run()
    }

    return { ok: true }
}
