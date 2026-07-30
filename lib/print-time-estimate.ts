/**
 * FDM / SLA / DLP 출력 시간 산출 (견적·히어로·관리자 시뮬 공통)
 *
 * FDM: weightGrams(쉘+인필 반영, lib/fdm-quote)로 volumeTime 산출.
 * 레이어 높이 속도 보정(speedModifier)으로 0.1/0.2/0.3mm 차별화.
 * 기준 레이어 = 0.2mm (speedModifier = (0.2 / layer)^alpha)
 */

export const FDM_REF_LAYER_MM = 0.2
export const FDM_VOLUME_TIME_EXP = 0.85
export const FDM_VOLUME_TIME_COEF = 0.0297
export const FDM_SURFACE_TIME_EXP = 0.8
export const FDM_SURFACE_TIME_COEF = 0.00126
/** 관리자 fdm_layer_hours_factor → 레이어당 Z/기구 시간(h)로 환산하는 스케일 */
export const FDM_LAYER_TIME_FACTOR_SCALE = 0.08
export const FDM_DEFAULT_LAYER_HOURS_FACTOR = 0.02
export const FDM_MIN_TIME_HOURS = 0.5

export const RESIN_MECHANIC_DELAY_SEC = 8.5
export const RESIN_TIME_EXP = 0.9
export const RESIN_TIME_COEF = 0.953
export const RESIN_MIN_TIME_HOURS = 0.5

/**
 * 레이어 높이 속도 보정.
 * alpha=1 → 완전 반비례(0.1mm = 2×, 0.3mm ≈ 0.67×)
 * alpha=0.85 → 완만한 반비례(체감 과할 때)
 */
export function fdmLayerSpeedModifier(
    layerHeightMm: number,
    alpha = 1,
    refMm = FDM_REF_LAYER_MM
): number {
    const h = Math.max(0.05, Number(layerHeightMm) || refMm)
    return Math.pow(refMm / h, alpha)
}

export type FdmTimeEstimateInput = {
    weightGrams: number
    heightMm: number
    surfaceAreaCm2: number
    layerHeightMm: number
    fdmLayerHoursFactor?: number
    /** 기본 1. 과하면 0.85 권장 */
    layerSpeedAlpha?: number
    /**
     * 인필 %(10~100). 견적 모듈에서 무게 산출에 이미 반영됨.
     * 시간식은 weightGrams(쉘+인필 무게)를 사용하므로 별도 배율은 두지 않음.
     */
    infillPercent?: number
}
export type FdmTimeEstimateResult = {
    hours: number
    numLayers: number
    volumeTime: number
    movementTime: number
    surfaceTime: number
    speedModifier: number
}

export function estimateFdmPrintTimeHours(input: FdmTimeEstimateInput): FdmTimeEstimateResult {
    const layerHeightMm = Math.max(0.05, Number(input.layerHeightMm) || FDM_REF_LAYER_MM)
    const heightMm = Math.max(0, Number(input.heightMm) || 0)
    const weightGrams = Math.max(0, Number(input.weightGrams) || 0)
    const surfaceAreaCm2 = Math.max(0, Number(input.surfaceAreaCm2) || 0)
    const alpha = input.layerSpeedAlpha ?? 1
    const baseLayerFactor = input.fdmLayerHoursFactor ?? FDM_DEFAULT_LAYER_HOURS_FACTOR

    const numLayers = Math.max(1, Math.ceil(heightMm / layerHeightMm))
    const speedModifier = fdmLayerSpeedModifier(layerHeightMm, alpha)

    const volumeTime = Math.pow(weightGrams + 1, FDM_VOLUME_TIME_EXP) * FDM_VOLUME_TIME_COEF * speedModifier
    const layerTimeFactor = baseLayerFactor * FDM_LAYER_TIME_FACTOR_SCALE
    const movementTime = numLayers * layerTimeFactor
    const surfaceTime = Math.pow(surfaceAreaCm2 + 1, FDM_SURFACE_TIME_EXP) * FDM_SURFACE_TIME_COEF * speedModifier

    const hours = Math.max(FDM_MIN_TIME_HOURS, volumeTime + movementTime + surfaceTime)

    return { hours, numLayers, volumeTime, movementTime, surfaceTime, speedModifier }
}

export type ResinTimeEstimateInput = {
    heightMm: number
    layerHeightMm: number
    layerExposureSec: number
    mechanicDelaySec?: number
}

export type ResinTimeEstimateResult = {
    hours: number
    numLayers: number
    rawHours: number
}

export function estimateResinPrintTimeHours(input: ResinTimeEstimateInput): ResinTimeEstimateResult {
    const layerHeightMm = Math.max(0.01, Number(input.layerHeightMm) || 0.05)
    const heightMm = Math.max(0, Number(input.heightMm) || 0)
    const layerExp = Math.max(0, Number(input.layerExposureSec) || 0)
    const mechanicDelay = input.mechanicDelaySec ?? RESIN_MECHANIC_DELAY_SEC

    const numLayers = Math.max(1, Math.ceil(heightMm / layerHeightMm))
    const rawHours = (numLayers * (layerExp + mechanicDelay)) / 3600
    const hours = Math.max(RESIN_MIN_TIME_HOURS, Math.pow(rawHours + 0.1, RESIN_TIME_EXP) * RESIN_TIME_COEF)

    return { hours, numLayers, rawHours }
}

/** 견적 UI용 읽기 쉬운 시간 표기 (ceil로 뭉개지 않음) */
export function formatEstimatedPrintTime(hours: number): string {
    const h = Math.max(0, Number(hours) || 0)
    if (h < 1) {
        const mins = Math.max(1, Math.round(h * 60))
        if (mins >= 60) return '1시간'
        return `${mins}분`
    }
    if (h < 24) {
        const whole = Math.floor(h)
        const mins = Math.round((h - whole) * 60)
        if (mins === 0) return `${whole}시간`
        if (mins === 60) return `${whole + 1}시간`
        return `${whole}시간 ${mins}분`
    }
    const days = h / 24
    if (days < 10) return `${days.toFixed(1)}일`
    return `${Math.round(days)}일`
}
