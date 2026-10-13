/**
 * 벽 두께 측정 — 정육면체·얇은 판·속 빈 상자·샘플 파일
 * 실행: npx --yes tsx scripts/test-mesh-thickness.ts
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseModelArrayBuffer } from '../lib/parseModelGeometry'
import { measureThickness, summarizeThickness, type MeshThicknessResult } from '../lib/mesh-thickness'
import { readGeometryArrays } from '../lib/mesh-repair-client'

type V = [number, number, number]

/** 바깥을 향하는 직육면체 삼각형 (min~max) */
function box(min: V, max: V, inward = false): number[] {
    const c = (x: number, y: number, z: number): V => [x ? max[0] : min[0], y ? max[1] : min[1], z ? max[2] : min[2]]
    const quads: V[][] = [
        [c(0, 0, 1), c(1, 0, 1), c(1, 1, 1), c(0, 1, 1)],
        [c(0, 0, 0), c(0, 1, 0), c(1, 1, 0), c(1, 0, 0)],
        [c(0, 1, 0), c(0, 1, 1), c(1, 1, 1), c(1, 1, 0)],
        [c(0, 0, 0), c(1, 0, 0), c(1, 0, 1), c(0, 0, 1)],
        [c(1, 0, 0), c(1, 1, 0), c(1, 1, 1), c(1, 0, 1)],
        [c(0, 0, 0), c(0, 0, 1), c(0, 1, 1), c(0, 1, 0)],
    ]
    const out: number[] = []
    for (const [a, b, cc, d] of quads) {
        const tris = inward ? [[a, cc, b], [a, d, cc]] : [[a, b, cc], [a, cc, d]]
        for (const t of tris) for (const p of t) out.push(...p)
    }
    return out
}

function measure(positions: number[]): MeshThicknessResult {
    const outcome = measureThickness(Float32Array.from(positions), null)
    assert.equal(outcome.status, 'ok')
    if (outcome.status !== 'ok') throw new Error('unreachable')
    return outcome.result
}

function median(a: Float32Array): number {
    const s = Array.from(a).sort((x, y) => x - y)
    return s[Math.floor(s.length / 2)]
}

async function fileResult(path: string) {
    const buf = readFileSync(path)
    const geo = await parseModelArrayBuffer(path, buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer)
    assert.ok(geo)
    const { position, index } = readGeometryArrays(geo)
    const t0 = performance.now()
    const outcome = measureThickness(position, index)
    assert.equal(outcome.status, 'ok')
    if (outcome.status !== 'ok') throw new Error('unreachable')
    return { result: outcome.result, ms: Math.round(performance.now() - t0) }
}

async function main() {
    // 1) 20mm 정육면체 — 어디서 재도 20mm, 1mm 기준 얇은 곳 없음
    const cube = measure(box([0, 0, 0], [20, 20, 20]))
    assert.ok(cube.thickness.length > 5000, `표본 ${cube.thickness.length}`)
    assert.ok(Math.abs(median(cube.thickness) - 20) < 1e-3)
    assert.equal(summarizeThickness(cube, 1, 1).thinCount, 0)

    // 2) 30×30×0.8mm 판 — 넓은 면 대부분 0.8mm → FDM 1mm 기준 얇음, SLA 0.6mm 기준 통과
    const plate = measure(box([0, 0, 0], [30, 30, 0.8]))
    const fdm = summarizeThickness(plate, 1, 1)
    assert.ok(fdm.thinRatio > 0.9, `판 얇은 비율 ${fdm.thinRatio}`)
    assert.ok(fdm.minMm != null && Math.abs(fdm.minMm - 0.8) < 1e-3, `판 최소 ${fdm.minMm}`)
    assert.equal(summarizeThickness(plate, 0.6, 1).thinCount, 0)
    // 배율 200%면 1.6mm → 1mm 기준 통과
    assert.equal(summarizeThickness(plate, 1, 2).thinCount, 0)

    // 3) 벽 0.5mm 속 빈 상자 (안쪽 껍데기는 안쪽을 향함)
    const hollow = measure([...box([0, 0, 0], [20, 20, 20]), ...box([0.5, 0.5, 0.5], [19.5, 19.5, 19.5], true)])
    const hollowSummary = summarizeThickness(hollow, 1, 1)
    assert.ok(hollowSummary.thinRatio > 0.95, `속 빈 상자 얇은 비율 ${hollowSummary.thinRatio}`)
    assert.ok(Math.abs(median(hollow.thickness) - 0.5) < 1e-3)

    // 4) 실제 샘플
    const rotor = await fileResult('public/jet_engine_rotor.stl')
    const testCube = await fileResult('public/test_cube.stl')
    assert.equal(summarizeThickness(testCube.result, 1, 1).thinCount, 0)
    const rotorSummary = summarizeThickness(rotor.result, 1, 1)

    // 5) 성능 — 큰 메쉬 (약 100만 삼각형: 잘게 쪼갠 판 묶음)
    const big: number[] = []
    const n = 290
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) big.push(...box([i * 2, j * 2, 0], [i * 2 + 1.5, j * 2 + 1.5, 3]))
    }
    const t0 = performance.now()
    const bigOutcome = measureThickness(Float32Array.from(big), null)
    const bigMs = Math.round(performance.now() - t0)
    assert.equal(bigOutcome.status, 'ok')

    console.log('test-mesh-thickness: ok', {
        cubeSamples: cube.thickness.length,
        plateThinRatio: +fdm.thinRatio.toFixed(3),
        hollowMedian: +median(hollow.thickness).toFixed(3),
        rotor: {
            ms: rotor.ms,
            samples: rotor.result.thickness.length,
            thinRatio: +rotorSummary.thinRatio.toFixed(3),
            minMm: rotorSummary.minMm == null ? null : +rotorSummary.minMm.toFixed(2),
        },
        big: { triangles: big.length / 9, ms: bigMs },
    })
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
