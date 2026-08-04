/**
 * model-transform smoke: 균일 스케일·90° 축 회전 AABB 순열
 */
import {
    applyTransformToAnalysis,
    DEFAULT_MODEL_TRANSFORM,
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

console.log('test-model-transform: ok')
