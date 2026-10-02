import {
    sanitizeGeometryAnalysis,
    UP_AXIS_KEYS,
    type FaceOrientation,
    type GeometryAnalysis,
    type OrientationSupport,
    type UpAxisKey,
} from '@/lib/geometry'
import { fdmSupportExtrudeCm3 } from '@/lib/fdm-quote'
import { estimateFdmPrintTimeP2S, FDM_REF_LAYER_MM } from '@/lib/print-time-estimate'
import { rotatePointEulerXyz, type Vec3Tuple } from '@/lib/stl-bake'

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
    /** 이 바깥 법선(원본 좌표)의 평면을 바닥에 놓음 — 90° 회전보다 먼저 적용 */
    layFlat?: Vec3Tuple | null
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

export const INCH_TO_MM = 25.4
/** 인치 → mm 변환 시 스케일 (100% × 25.4) */
export const INCH_SCALE_PERCENT = Math.round(100 * INCH_TO_MM)
/** 인치 변환 후에도 사용자가 400%까지 추가 조절할 수 있도록 */
export const UPLOAD_INCH_SCALE_PERCENT_MAX = Math.round(SCALE_PERCENT_MAX * INCH_TO_MM)
/** 최장축이 이 값(mm) 이하이면 인치 단위 파일로 의심 */
export const INCH_SUSPECT_MAX_LONGEST_MM = 10

/** 단위 정보가 없어 mm로 가정하는 형식 (STEP·3MF는 파일에 단위가 있음) */
const UNITLESS_MODEL_EXTENSIONS = ['stl', 'obj', 'ply']

export function isUnitlessModelFile(fileName: string | null | undefined): boolean {
    const ext = fileName?.split('.').pop()?.toLowerCase()
    return !!ext && UNITLESS_MODEL_EXTENSIONS.includes(ext)
}

/** 단위 없는 파일인데 최장축이 비정상적으로 작으면 인치로 만든 파일일 가능성이 높음 */
export function isLikelyInchModel(
    fileName: string | null | undefined,
    base: GeometryAnalysis | null | undefined
): boolean {
    if (!base || !isUnitlessModelFile(fileName)) return false
    const longest = Math.max(base.boundingBox.x, base.boundingBox.y, base.boundingBox.z)
    return longest > 0 && longest <= INCH_SUSPECT_MAX_LONGEST_MM
}

/** 업로드 모델은 최장축이 이 길이(mm)에 닿는 배율까지 400%를 넘어 확대 가능 (작은 단위 파일 대응) */
export const UPLOAD_SCALE_MAX_LONGEST_MM = 1000

export function getScalePercentMax(
    sourceKind: 'upload' | 'meshy-photo' | null,
    unitInch = false,
    baseLongestMm?: number | null
): number {
    if (sourceKind === 'meshy-photo') return AI_PHOTO_SCALE_PERCENT_MAX
    const fixed = unitInch ? UPLOAD_INCH_SCALE_PERCENT_MAX : SCALE_PERCENT_MAX
    const longest = Number(baseLongestMm)
    if (!(longest > 0) || !Number.isFinite(longest)) return fixed
    const sizeBased = Math.ceil((UPLOAD_SCALE_MAX_LONGEST_MM / longest) * 100)
    return Math.min(AI_PHOTO_SCALE_PERCENT_MAX, Math.max(fixed, sizeBased))
}

/** 원본 바운딩 박스 최장축(mm) */
export function baseLongestMm(base: GeometryAnalysis | null | undefined): number | null {
    if (!base) return null
    const longest = Math.max(base.boundingBox.x, base.boundingBox.y, base.boundingBox.z)
    return longest > 0 ? longest : null
}

