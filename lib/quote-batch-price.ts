/**
 * 수량 견적: 최소금액은 라인당 1회, 변동비(재료·서포트·장비)만 ×수량
 * 총액 = max(최소금액, 셋업 + 변동×N) → (선택) VAT 10% → 100원 반올림
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
 * 배치 라인 금액 산출
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
 * 저장된 견적 컬럼으로 라인 금액 계산.
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
