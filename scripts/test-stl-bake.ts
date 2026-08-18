/**
 * STL 견적 치수 베이크
 * 실행: npx --yes tsx scripts/test-stl-bake.ts
 */
import assert from 'node:assert/strict'
import {
    bakeStlToTargetMm,
    findBestBakeRotation,
    isBinaryStl,
    quoteSizedFileName,
    rotatePointEulerXyz,
} from '../lib/stl-bake'

function makeBinaryStl(vertices: number[][]): ArrayBuffer {
    const triCount = Math.floor(vertices.length / 3)
    const buf = new ArrayBuffer(84 + triCount * 50)
    const view = new DataView(buf)
    view.setUint32(80, triCount, true)
    for (let t = 0; t < triCount; t++) {
        const base = 84 + t * 50
        for (let v = 0; v < 3; v++) {
            const p = vertices[t * 3 + v]
            const o = base + 12 + v * 12
            view.setFloat32(o, p[0], true)
            view.setFloat32(o + 4, p[1], true)
            view.setFloat32(o + 8, p[2], true)
        }
    }
    return buf
}

function bboxOf(buf: ArrayBuffer): { x: number; y: number; z: number } {
    const view = new DataView(buf)
    const n = view.getUint32(80, true)
    let minX = Infinity, minY = Infinity, minZ = Infinity
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
    for (let t = 0; t < n; t++) {
        const base = 84 + t * 50
        for (let v = 0; v < 3; v++) {
            const o = base + 12 + v * 12
            const x = view.getFloat32(o, true)
            const y = view.getFloat32(o + 4, true)
            const z = view.getFloat32(o + 8, true)
            minX = Math.min(minX, x); maxX = Math.max(maxX, x)
            minY = Math.min(minY, y); maxY = Math.max(maxY, y)
            minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z)
        }
    }
    return { x: maxX - minX, y: maxY - minY, z: maxZ - minZ }
}

const rx = rotatePointEulerXyz(1, 2, 3, 90, 0, 0)
assert.deepEqual(rx, [1, -3, 2])

const src = makeBinaryStl([
    [0, 0, 0],
    [100, 0, 0],
    [0, 40, 80],
])
assert.equal(isBinaryStl(src), true)

const baked = bakeStlToTargetMm(src, { x: 50, y: 20, z: 40 })
const box = bboxOf(baked)
assert.ok(Math.abs(box.x - 50) < 0.05, `x ${box.x}`)
assert.ok(Math.abs(box.y - 20) < 0.05, `y ${box.y}`)
assert.ok(Math.abs(box.z - 40) < 0.05, `z ${box.z}`)

const huge = makeBinaryStl([
    [0, 0, 0],
    [655, 0, 0],
    [0, 812, 500],
])
const small = bakeStlToTargetMm(huge, { x: 79.1, y: 76.8, z: 65.8 })
const sb = bboxOf(small)
assert.ok(Math.abs(sb.x - 79.1) < 0.2, `fitted x ${sb.x}`)
assert.ok(Math.abs(sb.y - 76.8) < 0.2, `fitted y ${sb.y}`)
assert.ok(Math.abs(sb.z - 65.8) < 0.2, `fitted z ${sb.z}`)

const fit = findBestBakeRotation({ x: 655, y: 812, z: 500 }, { x: 79.1, y: 76.8, z: 65.8 })
assert.ok(fit.scale < 0.2 && fit.scale > 0.05, `scale ${fit.scale}`)

assert.equal(quoteSizedFileName('meshy-5.stl', { x: 79.1, y: 76.8, z: 65.8 }), 'meshy-5_79x77x66mm.stl')

console.log('test-stl-bake: ok', { box, sb, scale: +fit.scale.toFixed(4) })