export function clampScalePercent(value: number, maxPercent = SCALE_PERCENT_MAX): number {
    if (!Number.isFinite(value)) return 100
    const max = maxPercent > 0 ? maxPercent : SCALE_PERCENT_MAX
    return Math.min(max, Math.max(SCALE_PERCENT_MIN, Math.round(value)))
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

/** 평면 배치 법선과 일치하는 분석 후보 */
export function findFaceOrientation(
    base: GeometryAnalysis,
    layFlat: Vec3Tuple | null | undefined
): FaceOrientation | null {
    if (!layFlat || !base.faceOrientations) return null
    for (const f of base.faceOrientations) {
        if (f.down[0] * layFlat[0] + f.down[1] * layFlat[1] + f.down[2] * layFlat[2] > 0.999) return f
    }
    return null
}

/** 스케일 100% 기준, 회전만 반영한 AABB (mm) */
export function getRotatedBaseBox(
    base: GeometryAnalysis,
    transform: Pick<ModelTransform, 'rotX' | 'rotY' | 'rotZ' | 'layFlat'>
): { x: number; y: number; z: number } {
    const face = findFaceOrientation(base, transform.layFlat)
    return applyAxisRotations(face?.box ?? base.boundingBox, transform.rotX, transform.rotY, transform.rotZ)
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

const UP_AXIS_VECTORS: Record<UpAxisKey, [number, number, number]> = {
    '+x': [1, 0, 0],
    '-x': [-1, 0, 0],
    '+y': [0, 1, 0],
    '-y': [0, -1, 0],
    '+z': [0, 0, 1],
    '-z': [0, 0, -1],
}

/** 회전(X→Y→Z 순) 후 출력 베드 위쪽(+Z)을 향하는 원본 축 */
export function getUpAxisKey(transform: Pick<ModelTransform, 'rotX' | 'rotY' | 'rotZ'>): UpAxisKey {
    for (const key of UP_AXIS_KEYS) {
        const [x, y, z] = UP_AXIS_VECTORS[key]
        const p = rotatePointEulerXyz(x, y, z, transform.rotX, transform.rotY, transform.rotZ)
        if (p[2] > 0.5) return key
    }
    return '+z'
}

/**
 * 원본 분석값에 균일 스케일·90° 회전을 반영.
 * - 부피 ∝ s³, 면적·오버행 ∝ s², 서포트 부피 ∝ s³, 서포트 기둥 높이 ∝ s
 * - 바운딩 박스는 스케일 후 축 순열
 * - 오버행·서포트는 슬라이서처럼 회전 후 바닥(최저점)에 놓인 상태 기준
 */
export function applyTransformToAnalysis(
    base: GeometryAnalysis,
    transform: ModelTransform
): GeometryAnalysis {
    const s = clampScalePercent(transform.scalePercent, AI_PHOTO_SCALE_PERCENT_MAX) / 100
    const s2 = s * s
    const s3 = s2 * s

    // 평면 배치는 바닥 고정 상태에서 Z 회전만 쓰므로 그 면의 지표를 그대로 사용
    const face = findFaceOrientation(base, transform.layFlat)
    const box = face?.box ?? base.boundingBox
    const scaledBox = { x: box.x * s, y: box.y * s, z: box.z * s }
    const boundingBox = applyAxisRotations(
        scaledBox,
        transform.rotX,
        transform.rotY,
        transform.rotZ
    )

    const placed: OrientationSupport | undefined = face ?? base.orientations?.[getUpAxisKey(transform)]
    const src = placed ?? base
    const area = (v: number | undefined) => (v !== undefined ? v * s2 : undefined)
    const supportVolume = src.supportVolume

    return sanitizeGeometryAnalysis({
        volume: base.volume * s3,
        surfaceArea: base.surfaceArea * s2,
        overhangArea: area(src.overhangArea),
        ...(supportVolume !== undefined ? { supportVolume: supportVolume * s3 } : {}),
        ...(src.supportColumnMm !== undefined ? { supportColumnMm: src.supportColumnMm * s } : {}),
        ...(src.lateralArea !== undefined ? { lateralArea: area(src.lateralArea) } : {}),
        ...(src.topArea !== undefined ? { topArea: area(src.topArea) } : {}),
        ...(src.bottomArea !== undefined ? { bottomArea: area(src.bottomArea) } : {}),
        ...(src.bedArea !== undefined ? { bedArea: area(src.bedArea) } : {}),
        ...(src.slowWallArea !== undefined ? { slowWallArea: area(src.slowWallArea) } : {}),
        ...(src.curvedWallArea !== undefined ? { curvedWallArea: area(src.curvedWallArea) } : {}),
        ...(src.contourLoops !== undefined ? { contourLoops: src.contourLoops * s } : {}),
        ...(base.partCount != null ? { partCount: base.partCount } : {}),
        ...(src.partHeightSum !== undefined ? { partHeightSum: src.partHeightSum * s } : {}),
        ...(base.partSpacing !== undefined ? { partSpacing: base.partSpacing * s } : {}),
        boundingBox,
    })
}

const AXIS90_VALUES: readonly Axis90[] = [0, 90, 180, 270]

/** 축 정렬 자세와 거의 같은 시간이면 평면 배치보다 축 정렬을 택함 (시간) */
const FACE_PLACEMENT_TIE_HOURS = 0.02

export type AutoOrientResult = {
    transform: ModelTransform
    /** 축 정렬 배치에서 위를 향한 원본 축 (평면 배치면 null) */
    upAxis: UpAxisKey | null
    /** 배치에 따라 달라지는 시간(서포트+레이어) 추정, 시간 단위 */
    scoreHours: number
    fitsBed: boolean
}

/** 배치 비교용 P2S 출력 시간 (PLA·인필 15% 기준) */
function placementScoreHours(analysis: GeometryAnalysis, layerHeightMm: number): number {
    // 최소 0.5시간 바닥값 없이 비교해야 작은 모델도 자세 차이가 드러남
    const { breakdownSec } = estimateFdmPrintTimeP2S({
        volumeCm3: analysis.volume,
        surfaceAreaCm2: analysis.surfaceArea,
        heightMm: analysis.boundingBox.z,
        lateralAreaCm2: analysis.lateralArea,
        topAreaCm2: analysis.topArea,
        bottomAreaCm2: analysis.bottomArea,
        bedAreaCm2: analysis.bedArea,
        slowWallAreaCm2: analysis.slowWallArea,
        curvedWallAreaCm2: analysis.curvedWallArea,
        contourLoopsMm: analysis.contourLoops,
        partCount: analysis.partCount,
        partHeightSumMm: analysis.partHeightSum,
        partSpacingMm: analysis.partSpacing,
        layerHeightMm,
        infillPercent: 15,
        supportExtrudeCm3: fdmSupportExtrudeCm3(analysis.overhangArea, analysis.supportVolume, analysis.supportColumnMm),
        materialName: 'PLA',
    })
    return Object.values(breakdownSec).reduce((a, b) => a + b, 0) / 3600
}

function fitsBedBox(box: { x: number; y: number; z: number }, bed: BedMaxMm | null | undefined): boolean {
    if (!bed) return true
    return box.x <= bed.x && box.y <= bed.y && box.z <= bed.z
}

/**
 * 슬라이서 자동 배치와 같은 목적: 6개 축 방향과 큰 평면 바닥 배치 중 서포트·출력 시간이 가장 적은 자세.
 * 같은 바닥이면 베드에 들어가는 Z 회전, 그다음 원본 회전에 가까운 것을 우선.
 */
export function findAutoOrientTransform(
    base: GeometryAnalysis,
    current: ModelTransform,
    opts?: { bed?: BedMaxMm | null; layerHeightMm?: number }
): AutoOrientResult | null {
    if (!base.orientations) return null
    const layerHeightMm = opts?.layerHeightMm ?? FDM_REF_LAYER_MM
    let best: AutoOrientResult | null = null
    let bestRank = Infinity

    const consider = (transform: ModelTransform, penaltyHours: number) => {
        const analysis = applyTransformToAnalysis(base, transform)
        const scoreHours = placementScoreHours(analysis, layerHeightMm)
        const fitsBed = fitsBedBox(analysis.boundingBox, opts?.bed)
        const changed = Number(transform.rotX !== 0) + Number(transform.rotY !== 0) + Number(transform.rotZ !== 0)
        // 베드 초과는 큰 패널티, 동점이면 회전 변화가 적은 쪽
        const rank = scoreHours + penaltyHours + (fitsBed ? 0 : 1e6) + changed * 1e-6
        if (rank < bestRank) {
            bestRank = rank
            best = {
                transform,
                upAxis: transform.layFlat ? null : getUpAxisKey(transform),
                scoreHours,
                fitsBed,
            }
        }
    }

    for (const rotX of AXIS90_VALUES) {
        for (const rotY of AXIS90_VALUES) {
            for (const rotZ of [0, 90] as const) {
                consider({ ...current, rotX, rotY, rotZ, layFlat: null }, 0)
            }
        }
    }
    for (const face of base.faceOrientations ?? []) {
        for (const rotZ of [0, 90] as const) {
            consider({ ...current, rotX: 0, rotY: 0, rotZ, layFlat: face.down }, FACE_PLACEMENT_TIE_HOURS)
        }
    }
    return best
}

export function degreesToRadians(deg: number): number {
    return (deg * Math.PI) / 180
}
