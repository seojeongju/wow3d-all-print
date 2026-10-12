/**
 * 간편 가격 계산기 — 파일 없이 크기·형태·소재·수량만으로 견적 범위 추정
 *
 * 실제 견적과 같은 calculateFdmQuote / calculateResinQuote 공식과 관리자 단가를 쓰고,
 * 형태 프리셋으로 부피·표면적·오버행의 하한·상한을 잡아 금액 범위를 만든다.
 * (FDM 서포트·레진 후처리는 견적 화면과 동일하게 항상 포함)
 */

import { calculateFdmQuote, FDM_INFILL_DEFAULT } from '@/lib/fdm-quote'
import { calculateResinQuote } from '@/lib/resin-quote'
import { fitsBuildVolume, type BuildDims } from '@/lib/build-volume'

export type EstimatorMethod = 'fdm' | 'sla' | 'dlp'
export type EstimatorShape = 'solid' | 'general' | 'shell' | 'figure'

export const ESTIMATOR_SHAPES: EstimatorShape[] = ['solid', 'general', 'shell', 'figure']
export const ESTIMATOR_METHODS: EstimatorMethod[] = ['fdm', 'sla', 'dlp']

export const ESTIMATOR_DIM_MIN_MM = 1
export const ESTIMATOR_DIM_MAX_MM = 2000
export const ESTIMATOR_QTY_MAX = 999

const FDM_LAYER_MM = 0.2
const RESIN_LAYER_MM = 0.05

type ShapeBound = {
    /** 외곽 상자 부피 대비 실제 부피 비율 */
    fill: number
    /** 표면적 대비 서포트가 필요한 면 비율 */
    overhang: number
    /** 케이스형: 벽 두께(mm) — 지정 시 fill 대신 외곽 표면적 × 두께로 부피 산출 */
    wallMm?: number
}

type ShapePreset = {
    low: ShapeBound
    high: ShapeBound
    /** 외곽 상자 표면적 대비 실제 표면적 배수 */
    surfaceMul: number
}

/**
 * 형태별 범위 — 하한은 단순·작은 부피, 상한은 꽉 찬·서포트 많은 경우.
 * 케이스형은 안팎 면이 모두 표면이라 표면적 2배.
 */
const SHAPE_PRESETS: Record<EstimatorShape, ShapePreset> = {
    solid: { low: { fill: 0.5, overhang: 0.03 }, high: { fill: 0.8, overhang: 0.15 }, surfaceMul: 1 },
    general: { low: { fill: 0.2, overhang: 0.1 }, high: { fill: 0.45, overhang: 0.3 }, surfaceMul: 1.1 },
    shell: {
        low: { fill: 0, overhang: 0.1, wallMm: 1.5 },
        high: { fill: 0, overhang: 0.3, wallMm: 2.5 },
        surfaceMul: 2,
    },
    figure: { low: { fill: 0.15, overhang: 0.2 }, high: { fill: 0.35, overhang: 0.4 }, surfaceMul: 1.5 },
}

/**
 * 상한이 이 금액(VAT 포함)을 넘으면 숫자 대신 상담 안내 — 대형 부품은 속 비움(쉘)·분할 출력으로
 * 실제 금액이 크게 달라져 꽉 찬 부피 기준 추정이 의미가 없음
 */
export const ESTIMATOR_CONSULT_KRW = 1_000_000

/** 케이스형 부피 상한 (외곽 부피 대비) — 작은 상자에서 벽이 내부를 채우는 경우 */
const SHELL_MAX_FILL = 0.6

export type EstimatorSpec = {
    max?: BuildDims
    hourlyRate?: number
    layerCosts?: Record<string, number>
    minPriceKr?: number
    fdm_layer_hours_factor?: number
    fdm_labor_cost_krw?: number
    fdm_support_per_cm2_krw?: number
    sla_layer_exposure_sec?: number
    sla_labor_cost_krw?: number
    sla_consumables_krw?: number
    sla_post_process_krw?: number
    sla_support_per_cm2_krw?: number
    dlp_layer_exposure_sec?: number
    dlp_labor_cost_krw?: number
    dlp_consumables_krw?: number
    dlp_post_process_krw?: number
    dlp_support_per_cm2_krw?: number
}

export type EstimatorSpecs = Partial<Record<EstimatorMethod, EstimatorSpec>>

export type EstimatorMaterial = {
    name: string
    type: string
    price_per_gram: number
    price_per_ml?: number | null
    density: number
}

export type EstimatorInput = {
    method: EstimatorMethod
    dims: BuildDims
    shape: EstimatorShape
    quantity: number
    material: EstimatorMaterial
    spec: EstimatorSpec | undefined
    /** FDM 속채움(%) — 없으면 기본 20% */
    infillPercent?: number
}

export type EstimatePoint = {
    /** 라인 총액 (VAT 포함, 100원 단위) */
    totalKrw: number
    /** 총액 ÷ 수량 */
    unitKrw: number
    /** 예상 출력 시간(시간) — 수량 전체 기준 */
    hours: number
    /** 최소 금액이 적용됐는지 */
    minApplied: boolean
}

export type EstimateRange = {
    low: EstimatePoint
    high: EstimatePoint
    /** 회전해서라도 장비에 들어가는지 */
    fits: boolean
}

export function materialTypeForMethod(method: EstimatorMethod): 'FDM' | 'SLA' | 'DLP' {
    return method === 'fdm' ? 'FDM' : method === 'sla' ? 'SLA' : 'DLP'
}

