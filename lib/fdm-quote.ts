/**
 * FDM 견적 공통 모듈 (QuotePanel / Hero / PricingCalculator)
 *
 * 인필(속채움):
 * - UI 범위 10~100% (기본 20%) — 10%도 실제 반영 (구 density×0.2 floor 제거)
 * - 무게 = 외벽(shell) 부피×밀도 + 내부 부피×밀도×(인필/100)
 * - 출력 시간: 모델 무게 + 서포트 추정 무게를 Bambu급 유량식으로 반영
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
/** 고폴리 오버행 폭주 시 서포트비 상한 (재료비 대비) */
export const FDM_SUPPORT_COST_TO_MATERIAL_MAX = 3
export const FDM_SUPPORT_COST_FLOOR_KRW = 5_000

/**
 * 트리/오가닉 서포트 채움 밀도 근사 (Bambu tree ~희소).
 * supportVol ≈ overhangArea × (height×frac) × fill
 */
export const FDM_SUPPORT_FILL_RATIO = 0.125
/** 오버행 아래 평균 기둥 높이 = 모델 높이 × 이 비율 */
export const FDM_SUPPORT_AVG_HEIGHT_FRAC = 0.42
/** 서포트 무게 상한: 모델 무게 대비 배수 (극단 오버행 클램프) */
export const FDM_SUPPORT_MAX_MODEL_WEIGHT_RATIO = 3.5

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
    const rawSurface = Math.max(0, Number(input.surfaceAreaCm2) || 0)
    // 비밀폐·고폴리 메쉬의 표면적 폭주 방지 (구 표면의 여유 배수)
    const rCm = volumeCm3 > 0 ? Math.cbrt((3 * volumeCm3) / (4 * Math.PI)) : 0
    const maxSurfaceCm2 = Math.max(50, 4 * Math.PI * rCm * rCm * 12)
    const surfaceAreaCm2 = Math.min(rawSurface, maxSurfaceCm2)
    const shellThicknessMm = Math.max(0.2, Number(input.shellThicknessMm) || FDM_SHELL_THICKNESS_MM)
    const shellCm = shellThicknessMm / 10

    // 표면적×두께로 외벽 부피 근사 (전체 부피를 넘지 않음)
    const shellVolCm3 = Math.min(volumeCm3, surfaceAreaCm2 * shellCm)
    const infillVolCm3 = Math.max(0, volumeCm3 - shellVolCm3)
    const weightGrams =
        shellVolCm3 * density + infillVolCm3 * density * (effectiveInfill / 100)

    return { weightGrams, shellVolCm3, infillVolCm3, effectiveInfill, shellThicknessMm }
}

/**
 * Bambu급 서포트 필라멘트 무게 근사.
 * overhang 그림자 부피 × 희소 채움 밀도 (트리 서포트 체감).
 */
export function estimateFdmSupportGrams(input: {
    supportEnabled: boolean
    overhangAreaCm2: number
    heightMm: number
    density: number
    /** 클램프용 모델 무게(g) */
    modelWeightGrams?: number
}): number {
    if (!input.supportEnabled) return 0
    const overhang = Math.max(0, Number(input.overhangAreaCm2) || 0)
    if (overhang <= 0) return 0
    const heightCm = Math.max(0, Number(input.heightMm) || 0) / 10
    const density = Math.max(0, Number(input.density) || FDM_DEFAULT_DENSITY)
    const volCm3 =
        overhang * heightCm * FDM_SUPPORT_AVG_HEIGHT_FRAC * FDM_SUPPORT_FILL_RATIO
    let grams = volCm3 * density
    const modelW = Math.max(0, Number(input.modelWeightGrams) || 0)
    if (modelW > 0) {
        grams = Math.min(grams, modelW * FDM_SUPPORT_MAX_MODEL_WEIGHT_RATIO)
    }
    return grams
}

/** 오버행 미측정 시 표면적의 이 비율을 지지면적으로 사용 */
export const FDM_DEFAULT_OVERHANG_SURFACE_RATIO = 0.3

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
    /** 수량 — 변동비×N, 인건 1회, 최소금액 1회 (기본 1) */
    quantity?: number
}

