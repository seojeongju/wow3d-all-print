/**
 * model-transform smoke: 균일 스케일·90° 축 회전 AABB 순열
 */
import {
    applyTransformToAnalysis,
    DEFAULT_BED_MAX,
    DEFAULT_MODEL_TRANSFORM,
    meshyAutoFitScalePercent,
    meshyAutoFitTargetMm,
    nextAxis90,
    resolveScaleAxesPercent,
    scalePercentFromTargetMm,
    withAxisScalePercent,
    withProportionalAxisScale,
    withUniformScalePercent,
    type ModelTransform,
} from '../lib/model-transform'
import type { GeometryAnalysis } from '../lib/geometry'

function assert(cond: unknown, msg: string): asserts cond {
    if (!cond) throw new Error(msg)
}

const base: GeometryAnalysis = {
    volume: 8,
    surfaceArea: 24,
    overhangArea: 2,
    boundingBox: { x: 20, y: 10, z: 40 },
}

const t200: ModelTransform = { ...DEFAULT_MODEL_TRANSFORM, scalePercent: 200 }
const scaled = applyTransformToAnalysis(base, t200)
assert(Math.abs(scaled.volume - 64) < 1e-9, `volume 200% expected 64 got ${scaled.volume}`)
assert(Math.abs(scaled.surfaceArea - 96) < 1e-9, `surface 200% expected 96 got ${scaled.surfaceArea}`)
assert(Math.abs(scaled.boundingBox.x - 40) < 1e-9, 'bbox x scale')
assert(Math.abs(scaled.boundingBox.z - 80) < 1e-9, 'bbox z scale')

const rotX90: ModelTransform = { ...DEFAULT_MODEL_TRANSFORM, rotX: 90 }
const rx = applyTransformToAnalysis(base, rotX90)
assert(Math.abs(rx.volume - 8) < 1e-9, 'volume unchanged by rot')
assert(Math.abs(rx.boundingBox.x - 20) < 1e-9, 'rotX x')
assert(Math.abs(rx.boundingBox.y - 40) < 1e-9, 'rotX y←z')
assert(Math.abs(rx.boundingBox.z - 10) < 1e-9, 'rotX z←y')

assert(nextAxis90(270, 90) === 0, 'nextAxis90 wrap')
assert(nextAxis90(0, -90) === 270, 'nextAxis90 negative')

assert(meshyAutoFitTargetMm(DEFAULT_BED_MAX.fdm) === 110, 'FDM mid target 110')
assert(meshyAutoFitTargetMm(DEFAULT_BED_MAX.sla) === 73, 'SLA mid target ~72.5→73')
assert(meshyAutoFitTargetMm(DEFAULT_BED_MAX.dlp) === 34, 'DLP mid target 34')

const fitSmall = meshyAutoFitScalePercent(150, 'fdm')
assert(fitSmall != null && fitSmall >= 70 && fitSmall <= 75, `150mm FDM → ~73% got ${fitSmall}`)

const fit812 = meshyAutoFitScalePercent(812.35, 'fdm')
assert(fit812 != null && fit812 >= 12 && fit812 <= 15, `812mm FDM → ~14% got ${fit812}`)

const fitSla = meshyAutoFitScalePercent(812.35, 'sla')
assert(fitSla != null && fitSla < (fit812 as number), 'SLA mid smaller than FDM')

const fitTiny = meshyAutoFitScalePercent(0.8, 'fdm')
assert(fitTiny != null && fitTiny > 400 && fitTiny <= 15000, `tiny model autofit expected >400 got ${fitTiny}`)

// 축별(비균일) 스케일: Z만 50% → bbox.z 절반, 부피 ∝ sx·sy·sz
const baseNu: GeometryAnalysis = {
    volume: 0.8,
    surfaceArea: 12,
    boundingBox: { x: 20, y: 10, z: 4 },
}
const nu = applyTransformToAnalysis(
    baseNu,
    withAxisScalePercent(withUniformScalePercent(DEFAULT_MODEL_TRANSFORM, 100), 'z', 50)
)
assert(Math.abs(nu.boundingBox.x - 20) < 1e-9, `nu bbox x expected 20 got ${nu.boundingBox.x}`)
assert(Math.abs(nu.boundingBox.y - 10) < 1e-9, `nu bbox y expected 10 got ${nu.boundingBox.y}`)
assert(Math.abs(nu.boundingBox.z - 2) < 1e-9, `nu bbox z expected 2 got ${nu.boundingBox.z}`)
assert(Math.abs(nu.volume - 0.4) < 1e-9, `nu volume expected 0.4 got ${nu.volume}`)
const axes = resolveScaleAxesPercent(
    withAxisScalePercent(withUniformScalePercent(DEFAULT_MODEL_TRANSFORM, 100), 'x', 200)
)
assert(axes.x === 200 && axes.y === 100 && axes.z === 100, `axes after x200 got ${JSON.stringify(axes)}`)
const pctZ = scalePercentFromTargetMm(baseNu, DEFAULT_MODEL_TRANSFORM, 'z', 8)
assert(pctZ === 200, `target 8mm on z=4 → 200% got ${pctZ}`)

// 비율 유지 스케일: Z만 50%인 상태에서 Z→100%면 세 축 모두 ×2
const stretched = withAxisScalePercent(withUniformScalePercent(DEFAULT_MODEL_TRANSFORM, 100), 'z', 50)
const kept = withProportionalAxisScale(stretched, 'z', 100)
const keptAxes = resolveScaleAxesPercent(kept)
assert(keptAxes.x === 200 && keptAxes.y === 200 && keptAxes.z === 100, `proportional keep got ${JSON.stringify(keptAxes)}`)
const keptBox = applyTransformToAnalysis(baseNu, kept)
assert(Math.abs(keptBox.boundingBox.x - 40) < 1e-9, `proportional bbox x got ${keptBox.boundingBox.x}`)
assert(Math.abs(keptBox.boundingBox.z - 4) < 1e-9, `proportional bbox z got ${keptBox.boundingBox.z}`)

console.log('test-model-transform: ok')
