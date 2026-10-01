/**
 * 특정 법선 근처 평면의 면적·위치 진단
 * 실행: N="x,y,z" npx --yes tsx scripts/diag-face.ts "<stl 경로>"
 */
import { readFileSync } from 'node:fs'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'

const path = process.argv[2]
if (!path) throw new Error('STL 경로를 지정하세요')
const buf = readFileSync(path)
const geo = new STLLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
const pos = geo.attributes.position
const raw = (process.env.N ?? '-0.310,0.423,0.852').split(',').map(Number)
const len = Math.hypot(raw[0], raw[1], raw[2])
const n = raw.map((v) => v / len)

let maxD = -Infinity
for (let i = 0; i < pos.count; i++) {
    maxD = Math.max(maxD, pos.getX(i) * n[0] + pos.getY(i) * n[1] + pos.getZ(i) * n[2])
}

const bands = [0.9999, 0.999, 0.995, 0.99, 0.98]
const stats = bands.map(() => ({ area: 0, onPlane: 0, nx: 0, ny: 0, nz: 0 }))
let total = 0
for (let t = 0; t < pos.count / 3; t++) {
    const p = [0, 1, 2].map((j) => [pos.getX(t * 3 + j), pos.getY(t * 3 + j), pos.getZ(t * 3 + j)])
    const u = p[1].map((v, k) => v - p[0][k])
    const w = p[2].map((v, k) => v - p[0][k])
    const c = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]
    const l = Math.hypot(c[0], c[1], c[2])
    if (!(l > 0)) continue
    const area = l / 2
    total += area
    const dot = (c[0] * n[0] + c[1] * n[1] + c[2] * n[2]) / l
    const g = [0, 1, 2].map((k) => (p[0][k] + p[1][k] + p[2][k]) / 3)
    const d = g[0] * n[0] + g[1] * n[1] + g[2] * n[2]
    bands.forEach((b, i) => {
        if (dot < b) return
        const s = stats[i]
        s.area += area
        s.nx += (c[0] / l) * area
        s.ny += (c[1] / l) * area
        s.nz += (c[2] / l) * area
        if (maxD - d < 0.5) s.onPlane += area
    })
}
console.log(`표면 ${(total / 100).toFixed(1)}cm², 법선 방향 최대 ${maxD.toFixed(2)}mm`)
bands.forEach((b, i) => {
    const s = stats[i]
    const l = Math.hypot(s.nx, s.ny, s.nz) || 1
    console.log(
        `cos≥${b}: 면적 ${(s.area / 100).toFixed(2)}cm² (끝 평면 위 ${(s.onPlane / 100).toFixed(2)}cm²), ` +
            `평균 법선 (${(s.nx / l).toFixed(3)}, ${(s.ny / l).toFixed(3)}, ${(s.nz / l).toFixed(3)})`
    )
})
