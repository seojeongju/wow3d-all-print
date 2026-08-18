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

export const DEFAULT_MODEL_TRANSFORM: ModelTransform = {
    scalePercent: 100,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    snapToBed: true,
}

export const SCALE_PERCENT_MIN = 1
export const SCALE_PERCENT_MAX = 400
export const SCALE_PERCENT_STEP = 1

/** 사진→AI 3D: Meshy STL이 미터급으로 나오면 최장축을 이 길이(mm)에 맞춤 */
export const MESHY_AUTOFIT_TARGET_MM = 150
export const MESHY_AUTOFIT_TRIGGER_MM = 280

export function clampScalePercent(value: number): number {
    if (!Number.isFinite(value)) return 100
    return Math.min(SCALE_PERCENT_MAX, Math.max(SCALE_PERCENT_MIN, Math.round(value)))
}

/**
 * 사진→3D 모델이 베드보다 훨씬 크면 최장축 150mm 기준 스케일 %.
 * 이미 출력 가능한 크기면 null.
 */
export function meshyAutoFitScalePercent(longestMm: number): number | null {
    if (!(longestMm > MESHY_AUTOFIT_TRIGGER_MM)) return null
    return clampScalePercent((MESHY_AUTOFIT_TARGET_MM / longestMm) * 100)
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
    targetMm: number
): number {
    const rotated = getRotatedBaseBox(base, transform)
    const baseMm = rotated[axis]
    if (!(baseMm > 0) || !Number.isFinite(targetMm) || targetMm <= 0) {
        return transform.scalePercent
    }
    return clampScalePercent((targetMm / baseMm) * 100)
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
    const s = clampScalePercent(transform.scalePercent) / 100
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
