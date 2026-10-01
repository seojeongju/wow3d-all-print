/**
 * FDM / SLA / DLP 출력 시간 산출 (견적·히어로·관리자 시뮬 공통)
 *
 * FDM 견적: estimateFdmPrintTimeP2S — Bambu Lab P2S "0.20mm Standard" 기본 공정 기준
 * - 벽·윗면/바닥·인필·서포트별 경로 길이와 속도(재질 최대 유량 상한), 가감속
 * - 외벽 오버행 감속, 경사면 솔리드, 레이어 전환·이동, 최소 레이어 시간 감속, 출력 준비
 * - Bambu Studio P2S 실측(같은 부품 두 자세, 항목별 시간)으로 보정
 * estimateFdmPrintTimeHours는 이전 평균 유량식(스크립트 호환용)
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
    let surfaceTime = perimeterTime + supportTravelTime
    // 고폴리 내부면으로 표면 시간이 압출 시간을 수십 배 넘는 것을 방지
    const maxSurfaceTime = Math.max(volumeTime * 1.5, movementTime * 3, 0.75)
    surfaceTime = Math.min(surfaceTime, maxSurfaceTime)

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

/**
 * Bambu Lab P2S · 0.4mm 표준 핫엔드 · "0.20mm Standard @BBL P2S" 기본 공정값
 * (BambuStudio resources/profiles/BBL/process — 속도 mm/s, 가속 mm/s², 선폭 mm)
 */
export const P2S_PROFILE = {
    outerWall: { speed: 200, accel: 6000, width: 0.42 },
    innerWall: { speed: 300, accel: 10000, width: 0.45 },
    sparseInfill: { speed: 270, accel: 10000, width: 0.45 },
    solidInfill: { speed: 250, accel: 10000, width: 0.42 },
    topSurface: { speed: 200, accel: 2000, width: 0.42 },
    bridge: { speed: 50, accel: 10000, width: 0.42 },
    support: { speed: 150, accel: 10000, width: 0.42 },
    initialLayerWall: { speed: 50, accel: 500, width: 0.5 },
    initialLayerInfill: { speed: 105, accel: 500, width: 0.5 },
    travel: { speed: 1000, accel: 10000 },
    wallLoops: 2,
    topShellLayers: 5,
    topShellThicknessMm: 1.0,
    bottomShellLayers: 3,
    /** 레이어 전환(Z 이동·와이프) 고정 시간(초) */
    layerChangeSec: 0.5,
    /** 레이어당 이동 횟수(벽 시작·인필 진입 등) */
    travelsPerLayer: 4,
    /** 리트랙션 0.8mm 왕복 시간(초) */
    retractSec: 0.06,
    /** 출력 준비(예열·베드 레벨링·노즐 청소) 시간(초) — Bambu Studio P2S 표시 7m1s */
    prepSec: 420,
    /**
     * 경사 윗면·아랫면에서 벽이 솔리드를 대신하는 수평 폭(mm).
     * 벽 2겹 폭(0.87)보다 작은 것은 '수직 쉘 두께 보장'이 경사면 옆에 솔리드를 추가하기 때문
     */
    shellCoverBandMm: 0.25,
    /** 외벽 오버행 감속 — 레이어당 돌출량/외벽 선폭 구간별 속도(mm/s), Bambu 기본 + 50% 이상은 실측 평균 */
    overhangWallSpeeds: [
        { maxRatio: 0.1, speed: 200 },
        { maxRatio: 0.25, speed: 50 },
        { maxRatio: 0.5, speed: 30 },
        { maxRatio: Infinity, speed: 20 },
    ],
    /** 그리드 인필 실제 압출 / 밀도 — 교차·앵커(400%) 포함 */
    sparseInfillFlowScale: 1.27,
    /** 인필·솔리드 평균 구간 길이 = 두께(2V/S) × 계수 — 얇은 형상일수록 짧은 선·가감속 손실 */
    sparseSegmentPerThickness: 0.8,
    solidSegmentPerThickness: 1.4,
    /** 일반 서포트 평균 경로 구간(mm) — 실측 평균 약 90mm/s */
    supportSegmentMm: 3.2,
    /** 서포트 경로 이 길이(mm)마다 이동·리트랙션 1회 */
    supportPathPerTravelMm: 40,
    /** 인필 구간 이 개수마다 이동·리트랙션 1회 (앵커로 이어지지 않는 조각) */
    sparseSegmentsPerTravel: 17,
} as const

