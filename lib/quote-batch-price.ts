/**
 * 수량·다파일 견적 배치 가격
 * - 같은 출력방식 그룹: 최소금액·셋업 1회 + 변동비 합산
 * - 다른 출력방식: 그룹이 나뉘므로 방식마다 최소금액 적용
 */

import { roundTo100, type PriceRoundMode } from '@/lib/amount-display'

export type QuoteBatchPriceInput = {
    /** 1개당 변동비(공급가): 재료+서포트+장비 등 */
    variableCostKrw: number
    /** 건당 셋업(공급가): 인건·준비비 등 — 수량과 무관하게 1회 */
    setupCostKrw: number
    /** 장비 기본(최소) 금액. 없으면 0 */
    minPriceKrw?: number | null
    quantity: number
    applyVat?: boolean
    roundMode?: PriceRoundMode
}

export type QuoteBatchPriceResult = {
    quantity: number
    /** 공급가 (VAT 전) */
    supplyKrw: number
    /** 고객 표시 라인 총액 */
    lineTotalKrw: number
    /** 총액 ÷ 수량 (표시용 유효 단가) */
    effectiveUnitKrw: number
    /** 최소금액이 적용됐는지 */
    minApplied: boolean
    variableCostKrw: number
    setupCostKrw: number
}

export function normalizeQuoteQuantity(raw: unknown): number {
    const n = Math.floor(Number(raw))
    if (!Number.isFinite(n) || n < 1) return 1
    return Math.min(n, 99_999)
}

/**
 * 단일 라인 배치 금액 산출 (동일 파일 수량)
 */
export function calculateQuoteBatchPrice(input: QuoteBatchPriceInput): QuoteBatchPriceResult {
    const quantity = normalizeQuoteQuantity(input.quantity)
    const variable = Math.max(0, Number(input.variableCostKrw) || 0)
    const setup = Math.max(0, Number(input.setupCostKrw) || 0)
    const minPrice =
        input.minPriceKrw != null && Number(input.minPriceKrw) > 0 ? Number(input.minPriceKrw) : 0

    const rawSupply = setup + variable * quantity
    const minApplied = minPrice > 0 && rawSupply < minPrice
    const supplyKrw = minApplied ? minPrice : rawSupply

    const applyVat = input.applyVat !== false
    const lineTotalKrw = applyVat
        ? roundTo100(supplyKrw * 1.1, input.roundMode ?? 'round')
        : roundTo100(supplyKrw, input.roundMode ?? 'round')

    return {
        quantity,
        supplyKrw,
        lineTotalKrw,
        effectiveUnitKrw: lineTotalKrw / quantity,
        minApplied,
        variableCostKrw: variable,
        setupCostKrw: setup,
    }
}

/**
 * 저장된 견적 컬럼으로 라인 금액 계산 (단독 라인).
 * variable/setup이 없으면 구버전: total_price(1개, VAT포함) × 수량
 */
export function lineTotalFromStoredQuote(input: {
    totalPriceKrw: number
    quantity: number
    variableCostKrw?: number | null
    setupCostKrw?: number | null
    minPriceKrw?: number | null
    applyVat?: boolean
    roundMode?: PriceRoundMode
}): { lineTotalKrw: number; effectiveUnitKrw: number; usedBatchFormula: boolean } {
    const quantity = normalizeQuoteQuantity(input.quantity)
    const totalPrice = Math.max(0, Number(input.totalPriceKrw) || 0)
    const variable = input.variableCostKrw != null ? Number(input.variableCostKrw) : NaN
    const setup = input.setupCostKrw != null ? Number(input.setupCostKrw) : NaN

    if (Number.isFinite(variable) && variable >= 0 && Number.isFinite(setup) && setup >= 0) {
        const batch = calculateQuoteBatchPrice({
            variableCostKrw: variable,
            setupCostKrw: setup,
            minPriceKrw: input.minPriceKrw,
            quantity,
            applyVat: input.applyVat !== false,
            roundMode: input.roundMode,
        })
        return {
            lineTotalKrw: batch.lineTotalKrw,
            effectiveUnitKrw: batch.effectiveUnitKrw,
            usedBatchFormula: true,
        }
    }

    const lineTotalKrw = roundTo100(totalPrice * quantity, input.roundMode ?? 'round')
    return {
        lineTotalKrw,
        effectiveUnitKrw: quantity > 0 ? lineTotalKrw / quantity : lineTotalKrw,
        usedBatchFormula: false,
    }
}

export type PrintMethodGroupKey = string

export type CartBatchLineInput = {
    /** 장바구니 행 또는 quote id */
    key: string | number
    printMethod: string
    quantity: number
    totalPriceKrw: number
    variableCostKrw?: number | null
    setupCostKrw?: number | null
    minPriceKrw?: number | null
}

export type CartBatchLineResult = {
    key: string | number
    printMethod: string
    groupKey: PrintMethodGroupKey
    quantity: number
    lineTotalKrw: number
    effectiveUnitKrw: number
    usedGroupBatch: boolean
}

function normalizePrintMethod(raw: string | undefined | null): PrintMethodGroupKey {
    const m = String(raw || '').trim().toLowerCase()
    if (m === 'fdm' || m === 'sla' || m === 'dlp') return m
    return m || 'unknown'
}

