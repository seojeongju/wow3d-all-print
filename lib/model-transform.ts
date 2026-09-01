import { sanitizeGeometryAnalysis, type GeometryAnalysis } from '@/lib/geometry'

/** 90° 단위 모델 변환 — 자동견적 뷰어용 */
export type Axis90 = 0 | 90 | 180 | 270

export type ModelTransform = {
    /** 100 = 원본 크기 */
    scalePercent: number
    rotX: Axis90
    rotY: Axis90
    rotZ: Axis90
    /** 뷰어에서 모델을 바닥(그리드)에 붙임 */
    snapToBed: boolean
}

export type PrintMethodKey = 'fdm' | 'sla' | 'dlp'

export type BedMaxMm = { x: number; y: number; z: number }

export const DEFAULT_MODEL_TRANSFORM: ModelTransform = {
    scalePercent: 100,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    snapToBed: true,
}

export const SCALE_PERCENT_MIN = 1
export const SCALE_PERCENT_MAX = 400
/** Tripo 등 일부 AI STL은 mm 단위가 매우 작아 400%로는 참고 치수에 도달하지 못함 */
export const AI_PHOTO_SCALE_PERCENT_MAX = 15000
export const SCALE_PERCENT_STEP = 1

/** 사진→AI 3D: 출력 방식 최대 치수(제한축)의 중간(50%)으로 최장축 맞춤 */
export const MESHY_AUTOFIT_BED_FRACTION = 0.5
/** 너무 작은 타깃 방지 */
export const MESHY_AUTOFIT_TARGET_MIN_MM = 20

export const DEFAULT_BED_MAX: Record<PrintMethodKey, BedMaxMm> = {
    fdm: { x: 220, y: 220, z: 250 },
    sla: { x: 145, y: 145, z: 175 },
    dlp: { x: 120, y: 68, z: 200 },
}

/** @deprecated 호환용 — 신규 코드는 meshyAutoFitTargetMm(bed) 사용 */
export const MESHY_AUTOFIT_TARGET_MM = 110
/** @deprecated 항상 맞춤으로 변경됨 */
export const MESHY_AUTOFIT_TRIGGER_MM = 0

export function getScalePercentMax(sourceKind: 'upload' | 'meshy-photo' | null): number {
    return sourceKind === 'meshy-photo' ? AI_PHOTO_SCALE_PERCENT_MAX : SCALE_PERCENT_MAX
}

export function clampScalePercent(value: number, maxPercent = SCALE_PERCENT_MAX): number {
    if (!Number.isFinite(value)) return 100
    const max = maxPercent > 0 ? maxPercent : SCALE_PERCENT_MAX
    return Math.min(max, Math.max(SCALE_PERCENT_MIN, Math.round(value)))
}

/**
 * 사진→AI 3D용 range 슬라이더 상한.
 * autofit 프리셋(예: 11234%)을 max에 넣으면 현재 값(예: 1395%)이 막대 왼쪽에 몰리므로,
 * 현재 스케일 기준으로만 여유(15%)를 두고 50% 단위로 올림한다.
 */
export function aiPhotoSliderMaxPercent(
    scalePercent: number,
    absoluteMax = AI_PHOTO_SCALE_PERCENT_MAX
): number {
    const floor = SCALE_PERCENT_MAX
    const withHeadroom = Math.ceil((Math.max(floor, scalePercent) * 1.15) / 50) * 50
    return Math.min(absoluteMax, Math.max(floor, withHeadroom))
}

/** 해당 방식 베드에서 가장 짧은 축 × 50% = 기본 참고 최장축(mm) */
export function meshyAutoFitTargetMm(bed: BedMaxMm): number {
    const limiting = Math.min(bed.x, bed.y, bed.z)
    if (!(limiting > 0)) return MESHY_AUTOFIT_TARGET_MM
    return Math.max(MESHY_AUTOFIT_TARGET_MIN_MM, Math.round(limiting * MESHY_AUTOFIT_BED_FRACTION))
}

export function resolveBedMaxForMethod(
    method: PrintMethodKey,
    bed?: BedMaxMm | null
): BedMaxMm {
    if (bed && bed.x > 0 && bed.y > 0 && bed.z > 0) return bed
    return DEFAULT_BED_MAX[method]
}

/**
 * 사진→3D: 최장축을 출력 방식 최대 치수(제한축)의 중간 크기로 맞추는 스케일 %.
 * 원본이 작으면 키우고, 크면 줄인다.
 */