/** 경사면이 윗면(아랫면) 솔리드로 남는 비율 — 층당 노출 폭 h·cotφ 중 벽이 덮는 부분 제외 */
export function p2sShellSolidFraction(
    absNormalUp: number,
    sinTheta: number,
    shellLayers: number,
    layerHeightMm: number = FDM_REF_LAYER_MM
): number {
    if (sinTheta < 1e-6) return 1
    const exposedMm = (shellLayers * layerHeightMm * absNormalUp) / sinTheta
    return exposedMm > 0 ? Math.max(0, 1 - P2S_PROFILE.shellCoverBandMm / exposedMm) : 0
}

/** slowWallArea 상한 = 표면적 × 이 값 (외벽 속도 / 최저 오버행 속도 − 1) */
export const P2S_MAX_SLOW_WALL_TO_SURFACE_RATIO =
    P2S_PROFILE.outerWall.speed / Math.min(...P2S_PROFILE.overhangWallSpeeds.map((b) => b.speed)) - 1

/** 아래를 향한 면의 외벽 시간 추가 배수 (외벽 속도 / 오버행 구간 속도 − 1) */
export function p2sOverhangWallExtra(
    absNormalUp: number,
    sinTheta: number,
    layerHeightMm: number = FDM_REF_LAYER_MM
): number {
    if (sinTheta < 1e-6) return 0
    const ratio = (layerHeightMm * absNormalUp) / sinTheta / P2S_PROFILE.outerWall.width
    const bin = P2S_PROFILE.overhangWallSpeeds.find((b) => ratio < b.maxRatio)!
    return P2S_PROFILE.outerWall.speed / bin.speed - 1
}

export type FdmMaterialSpeedProfile = {
    key: string
    /** 필라멘트 최대 체적 유량 (mm³/s, P2S 표준 핫엔드) */
    maxVolumetricSpeed: number
    /** 최소 레이어 시간(초) — 작은 레이어는 이 시간까지 감속 */
    minLayerTimeSec: number
}

/** Bambu 필라멘트 P2S 프로파일 기준 (filament_max_volumetric_speed / slow_down_layer_time) */
export const P2S_MATERIAL_PROFILES: Record<string, FdmMaterialSpeedProfile> = {
    PLA: { key: 'PLA', maxVolumetricSpeed: 21, minLayerTimeSec: 4 },
    PETG: { key: 'PETG', maxVolumetricSpeed: 21, minLayerTimeSec: 10 },
    ABS: { key: 'ABS', maxVolumetricSpeed: 16, minLayerTimeSec: 12 },
    ASA: { key: 'ASA', maxVolumetricSpeed: 18, minLayerTimeSec: 12 },
    TPU: { key: 'TPU', maxVolumetricSpeed: 12, minLayerTimeSec: 8 },
}
const P2S_DEFAULT_MATERIAL: FdmMaterialSpeedProfile = { key: 'DEFAULT', maxVolumetricSpeed: 15, minLayerTimeSec: 8 }

export function resolveP2SMaterialProfile(name: string | null | undefined): FdmMaterialSpeedProfile {
    const n = (name || '').toUpperCase()
    for (const key of ['TPU', 'PETG', 'ASA', 'ABS', 'PLA']) {
        if (n.includes(key)) return P2S_MATERIAL_PROFILES[key]
    }
    return P2S_DEFAULT_MATERIAL
}

/** 압출 단면적(mm²) — 슬라이서식 둥근 사각형 */
export function extrusionSectionMm2(widthMm: number, layerHeightMm: number): number {
    const w = Math.max(layerHeightMm, widthMm)
    return (w - layerHeightMm) * layerHeightMm + (Math.PI * layerHeightMm * layerHeightMm) / 4
}

/** 가감속을 반영한 한 구간 이동 시간(초) */
function moveTimeSec(lengthMm: number, speed: number, accel: number): number {
    if (!(lengthMm > 0) || !(speed > 0) || !(accel > 0)) return 0
    const accelDist = (speed * speed) / accel
    return lengthMm >= accelDist ? lengthMm / speed + speed / accel : 2 * Math.sqrt(lengthMm / accel)
}

