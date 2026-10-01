/**
 * STL 평면 진단: 면적 가중 법선 군집(평평한 면 방향)과 그 면을 바닥에 둘 때의 높이
 * 실행: npx --yes tsx scripts/diag-stl.ts "<stl 경로>"
 */
import { readFileSync } from 'node:fs'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'

const buf = readFileSync(process.argv[2])
const geo = new STLLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
const pos = geo.getAttribute('position').array as Float32Array
const nTri = pos.length / 9

const bins = new Map<string, { area: number; n: number[] }>()
let total = 0
for (let t = 0; t < nTri; t++) {
    const o = t * 9
    const ux = pos[o + 3] - pos[o], uy = pos[o + 4] - pos[o + 1], uz = pos[o + 5] - pos[o + 2]
    const vx = pos[o + 6] - pos[o], vy = pos[o + 7] - pos[o + 1], vz = pos[o + 8] - pos[o + 2]
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx
    const len = Math.hypot(cx, cy, cz)
    if (!(len > 0)) continue
    const area = len / 2
    total += area
    const n = [cx / len, cy / len, cz / len]
    const k = n.map((v) => Math.round(v * 50)).join(',')
    const b = bins.get(k) ?? { area: 0, n: [0, 0, 0] }
    b.area += area
    b.n = b.n.map((v, i) => v + n[i] * area)
    bins.set(k, b)
}
const top = [...bins.values()].sort((a, b) => b.area - a.area).slice(0, 8)
for (const b of top) {
    const l = Math.hypot(...b.n)
    const n = b.n.map((v) => v / l)
    let min = Infinity, max = -Infinity
    for (let i = 0; i < pos.length; i += 3) {
        const d = pos[i] * n[0] + pos[i + 1] * n[1] + pos[i + 2] * n[2]
        min = Math.min(min, d)
        max = Math.max(max, d)
    }
    console.log(
        `법선 (${n.map((v) => v.toFixed(3)).join(', ')}) 면적 ${(b.area / 100).toFixed(1)}cm² (${((b.area / total) * 100).toFixed(1)}%) → 이 면 바닥 시 높이 ${(max - min).toFixed(2)}mm`
    )
}
