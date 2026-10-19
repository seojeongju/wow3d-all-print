/**
 * 주문 생성 시 견적 단가를 DB(quotes) 기준으로 확정
 * - cart_batch_min_price_mode(기본 hybrid): 한 판에 넣을 수 있을 때만 소재별 셋업·최소 1회
 * - 베드 초과·발자국 합 초과 시 라인별 최소 적용
 * - 배치 컬럼 없으면: 구버전 total_price × 수량
 * - 장비 최대 출력 크기 초과 견적은 주문 거부
 */

import {
    BATCH_MIN_PRICE_MODE_SETTING_KEY,
    parseBatchMinPriceMode,
    priceCartLinesByMaterialGroup,
    type BatchMinPriceMode,
    type BedMaxByMethod,
} from '@/lib/quote-batch-price'
import { buildVolumeErrorMessage, loadBuildMaxByMethod } from '@/lib/build-volume'
import {
    evaluateQuoteValidity,
    loadPricingStamps,
    quoteValidityErrorMessage,
    type PricingStamps,
} from '@/lib/quote-validity'

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
    created_at?: string | null
    updated_at?: string | null
    fdm_material?: string | null
    fdm_material_name?: string | null
    resin_type?: string | null
    resin_type_name?: string | null
    file_name?: string | null
    dimensions_x?: number | null
    dimensions_y?: number | null
    dimensions_z?: number | null
}

function quoteMaterialKey(row: QuoteCartRow): string {
    const method = String(row.print_method || '').trim().toLowerCase()
    if (method === 'fdm') return String(row.fdm_material_name || row.fdm_material || '')
    return String(row.resin_type_name || row.resin_type || '')
}

export type ResolveOrderLinesResult =
    | { ok: true; lines: ResolvedOrderLine[]; totalAmount: number }
    | { ok: false; error: string; status: number }

async function loadBatchMinPriceMode(db: D1Like): Promise<BatchMinPriceMode> {
    try {
        const row = await db
            .prepare('SELECT setting_value FROM store_settings WHERE setting_key = ?')
            .bind(BATCH_MIN_PRICE_MODE_SETTING_KEY)
            .all<{ setting_value: string }>()
        return parseBatchMinPriceMode(row.results?.[0]?.setting_value)
    } catch {
        return parseBatchMinPriceMode(null)
    }
}