function hasBatchCosts(line: CartBatchLineInput): boolean {
    const v = line.variableCostKrw != null ? Number(line.variableCostKrw) : NaN
    const s = line.setupCostKrw != null ? Number(line.setupCostKrw) : NaN
    return Number.isFinite(v) && v >= 0 && Number.isFinite(s) && s >= 0
}

/**
 * 장바구니/주문 라인들을 출력방식별로 묶어 가격 산정.
 * - 같은 방식: 셋업 max 1회 + 변동 합산 + 최소 1회
 * - 다른 방식: 그룹이 달라 방식마다 최소 적용
 */
export function priceCartLinesByPrintMethod(
    lines: CartBatchLineInput[],
    options?: { applyVat?: boolean; roundMode?: PriceRoundMode }
): {
    lines: CartBatchLineResult[]
    grandTotalKrw: number
    groups: { groupKey: string; supplyKrw: number; totalKrw: number; minApplied: boolean }[]
} {
    const applyVat = options?.applyVat !== false
    const roundMode = options?.roundMode ?? 'round'
    const results: CartBatchLineResult[] = []
    const groupsOut: { groupKey: string; supplyKrw: number; totalKrw: number; minApplied: boolean }[] =
        []

    const legacy: CartBatchLineInput[] = []
    const batchable: CartBatchLineInput[] = []
    for (const line of lines) {
        if (hasBatchCosts(line)) batchable.push(line)
        else legacy.push(line)
    }

    for (const line of legacy) {
        const priced = lineTotalFromStoredQuote({
            totalPriceKrw: line.totalPriceKrw,
            quantity: line.quantity,
            applyVat,
            roundMode,
        })
        results.push({
            key: line.key,
            printMethod: normalizePrintMethod(line.printMethod),
            groupKey: `legacy:${line.key}`,
            quantity: normalizeQuoteQuantity(line.quantity),
            lineTotalKrw: priced.lineTotalKrw,
            effectiveUnitKrw: priced.effectiveUnitKrw,
            usedGroupBatch: false,
        })
    }

    const byMethod = new Map<string, CartBatchLineInput[]>()
    for (const line of batchable) {
        const gk = normalizePrintMethod(line.printMethod)
        const arr = byMethod.get(gk) || []
        arr.push(line)
        byMethod.set(gk, arr)
    }

    for (const [groupKey, groupLines] of byMethod) {
        let sumVariable = 0
        let setupOnce = 0
        let minOnce = 0
        const weights: number[] = []

        for (const line of groupLines) {
            const qty = normalizeQuoteQuantity(line.quantity)
            const variable = Math.max(0, Number(line.variableCostKrw) || 0)
            const setup = Math.max(0, Number(line.setupCostKrw) || 0)
            const minP =
                line.minPriceKrw != null && Number(line.minPriceKrw) > 0
                    ? Number(line.minPriceKrw)
                    : 0
            const w = variable * qty
            weights.push(w)
            sumVariable += w
            setupOnce = Math.max(setupOnce, setup)
            minOnce = Math.max(minOnce, minP)
        }

        const rawSupply = setupOnce + sumVariable
        const minApplied = minOnce > 0 && rawSupply < minOnce
        const supplyKrw = minApplied ? minOnce : rawSupply
        const groupTotalKrw = applyVat
            ? roundTo100(supplyKrw * 1.1, roundMode)
            : roundTo100(supplyKrw, roundMode)

        groupsOut.push({ groupKey, supplyKrw, totalKrw: groupTotalKrw, minApplied })

        const weightSum = weights.reduce((a, b) => a + b, 0)
        let allocated = 0
        for (let i = 0; i < groupLines.length; i++) {
            const line = groupLines[i]
            const qty = normalizeQuoteQuantity(line.quantity)
            const isLast = i === groupLines.length - 1
            let share: number
            if (weightSum > 0) {
                share = isLast
                    ? groupTotalKrw - allocated
                    : Math.round((groupTotalKrw * weights[i]) / weightSum)
            } else {
                const each = Math.floor(groupTotalKrw / groupLines.length)
                share = isLast ? groupTotalKrw - allocated : each
            }
            if (!isLast) allocated += share
            results.push({
                key: line.key,
                printMethod: groupKey,
                groupKey,
                quantity: qty,
                lineTotalKrw: Math.max(0, share),
                effectiveUnitKrw: qty > 0 ? Math.max(0, share) / qty : Math.max(0, share),
                usedGroupBatch: true,
            })
        }
    }

    const grandTotalKrw = results.reduce((s, r) => s + r.lineTotalKrw, 0)
    return { lines: results, grandTotalKrw, groups: groupsOut }
}

/** key → lineTotal 맵 */
export function cartLineTotalsByKey(
    lines: CartBatchLineInput[],
    options?: { applyVat?: boolean; roundMode?: PriceRoundMode }
): Map<string | number, number> {
    const priced = priceCartLinesByPrintMethod(lines, options)
    return new Map(priced.lines.map((l) => [l.key, l.lineTotalKrw]))
}
