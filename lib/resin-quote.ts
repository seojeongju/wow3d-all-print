/**
 * SLA / DLP 견적 공통 모듈 (QuotePanel / PricingCalculator / 서버 재계산)
 *
 * 레진비 = pricePerMl × volumeCm3 (1 cm³ ≈ 1 mL)
 * 서포트비 = 지지면적(표면적×0.3) × 원/cm² (항상 포함, 상한 = max(레진비×3, 5,000원))
 * 시간 = estimateResinPrintTimeHours (레이어 노출 + 기계 지연)
 */

import { QUOTE_PRICE_ROUND_MODE, roundTo100 } from '@/lib/amount-display'
import {
    estimateResinPrintTimeHours,
    type ResinTimeEstimateResult,
} from '@/lib/print-time-estimate'

export type ResinMethod = 'sla' | 'dlp'

export const SLA_LAYER_HEIGHTS = [0.025, 0.05, 0.1] as const
export const SLA_LAYER_DEFAULT = 0.05

export const SLA_DEFAULT_HOURLY_RATE_KRW = 11100
export const SLA_DEFAULT_LAYER_EXPOSURE_SEC = 9
export const SLA_DEFAULT_LABOR_KRW = 10700
export const SLA_DEFAULT_CONSUMABLES_KRW = 3900
export const SLA_DEFAULT_POST_PROCESS_KRW = 10400

export const DLP_DEFAULT_HOURLY_RATE_KRW = 7100
export const DLP_DEFAULT_LAYER_EXPOSURE_SEC = 3
export const DLP_DEFAULT_LABOR_KRW = 9100
export const DLP_DEFAULT_CONSUMABLES_KRW = 3900
export const DLP_DEFAULT_POST_PROCESS_KRW = 10400

export const SLA_DEFAULT_SUPPORT_PER_CM2_KRW = 60
export const DLP_DEFAULT_SUPPORT_PER_CM2_KRW = 50
/** 지지면적 = 표면적 × 이 비율 (서버 재계산과 동일하게 오버행 측정값은 쓰지 않음) */
export const RESIN_SUPPORT_SURFACE_RATIO = 0.3
/** 고폴리·비밀폐 메쉬 오버행 폭주 시 서포트비 상한 (레진비 대비) */
export const RESIN_SUPPORT_COST_TO_MATERIAL_MAX = 3
export const RESIN_SUPPORT_COST_FLOOR_KRW = 5_000

export function resinMethodToMaterialType(method: ResinMethod): 'SLA' | 'DLP' {
    return method === 'dlp' ? 'DLP' : 'SLA'
}

export function snapSlaLayerHeight(v: unknown): typeof SLA_LAYER_HEIGHTS[number] | null {
    if (v == null || v === '') return null
    const n = Math.round(Number(v) * 1000) / 1000
    return SLA_LAYER_HEIGHTS.includes(n as typeof SLA_LAYER_HEIGHTS[number])
        ? (n as typeof SLA_LAYER_HEIGHTS[number])
        : null
}

export function clampSlaLayerHeight(v: unknown, fallback = SLA_LAYER_DEFAULT): number {
    const snapped = snapSlaLayerHeight(v)
    if (snapped != null) return snapped
    const n = Number(v)
    if (Number.isFinite(n) && n > 0) return n
    return fallback
}

function machineRateAfterVolumeDiscount(hours: number, rateKr: number): number {
    if (hours > 10) return rateKr * 0.7
    if (hours > 5) return rateKr * 0.8
    return rateKr
}

export function resinDefaults(method: ResinMethod) {
    if (method === 'dlp') {
        return {
            hourlyRateKr: DLP_DEFAULT_HOURLY_RATE_KRW,
            layerExposureSec: DLP_DEFAULT_LAYER_EXPOSURE_SEC,
            laborCostKrw: DLP_DEFAULT_LABOR_KRW,
            consumablesKrw: DLP_DEFAULT_CONSUMABLES_KRW,
            postProcessKrw: DLP_DEFAULT_POST_PROCESS_KRW,
            supportPerCm2Krw: DLP_DEFAULT_SUPPORT_PER_CM2_KRW,
        }
    }
    return {
        hourlyRateKr: SLA_DEFAULT_HOURLY_RATE_KRW,
        layerExposureSec: SLA_DEFAULT_LAYER_EXPOSURE_SEC,
        laborCostKrw: SLA_DEFAULT_LABOR_KRW,
        consumablesKrw: SLA_DEFAULT_CONSUMABLES_KRW,
        postProcessKrw: SLA_DEFAULT_POST_PROCESS_KRW,
        supportPerCm2Krw: SLA_DEFAULT_SUPPORT_PER_CM2_KRW,
    }
}

/** 레진 서포트비(1개 기준) — 지지면적 × 단가, 레진비 대비 상한 */
export function calculateResinSupportCost(input: {
    volumeCm3: number
    surfaceAreaCm2: number
    materialCostKrw: number
    supportPerCm2Krw: number
}): { supportAreaCm2: number; supportCostKrw: number } {
    const volumeCm3 = Math.max(0, Number(input.volumeCm3) || 0)
    const rawSurface = Math.max(0, Number(input.surfaceAreaCm2) || 0)
    // 비밀폐·고폴리 메쉬의 표면적 폭주 방지 (FDM과 동일한 구 표면 여유 배수)
    const rCm = volumeCm3 > 0 ? Math.cbrt((3 * volumeCm3) / (4 * Math.PI)) : 0
    const surfaceAreaCm2 = Math.min(rawSurface, Math.max(50, 4 * Math.PI * rCm * rCm * 12))
    const supportAreaCm2 = surfaceAreaCm2 * RESIN_SUPPORT_SURFACE_RATIO
    const rate = Math.max(0, Number(input.supportPerCm2Krw) || 0)
    const cap = Math.max(
        Math.max(0, input.materialCostKrw) * RESIN_SUPPORT_COST_TO_MATERIAL_MAX,
        RESIN_SUPPORT_COST_FLOOR_KRW
    )
    return { supportAreaCm2, supportCostKrw: Math.min(rate * supportAreaCm2, cap) }
}

