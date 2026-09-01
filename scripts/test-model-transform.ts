/**
 * model-transform smoke: 균일 스케일·90° 축 회전 AABB 순열
 */
import {
    aiPhotoSliderMaxPercent,
    applyTransformToAnalysis,
    DEFAULT_BED_MAX,
    DEFAULT_MODEL_TRANSFORM,
    meshyAutoFitScalePercent,
    meshyAutoFitTargetMm,
    nextAxis90,
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

assert(aiPhotoSliderMaxPercent(100) === 500, 'slider max at 100% with headroom')
assert(aiPhotoSliderMaxPercent(1395) === 1650, '1395% → slider max 1650 not autofit 11234')
assert(
    1395 / aiPhotoSliderMaxPercent(1395) > 0.8,
    '1395% thumb should sit near right side of bar'
)
assert(
    aiPhotoSliderMaxPercent(11234) >= 11234,
    'autofit preset value still reachable on slider'
)

console.log('test-model-transform: ok')
