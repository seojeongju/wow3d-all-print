/**
 * 면 방향 자동 정렬 — 뒤집힌 면 보정·속 빈 모델의 안쪽 껍데기 보존·부피 정확도
 * 실행: npx --yes tsx scripts/test-mesh-orient.ts
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import * as THREE from 'three'
import { parseModelArrayBuffer } from '../lib/parseModelGeometry'
import { analyzeMeshGeometry } from '../lib/geometry'
import { inspectMesh } from '../lib/mesh-inspect'
import { MESH_ORIENT_USERDATA_KEY, orientMeshConsistently } from '../lib/mesh-orient'

type Tri = [number[], number[], number[]]

/** 바깥을 향하는 정육면체 삼각형 12개 (min~max) */
function cubeTris(min: number, max: number): Tri[] {
    const c = (x: number, y: number, z: number) => [x ? max : min, y ? max : min, z ? max : min]
    const quads: number[][][] = [
        [c(0, 0, 1), c(1, 0, 1), c(1, 1, 1), c(0, 1, 1)], // +z
        [c(0, 0, 0), c(0, 1, 0), c(1, 1, 0), c(1, 0, 0)], // -z
        [c(0, 1, 0), c(0, 1, 1), c(1, 1, 1), c(1, 1, 0)], // +y
        [c(0, 0, 0), c(1, 0, 0), c(1, 0, 1), c(0, 0, 1)], // -y
        [c(1, 0, 0), c(1, 1, 0), c(1, 1, 1), c(1, 0, 1)], // +x
        [c(0, 0, 0), c(0, 0, 1), c(0, 1, 1), c(0, 1, 0)], // -x
    ]
    return quads.flatMap(([a, b, cc, d]) => [[a, b, cc], [a, cc, d]] as Tri[])
}

const reverse = (tris: Tri[]): Tri[] => tris.map(([a, b, c]) => [a, c, b])

function toStl(tris: Tri[]): ArrayBuffer {
    const body = tris
        .map(([a, b, c]) => `facet normal 0 0 0\nouter loop\nvertex ${a.join(' ')}\nvertex ${b.join(' ')}\nvertex ${c.join(' ')}\nendloop\nendfacet`)
        .join('\n')
    const buf = Buffer.from(`solid t\n${body}\nendsolid t\n`, 'ascii')
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}

function fileBuffer(path: string): ArrayBuffer {
    const buf = readFileSync(path)
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}

async function run(name: string, buf: ArrayBuffer) {
    const geo = await parseModelArrayBuffer('t.stl', buf)
    assert.ok(geo, `${name}: 파싱 실패`)
    const volume = analyzeMeshGeometry(geo).volume
    const outcome = await inspectMesh(geo)
    assert.ok(outcome?.status === 'ok', `${name}: 점검 실패`)
    return { volume, flipped: Number(geo.userData[MESH_ORIENT_USERDATA_KEY]), mesh: outcome.result }
}

const near = (a: number, b: number) => Math.abs(a - b) < 1e-3

async function main() {
    // 1) 원래 샘플(옆면 8개가 뒤집힌 20mm 정육면체) → 8cm³로 복구
    const oldCube = execSync('git show e757762:public/test_cube.stl')
    const oldBuf = oldCube.buffer.slice(oldCube.byteOffset, oldCube.byteOffset + oldCube.byteLength) as ArrayBuffer
    const legacy = await run('기존 샘플', oldBuf)
    assert.ok(near(legacy.volume, 8), `기존 샘플 부피 ${legacy.volume}`)
    assert.equal(legacy.flipped, 8)
    assert.equal(legacy.mesh.flippedEdges, 0)
    assert.equal(legacy.mesh.invertedShells, 0)

    // 2) 교체한 샘플 → 손대지 않음
    const sample = await run('새 샘플', fileBuffer('public/test_cube.stl'))
    assert.ok(near(sample.volume, 8), `새 샘플 부피 ${sample.volume}`)
    assert.equal(sample.flipped, 0)

    // 3) 전체가 뒤집힌 정육면체 → 12개 모두 보정
    const inverted = await run('전체 반전', toStl(reverse(cubeTris(0, 20))))
    assert.ok(near(inverted.volume, 8))
    assert.equal(inverted.flipped, 12)

    // 4) 속 빈 정육면체(안쪽 껍데기는 안쪽을 향함) → 보존, 부피 8 - 1 = 7cm³
    const hollow = await run('속 빈 모델', toStl([...cubeTris(0, 20), ...reverse(cubeTris(5, 15))]))
    assert.ok(near(hollow.volume, 7), `속 빈 모델 부피 ${hollow.volume}`)
    assert.equal(hollow.flipped, 0)
    assert.equal(hollow.mesh.invertedShells, 0)

    // 5) 떨어진 두 덩어리 중 하나만 반전 → 그 덩어리만 보정
    const pair = await run('두 덩어리', toStl([...cubeTris(0, 20), ...reverse(cubeTris(30, 40))]))
    assert.ok(near(pair.volume, 9), `두 덩어리 부피 ${pair.volume}`)
    assert.equal(pair.flipped, 12)

    // 6) 인덱스 지오메트리 — 인덱스 순서만 바꿔 보정
    const tris = cubeTris(0, 10)
    tris[3] = [tris[3][0], tris[3][2], tris[3][1]]
    const verts: number[] = []
    const keyOf = new Map<string, number>()
    const index: number[] = []
    for (const tri of tris) {
        for (const p of tri) {
            const k = p.join(',')
            if (!keyOf.has(k)) {
                keyOf.set(k, verts.length / 3)
                verts.push(...p)
            }
            index.push(keyOf.get(k)!)
        }
    }
    const indexed = new THREE.BufferGeometry()
    indexed.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    indexed.setIndex(index)
    assert.equal(orientMeshConsistently(indexed).flipped, 1)
    assert.ok(near(analyzeMeshGeometry(indexed).volume, 1))

    // 7) 실제 샘플(열린 모서리·비다양체 포함) — 부피 변화 확인용
    const rotor = await run('로터', fileBuffer('public/jet_engine_rotor.stl'))

    console.log('test-mesh-orient: ok', {
        legacyVolume: +legacy.volume.toFixed(3),
        legacyFlipped: legacy.flipped,
        hollowVolume: +hollow.volume.toFixed(3),
        rotor: { volume: +rotor.volume.toFixed(3), flipped: rotor.flipped, openEdges: rotor.mesh.openEdges },
    })
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
