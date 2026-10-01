/**
 * P2S 보정용 형상 지표: 경사 가중 솔리드 면적, 오버행 감속 외벽 시간
 * 실행: npx --yes tsx scripts/calib-p2s.ts "<stl>"  (DOWN="x,y,z"로 해당 법선 면을 바닥에)
 */
import { readFileSync } from 'node:fs'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'

const buf = readFileSync(process.argv[2])
const geo = new STLLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
if (process.env.DOWN) {
    const [x, y, z] = process.env.DOWN.split(',').map(Number)
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(x, y, z).normalize(), new THREE.Vector3(0, 0, -1)))
}
if (process.env.FLIP) geo.rotateX(Math.PI)
const pos = geo.getAttribute('position').array as Float32Array
const h = 0.2
const band = Number(process.env.BAND ?? 0.87)
let lateral = 0, top = 0, bottom = 0, topEff = 0, bottomEff = 0, outerSec = 0, outerFastSec = 0
const bins = [0, 0, 0, 0, 0, 0]
for (let o = 0; o < pos.length; o += 9) {
    const ux = pos[o + 3] - pos[o], uy = pos[o + 4] - pos[o + 1], uz = pos[o + 5] - pos[o + 2]
    const vx = pos[o + 6] - pos[o], vy = pos[o + 7] - pos[o + 1], vz = pos[o + 8] - pos[o + 2]
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx
    const len = Math.hypot(cx, cy, cz)
    if (!(len > 0)) continue
    const A = len / 2
    const nz = cz / len
    const s = Math.sqrt(Math.max(0, 1 - nz * nz))
    const lat = A * s
    lateral += lat
    const proj = A * Math.abs(nz)
    // 층당 노출 폭 = h·cotφ (φ: 수평 대비 경사), 벽 밴드가 덮는 만큼 솔리드 제외
    const eff = (n: number) => (s < 1e-6 ? 1 : Math.max(0, 1 - band / ((n * h * Math.abs(nz)) / s)))
    if (nz > 0) {
        top += proj
        topEff += proj * eff(5)
    } else {
        bottom += proj
        bottomEff += proj * eff(3)
    }
    const path = lat / h
    outerFastSec += path / 200
    let v = 200
    let bin = 0
    if (nz < 0 && s > 1e-6) {
        const pct = (h * (-nz / s)) / 0.42
        bin = pct < 0.1 ? 0 : pct < 0.25 ? 1 : pct < 0.5 ? 2 : pct < 0.75 ? 3 : pct < 1 ? 4 : 5
        v = [200, 50, 30, 10, 10, 10][bin]
    }
    bins[bin] += path / v
    outerSec += path / v
}
const c = (mm2: number) => (mm2 / 100).toFixed(1)
console.log(
    `[밴드 ${band}] 측면 ${c(lateral)} 윗면 ${c(top)} (유효 ${c(topEff)}) 바닥 ${c(bottom)} (유효 ${c(bottomEff)}) cm²` +
        ` → 솔리드 ${(((topEff * 5 + bottomEff * 3) * h) / 1000).toFixed(2)}cm³`
)
console.log(`외벽(가속 무시): 감속 없음 ${(outerFastSec / 60).toFixed(1)}분, 오버행 감속 ${(outerSec / 60).toFixed(1)}분`)
console.log(`  구간별 분: ${bins.map((b, i) => `${['<10%', '10-25', '25-50', '50-75', '75-100', '>100'][i]} ${(b / 60).toFixed(1)}`).join(' / ')}`)
