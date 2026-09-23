/**
 * 주문 생성 시 견적 단가를 DB(quotes) 기준으로 확정
 * - 같은 출력방식: 최소·셋업 1회 + 변동 합산
 * - 다른 출력방식: 방식마다 최소 적용
 * - 배치 컬럼 없으면: 구버전 total_price × 수량
 */

import { priceCartLinesByPrintMethod } from '@/lib/quote-batch-price'

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
    print_method?: string | null
    variable_cost_krw?: number | null
    setup_cost_krw?: number | null
    min_price_krw?: number | null
}

export type ResolveOrderLinesResult =
    | { ok: true; lines: ResolvedOrderLine[]; totalAmount: number }
    | { ok: false; error: string; status: number }

function quoteOwnershipClause(auth: {
    isGuest: boolean
    userId?: number
    sessionId?: string | null
}): { sql: string; binds: (string | number)[] } {
    if (auth.isGuest) {
        return { sql: 'c.session_id = ?', binds: [String(auth.sessionId)] }
    }
    const userId = Number(auth.userId)
    const sessionId = auth.sessionId?.trim()
    if (sessionId) {
        return { sql: '(c.user_id = ? OR c.session_id = ?)', binds: [userId, sessionId] }
    }
    return { sql: 'c.user_id = ?', binds: [userId] }
}

/**
 * 장바구니에 담긴 견적만 주문 가능.
 */
export async function resolveOrderLinesFromDb(
    db: D1Like,
    items: OrderCartItemInput[],
    auth: { isGuest: boolean; userId?: number; sessionId?: string | null }
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
    const owner = quoteOwnershipClause(auth)

    let results: QuoteCartRow[] = []
    try {
        const q = await db
            .prepare(
                `SELECT q.id, q.total_price, q.volume_cm3, q.print_method, c.quantity AS cart_quantity,
                        q.variable_cost_krw, q.setup_cost_krw, q.min_price_krw
                 FROM quotes q
                 INNER JOIN cart c ON c.quote_id = q.id
                 WHERE q.id IN (${placeholders}) AND ${owner.sql}`
            )
            .bind(...quoteIds, ...owner.binds)
            .all<QuoteCartRow>()
        results = q.results || []
    } catch {
        try {
            const q = await db
                .prepare(
                    `SELECT q.id, q.total_price, q.volume_cm3, q.print_method, c.quantity AS cart_quantity
                     FROM quotes q
                     INNER JOIN cart c ON c.quote_id = q.id
                     WHERE q.id IN (${placeholders}) AND ${owner.sql}`
                )
                .bind(...quoteIds, ...owner.binds)
                .all<QuoteCartRow>()
            results = q.results || []
        } catch {
            const q = await db
                .prepare(
                    `SELECT q.id, q.total_price, q.volume_cm3, c.quantity AS cart_quantity
                     FROM quotes q
                     INNER JOIN cart c ON c.quote_id = q.id
                     WHERE q.id IN (${placeholders}) AND ${owner.sql}`
                )
                .bind(...quoteIds, ...owner.binds)
                .all<QuoteCartRow>()
            results = q.results || []
        }
    }

    const byId = new Map(results.map((r) => [Number(r.id), r]))

    const batchInputs: {
        key: number
        printMethod: string
        quantity: number
        totalPriceKrw: number
        variableCostKrw?: number | null
        setupCostKrw?: number | null
        minPriceKrw?: number | null
        clientPrice?: number
    }[] = []

    for (const item of items) {
        const quoteId = Number(item.quoteId)
        const row = byId.get(quoteId)
        if (!row) {
            return {
                ok: false,
                error: `장바구니에 없는 견적(ID ${quoteId})이 포함되어 있습니다.`,
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

        batchInputs.push({
            key: quoteId,
            printMethod: String(row.print_method || 'unknown'),
            quantity,
            totalPriceKrw: Number(row.total_price) || 0,
            variableCostKrw: row.variable_cost_krw,
            setupCostKrw: row.setup_cost_krw,
            minPriceKrw: row.min_price_krw,
            clientPrice,
        })
    }

    if (!batchInputs.length) {
        return { ok: false, error: '유효한 주문 항목이 없습니다. 장바구니를 다시 확인해 주세요.', status: 400 }
    }

    const priced = priceCartLinesByPrintMethod(
        batchInputs.map((b) => ({
            key: b.key,
            printMethod: b.printMethod,
            quantity: b.quantity,
            totalPriceKrw: b.totalPriceKrw,
            variableCostKrw: b.variableCostKrw,
            setupCostKrw: b.setupCostKrw,
            minPriceKrw: b.minPriceKrw,
        })),
        { applyVat: true }
    )

    const byKey = new Map(priced.lines.map((l) => [Number(l.key), l]))
    const lines: ResolvedOrderLine[] = []

    for (const b of batchInputs) {
        const line = byKey.get(b.key)
        if (!line) continue
        const subtotal = line.lineTotalKrw
        const unitPrice = Math.round(line.effectiveUnitKrw)

        if (b.clientPrice != null && Math.abs(b.clientPrice - unitPrice) > 500) {
            console.info(
                `[order] quote ${b.key} price from DB group-batch (clientUnit=${b.clientPrice} dbUnit=${unitPrice} qty=${b.quantity} method=${b.printMethod} grouped=${line.usedGroupBatch})`
            )
        }

        lines.push({
            quoteId: b.key,
            quantity: b.quantity,
            unitPrice,
            subtotal,
            ...(b.clientPrice != null ? { clientPrice: b.clientPrice } : {}),
        })
    }

    if (!lines.length) {
        return { ok: false, error: '유효한 주문 항목이 없습니다. 장바구니를 다시 확인해 주세요.', status: 400 }
    }

    const totalAmount = lines.reduce((sum, l) => sum + l.subtotal, 0)
    return { ok: true, lines, totalAmount }
}
