/**
 * 수량·다파일 견적 배치 가격
 * - once_per_material: 같은 출력방식·소재면 셋업·최소 1회 (기존)
 * - once_per_quote_line: 파일(라인)마다 셋업·최소
 * - hybrid(기본): 베드에 안 들어가거나 한 판에 못 넣으면 라인별, 가능하면 소재 묶음
 */

import {
    QUOTE_PRICE_ROUND_MODE,
    alignLineToUnitPrice,
    allocateByWeights,
    roundTo100,
    type PriceRoundMode,
} from '@/lib/amount-display'
import { fitsBuildVolume, type BuildDims } from '@/lib/build-volume'

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

/** 다파일 최소금액·셋업 공유 정책 */
export type BatchMinPriceMode = 'once_per_material' | 'once_per_quote_line' | 'hybrid'

/** 과소 견적 방지를 위해 hybrid를 기본으로 함 */
export const DEFAULT_BATCH_MIN_PRICE_MODE: BatchMinPriceMode = 'hybrid'

export const BATCH_MIN_PRICE_MODE_SETTING_KEY = 'cart_batch_min_price_mode'

export function parseBatchMinPriceMode(raw: unknown): BatchMinPriceMode {
    const s = String(raw ?? '')
        .trim()
        .toLowerCase()
    if (s === 'once_per_material' || s === 'once_per_quote_line' || s === 'hybrid') return s
    return DEFAULT_BATCH_MIN_PRICE_MODE
}

export type BedMaxByMethod = Partial<Record<'fdm' | 'sla' | 'dlp', BuildDims>>