export function meshyAutoFitScalePercent(
    longestMm: number,
    bedOrMethod?: BedMaxMm | PrintMethodKey | null,
    maxPercent = AI_PHOTO_SCALE_PERCENT_MAX
): number | null {
    if (!(longestMm > 0) || !Number.isFinite(longestMm)) return null
    let bed: BedMaxMm = DEFAULT_BED_MAX.fdm
    if (typeof bedOrMethod === 'string') {
        bed = DEFAULT_BED_MAX[bedOrMethod]
    } else if (bedOrMethod) {
        bed = resolveBedMaxForMethod('fdm', bedOrMethod)
    }
    const target = meshyAutoFitTargetMm(bed)
    return clampScalePercent((target / longestMm) * 100, maxPercent)
}

/** 스케일 100% 기준, 회전만 반영한 AABB (mm) */
export function getRotatedBaseBox(
    base: GeometryAnalysis,
    transform: Pick<ModelTransform, 'rotX' | 'rotY' | 'rotZ'>
): { x: number; y: number; z: number } {
    return applyAxisRotations(base.boundingBox, transform.rotX, transform.rotY, transform.rotZ)
}

/**
 * 특정 축 목표 치수(mm) → 균일 스케일 %.
 * 균일 스케일이므로 X/Y/Z 중 하나를 바꾸면 전체가 비례 변경된다.
 */
export function scalePercentFromTargetMm(
    base: GeometryAnalysis,
    transform: ModelTransform,
    axis: 'x' | 'y' | 'z',
    targetMm: number,
    maxPercent = SCALE_PERCENT_MAX
): number {
    const rotated = getRotatedBaseBox(base, transform)
    const baseMm = rotated[axis]
    if (!(baseMm > 0) || !Number.isFinite(targetMm) || targetMm <= 0) {
        return transform.scalePercent
    }
    return clampScalePercent((targetMm / baseMm) * 100, maxPercent)
}

export function nextAxis90(current: Axis90, delta = 90): Axis90 {
    const n = ((current + delta) % 360 + 360) % 360
    return n as Axis90
}

/** AABB 치수에 축 90° 회전 1회 적용 (크기만, 부호 무시) */
function rotateSizeOnce(
    size: { x: number; y: number; z: number },
    axis: 'x' | 'y' | 'z'
): { x: number; y: number; z: number } {
    if (axis === 'x') return { x: size.x, y: size.z, z: size.y }
    if (axis === 'y') return { x: size.z, y: size.y, z: size.x }
    return { x: size.y, y: size.x, z: size.z }
}

function applyAxisRotations(
    size: { x: number; y: number; z: number },
    rotX: Axis90,
    rotY: Axis90,
    rotZ: Axis90
): { x: number; y: number; z: number } {
    let out = { ...size }
    const stepsX = (rotX / 90) | 0
    const stepsY = (rotY / 90) | 0
    const stepsZ = (rotZ / 90) | 0
    for (let i = 0; i < stepsX; i++) out = rotateSizeOnce(out, 'x')
    for (let i = 0; i < stepsY; i++) out = rotateSizeOnce(out, 'y')
    for (let i = 0; i < stepsZ; i++) out = rotateSizeOnce(out, 'z')
    return out
}

/**
 * 원본 분석값에 균일 스케일·90° 회전을 반영.
 * - 부피 ∝ s³, 면적·오버행 ∝ s²
 * - 바운딩 박스는 스케일 후 축 순열
 * - 오버행은 회전 후 재계산하지 않음(근사). 높이는 회전된 Z로 견적 시간에 반영
 */
export function applyTransformToAnalysis(
    base: GeometryAnalysis,
    transform: ModelTransform
): GeometryAnalysis {
    const s = clampScalePercent(transform.scalePercent, AI_PHOTO_SCALE_PERCENT_MAX) / 100
    const s2 = s * s
    const s3 = s2 * s

    const scaledBox = {
        x: base.boundingBox.x * s,
        y: base.boundingBox.y * s,
        z: base.boundingBox.z * s,
    }
    const boundingBox = applyAxisRotations(
        scaledBox,
        transform.rotX,
        transform.rotY,
        transform.rotZ
    )

    return sanitizeGeometryAnalysis({
        volume: base.volume * s3,
        surfaceArea: base.surfaceArea * s2,
        overhangArea:
            base.overhangArea !== undefined ? base.overhangArea * s2 : undefined,
        boundingBox,
    })
}

export function degreesToRadians(deg: number): number {
    return (deg * Math.PI) / 180
}