/** 총 경로 길이를 평균 구간 길이로 나눠 가감속 포함 시간(초) */
function featureTimeSec(totalMm: number, segmentMm: number, speed: number, accel: number): number {
    if (!(totalMm > 0)) return 0
    const seg = Math.max(0.5, Math.min(segmentMm, totalMm))
    return (totalMm / seg) * moveTimeSec(seg, speed, accel)
}

export type FdmGeometryForPrint = {
    volumeCm3: number
    surfaceAreaCm2: number
    heightMm: number
    /** 측면(벽) 면적 Σ A·sinθ (cm²) */
    lateralAreaCm2?: number | null
    /** 위를 향한 면 투영 면적 (cm²) */
    topAreaCm2?: number | null
    /** 아래를 향한 면 투영 면적, 바닥 접촉 포함 (cm²) */
    bottomAreaCm2?: number | null
    /** 바닥 접촉 면적 (cm²) */
    bedAreaCm2?: number | null
    /** 외벽 오버행 감속 추가분 — 외벽 속도 기준 등가 측면 면적 (cm²) */
    slowWallAreaCm2?: number | null
}

export type FdmStructureEstimate = {
    layerHeightMm: number
    numLayers: number
    /** 벽(외벽+내벽) 압출 부피 mm³ */
    wallVolMm3: number
    /** 윗면·바닥 솔리드 압출 부피 mm³ */
    solidVolMm3: number
    /** 내부(성긴 인필 영역) 부피 mm³ — 채움률 적용 전 */
    sparseRegionMm3: number
    /** 성긴 인필 압출 부피 mm³ */
    sparseVolMm3: number
    lateralMm2: number
    topMm2: number
    bottomMm2: number
    bedMm2: number
    /** 단면 대표 길이(mm) — 벽 구간 길이 근사 */
    characteristicMm: number
    /** 평균 두께 2V/S (mm) — 인필·솔리드 구간 길이 근사 */
    thicknessMm: number
    nTop: number
    nBottom: number
    /** 솔리드 층이 모델 부피를 넘을 때 줄인 비율 */
    solidScale: number
}

/** P2S 기본 공정(벽 2겹, 윗면 5층·1.0mm, 바닥 3층) 기준 압출 구조 */
export function estimateFdmStructureP2S(
    geom: FdmGeometryForPrint,
    layerHeightMm: number,
    infillPercent: number
): FdmStructureEstimate {
    const h = Math.max(0.05, Number(layerHeightMm) || FDM_REF_LAYER_MM)
    const heightMm = Math.max(h, Number(geom.heightMm) || 0)
    const volMm3 = Math.max(0, Number(geom.volumeCm3) || 0) * 1000
    const surfMm2 = Math.max(0, Number(geom.surfaceAreaCm2) || 0) * 100
    const numLayers = Math.max(1, Math.ceil(heightMm / h))

    // 방향 지표가 없으면 평균 단면으로 근사
    const xsMm2 = volMm3 / heightMm
    const fallbackFlat = Math.min(xsMm2, surfMm2 * 0.25)
    const cm2 = (v: number | null | undefined, fb: number) =>
        v != null && Number.isFinite(Number(v)) ? Math.min(Math.max(0, Number(v)) * 100, surfMm2) : fb
    const topMm2 = cm2(geom.topAreaCm2, fallbackFlat)
    const bottomMm2 = cm2(geom.bottomAreaCm2, fallbackFlat)
    const bedMm2 = Math.min(cm2(geom.bedAreaCm2, bottomMm2 * 0.6), bottomMm2)
    const lateralMm2 = cm2(geom.lateralAreaCm2, Math.max(surfMm2 - topMm2 - bottomMm2, surfMm2 * 0.4))

    const P = P2S_PROFILE
    const wallSection =
        extrusionSectionMm2(P.outerWall.width, h) +
        extrusionSectionMm2(P.innerWall.width, h) * (P.wallLoops - 1)
    const wallVolMm3 = Math.min(volMm3, (lateralMm2 / h) * wallSection)

    const nTop = Math.max(P.topShellLayers, Math.ceil(P.topShellThicknessMm / h - 1e-9))
    const nBottom = P.bottomShellLayers
    const rawSolidMm3 = (topMm2 * nTop + bottomMm2 * nBottom) * h
    const solidRoom = Math.max(0, volMm3 - wallVolMm3)
    const solidScale = rawSolidMm3 > solidRoom && rawSolidMm3 > 0 ? solidRoom / rawSolidMm3 : 1
    const solidVolMm3 = rawSolidMm3 * solidScale

    const sparseRegionMm3 = Math.max(0, volMm3 - wallVolMm3 - solidVolMm3)
    const infill = Math.min(100, Math.max(0, Number(infillPercent) || 0)) / 100
    const sparseVolMm3 = sparseRegionMm3 * Math.min(1, infill * P.sparseInfillFlowScale)
    const characteristicMm = Math.min(300, Math.max(5, Math.sqrt(xsMm2)))

    return {
        layerHeightMm: h,
        numLayers,
        wallVolMm3,
        solidVolMm3,
        sparseRegionMm3,
        sparseVolMm3,
        lateralMm2,
        topMm2,
        bottomMm2,
        bedMm2,
        characteristicMm,
        thicknessMm: surfMm2 > 0 ? Math.min(characteristicMm, Math.max(0.8, (2 * volMm3) / surfMm2)) : characteristicMm,
        nTop,
        nBottom,
        solidScale,
    }
}

