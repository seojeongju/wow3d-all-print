/**
 * Bambu P2S 기준 FDM 출력 시간·무게 근사 검증
 * 실행: npx --yes tsx scripts/test-p2s-time.ts
 */
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { analyzeGeometry } from '../lib/geometry'
import { applyTransformToAnalysis, DEFAULT_MODEL_TRANSFORM, type ModelTransform } from '../lib/model-transform'
import { calculateFdmQuote } from '../lib/fdm-quote'
import { resolveP2SMaterialProfile } from '../lib/print-time-estimate'

const fmt = (h: number) => `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`

function quote(geo: THREE.BufferGeometry, opts: { infill?: number; layer?: number; material?: string; transform?: Partial<ModelTransform> } = {}) {
    const a = applyTransformToAnalysis(analyzeGeometry(geo), { ...DEFAULT_MODEL_TRANSFORM, ...opts.transform })
    const q = calculateFdmQuote({
        volumeCm3: a.volume,
        surfaceAreaCm2: a.surfaceArea,
        heightMm: a.boundingBox.z,
        density: 1.24,
        pricePerGramKr: 50,
        infillPercent: opts.infill ?? 15,
        layerHeightMm: opts.layer ?? 0.2,
        supportEnabled: true,
        overhangAreaCm2: a.overhangArea,
        supportVolumeCm3: a.supportVolume,
        lateralAreaCm2: a.lateralArea,
        topAreaCm2: a.topArea,
        bottomAreaCm2: a.bottomArea,
        bedAreaCm2: a.bedArea,
        materialName: opts.material ?? 'PLA',
        hourlyRateKr: 5000,
    })
    return { a, q }
}

// 재질 매칭
assert.equal(resolveP2SMaterialProfile('PLA Basic').maxVolumetricSpeed, 21)
assert.equal(resolveP2SMaterialProfile('PETG HF').key, 'PETG')
assert.equal(resolveP2SMaterialProfile('TPU 95A').key, 'TPU')
assert.equal(resolveP2SMaterialProfile('ABS').minLayerTimeSec, 12)

// 1) 방향별 면적: 10×20×30 상자 (+z 위) → 측면 2(10+20)·30 = 18cm², 윗면·바닥 2cm², 베드 2cm²
{
    const a = analyzeGeometry(new THREE.BoxGeometry(10, 20, 30))
    assert.ok(Math.abs(a.lateralArea! - 18) < 1e-6, `측면 ${a.lateralArea}`)
    assert.ok(Math.abs(a.topArea! - 2) < 1e-6 && Math.abs(a.bottomArea! - 2) < 1e-6)
    assert.ok(Math.abs(a.bedArea! - 2) < 1e-6, `베드 ${a.bedArea}`)
    const side = applyTransformToAnalysis(a, { ...DEFAULT_MODEL_TRANSFORM, rotX: 90 })
    // X 90° → 원본 +Y가 위: 측면 2(10+30)·20 = 16cm², 윗면 3cm²
    assert.ok(Math.abs(side.lateralArea! - 16) < 1e-6 && Math.abs(side.topArea! - 3) < 1e-6)
    console.log('✓ 방향별 측면·윗면·바닥·베드 면적')
}

const cases: [string, THREE.BufferGeometry, Parameters<typeof quote>[1]?][] = [
    ['20mm 큐브', new THREE.BoxGeometry(20, 20, 20)],
    ['50mm 큐브', new THREE.BoxGeometry(50, 50, 50)],
    ['50mm 큐브 인필40%', new THREE.BoxGeometry(50, 50, 50), { infill: 40 }],
    ['50mm 큐브 PETG', new THREE.BoxGeometry(50, 50, 50), { material: 'PETG' }],
    ['50mm 큐브 0.1mm', new THREE.BoxGeometry(50, 50, 50), { layer: 0.1 }],
    ['142×39.3×290 박스(세움)', new THREE.BoxGeometry(142, 39.3, 290)],
    ['142×290×39.3 박스(눕힘)', new THREE.BoxGeometry(142, 290, 39.3)],
    ['원기둥 Ø60×120', new THREE.CylinderGeometry(30, 30, 120, 96).rotateX(Math.PI / 2)],
]

for (const [name, geo, opts] of cases) {
    const { a, q } = quote(geo, opts)
    const b = q.timeDetail.breakdownSec
    const m = (s: number) => `${(s / 60).toFixed(1)}분`
    console.log(
        `${name}: ${fmt(q.timeHours)} · ${q.weightGrams.toFixed(1)}g (${(q.weightGrams / Math.max(q.timeHours, 1e-9)).toFixed(0)}g/h)` +
            ` | 벽 ${m(b.walls)} 솔리드 ${m(b.solid)} 인필 ${m(b.sparseInfill)} 첫층 ${m(b.firstLayer)} 서포트 ${m(b.support)} 레이어 ${m(b.layerOverhead)} 최소층 ${m(b.minLayerSlowdown)}` +
            ` | ${a.volume.toFixed(1)}cm³`
    )
}

// 2) 같은 모델: 인필↑·0.1mm·PETG(최소 레이어 시간↑)는 더 오래, 눕힌 박스는 레이어가 줄어 더 빠름
{
    const cube = () => new THREE.BoxGeometry(50, 50, 50)
    const base = quote(cube()).q.timeHours
    assert.ok(quote(cube(), { infill: 40 }).q.timeHours > base)
    assert.ok(quote(cube(), { layer: 0.1 }).q.timeHours > base * 1.5)
    const upright = quote(new THREE.BoxGeometry(142, 39.3, 290)).q.timeHours
    const flat = quote(new THREE.BoxGeometry(142, 290, 39.3)).q.timeHours
    assert.ok(flat < upright, '눕히면 레이어 수가 줄어 빨라짐')
    console.log('✓ 인필·레이어 높이·배치에 따른 시간 변화 방향')
}

console.log('P2S 시간 테스트 통과')
