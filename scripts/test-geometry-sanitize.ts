/**
 * 메쉬 분석 값 sanitize — 고폴리 표면적 폭주 방지
 * 실행: npx --yes tsx scripts/test-geometry-sanitize.ts
 */
import assert from 'node:assert/strict'
import {
    aabbSurfaceCm2,
    aabbVolumeCm3,
    sanitizeGeometryAnalysis,
    MAX_SURFACE_TO_AABB_RATIO,
} from '../lib/geometry'

const box = { x: 655.25, y: 812.35, z: 500 }
const aabbVol = aabbVolumeCm3(box)
const aabbSurf = aabbSurfaceCm2(box)

const inflated = sanitizeGeometryAnalysis({
    volume: 81833.71,
    surfaceArea: 24_473_147,
    overhangArea: 7_341_944,
    boundingBox: box,
})

assert.ok(inflated.volume <= aabbVol + 1e-6, 'volume <= AABB')
assert.ok(inflated.surfaceArea <= aabbSurf * MAX_SURFACE_TO_AABB_RATIO + 1e-6, 'surface clamped')
assert.ok((inflated.overhangArea ?? 0) <= inflated.surfaceArea * 0.55 + 1e-6, 'overhang clamped')
assert.ok(inflated.surfaceArea < 80_000, `surface still huge: ${inflated.surfaceArea}`)

const ok = sanitizeGeometryAnalysis({
    volume: 8,
    surfaceArea: 24,
    overhangArea: 2,
    boundingBox: { x: 20, y: 10, z: 40 },
})
assert.equal(ok.volume, 8)
assert.equal(ok.surfaceArea, 24)

console.log('test-geometry-sanitize: ok', {
    aabbVol: +aabbVol.toFixed(1),
    aabbSurf: +aabbSurf.toFixed(1),
    clampedSurf: +inflated.surfaceArea.toFixed(1),
    clampedOverhang: +(inflated.overhangArea ?? 0).toFixed(1),
})
