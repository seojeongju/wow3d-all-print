/**
 * STL 자동 수리 — 구멍·틈·중복 면·내부 칸막이·부스러기·뒤집힌 면 보정과 정상 모델 보존 확인
 * 실행: npx --yes tsx scripts/test-mesh-repair.ts
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { parseModelArrayBuffer } from '../lib/parseModelGeometry'
import { analyzeMeshGeometry } from '../lib/geometry'
import { inspectMesh, type MeshInspection } from '../lib/mesh-inspect'
import { encodeBinaryStl, meshRepairChanged, repairMesh, type MeshRepairOptions, type MeshRepairReport } from '../lib/mesh-repair'

type Tri = [number[], number[], number[]]

/** 바깥을 향하는 직육면체 삼각형 12개 */
function boxTris(min: number[], max: number[]): Tri[] {
    const c = (x: number, y: number, z: number) => [x ? max[0] : min[0], y ? max[1] : min[1], z ? max[2] : min[2]]
    const quads: number[][][] = [
        [c(0, 0, 1), c(1, 0, 1), c(1, 1, 1), c(0, 1, 1)],
        [c(0, 0, 0), c(0, 1, 0), c(1, 1, 0), c(1, 0, 0)],
        [c(0, 1, 0), c(0, 1, 1), c(1, 1, 1), c(1, 1, 0)],
        [c(0, 0, 0), c(1, 0, 0), c(1, 0, 1), c(0, 0, 1)],
        [c(1, 0, 0), c(1, 1, 0), c(1, 1, 1), c(1, 0, 1)],
        [c(0, 0, 0), c(0, 0, 1), c(0, 1, 1), c(0, 1, 0)],
    ]
    return quads.flatMap(([a, b, cc, d]) => [[a, b, cc], [a, cc, d]] as Tri[])
}
const cube = (min: number, max: number) => boxTris([min, min, min], [max, max, max])

/** 반지름 r, 높이 h, 분할 n인 원기둥 (윗면 뚜껑 포함 여부 선택) */
function cylinderTris(r: number, h: number, n: number, topCap = true): Tri[] {
    const tris: Tri[] = []
    const p = (i: number, z: number) => [r * Math.cos((2 * Math.PI * i) / n), r * Math.sin((2 * Math.PI * i) / n), z]
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n
        tris.push([p(i, 0), p(j, 0), p(j, h)], [p(i, 0), p(j, h), p(i, h)])
        tris.push([[0, 0, 0], p(j, 0), p(i, 0)])
        if (topCap) tris.push([[0, 0, h], p(i, h), p(j, h)])
    }
    return tris
}

const flat = (tris: Tri[]) => Float32Array.from(tris.flatMap(([a, b, c]) => [...a, ...b, ...c]))

function geometryOf(positions: Float32Array): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
}

async function inspect(positions: Float32Array): Promise<MeshInspection> {
    const outcome = await inspectMesh(geometryOf(positions))
    assert.ok(outcome?.status === 'ok')
    return outcome.result
}

const volumeOf = (positions: Float32Array) => analyzeMeshGeometry(geometryOf(positions)).volume
const closedCylinderVolume = (r: number, h: number, n: number) => volumeOf(flat(cylinderTris(r, h, n, true)))

async function repair(name: string, positions: Float32Array, opts: MeshRepairOptions = {}) {
    const out = repairMesh(positions, null, opts)
    assert.equal(out.status, 'ok', `${name}: 수리 실패`)
    if (out.status !== 'ok') throw new Error('unreachable')
    const after = await inspect(out.positions)
    return { report: out.report, after, positions: out.positions, volume: volumeOf(out.positions) }
}

function assertClosed(name: string, after: MeshInspection) {
    assert.equal(after.openEdges, 0, `${name}: 열린 모서리 ${after.openEdges}`)
    assert.equal(after.nonManifoldEdges, 0, `${name}: 비다양체 ${after.nonManifoldEdges}`)
    assert.equal(after.flippedEdges, 0, `${name}: 뒤집힌 모서리 ${after.flippedEdges}`)
    assert.equal(after.invertedShells, 0, `${name}: 뒤집힌 덩어리 ${after.invertedShells}`)
}

const near = (a: number, b: number, tol = 1e-3) => Math.abs(a - b) < tol