export function clampEstimatorDim(v: unknown): number {
    const n = Number(v)
    if (!Number.isFinite(n)) return 0
    return Math.min(ESTIMATOR_DIM_MAX_MM, Math.max(0, n))
}

export function clampEstimatorQty(v: unknown): number {
    const n = Math.floor(Number(v))
    if (!Number.isFinite(n) || n < 1) return 1
    return Math.min(ESTIMATOR_QTY_MAX, n)
}

export function isValidEstimatorDims(d: BuildDims): boolean {
    return [d.x, d.y, d.z].every((v) => Number.isFinite(v) && v >= ESTIMATOR_DIM_MIN_MM && v <= ESTIMATOR_DIM_MAX_MM)
}

function shapeGeometry(dims: BuildDims, preset: ShapePreset, bound: ShapeBound) {
    const { x, y, z } = dims
    const boxCm3 = (x * y * z) / 1000
    const boxSurfaceCm2 = (2 * (x * y + y * z + x * z)) / 100
    const volumeCm3 =
        bound.wallMm != null
            ? Math.min(boxSurfaceCm2 * (bound.wallMm / 10), boxCm3 * SHELL_MAX_FILL)
            : boxCm3 * bound.fill
    const surfaceAreaCm2 = boxSurfaceCm2 * preset.surfaceMul
    return { volumeCm3, surfaceAreaCm2, overhangAreaCm2: surfaceAreaCm2 * bound.overhang }
}

function hourlyRateFor(spec: EstimatorSpec | undefined, layerMm: number, fallback: number): number {
    const byLayer = spec?.layerCosts?.[String(layerMm)]
    if (byLayer != null && Number.isFinite(byLayer)) return byLayer
    return spec?.hourlyRate ?? fallback
}

function estimatePoint(input: EstimatorInput, bound: ShapeBound): EstimatePoint {
    const preset = SHAPE_PRESETS[input.shape]
    const geom = shapeGeometry(input.dims, preset, bound)
    const quantity = clampEstimatorQty(input.quantity)
    const spec = input.spec
    const minPriceKr = spec?.minPriceKr

    if (input.method === 'fdm') {
        const q = calculateFdmQuote({
            volumeCm3: geom.volumeCm3,
            surfaceAreaCm2: geom.surfaceAreaCm2,
            heightMm: input.dims.z,
            density: input.material.density,
            pricePerGramKr: Number(input.material.price_per_gram) || 0,
            infillPercent: input.infillPercent ?? FDM_INFILL_DEFAULT,
            layerHeightMm: FDM_LAYER_MM,
            supportEnabled: true,
            overhangAreaCm2: geom.overhangAreaCm2,
            materialName: input.material.name,
            hourlyRateKr: hourlyRateFor(spec, FDM_LAYER_MM, 5000),
            fdmLaborCostKrw: spec?.fdm_labor_cost_krw,
            fdmSupportPerCm2Krw: spec?.fdm_support_per_cm2_krw,
            fdmLayerHoursFactor: spec?.fdm_layer_hours_factor,
            applyVat: true,
            minPriceKr,
            quantity,
        })
        return {
            totalKrw: q.total,
            unitKrw: q.effectiveUnitKrw,
            hours: q.timeHours,
            minApplied: minPriceKr != null && minPriceKr > 0 && q.subtotal < minPriceKr,
        }
    }

    const dlp = input.method === 'dlp'
    const q = calculateResinQuote({
        method: dlp ? 'dlp' : 'sla',
        volumeCm3: geom.volumeCm3,
        surfaceAreaCm2: geom.surfaceAreaCm2,
        heightMm: input.dims.z,
        layerHeightMm: RESIN_LAYER_MM,
        pricePerMlKr: Number(input.material.price_per_ml) || 0,
        postProcessing: true,
        hourlyRateKr: hourlyRateFor(spec, RESIN_LAYER_MM, dlp ? 7100 : 11100),
        layerExposureSec: dlp ? spec?.dlp_layer_exposure_sec : spec?.sla_layer_exposure_sec,
        laborCostKrw: dlp ? spec?.dlp_labor_cost_krw : spec?.sla_labor_cost_krw,
        consumablesKrw: dlp ? spec?.dlp_consumables_krw : spec?.sla_consumables_krw,
        postProcessKrw: dlp ? spec?.dlp_post_process_krw : spec?.sla_post_process_krw,
        supportPerCm2Krw: dlp ? spec?.dlp_support_per_cm2_krw : spec?.sla_support_per_cm2_krw,
        applyVat: true,
        minPriceKr,
        quantity,
    })
    return {
        totalKrw: q.total,
        unitKrw: q.effectiveUnitKrw,
        hours: q.timeHours,
        minApplied: minPriceKr != null && minPriceKr > 0 && q.subtotal < minPriceKr,
    }
}

/** 크기·형태·소재·수량으로 금액 범위 산출. 치수가 유효하지 않으면 null */
export function estimatePriceRange(input: EstimatorInput): EstimateRange | null {
    if (!isValidEstimatorDims(input.dims)) return null
    const preset = SHAPE_PRESETS[input.shape]
    const a = estimatePoint(input, preset.low)
    const b = estimatePoint(input, preset.high)
    const [low, high] = a.totalKrw <= b.totalKrw ? [a, b] : [b, a]
    return {
        low: { ...low, hours: Math.min(a.hours, b.hours) },
        high: { ...high, hours: Math.max(a.hours, b.hours) },
        fits: fitsBuildVolume(input.dims, input.spec?.max),
    }
}