export type CartBatchOptions = {
    applyVat?: boolean
    roundMode?: PriceRoundMode
    minPriceMode?: BatchMinPriceMode
    bedMaxByMethod?: BedMaxByMethod
    /** 한 판 면적 여유 (0~1). hybrid에서 footprint 합이 bed×이 값 초과면 라인별 */
    bedAreaFillRatio?: number
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
    const roundMode = input.roundMode ?? QUOTE_PRICE_ROUND_MODE
    const rawLineTotal = applyVat ? roundTo100(supplyKrw * 1.1, roundMode) : roundTo100(supplyKrw, roundMode)
    const aligned = alignLineToUnitPrice(rawLineTotal, quantity, roundMode)

    return {
        quantity,
        supplyKrw,
        lineTotalKrw: aligned.lineTotal,
        effectiveUnitKrw: aligned.unitPrice,
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

    const aligned = alignLineToUnitPrice(totalPrice * quantity, quantity, input.roundMode ?? QUOTE_PRICE_ROUND_MODE)
    return {
        lineTotalKrw: aligned.lineTotal,
        effectiveUnitKrw: aligned.unitPrice,
        usedBatchFormula: false,
    }
}

export type PrintMethodGroupKey = string

export type CartBatchLineInput = {
    /** 장바구니 행 또는 quote id */
    key: string | number
    printMethod: string
    /** FDM 소재명 또는 레진 종류 — 같은 출력방식이라도 소재가 다르면 최소금액을 따로 적용 */
    material?: string | null
    quantity: number
    totalPriceKrw: number
    variableCostKrw?: number | null
    setupCostKrw?: number | null
    minPriceKrw?: number | null
    /** 출력 치수(mm) — hybrid 베드 판정용 */
    printSizeMm?: BuildDims | null
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

function normalizePrintMethod(raw: string | undefined | null): string {
    const m = String(raw || '').trim().toLowerCase()
    if (m === 'fdm' || m === 'sla' || m === 'dlp') return m
    return m || 'unknown'
}

function normalizeMaterial(raw: string | undefined | null): string {
    return String(raw || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

/** 출력방식 + 소재 그룹 키 (소재 정보가 없으면 출력방식만) */
export function materialGroupKey(line: CartBatchLineInput): PrintMethodGroupKey {
    const method = normalizePrintMethod(line.printMethod)
    const material = normalizeMaterial(line.material)
    return material ? `${method}:${material}` : method
}

function hasBatchCosts(line: CartBatchLineInput): boolean {
    const v = line.variableCostKrw != null ? Number(line.variableCostKrw) : NaN
    const s = line.setupCostKrw != null ? Number(line.setupCostKrw) : NaN
    return Number.isFinite(v) && v >= 0 && Number.isFinite(s) && s >= 0
}

function bedForLine(
    line: CartBatchLineInput,
    bedMaxByMethod?: BedMaxByMethod
): BuildDims | null {
    if (!bedMaxByMethod) return null
    const m = normalizePrintMethod(line.printMethod)
    if (m !== 'fdm' && m !== 'sla' && m !== 'dlp') return null
    return bedMaxByMethod[m] ?? null
}

function lineFitsBed(line: CartBatchLineInput, bed: BuildDims | null): boolean {
    if (!bed) return true
    const d = line.printSizeMm
    if (!d || !(d.x > 0 && d.y > 0 && d.z > 0)) return true
    return fitsBuildVolume(d, bed)
}

/** 출력 XY 발자국(mm²). 치수 없으면 0 */
function footprintMm2(line: CartBatchLineInput): number {
    const d = line.printSizeMm
    if (!d) return 0
    const x = Math.max(0, Number(d.x) || 0)
    const y = Math.max(0, Number(d.y) || 0)
    return x * y
}

/**
 * 가격 그룹 키 결정.
 * - solo: 라인별 셋업·최소
 * - material: 동일 소재 묶음
 */
export function resolvePricingGroupKey(
    line: CartBatchLineInput,
    options?: Pick<CartBatchOptions, 'minPriceMode' | 'bedMaxByMethod'>
): string {
    const mode = options?.minPriceMode ?? DEFAULT_BATCH_MIN_PRICE_MODE
    if (mode === 'once_per_quote_line') return `solo:${line.key}`

    const bed = bedForLine(line, options?.bedMaxByMethod)
    if (mode === 'hybrid' && bed && !lineFitsBed(line, bed)) {
        return `solo:${line.key}`
    }

    return materialGroupKey(line)
}

function shouldSplitMaterialGroupForBed(
    groupLines: CartBatchLineInput[],
    bed: BuildDims | null,
    fillRatio: number
): boolean {
    if (!bed || groupLines.length <= 1) return false
    const bedArea = Math.max(0, bed.x) * Math.max(0, bed.y)
    if (!(bedArea > 0)) return false
    let sumFp = 0
    let known = 0
    for (const line of groupLines) {
        const qty = normalizeQuoteQuantity(line.quantity)
        const fp = footprintMm2(line)
        if (fp > 0) {
            sumFp += fp * qty
            known += 1
        }
    }
    if (known === 0) return false
    return sumFp > bedArea * fillRatio
}

function priceOneGroup(
    groupKey: string,
    groupLines: CartBatchLineInput[],
    applyVat: boolean,
    roundMode: PriceRoundMode
): {
    results: CartBatchLineResult[]
    group: { groupKey: string; supplyKrw: number; totalKrw: number; minApplied: boolean }
} {
    let sumVariable = 0
    let setupOnce = 0
    let minOnce = 0
    const weights: number[] = []

    for (const line of groupLines) {
        const qty = normalizeQuoteQuantity(line.quantity)
        const variable = Math.max(0, Number(line.variableCostKrw) || 0)
        const setup = Math.max(0, Number(line.setupCostKrw) || 0)
        const minP =
            line.minPriceKrw != null && Number(line.minPriceKrw) > 0 ? Number(line.minPriceKrw) : 0
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

    const shares = allocateByWeights(groupTotalKrw, weights, roundMode === 'none' ? 1 : 100)
    const results: CartBatchLineResult[] = []
    let groupLinesTotal = 0
    const usedGroupBatch = groupLines.length > 1
    for (let i = 0; i < groupLines.length; i++) {
        const line = groupLines[i]
        const qty = normalizeQuoteQuantity(line.quantity)
        const aligned = alignLineToUnitPrice(shares[i] ?? 0, qty, roundMode)
        groupLinesTotal += aligned.lineTotal
        results.push({
            key: line.key,
            printMethod: normalizePrintMethod(line.printMethod),
            groupKey,
            quantity: qty,
            lineTotalKrw: aligned.lineTotal,
            effectiveUnitKrw: aligned.unitPrice,
            usedGroupBatch,
        })
    }
    return {
        results,
        group: { groupKey, supplyKrw, totalKrw: groupLinesTotal, minApplied },
    }
}

/**
 * 장바구니/주문 라인들을 정책에 따라 묶어 가격 산정.
 */
export function priceCartLinesByMaterialGroup(
    lines: CartBatchLineInput[],
    options?: CartBatchOptions
): {
    lines: CartBatchLineResult[]
    grandTotalKrw: number
    groups: { groupKey: string; supplyKrw: number; totalKrw: number; minApplied: boolean }[]
} {
    const applyVat = options?.applyVat !== false
    const roundMode = options?.roundMode ?? QUOTE_PRICE_ROUND_MODE
    const mode = options?.minPriceMode ?? DEFAULT_BATCH_MIN_PRICE_MODE
    const fillRatio = options?.bedAreaFillRatio ?? 0.9
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

    /** 1차: 모드·단독 베드 초과로 그룹 키 부여 */
    const provisional = new Map<string, CartBatchLineInput[]>()
    for (const line of batchable) {
        const gk = resolvePricingGroupKey(line, {
            minPriceMode: mode,
            bedMaxByMethod: options?.bedMaxByMethod,
        })
        const arr = provisional.get(gk) || []
        arr.push(line)
        provisional.set(gk, arr)
    }

    /** 2차: hybrid에서 소재 그룹이 한 판에 안 들어가면 라인별로 분리 */
    const finalGroups = new Map<string, CartBatchLineInput[]>()
    for (const [gk, groupLines] of provisional) {
        if (mode === 'hybrid' && !gk.startsWith('solo:')) {
            const bed = bedForLine(groupLines[0], options?.bedMaxByMethod)
            if (shouldSplitMaterialGroupForBed(groupLines, bed, fillRatio)) {
                for (const line of groupLines) {
                    finalGroups.set(`solo:${line.key}`, [line])
                }
                continue
            }
        }
        finalGroups.set(gk, groupLines)
    }

    for (const [groupKey, groupLines] of finalGroups) {
        const priced = priceOneGroup(groupKey, groupLines, applyVat, roundMode)
        results.push(...priced.results)
        groupsOut.push(priced.group)
    }

    const grandTotalKrw = results.reduce((s, r) => s + r.lineTotalKrw, 0)
    return { lines: results, grandTotalKrw, groups: groupsOut }
}

/** key → lineTotal 맵 */
export function cartLineTotalsByKey(
    lines: CartBatchLineInput[],
    options?: CartBatchOptions
): Map<string | number, number> {
    const priced = priceCartLinesByMaterialGroup(lines, options)
    return new Map(priced.lines.map((l) => [l.key, l.lineTotalKrw]))
}