async function main() {
    const reports: Record<string, MeshRepairReport> = {}

    // 1) 정상 정육면체 → 아무것도 바꾸지 않음
    const ok = await repair('정상', flat(cube(0, 10)))
    assert.equal(meshRepairChanged(ok.report), false)
    assert.equal(ok.report.trianglesAfter, 12)
    assertClosed('정상', ok.after)

    // 2) 삼각형 1개가 빠진 정육면체 → 구멍 1개 메움, 부피 1cm³
    const oneHole = await repair('삼각형 구멍', flat(cube(0, 10).slice(1)))
    assert.equal(oneHole.report.holesFilled, 1)
    assertClosed('삼각형 구멍', oneHole.after)
    assert.ok(near(oneHole.volume, 1), `삼각형 구멍 부피 ${oneHole.volume}`)
    reports.oneHole = oneHole.report

    // 3) 뚜껑이 없는 원기둥(64각형 구멍) → 귀 자르기로 메움
    const r = 10, h = 20, n = 64
    const openCyl = await repair('뚜껑 없는 원기둥', flat(cylinderTris(r, h, n, false)))
    const closedCylVolume = volumeOf(flat(cylinderTris(r, h, n, true)))
    assert.equal(openCyl.report.holesFilled, 1)
    assert.equal(openCyl.report.holeTrianglesAdded, n - 2)
    assertClosed('뚜껑 없는 원기둥', openCyl.after)
    assert.ok(near(openCyl.volume, closedCylVolume), `원기둥 부피 ${openCyl.volume} / ${closedCylVolume}`)

    // 3-1) 구멍 경계에 뒤집힌 면이 섞여 있어도 메움 (방향 정렬 전 입력)
    const mixedOpen = cylinderTris(r, h, n, false).map((tri, i) => (i >= 30 && i < 42 ? ([tri[0], tri[2], tri[1]] as Tri) : tri))
    const mixedFill = await repair('뒤집힌 경계 구멍', flat(mixedOpen))
    assert.equal(mixedFill.report.holesFilled, 1)
    assertClosed('뒤집힌 경계 구멍', mixedFill.after)
    assert.ok(near(mixedFill.volume, closedCylVolume), `뒤집힌 경계 부피 ${mixedFill.volume}`)

    // 4) 미세한 틈 — 윗면 4개 정점이 0.0005mm 어긋남 → 이어붙임
    const cracked = cube(0, 10).map((tri, i) =>
        (i < 2 ? tri.map((p) => [p[0] + 0.0005, p[1], p[2]]) : tri) as Tri
    )
    const crack = await repair('틈', flat(cracked))
    assert.ok(crack.report.stitchedVertices > 0, '틈 이어붙이기 없음')
    assert.equal(crack.report.holesFilled, 0, '틈을 구멍으로 메움')
    assertClosed('틈', crack.after)
    reports.crack = crack.report

    // 5) 중복 삼각형 → 제거
    const dup = await repair('중복 면', flat([...cube(0, 10), ...cube(0, 10).slice(0, 4)]))
    assert.equal(dup.report.duplicateRemoved, 4)
    assertClosed('중복 면', dup.after)

    // 6) 면을 맞댄 두 상자(가운데 칸막이) → 칸막이 제거, 2×1×1 상자 하나
    const wall = await repair('내부 칸막이', flat([...cube(0, 10), ...boxTris([10, 0, 0], [20, 10, 10])]))
    assert.equal(wall.report.internalFacesRemoved, 4, '칸막이 남음')
    assertClosed('내부 칸막이', wall.after)
    assert.ok(near(wall.volume, 2), `칸막이 부피 ${wall.volume}`)
    reports.wall = wall.report

    // 6-1) 두께 0인 양면 판(방향 반대 겹친 면) → 그대로 둠
    const sheet: Tri[] = [[[30, 0, 0], [40, 0, 0], [40, 10, 0]], [[30, 0, 0], [40, 10, 0], [30, 10, 0]]]
    const twoSided = await repair('양면 판', flat([...cube(0, 10), ...sheet, ...sheet.map(([a, b, c]) => [a, c, b] as Tri)]))
    assert.equal(meshRepairChanged(twoSided.report), false, '양면 판을 변경함')

    // 7) 모서리만 맞닿은 두 정육면체 → 비다양체지만 바깥 면이므로 지우지 않음
    const touching = await repair('모서리 접촉', flat([...cube(0, 10), ...boxTris([10, 10, 0], [20, 20, 10])]))
    assert.equal(touching.report.internalFacesRemoved, 0)
    assert.equal(touching.report.trianglesAfter, 24)
    assert.ok(near(touching.volume, 2))

    // 8) 부스러기 조각 — 옵션을 켤 때만 제거
    const crumb: Tri[] = [...cube(0, 50), ...cube(70, 70.2)]
    const keep = await repair('부스러기 유지', flat(crumb))
    assert.equal(keep.report.fragmentsRemoved, 0)
    const drop = await repair('부스러기 제거', flat(crumb), { removeFragments: true })
    assert.equal(drop.report.fragmentsRemoved, 1)
    assert.equal(drop.report.trianglesAfter, 12)

    // 9) 일부 면이 뒤집힌 정육면체 → 방향 통일
    const mixed = cube(0, 10).map((tri, i) => (i % 3 === 0 ? ([tri[0], tri[2], tri[1]] as Tri) : tri))
    const flipped = await repair('뒤집힌 면', flat(mixed))
    assert.equal(flipped.report.flippedFixed, 4)
    assertClosed('뒤집힌 면', flipped.after)
    assert.ok(near(flipped.volume, 1))

    // 10) 속 빈 정육면체 → 안쪽 껍데기 보존 (부피 8 - 1)
    const inner = cube(5, 15).map(([a, b, c]) => [a, c, b] as Tri)
    const hollow = await repair('속 빈 모델', flat([...cube(0, 20), ...inner]))
    assert.equal(meshRepairChanged(hollow.report), false)
    assert.ok(near(hollow.volume, 7), `속 빈 부피 ${hollow.volume}`)

    // 11) 바이너리 STL 왕복
    const stl = encodeBinaryStl(openCyl.positions)
    const loaded = new STLLoader().parse(stl)
    assert.equal(loaded.getAttribute('position').count, openCyl.positions.length / 3)
    assert.ok(near(analyzeMeshGeometry(loaded).volume, closedCylVolume))

    // 11-1) 점검기 체험용 구멍 난 샘플 → 완전히 닫힘
    const brokenBuf = readFileSync('public/broken_sample.stl')
    const brokenGeo = new STLLoader().parse(brokenBuf.buffer.slice(brokenBuf.byteOffset, brokenBuf.byteOffset + brokenBuf.byteLength) as ArrayBuffer)
    const broken = await repair('체험 샘플', brokenGeo.getAttribute('position').array as Float32Array, { removeFragments: true })
    assertClosed('체험 샘플', broken.after)
    assert.equal(broken.after.shells, 1)
    assert.equal(broken.report.holesSkipped, 0)
    assert.ok(near(broken.volume, closedCylinderVolume(20, 40, 64), 0.01), `체험 샘플 부피 ${broken.volume}`)
    reports.brokenSample = broken.report

    // 12) 실제 샘플(열린 모서리·비다양체 포함)
    const buf = readFileSync('public/jet_engine_rotor.stl')
    const rotorGeo = await parseModelArrayBuffer('rotor.stl', buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer)
    assert.ok(rotorGeo)
    const rotorPos = rotorGeo.getAttribute('position').array as Float32Array
    const rotorIndex = rotorGeo.getIndex()?.array ?? null
    const rotorBefore = (await inspectMesh(rotorGeo))
    assert.ok(rotorBefore?.status === 'ok')
    const t0 = Date.now()
    const rotorOut = repairMesh(rotorPos, rotorIndex, { removeFragments: true })
    const ms = Date.now() - t0
    assert.equal(rotorOut.status, 'ok')
    if (rotorOut.status !== 'ok') return
    const rotorAfter = await inspect(rotorOut.positions)
    assert.ok(rotorAfter.openEdges <= rotorBefore.result.openEdges, '로터 열린 모서리 증가')

    console.log('test-mesh-repair: ok', {
        reports,
        rotor: {
            ms,
            before: {
                open: rotorBefore.result.openEdges,
                nonManifold: rotorBefore.result.nonManifoldEdges,
                flipped: rotorBefore.result.flippedEdges,
                shells: rotorBefore.result.shells,
            },
            after: {
                open: rotorAfter.openEdges,
                nonManifold: rotorAfter.nonManifoldEdges,
                flipped: rotorAfter.flippedEdges,
                shells: rotorAfter.shells,
            },
            report: rotorOut.report,
        },
    })
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
