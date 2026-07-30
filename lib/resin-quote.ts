/**
 * SLA / DLP 견적 공통 모듈 (QuotePanel / PricingCalculator / 서버 재계산)
 *
 * 레진비 = pricePerMl × volumeCm3 (1 cm³ ≈ 1 mL)
 * 시간 = estimateResinPrintTimeHours (레이어 노출 + 기계 지연)
 */

import { roundTo100 } from '@/lib/amount-display'
import {
    estimateResinPrintTimeHours,
    type ResinTimeEstimateResult,
} from '@/lib/print-time-estimate'

export type ResinMethod = 'sla' | 'dlp'

export const SLA_LAYER_HEIGHTS = [0.025, 0.05, 0.1] as const
export const SLA_LAYER_DEFAULT = 0.05

export const SLA_DEFAULT_HOURLY_RATE_KRW = 8000
export const SLA_DEFAULT_LAYER_EXPOSURE_SEC = 8
export const SLA_DEFAULT_LABOR_KRW = 9100
export const SLA_DEFAULT_CONSUMABLES_KRW = 3900
export const SLA_DEFAULT_POST_PROCESS_KRW = 10400

export const DLP_DEFAULT_HOURLY_RATE_KRW = 9000
export const DLP_DEFAULT_LAYER_EXPOSURE_SEC = 3
export const DLP_DEFAULT_LABOR_KRW = 9100
export const DLP_DEFAULT_CONSUMABLES_KRW = 3900
export const DLP_DEFAULT_POST_PROCESS_KRW = 10400

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
        }
    }
    return {
        hourlyRateKr: SLA_DEFAULT_HOURLY_RATE_KRW,
        layerExposureSec: SLA_DEFAULT_LAYER_EXPOSURE_SEC,
        laborCostKrw: SLA_DEFAULT_LABOR_KRW,
        consumablesKrw: SLA_DEFAULT_CONSUMABLES_KRW,
        postProcessKrw: SLA_DEFAULT_POST_PROCESS_KRW,
    }
}

export type CalculateResinQuoteInput = {
    method: ResinMethod
    volumeCm3: number
    heightMm: number
    layerHeightMm: number
    pricePerMlKr: number
    postProcessing: boolean
    hourlyRateKr: number
    layerExposureSec?: number
    laborCostKrw?: number
    consumablesKrw?: number
    postProcessKrw?: number
    /** true면 VAT 10% + 최소견적 + 100원 반올림까지 적용 */
    applyVat?: boolean
    minPriceKr?: number | null
}

export type CalculateResinQuoteResult = {
    /** 공급가 (레진+기타+장비+인건) */
    subtotal: number
    /** 표시용 최종 금액 */
    total: number
    timeHours: number
    numLayers: number
    volumeMl: number
    costBreakdown: {
        material: number
        other: number
        machine: number
        labor: number
    }
    timeDetail: ResinTimeEstimateResult
}

/** SLA / DLP 견적 일괄 산출 */
export function calculateResinQuote(input: CalculateResinQuoteInput): CalculateResinQuoteResult {
    const defaults = resinDefaults(input.method)
    const volumeMl = Math.max(0, Number(input.volumeCm3) || 0)
    const materialCost = Math.max(0, Number(input.pricePerMlKr) || 0) * volumeMl

    const consumablesKrw = input.consumablesKrw ?? defaults.consumablesKrw
    const postProcessKrw = input.postProcessKrw ?? defaults.postProcessKrw
    const postProcessCost = input.postProcessing ? postProcessKrw : 0
    const otherCost = consumablesKrw + postProcessCost

    const laborCost = input.laborCostKrw ?? defaults.laborCostKrw

    const layerExposureSec = input.layerExposureSec ?? defaults.layerExposureSec
    const timeDetail = estimateResinPrintTimeHours({
        heightMm: input.heightMm,
        layerHeightMm: input.layerHeightMm,
        layerExposureSec,
    })

    const rate = Math.max(0, Number(input.hourlyRateKr) || defaults.hourlyRateKr)
    const machineCost = timeDetail.hours * machineRateAfterVolumeDiscount(timeDetail.hours, rate)

    const subtotal = materialCost + otherCost + machineCost + laborCost

    let total = subtotal
    if (input.applyVat) {
        const base =
            input.minPriceKr != null && input.minPriceKr > 0
                ? Math.max(subtotal, input.minPriceKr)
                : subtotal
        total = roundTo100(base * 1.1, 'round')
    } else if (input.minPriceKr != null && input.minPriceKr > 0) {
        total = Math.max(roundTo100(subtotal, 'round'), input.minPriceKr)
    }

    return {
        subtotal,
        total,
        timeHours: timeDetail.hours,
        numLayers: timeDetail.numLayers,
        volumeMl,
        costBreakdown: {
            material: materialCost,
            other: otherCost,
            machine: machineCost,
            labor: laborCost,
        },
        timeDetail,
    }
}
