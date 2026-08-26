/**
 * 주문 생성 시 견적 단가를 DB(quotes.total_price) 기준으로 확정
 * 클라이언트 cartItems.totalPrice는 참고만 하고 저장·합산에는 사용하지 않음
 */

type D1Like = {
    prepare: (sql: string) => {
        bind: (...args: unknown[]) => {
            all: <T = Record<string, unknown>>() => Promise<{ results?: T[] }>
        }
    }
}

export type OrderCartItemInput = {
    quoteId: number
    quantity?: number
    totalPrice?: number
}

export type ResolvedOrderLine = {
    quoteId: number
    quantity: number
    unitPrice: number
    subtotal: number
    clientPrice?: number
}

type QuoteCartRow = {
    id: number
    total_price: number
    volume_cm3: number
    cart_quantity: number
}

export type ResolveOrderLinesResult =
    | { ok: true; lines: ResolvedOrderLine[]; totalAmount: number }
    | { ok: false; error: string; status: number }

function quoteOwnershipClause(isGuest: boolean): string {
    return isGuest ? 'c.session_id = ?' : 'c.user_id = ?'
}

/**
 * 장바구니에 담긴 견적만 주문 가능. 단가는 quotes.total_price 사용.
 */
export async function resolveOrderLinesFromDb(
    db: D1Like,
    items: OrderCartItemInput[],
    auth: { isGuest: boolean; userId?: number; sessionId?: string }
): Promise<ResolveOrderLinesResult> {
    const quoteIds = [...new Set(items.map((i) => Number(i.quoteId)).filter((id) => Number.isInteger(id) && id > 0))]
    if (!quoteIds.length) {
        return { ok: false, error: '유효한 주문 항목이 없습니다. 장바구니를 다시 확인해 주세요.', status: 400 }
    }

    if (auth.isGuest && !auth.sessionId) {
        return { ok: false, error: '비회원 주문에는 세션 정보가 필요합니다.', status: 400 }
    }
    if (!auth.isGuest && (auth.userId == null || !Number.isFinite(auth.userId))) {
        return { ok: false, error: '회원 주문에는 사용자 정보가 필요합니다.', status: 400 }
    }

    const placeholders = quoteIds.map(() => '?').join(',')
    const ownerBind = auth.isGuest ? auth.sessionId : auth.userId

    const { results } = await db
        .prepare(
            `SELECT q.id, q.total_price, q.volume_cm3, c.quantity AS cart_quantity
             FROM quotes q
             INNER JOIN cart c ON c.quote_id = q.id
             WHERE q.id IN (${placeholders}) AND ${quoteOwnershipClause(auth.isGuest)}`
        )
        .bind(...quoteIds, ownerBind)
        .all<QuoteCartRow>()

    const rowMap = new Map((results ?? []).map((r) => [r.id, r]))

    const lines: ResolvedOrderLine[] = []

    for (const item of items) {
        const quoteId = Number(item.quoteId)
        if (!Number.isInteger(quoteId) || quoteId <= 0) continue

        const row = rowMap.get(quoteId)
        if (!row) {
            return {
                ok: false,
                error:
                    '이 견적은 아직 장바구니에 없습니다. 저장된 견적에서 ‘장바구니에 담기’ 후 주문해 주세요.',
                status: 403,
            }
        }

        if (!Number(row.volume_cm3) || row.volume_cm3 <= 0) {
            return {
                ok: false,
                error: `견적(${quoteId}) 파일 분석이 완료되지 않았습니다. 다시 견적을 내주세요.`,
                status: 400,
            }
        }

        const unitPrice = Math.max(0, Math.round(Number(row.total_price) || 0))
        if (unitPrice <= 0) {
            return {
                ok: false,
                error: `견적(${quoteId}) 금액이 유효하지 않습니다. 옵션을 확인한 뒤 다시 저장해 주세요.`,
                status: 400,
            }
        }

        const requestedQty = Math.max(1, Math.floor(Number(item.quantity) || 1))
        const cartQty = Math.max(1, Math.floor(Number(row.cart_quantity) || 1))
        const quantity = Math.min(requestedQty, cartQty)

        const clientPrice =
            item.totalPrice != null && Number.isFinite(Number(item.totalPrice))
                ? Math.round(Number(item.totalPrice))
                : undefined

        if (clientPrice != null && Math.abs(clientPrice - unitPrice) > 500) {
            console.info(
                `[order] quote ${quoteId} price from DB (client=${clientPrice} db=${unitPrice})`
            )
        }

        lines.push({
            quoteId,
            quantity,
            unitPrice,
            subtotal: unitPrice * quantity,
            ...(clientPrice != null ? { clientPrice } : {}),
        })
    }

    if (!lines.length) {
        return { ok: false, error: '유효한 주문 항목이 없습니다. 장바구니를 다시 확인해 주세요.', status: 400 }
    }

    const totalAmount = lines.reduce((sum, l) => sum + l.subtotal, 0)
    return { ok: true, lines, totalAmount }
}