export type CalculateResinQuoteInput = {
    method: ResinMethod
    volumeCm3: number
    /** 서포트 지지면적 산출용 */
    surfaceAreaCm2: number
    heightMm: number
    layerHeightMm: number
    pricePerMlKr: number
    postProcessing: boolean
    hourlyRateKr: number
    layerExposureSec?: number
    laborCostKrw?: number
    consumablesKrw?: number
    postProcessKrw?: number
    supportPerCm2Krw?: number
    /** true면 VAT 10% + 최소견적 + 100원 반올림까지 적용 */
    applyVat?: boolean
    minPriceKr?: number | null
    /** 수량 — 레진·후가공 ×N, 인건·소모품·장비시간(동일 높이 배치) 1회, 최소 1회 */
    quantity?: number
}

export type CalculateResinQuoteResult = {
    /** 공급가 (레진+서포트+기타+장비+인건) — 수량 반영 후 */
    subtotal: number
    /** 표시용 최종 금액 */
    total: number
    quantity: number
    effectiveUnitKrw: number
    variableCostKrw: number
    setupCostKrw: number
    timeHours: number
    numLayers: number
    volumeMl: number
    /** 서포트 지지면적(cm²) — 1개 기준 */
    supportAreaCm2: number
    costBreakdown: {
        material: number
        support: number
        other: number
        machine: number
        labor: number
    }
    timeDetail: ResinTimeEstimateResult
}

/** SLA / DLP 견적 일괄 산출 */
export function calculateResinQuote(input: CalculateResinQuoteInput): CalculateResinQuoteResult {
    const quantity = Math.max(1, Math.floor(Number(input.quantity) || 1))
    const defaults = resinDefaults(input.method)
    const volumeMlUnit = Math.max(0, Number(input.volumeCm3) || 0)
    const materialCostUnit = Math.max(0, Number(input.pricePerMlKr) || 0) * volumeMlUnit

    const consumablesKrw = input.consumablesKrw ?? defaults.consumablesKrw
    const postProcessKrw = input.postProcessKrw ?? defaults.postProcessKrw
    const postProcessCostUnit = input.postProcessing ? postProcessKrw : 0
    const support = calculateResinSupportCost({
        volumeCm3: volumeMlUnit,
        surfaceAreaCm2: input.surfaceAreaCm2,
        materialCostKrw: materialCostUnit,
        supportPerCm2Krw: input.supportPerCm2Krw ?? defaults.supportPerCm2Krw,
    })
    const supportCostUnit = support.supportCostKrw

    const laborCost = input.laborCostKrw ?? defaults.laborCostKrw

    const layerExposureSec = input.layerExposureSec ?? defaults.layerExposureSec
    // 동일 높이로 한 판에 배치한다고 가정 → 노출 시간은 수량과 무관
    const timeDetail = estimateResinPrintTimeHours({
        heightMm: input.heightMm,
        layerHeightMm: input.layerHeightMm,
        layerExposureSec,
    })

    const rate = Math.max(0, Number(input.hourlyRateKr) || defaults.hourlyRateKr)
    const machineCost = timeDetail.hours * machineRateAfterVolumeDiscount(timeDetail.hours, rate)

    const materialCost = materialCostUnit * quantity
    const supportCost = supportCostUnit * quantity
    const postProcessCost = postProcessCostUnit * quantity
    // 소모품·인건·장비 = 셋업성 / 레진·서포트·후가공 = 변동
    const otherCost = consumablesKrw + postProcessCost
    const variableCostKrw = materialCostUnit + supportCostUnit + postProcessCostUnit
    const setupCostKrw = laborCost + consumablesKrw + machineCost
    const subtotal = materialCost + supportCost + otherCost + machineCost + laborCost

    let total = subtotal
    if (input.applyVat) {
        const base =
            input.minPriceKr != null && input.minPriceKr > 0
                ? Math.max(subtotal, input.minPriceKr)
                : subtotal
        total = roundTo100(base * 1.1, QUOTE_PRICE_ROUND_MODE)
    } else if (input.minPriceKr != null && input.minPriceKr > 0) {
        total = Math.max(roundTo100(subtotal, QUOTE_PRICE_ROUND_MODE), input.minPriceKr)
    } else {
        total = roundTo100(subtotal, QUOTE_PRICE_ROUND_MODE)
    }

    return {
        subtotal,
        total,
        quantity,
        effectiveUnitKrw: total / quantity,
        variableCostKrw,
        setupCostKrw,
        timeHours: timeDetail.hours,
        numLayers: timeDetail.numLayers,
        volumeMl: volumeMlUnit * quantity,
        supportAreaCm2: support.supportAreaCm2,
        costBreakdown: {
            material: materialCost,
            support: supportCost,
            other: otherCost,
            machine: machineCost,
            labor: laborCost,
        },
        timeDetail,
    }
}