export type FdmP2STimeInput = FdmGeometryForPrint & {
    layerHeightMm: number
    infillPercent: number
    /** 서포트 압출 부피(cm³, 채움률 적용 후) */
    supportExtrudeCm3?: number
    materialName?: string | null
    /** 관리자 레이어 계수 — 기본 0.02 대비 비율로 레이어 오버헤드 스케일 */
    fdmLayerHoursFactor?: number
    /** 동시 출력 수량 — 경로는 ×N, 레이어 수는 동일 */
    quantity?: number
}

export type FdmP2STimeResult = FdmTimeEstimateResult & {
    structure: FdmStructureEstimate
    material: FdmMaterialSpeedProfile
    breakdownSec: {
        walls: number
        solid: number
        sparseInfill: number
        firstLayer: number
        support: number
        travel: number
        layerOverhead: number
        minLayerSlowdown: number
        /** 출력 준비(예열·레벨링) — 작업당 1회 */
        prep: number
    }
}

/**
 * Bambu Studio(P2S) 슬라이스 시간 근사.
 * 기능별 경로 길이 = 압출 부피 / 단면적, 속도 = min(프로파일 속도, 재질 최대 유량 / 단면적),
 * 구간마다 가감속을 반영하고 최소 레이어 시간 감속을 적용.
 */
