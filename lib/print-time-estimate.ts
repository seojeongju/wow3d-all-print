/**
 * FDM / SLA / DLP 출력 시간 산출 (견적·히어로·관리자 시뮬 공통)
 *
 * FDM: Bambu Studio급 슬라이서에 맞춘 물리 근사
 * - 압출 시간: (모델+서포트) 필라멘트 체적 / 평균 유량
 * - 레이어 오버헤드: Z 이동·레이어 전환
 * - 표면/이동: 외벽·트래블
 * - 서포트 트래블 패널티: 오버행 면적 기반
 * 레이어 높이 속도 보정(speedModifier): 기준 0.2mm
 */

export const FDM_REF_LAYER_MM = 0.2

/**
 * Bambu급 평균 체적 유량(mm³/s).
 * 피크 유량(15~25)보다 낮게 — 가감속·쿨링·소형 피처 감속 반영.
 */
export const FDM_AVG_FLOW_MM3_S = 10.2

/** 레이어당 오버헤드(초). 관리자 fdm_layer_hours_factor로 스케일 */
export const FDM_LAYER_OVERHEAD_SEC = 2.8

/** 표면(외벽·트래블) 시간 계수 — h / cm² @ 0.2mm */
export const FDM_SURFACE_HOURS_PER_CM2 = 0.0019

/** 서포트 트래블 패널티 — h / overhang cm² */
export const FDM_SUPPORT_TRAVEL_HOURS_PER_CM2 = 0.0032

/**
 * 서포트 압출은 끊김·이동이 많아 동일 무게 대비 시간 가중.
 * (Bambu 트리/노멀 서포트 체감)
 */
export const FDM_SUPPORT_TIME_WEIGHT = 1.2

/** @deprecated 레거시 멱승식 계수 — 호환/문서용으로만 유지 */
export const FDM_VOLUME_TIME_EXP = 0.85
/** @deprecated */
export const FDM_VOLUME_TIME_COEF = 0.0297
/** @deprecated */
export const FDM_SURFACE_TIME_EXP = 0.8
/** @deprecated */
export const FDM_SURFACE_TIME_COEF = 0.00126
/** 관리자 fdm_layer_hours_factor 기본값 (레거시 스케일과 동일 키) */
export const FDM_DEFAULT_LAYER_HOURS_FACTOR = 0.02
/** @deprecated 레거시 movementTime 스케일 */
export const FDM_LAYER_TIME_FACTOR_SCALE = 0.08
export const FDM_MIN_TIME_HOURS = 0.5
export const FDM_DEFAULT_DENSITY = 1.24

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
    /** 필라멘트 밀도(g/cm³). 압출 체적 환산용 */
    density?: number
    /** 서포트 추정 무게(g). 없으면 0 */
    supportGrams?: number
    /** 서포트 ON일 때 오버행 면적(cm²) — 트래블 패널티 */
    overhangAreaCm2?: number
}
export type FdmTimeEstimateResult = {
    hours: number
    numLayers: number
    /** 압출(모델+서포트 가중) 시간 */
    volumeTime: number
    /** 레이어 전환 오버헤드 */
    movementTime: number
    /** 표면/외벽·트래블 (+서포트 트래블) */
    surfaceTime: number
    speedModifier: number
    effectiveExtrudeGrams?: number
}

export function estimateFdmPrintTimeHours(input: FdmTimeEstimateInput): FdmTimeEstimateResult {
    const layerHeightMm = Math.max(0.05, Number(input.layerHeightMm) || FDM_REF_LAYER_MM)
    const heightMm = Math.max(0, Number(input.heightMm) || 0)
    const weightGrams = Math.max(0, Number(input.weightGrams) || 0)
    const supportGrams = Math.max(0, Number(input.supportGrams) || 0)
    const surfaceAreaCm2 = Math.max(0, Number(input.surfaceAreaCm2) || 0)
    const overhangAreaCm2 = Math.max(0, Number(input.overhangAreaCm2) || 0)
    const density = Math.max(0.5, Number(input.density) || FDM_DEFAULT_DENSITY)
    const alpha = input.layerSpeedAlpha ?? 1
    const baseLayerFactor = input.fdmLayerHoursFactor ?? FDM_DEFAULT_LAYER_HOURS_FACTOR

    const numLayers = Math.max(1, Math.ceil(heightMm / layerHeightMm))
    const speedModifier = fdmLayerSpeedModifier(layerHeightMm, alpha)

    // 서포트는 이동이 많아 동일 g 대비 시간↑
    const effectiveExtrudeGrams = weightGrams + supportGrams * FDM_SUPPORT_TIME_WEIGHT
    const extrudeVolumeMm3 = (effectiveExtrudeGrams / density) * 1000
    const volumeTime = (extrudeVolumeMm3 / FDM_AVG_FLOW_MM3_S / 3600) * speedModifier

    // 관리자 계수: 기본 0.02 대비 비율로 레이어 오버헤드 스케일
    const layerScale = baseLayerFactor / FDM_DEFAULT_LAYER_HOURS_FACTOR
    const movementTime = (numLayers * FDM_LAYER_OVERHEAD_SEC * layerScale) / 3600

    const perimeterTime = surfaceAreaCm2 * FDM_SURFACE_HOURS_PER_CM2 * speedModifier
    const supportTravelTime =
        supportGrams > 0 || overhangAreaCm2 > 0
            ? overhangAreaCm2 * FDM_SUPPORT_TRAVEL_HOURS_PER_CM2 * speedModifier
            : 0
    const surfaceTime = perimeterTime + supportTravelTime

    const hours = Math.max(FDM_MIN_TIME_HOURS, volumeTime + movementTime + surfaceTime)

    return {
        hours,
        numLayers,
        volumeTime,
        movementTime,
        surfaceTime,
        speedModifier,
        effectiveExtrudeGrams,
    }
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
