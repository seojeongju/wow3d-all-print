/**
 * Bambu Studio(P2S) 실측과 자동견적 비교
 * 실행: npx --yes tsx scripts/compare-bambu-p2s.ts "<stl 경로>"
 */
import { readFileSync } from 'node:fs'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { analyzeGeometry } from '../lib/geometry'
import { applyTransformToAnalysis, DEFAULT_MODEL_TRANSFORM, getUpAxisKey, type Axis90 } from '../lib/model-transform'
import { calculateFdmQuote } from '../lib/fdm-quote'

const path = process.argv[2]
if (!path) throw new Error('STL 경로를 지정하세요')
const buf = readFileSync(path)
const geo = new STLLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
// DOWN="x,y,z": 이 법선 방향 면을 바닥(-Z)으로 회전 (Bambu '면에 놓기' 재현)
if (process.env.DOWN) {
    const [x, y, z] = process.env.DOWN.split(',').map(Number)
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(x, y, z).normalize(), new THREE.Vector3(0, 0, -1))
    geo.applyQuaternion(q)
    geo.computeBoundingBox()
    geo.translate(-geo.boundingBox!.min.x, -geo.boundingBox!.min.y, -geo.boundingBox!.min.z)
    geo.computeBoundingBox()
}
const base = analyzeGeometry(geo)
console.log(
    `원본: ${base.volume.toFixed(2)}cm³, 표면 ${base.surfaceArea.toFixed(1)}cm², ` +
        `박스 ${base.boundingBox.x.toFixed(1)}×${base.boundingBox.y.toFixed(1)}×${base.boundingBox.z.toFixed(1)}mm`
)

const fmt = (h: number) => `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`
const m = (s: number) => `${(s / 60).toFixed(1)}`
const rots: [Axis90, Axis90][] = [[0, 0], [180, 0], [90, 0], [270, 0], [0, 90], [0, 270]]

for (const [rotX, rotY] of rots) {
    const t = { ...DEFAULT_MODEL_TRANSFORM, rotX, rotY }
    const a = applyTransformToAnalysis(base, t)
    const q = calculateFdmQuote({
        volumeCm3: a.volume,
        surfaceAreaCm2: a.surfaceArea,
        heightMm: a.boundingBox.z,
        density: 1.24,
        pricePerGramKr: 50,
        infillPercent: Number(process.env.INFILL ?? 30),
        layerHeightMm: 0.2,
        supportEnabled: true,
        overhangAreaCm2: a.overhangArea,
        supportVolumeCm3: a.supportVolume,
        lateralAreaCm2: a.lateralArea,
        topAreaCm2: a.topArea,
        bottomAreaCm2: a.bottomArea,
        bedAreaCm2: a.bedArea,
        slowWallAreaCm2: a.slowWallArea,
        materialName: 'PLA Basic',
        hourlyRateKr: 5000,
    })
    const b = q.timeDetail.breakdownSec
    const s = q.timeDetail.structure
    console.log(
        `[${getUpAxisKey(t)}] H ${a.boundingBox.z.toFixed(1)}mm · ${fmt(q.timeHours)} · 모델 ${q.weightGrams.toFixed(1)}g + 서포트 ${q.supportGrams.toFixed(1)}g` +
            `\n    분: 벽 ${m(b.walls)} 솔리드 ${m(b.solid)} 인필 ${m(b.sparseInfill)} 첫층 ${m(b.firstLayer)} 서포트 ${m(b.support)} 이동 ${m(b.travel)} 레이어 ${m(b.layerOverhead)} 최소층 ${m(b.minLayerSlowdown)} 준비 ${m(b.prep)}` +
            `\n    면적 cm²: 측면 ${a.lateralArea?.toFixed(1)} 감속벽 ${a.slowWallArea?.toFixed(1)} 윗면 ${a.topArea?.toFixed(1)} 바닥 ${a.bottomArea?.toFixed(1)} 베드 ${a.bedArea?.toFixed(1)} 오버행 ${a.overhangArea?.toFixed(1)} 서포트부피 ${a.supportVolume?.toFixed(1)}cm³` +
            `\n    압출 cm³: 벽 ${(s.wallVolMm3 / 1000).toFixed(1)} 솔리드 ${(s.solidVolMm3 / 1000).toFixed(1)} 인필 ${(s.sparseVolMm3 / 1000).toFixed(1)} (인필영역 ${(s.sparseRegionMm3 / 1000).toFixed(1)})`
    )
}