export type CalculateFdmQuoteResult = {
    /** 공급가 (재료+지지+장비+인건) — 수량 반영 후, 최소·VAT 전 */
    subtotal: number
    /** 표시용 최종 금액 (applyVat 시 VAT·최소·반올림 반영, 아니면 subtotal에 최소만) */
    total: number
    /** 라인 총액과 동일(total). 수량>1일 때 유효 단가는 total/quantity */
    quantity: number
    effectiveUnitKrw: number
    /** 1개당 변동비(재료+서포트+장비) — 수량 저장용 */
    variableCostKrw: number
    /** 건당 셋업(인건) */
    setupCostKrw: number
    timeHours: number
    numLayers: number
    /** 모델(쉘+인필) 무게 — 1개 기준 */
    weightGrams: number
    /** 서포트 추정 무게(g) — 1개 기준 */
    supportGrams: number
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
    const quantity = Math.max(1, Math.floor(Number(input.quantity) || 1))
    const volumeCm3 = Math.max(0, Number(input.volumeCm3) || 0)
    const rawSurface = Math.max(0, Number(input.surfaceAreaCm2) || 0)
    const rCm = volumeCm3 > 0 ? Math.cbrt((3 * volumeCm3) / (4 * Math.PI)) : 0
    const maxSurfaceCm2 = Math.max(50, 4 * Math.PI * rCm * rCm * 12)
    const surfaceAreaCm2 = Math.min(rawSurface, maxSurfaceCm2)

    const weight = estimateFdmWeightGrams({
        volumeCm3,
        surfaceAreaCm2,
        density: input.density,
        infillPercent: input.infillPercent,
        shellThicknessMm: input.shellThicknessMm,
    })

    const materialCostUnit = Math.max(0, Number(input.pricePerGramKr) || 0) * weight.weightGrams

    const supportPerCm2 = input.fdmSupportPerCm2Krw ?? FDM_DEFAULT_SUPPORT_PER_CM2_KRW
    const rawOverhang =
        input.overhangAreaCm2 != null && Number.isFinite(Number(input.overhangAreaCm2))
            ? Math.max(0, Number(input.overhangAreaCm2))
            : surfaceAreaCm2 * FDM_DEFAULT_OVERHANG_SURFACE_RATIO
    const overhang = Math.min(rawOverhang, surfaceAreaCm2 * 0.55)
    const rawSupportCostUnit = input.supportEnabled ? supportPerCm2 * overhang : 0
    const supportCostCap = Math.max(
        materialCostUnit * FDM_SUPPORT_COST_TO_MATERIAL_MAX,
        FDM_SUPPORT_COST_FLOOR_KRW
    )
    const supportCostUnit = input.supportEnabled ? Math.min(rawSupportCostUnit, supportCostCap) : 0

    const supportGramsUnit = estimateFdmSupportGrams({
        supportEnabled: input.supportEnabled,
        overhangAreaCm2: overhang,
        heightMm: input.heightMm,
        density: input.density,
        modelWeightGrams: weight.weightGrams,
    })

    const laborCost = input.fdmLaborCostKrw ?? FDM_DEFAULT_LABOR_KRW

    // 1개 기준 장비비 (저장용 변동비 산정)
    const timeDetailUnit = estimateFdmPrintTimeHours({
        weightGrams: weight.weightGrams,
        heightMm: input.heightMm,
        surfaceAreaCm2,
        layerHeightMm: input.layerHeightMm,
        fdmLayerHoursFactor: input.fdmLayerHoursFactor,
        infillPercent: weight.effectiveInfill,
        density: input.density,
        supportGrams: supportGramsUnit,
        overhangAreaCm2: input.supportEnabled ? overhang : 0,
    })
    const rate = Math.max(0, Number(input.hourlyRateKr) || FDM_DEFAULT_HOURLY_RATE_KRW)
    const machineCostUnit =
        timeDetailUnit.hours * machineRateAfterVolumeDiscount(timeDetailUnit.hours, rate)

    // 배치: 부피·무게·서포트 ×N, 높이(Z)는 유지 → 압출량·시간에 반영. 인건은 1회.
    const timeDetail =
        quantity === 1
            ? timeDetailUnit
            : estimateFdmPrintTimeHours({
                  weightGrams: weight.weightGrams * quantity,
                  heightMm: input.heightMm,
                  surfaceAreaCm2: surfaceAreaCm2 * quantity,
                  layerHeightMm: input.layerHeightMm,
                  fdmLayerHoursFactor: input.fdmLayerHoursFactor,
                  infillPercent: weight.effectiveInfill,
                  density: input.density,
                  supportGrams: supportGramsUnit * quantity,
                  overhangAreaCm2: input.supportEnabled ? overhang * quantity : 0,
              })
    const machineCost =
        quantity === 1
            ? machineCostUnit
            : timeDetail.hours * machineRateAfterVolumeDiscount(timeDetail.hours, rate)

    const materialCost = materialCostUnit * quantity
    const supportCost = supportCostUnit * quantity
    const variableCostKrw = materialCostUnit + supportCostUnit + machineCostUnit
    const setupCostKrw = laborCost
    const subtotal = materialCost + supportCost + machineCost + laborCost

    let total = subtotal
    if (input.applyVat) {
        const base =
            input.minPriceKr != null && input.minPriceKr > 0
                ? Math.max(subtotal, input.minPriceKr)
                : subtotal
        total = roundTo100(base * 1.1, 'round')
    } else if (input.minPriceKr != null && input.minPriceKr > 0) {
        total = Math.max(roundTo100(subtotal, 'round'), input.minPriceKr)
    } else {
        total = roundTo100(subtotal, 'round')
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
        weightGrams: weight.weightGrams,
        supportGrams: supportGramsUnit,
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
