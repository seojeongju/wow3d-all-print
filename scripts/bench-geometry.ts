/**
 * 대용량 메쉬 분석 시간 측정
 * 실행: npx --yes tsx scripts/bench-geometry.ts
 */
import * as THREE from 'three'
import { analyzeGeometry } from '../lib/geometry'

const cases: [string, THREE.BufferGeometry][] = [
    ['구 2M 삼각형', new THREE.SphereGeometry(30, 1000, 1000)],
    ['기울어진 판 분할 0.5M', new THREE.BoxGeometry(80, 60, 10, 200, 200, 50).applyQuaternion(
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0.4, 0.3, 0.1))
    )],
]
for (const [label, geo] of cases) {
    const tris = (geo.index ? geo.index.count : geo.attributes.position.count) / 3
    const t0 = performance.now()
    const a = analyzeGeometry(geo)
    console.log(
        `${label} (${tris.toLocaleString()} tri): ${(performance.now() - t0).toFixed(0)}ms, 면 후보 ${a.faceOrientations?.length ?? 0}`
    )
}