/** 견적에 min_price_krw가 비었을 때 장비 기본(최소) 금액으로 보완 */
async function loadEquipmentMinByMethod(
    db: D1Like
): Promise<Partial<Record<'fdm' | 'sla' | 'dlp', number>>> {
    const out: Partial<Record<'fdm' | 'sla' | 'dlp', number>> = {}
    try {
        const { results } = await db
            .prepare(
                `SELECT type, min_price_krw FROM printer_equipment
                 WHERE is_active = 1 AND min_price_krw IS NOT NULL AND min_price_krw > ?`
            )
            .bind(0)
            .all<{ type: string; min_price_krw: number }>()
        for (const r of results || []) {
            const key = String(r.type || '')
                .trim()
                .toLowerCase()
            if (key !== 'fdm' && key !== 'sla' && key !== 'dlp') continue
            const n = Number(r.min_price_krw)
            if (!(n > 0)) continue
            out[key] = Math.max(out[key] ?? 0, n)
        }
    } catch (e) {
        console.warn('[order-prices] 장비 최소금액 조회 실패 — 견적 컬럼만 사용', e)
    }
    return out
}

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
                        q.variable_cost_krw, q.setup_cost_krw, q.min_price_krw,
                        q.created_at, q.updated_at, q.fdm_material, q.fdm_material_name,
                        q.resin_type, q.resin_type_name,
                        q.file_name, q.dimensions_x, q.dimensions_y, q.dimensions_z
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

    const stamps: PricingStamps = await loadPricingStamps(db as unknown as Parameters<typeof loadPricingStamps>[0])
    const buildMax = await loadBuildMaxByMethod(db as unknown as Parameters<typeof loadBuildMaxByMethod>[0])
    const equipmentMinByMethod = await loadEquipmentMinByMethod(db)

    const batchInputs: {
        key: number
        printMethod: string
        material: string
        quantity: number
        totalPriceKrw: number
        variableCostKrw?: number | null
        setupCostKrw?: number | null
        minPriceKrw?: number | null
        printSizeMm?: { x: number; y: number; z: number } | null
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

        const validityError = quoteValidityErrorMessage(evaluateQuoteValidity(row, stamps).status, quoteId)
        if (validityError) return { ok: false, error: validityError, status: 409 }

        if (row.dimensions_x != null && row.dimensions_y != null && row.dimensions_z != null) {
            const sizeError = buildVolumeErrorMessage(
                row.print_method,
                { x: row.dimensions_x, y: row.dimensions_y, z: row.dimensions_z },
                buildMax,
                row.file_name || `견적 #${quoteId}`
            )
            if (sizeError) return { ok: false, error: sizeError, status: 422 }
        }

        const requestedQty = Math.max(1, Math.floor(Number(item.quantity) || 1))
        const cartQty = Math.max(1, Math.floor(Number(row.cart_quantity) || 1))
        const quantity = Math.min(requestedQty, cartQty)

        const clientPrice =
            item.totalPrice != null && Number.isFinite(Number(item.totalPrice))
                ? Math.round(Number(item.totalPrice))
                : undefined

        const hasDims =
            row.dimensions_x != null &&
            row.dimensions_y != null &&
            row.dimensions_z != null &&
            Number(row.dimensions_x) > 0 &&
            Number(row.dimensions_y) > 0 &&
            Number(row.dimensions_z) > 0

        const methodKey = String(row.print_method || '')
            .trim()
            .toLowerCase()
        const quoteMin =
            row.min_price_krw != null && Number(row.min_price_krw) > 0
                ? Number(row.min_price_krw)
                : null
        const equipmentMin =
            methodKey === 'fdm' || methodKey === 'sla' || methodKey === 'dlp'
                ? equipmentMinByMethod[methodKey]
                : undefined
        const minPriceKrw = quoteMin ?? (equipmentMin != null && equipmentMin > 0 ? equipmentMin : null)

        batchInputs.push({
            key: quoteId,
            printMethod: String(row.print_method || 'unknown'),
            material: quoteMaterialKey(row),
            quantity,
            totalPriceKrw: Number(row.total_price) || 0,
            variableCostKrw: row.variable_cost_krw,
            setupCostKrw: row.setup_cost_krw,
            minPriceKrw,
            printSizeMm: hasDims
                ? {
                      x: Number(row.dimensions_x),
                      y: Number(row.dimensions_y),
                      z: Number(row.dimensions_z),
                  }
                : null,
            clientPrice,
        })
    }

    if (!batchInputs.length) {
        return { ok: false, error: '유효한 주문 항목이 없습니다. 장바구니를 다시 확인해 주세요.', status: 400 }
    }

    const minPriceMode = await loadBatchMinPriceMode(db)
    const bedMaxByMethod = buildMax as BedMaxByMethod

    const priced = priceCartLinesByMaterialGroup(
        batchInputs.map((b) => ({
            key: b.key,
            printMethod: b.printMethod,
            material: b.material,
            quantity: b.quantity,
            totalPriceKrw: b.totalPriceKrw,
            variableCostKrw: b.variableCostKrw,
            setupCostKrw: b.setupCostKrw,
            minPriceKrw: b.minPriceKrw,
            printSizeMm: b.printSizeMm,
        })),
        { applyVat: true, minPriceMode, bedMaxByMethod }
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
                `[order] quote ${b.key} price from DB group-batch (clientUnit=${b.clientPrice} dbUnit=${unitPrice} qty=${b.quantity} method=${b.printMethod} material=${b.material} grouped=${line.usedGroupBatch})`
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