export function estimateFdmPrintTimeP2S(input: FdmP2STimeInput): FdmP2STimeResult {
    const P = P2S_PROFILE
    const quantity = Math.max(1, Math.floor(Number(input.quantity) || 1))
    const material = resolveP2SMaterialProfile(input.materialName)
    const s = estimateFdmStructureP2S(input, input.layerHeightMm, input.infillPercent)
    const h = s.layerHeightMm
    const flow = material.maxVolumetricSpeed
    const speedFor = (f: { speed: number; width: number }) =>
        Math.min(f.speed, flow / extrusionSectionMm2(f.width, h))
    const D = s.characteristicMm
    const solidSeg = Math.min(D, s.thicknessMm * P.solidSegmentPerThickness)
    const sparseSeg = Math.min(D, s.thicknessMm * P.sparseSegmentPerThickness)

    const wallPathMm = (s.lateralMm2 / h) * quantity
    // slowWallArea = Σ 측면 × (외벽 속도 / 오버행 속도 − 1) → 외벽 속도로 나누면 추가 시간
    const slowWallPathMm = ((Math.max(0, Number(input.slowWallAreaCm2) || 0) * 100) / h) * quantity
    const walls =
        featureTimeSec(wallPathMm, D, speedFor(P.outerWall), P.outerWall.accel) +
        slowWallPathMm / P.outerWall.speed +
        featureTimeSec(wallPathMm * (P.wallLoops - 1), D, speedFor(P.innerWall), P.innerWall.accel)

    // 바닥 1층(베드)은 첫 레이어 속도, 공중 아랫면 1층은 브리지 속도, 나머지는 솔리드
    const sc = s.solidScale * quantity
    const solidLen = (area: number, layers: number) => (area * layers * sc) / P.solidInfill.width
    const solid =
        featureTimeSec(solidLen(s.topMm2, 1), solidSeg, speedFor(P.topSurface), P.topSurface.accel) +
        featureTimeSec(
            solidLen(s.topMm2, s.nTop - 1) + solidLen(s.bottomMm2, s.nBottom - 1),
            solidSeg,
            speedFor(P.solidInfill),
            P.solidInfill.accel
        ) +
        featureTimeSec(solidLen(Math.max(0, s.bottomMm2 - s.bedMm2), 1), solidSeg, speedFor(P.bridge), P.bridge.accel)

    const firstLayer =
        featureTimeSec(
            (s.bedMm2 * quantity * s.solidScale) / P.initialLayerInfill.width,
            solidSeg,
            speedFor(P.initialLayerInfill),
            P.initialLayerInfill.accel
        ) +
        featureTimeSec(
            4 * Math.sqrt(s.bedMm2) * P.wallLoops * quantity,
            D,
            speedFor(P.initialLayerWall),
            P.initialLayerWall.accel
        )

    const sparsePathMm =
        (s.sparseVolMm3 * quantity) / extrusionSectionMm2(P.sparseInfill.width, h)
    const sparseInfill = featureTimeSec(sparsePathMm, sparseSeg, speedFor(P.sparseInfill), P.sparseInfill.accel)

    const supportMm3 = Math.max(0, Number(input.supportExtrudeCm3) || 0) * 1000 * quantity
    const supportPathMm = supportMm3 / extrusionSectionMm2(P.support.width, h)
    const support = featureTimeSec(supportPathMm, P.supportSegmentMm, speedFor(P.support), P.support.accel)

    const travelSec = (len: number) => moveTimeSec(len, P.travel.speed, P.travel.accel) + P.retractSec
    // 서포트 기둥·인필 조각 사이 짧은 이동
    const travel =
        (supportPathMm / P.supportPathPerTravelMm + sparsePathMm / (sparseSeg * P.sparseSegmentsPerTravel)) *
        travelSec(D / 4)

    const layerScale =
        (input.fdmLayerHoursFactor ?? FDM_DEFAULT_LAYER_HOURS_FACTOR) / FDM_DEFAULT_LAYER_HOURS_FACTOR
    const perLayerOverhead =
        (P.layerChangeSec + P.travelsPerLayer * quantity * travelSec(D / 2)) * layerScale
    const layerOverhead = s.numLayers * perLayerOverhead

    const printSec = walls + solid + firstLayer + sparseInfill + support + travel + layerOverhead
    const minLayerTotal = s.numLayers * material.minLayerTimeSec
    const minLayerSlowdown = Math.max(0, minLayerTotal - printSec)
    const prep = P.prepSec
    const totalSec = printSec + minLayerSlowdown + prep

    const hours = Math.max(FDM_MIN_TIME_HOURS, totalSec / 3600)
    return {
        hours,
        numLayers: s.numLayers,
        volumeTime: (solid + firstLayer + sparseInfill + support) / 3600,
        movementTime: (travel + layerOverhead + minLayerSlowdown + prep) / 3600,
        surfaceTime: walls / 3600,
        speedModifier: 1,
        structure: s,
        material,
        breakdownSec: {
            walls,
            solid,
            sparseInfill,
            firstLayer,
            support,
            travel,
            layerOverhead,
            minLayerSlowdown,
            prep,
        },
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
export function formatEstimatedPrintTime(hours: number, locale: string = 'ko'): string {
    const en = locale === 'en'
    const fmtH = (n: number) => (en ? `${n}h` : `${n}시간`)
    const fmtM = (n: number) => (en ? `${n}m` : `${n}분`)
    const fmtD = (s: string) => (en ? `${s} ${s === '1' || s === '1.0' ? 'day' : 'days'}` : `${s}일`)

    const h = Math.max(0, Number(hours) || 0)
    if (h < 1) {
        const mins = Math.max(1, Math.round(h * 60))
        if (mins >= 60) return fmtH(1)
        return fmtM(mins)
    }
    if (h < 24) {
        const whole = Math.floor(h)
        const mins = Math.round((h - whole) * 60)
        if (mins === 0) return fmtH(whole)
        if (mins === 60) return fmtH(whole + 1)
        return `${fmtH(whole)} ${fmtM(mins)}`
    }
    const days = h / 24
    if (days < 10) return fmtD(days.toFixed(1))
    return fmtD(String(Math.round(days)))
}
