/**
 * FDM 견적 공통 모듈 (QuotePanel / Hero / PricingCalculator)
 *
 * 인필(속채움):
 * - UI 범위 10~100% (기본 20%) — 10%도 실제 반영 (구 density×0.2 floor 제거)
 * - 무게 = 외벽(shell) 부피×밀도 + 내부 부피×밀도×(인필/100)
 * - 출력 시간은 인필이 반영된 weightGrams로 volumeTime에 간접 반영
 */

import { roundTo100 } from '@/lib/amount-display'
import {
    estimateFdmPrintTimeHours,
    type FdmTimeEstimateResult,
} from '@/lib/print-time-estimate'

export const FDM_INFILL_MIN = 10
export const FDM_INFILL_MAX = 100
export const FDM_INFILL_DEFAULT = 20

/** 용도별 인필 프리셋 (QuotePanel 빠른 선택) */
export const FDM_INFILL_PRESETS = [
    { id: 'appearance' as const, label: '외관', percent: 20, hint: '시제품·형상 확인' },
    { id: 'functional' as const, label: '기능', percent: 40, hint: '조립·일반 하중' },
    { id: 'strength' as const, label: '고강도', percent: 80, hint: '내구·응력 부품' },
]

/** 외벽 근사 두께 — 대략 perimeter 2줄 × 0.4mm */
export const FDM_SHELL_THICKNESS_MM = 0.8
export const FDM_DEFAULT_DENSITY = 1.24
export const FDM_DEFAULT_LABOR_KRW = 6500
export const FDM_DEFAULT_SUPPORT_PER_CM2_KRW = 26
export const FDM_DEFAULT_HOURLY_RATE_KRW = 5000

export function clampFdmInfillPercent(v: unknown, fallback = FDM_INFILL_DEFAULT): number {
    const n = Math.round(Number(v))
    if (!Number.isFinite(n)) return fallback
    return Math.min(FDM_INFILL_MAX, Math.max(FDM_INFILL_MIN, n))
}

export type FdmWeightEstimate = {
    weightGrams: number
    shellVolCm3: number
    infillVolCm3: number
    effectiveInfill: number
    shellThicknessMm: number
}

/** 쉘 + 인필 분리 무게 추정 */
export function estimateFdmWeightGrams(input: {
    volumeCm3: number
    surfaceAreaCm2: number
    density: number
    infillPercent: number
    shellThicknessMm?: number
}): FdmWeightEstimate {
    const effectiveInfill = clampFdmInfillPercent(input.infillPercent)
    const density = Math.max(0, Number(input.density) || 0)
    const volumeCm3 = Math.max(0, Number(input.volumeCm3) || 0)
    const surfaceAreaCm2 = Math.max(0, Number(input.surfaceAreaCm2) || 0)
    const shellThicknessMm = Math.max(0.2, Number(input.shellThicknessMm) || FDM_SHELL_THICKNESS_MM)
    const shellCm = shellThicknessMm / 10

    // 표면적×두께로 외벽 부피 근사 (전체 부피를 넘지 않음)
    const shellVolCm3 = Math.min(volumeCm3, surfaceAreaCm2 * shellCm)
    const infillVolCm3 = Math.max(0, volumeCm3 - shellVolCm3)
    const weightGrams =
        shellVolCm3 * density + infillVolCm3 * density * (effectiveInfill / 100)

    return { weightGrams, shellVolCm3, infillVolCm3, effectiveInfill, shellThicknessMm }
}

export type CalculateFdmQuoteInput = {
    volumeCm3: number
    surfaceAreaCm2: number
    heightMm: number
    density: number
    pricePerGramKr: number
    infillPercent: number
    layerHeightMm: number
    supportEnabled: boolean
    /** 있으면 지지면적에 사용, 없으면 surfaceArea×0.3 */
    overhangAreaCm2?: number | null
    hourlyRateKr: number
    fdmLaborCostKrw?: number
    fdmSupportPerCm2Krw?: number
    fdmLayerHoursFactor?: number
    shellThicknessMm?: number
    /** true면 VAT 10% + 최소견적 + 100원 반올림까지 적용 */
    applyVat?: boolean
    minPriceKr?: number | null
}

export type CalculateFdmQuoteResult = {
    /** 공급가 (재료+지지+장비+인건) */
    subtotal: number
    /** 표시용 최종 금액 (applyVat 시 VAT·최소·반올림 반영, 아니면 subtotal) */
    total: number
    timeHours: number
    numLayers: number
    weightGrams: number
    shellVolCm3: number
    infillVolCm3: number
    effectiveInfill: number
    materialName?: string
    costBreakdown: {
        material: number
        support: number
        machine: number
        labor: number
    }
    timeDetail: FdmTimeEstimateResult
}

function machineRateAfterVolumeDiscount(hours: number, rateKr: number): number {
    if (hours > 10) return rateKr * 0.7
    if (hours > 5) return rateKr * 0.8
    return rateKr
}

/** FDM 견적 일괄 산출 */
export function calculateFdmQuote(input: CalculateFdmQuoteInput): CalculateFdmQuoteResult {
    const weight = estimateFdmWeightGrams({
        volumeCm3: input.volumeCm3,
        surfaceAreaCm2: input.surfaceAreaCm2,
        density: input.density,
        infillPercent: input.infillPercent,
        shellThicknessMm: input.shellThicknessMm,
    })

    const materialCost = Math.max(0, Number(input.pricePerGramKr) || 0) * weight.weightGrams

    const supportPerCm2 = input.fdmSupportPerCm2Krw ?? FDM_DEFAULT_SUPPORT_PER_CM2_KRW
    const overhang =
        input.overhangAreaCm2 != null && Number.isFinite(Number(input.overhangAreaCm2))
            ? Math.max(0, Number(input.overhangAreaCm2))
            : Math.max(0, Number(input.surfaceAreaCm2) || 0) * 0.3
    const supportCost = input.supportEnabled ? supportPerCm2 * overhang : 0

    const laborCost = input.fdmLaborCostKrw ?? FDM_DEFAULT_LABOR_KRW

    const timeDetail = estimateFdmPrintTimeHours({
        weightGrams: weight.weightGrams,
        heightMm: input.heightMm,
        surfaceAreaCm2: input.surfaceAreaCm2,
        layerHeightMm: input.layerHeightMm,
        fdmLayerHoursFactor: input.fdmLayerHoursFactor,
        infillPercent: weight.effectiveInfill,
    })

    const rate = Math.max(0, Number(input.hourlyRateKr) || FDM_DEFAULT_HOURLY_RATE_KRW)
    const machineCost = timeDetail.hours * machineRateAfterVolumeDiscount(timeDetail.hours, rate)

    const subtotal = materialCost + supportCost + machineCost + laborCost

    let total = subtotal
    if (input.applyVat) {
        // QuotePanel과 동일: 공급가에 최소견적 적용 → VAT 10% → 100원 반올림
        const base = input.minPriceKr != null && input.minPriceKr > 0
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
        weightGrams: weight.weightGrams,
        shellVolCm3: weight.shellVolCm3,
        infillVolCm3: weight.infillVolCm3,
        effectiveInfill: weight.effectiveInfill,
        costBreakdown: {
            material: materialCost,
            support: supportCost,
            machine: machineCost,
            labor: laborCost,
        },
        timeDetail,
    }
}
