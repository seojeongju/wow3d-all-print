/**
 * 슬라이서식 바닥 배치·방향별 서포트·자동 배치 검증
 * 실행: npx --yes tsx scripts/test-orientation.ts
 */
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { analyzeGeometry } from '../lib/geometry'
import {
    applyTransformToAnalysis,
    DEFAULT_MODEL_TRANSFORM,
    findAutoOrientTransform,
    getUpAxisKey,
    type Axis90,
    type ModelTransform,
} from '../lib/model-transform'
import { calculateFdmQuote, fdmSupportExtrudeCm3 } from '../lib/fdm-quote'
import { bakeStlToTargetMm, layFlatMatrix } from '../lib/stl-bake'

const AXES: Axis90[] = [0, 90, 180, 270]
const near = (a: number, b: number, eps = 1e-3) => Math.abs(a - b) <= eps

// 1) 뷰어(three.js Euler 'ZYX') 회전 결과와 견적 치수·위쪽 축이 64가지 조합 모두 일치
{
    const box = new THREE.BoxGeometry(10, 20, 30)
    const base = analyzeGeometry(box)
    for (const rotX of AXES) {
        for (const rotY of AXES) {
            for (const rotZ of AXES) {
                const tf: ModelTransform = { ...DEFAULT_MODEL_TRANSFORM, rotX, rotY, rotZ }
                const euler = new THREE.Euler(
                    THREE.MathUtils.degToRad(rotX),
                    THREE.MathUtils.degToRad(rotY),
                    THREE.MathUtils.degToRad(rotZ),
                    'ZYX'
                )
                const geo = box.clone().applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(euler))
                geo.computeBoundingBox()
                const size = new THREE.Vector3()
                geo.boundingBox!.getSize(size)
                const quoted = applyTransformToAnalysis(base, tf).boundingBox
                assert.ok(
                    near(size.x, quoted.x) && near(size.y, quoted.y) && near(size.z, quoted.z),
                    `치수 불일치 rot=${rotX},${rotY},${rotZ}: viewer=${size.toArray()} quote=${JSON.stringify(quoted)}`
                )

                const upKey = getUpAxisKey(tf)
                const sign = upKey[0] === '+' ? 1 : -1
                const axis = upKey[1] as 'x' | 'y' | 'z'
                const v = new THREE.Vector3(axis === 'x' ? sign : 0, axis === 'y' ? sign : 0, axis === 'z' ? sign : 0)
                v.applyEuler(euler)
                assert.ok(v.z > 0.99, `위쪽 축 불일치 rot=${rotX},${rotY},${rotZ}: ${upKey}`)
            }
        }
    }
    // 상자는 어느 방향이든 바닥면만 아래를 향하므로 서포트 0
    for (const o of Object.values(base.orientations!)) {
        assert.equal(o.overhangArea, 0)
        assert.equal(o.supportVolume, 0)
    }
    console.log('✓ 뷰어·견적 회전 일치(64조합), 상자 서포트 0')
}

// 2) T자 형상: 세우면 날개 아래 서포트, 뒤집거나 눕히면 0
function buildT(): THREE.BufferGeometry {
    const s = new THREE.Shape()
    s.moveTo(-5, 0)
    s.lineTo(5, 0)
    s.lineTo(5, 20)
    s.lineTo(15, 20)
    s.lineTo(15, 25)
    s.lineTo(-15, 25)
    s.lineTo(-15, 20)
    s.lineTo(-5, 20)
    s.closePath()
    // XY 평면 T 프로파일을 Z로 10mm 압출 — 원본 +Y가 T의 위쪽
    return new THREE.ExtrudeGeometry(s, { depth: 10, bevelEnabled: false })
}

const tBase = analyzeGeometry(buildT())
{
    const o = tBase.orientations!
    // 날개 아랫면 2 × (10×10mm) = 2cm², 높이 20mm → 그림자 4cm³
    assert.ok(near(o['+y']!.overhangArea, 2, 1e-6), `+y 오버행 ${o['+y']!.overhangArea}`)
    assert.ok(near(o['+y']!.supportVolume, 4, 1e-6), `+y 서포트 부피 ${o['+y']!.supportVolume}`)
    assert.equal(o['-y']!.overhangArea, 0, 'T를 뒤집으면 서포트 없음')
    assert.equal(o['+z']!.overhangArea, 0, '눕히면 서포트 없음')
    assert.equal(o['-z']!.overhangArea, 0)

    // 감김 방향이 뒤집힌 메쉬도 같은 결과
    const flipped = buildT()
    const pos = flipped.attributes.position
    for (let i = 0; i < pos.count; i += 3) {
        const x = pos.getX(i + 1), y = pos.getY(i + 1), z = pos.getZ(i + 1)
        pos.setXYZ(i + 1, pos.getX(i + 2), pos.getY(i + 2), pos.getZ(i + 2))
        pos.setXYZ(i + 2, x, y, z)
    }
    const fo = analyzeGeometry(flipped).orientations!
    assert.ok(near(fo['+y']!.supportVolume, 4, 1e-6), '뒤집힌 감김에서도 +y 서포트 4cm³')
    assert.equal(fo['-y']!.overhangArea, 0)
    console.log('✓ T자 방향별 서포트(세움 4cm³ / 뒤집음·눕힘 0), 감김 반전 대응')
}

// 3) 회전 → 해당 바닥 방향 값 선택 + 스케일 반영
{
    // X 270°: 원본 -Y가 위 → T가 뒤집혀 서포트 0
    const flippedT = applyTransformToAnalysis(tBase, { ...DEFAULT_MODEL_TRANSFORM, rotX: 270 })
    assert.equal(getUpAxisKey({ rotX: 270, rotY: 0, rotZ: 0 }), '-y')
    assert.equal(flippedT.supportVolume, 0)
    // X 90°: 원본 +Y가 위 → 세운 T, 스케일 200%면 부피 ×8, 면적 ×4
    const upright = applyTransformToAnalysis(tBase, { ...DEFAULT_MODEL_TRANSFORM, rotX: 90, scalePercent: 200 })
    assert.ok(near(upright.supportVolume!, 32, 1e-6), `세운 T 200% 서포트 ${upright.supportVolume}`)
    assert.ok(near(upright.overhangArea!, 8, 1e-6))
    console.log('✓ 회전별 바닥 방향 선택, 스케일 s²·s³ 반영')
}

// 4) 자동 배치: 세운 T에서 시작해도 서포트 0 + 가장 낮은 높이로 배치
{
    const start: ModelTransform = { ...DEFAULT_MODEL_TRANSFORM, rotX: 90 }
    const r = findAutoOrientTransform(tBase, start)!
    const placed = applyTransformToAnalysis(tBase, r.transform)
    assert.equal(placed.supportVolume, 0)
    assert.ok(near(placed.boundingBox.z, 10), `자동 배치 높이 ${placed.boundingBox.z}`)
    // 베드가 좁으면 들어가는 방향 우선
    const narrow = findAutoOrientTransform(tBase, start, { bed: { x: 12, y: 40, z: 40 } })!
    assert.ok(narrow.fitsBed, '좁은 베드에 맞는 자세 선택')
    console.log(`✓ 자동 배치 → rot=${r.transform.rotX},${r.transform.rotY},${r.transform.rotZ} (up ${r.upAxis}), 좁은 베드 대응`)
}

// 5) 견적: 서포트 부피가 있으면 배치에 따라 서포트 무게가 달라짐
{
    const common = {
        volumeCm3: tBase.volume,
        surfaceAreaCm2: tBase.surfaceArea,
        heightMm: 25,
        density: 1.24,
        pricePerGramKr: 50,
        infillPercent: 20,
        layerHeightMm: 0.2,
        supportEnabled: true,
        hourlyRateKr: 5000,
    }
    const upright = calculateFdmQuote({ ...common, overhangAreaCm2: 2, supportVolumeCm3: 4 })
    const flat = calculateFdmQuote({ ...common, heightMm: 10, overhangAreaCm2: 0, supportVolumeCm3: 0 })
    assert.ok(near(upright.supportGrams, fdmSupportExtrudeCm3(2, 4) * 1.24, 1e-9), `세운 T 서포트 ${upright.supportGrams}g`)
    assert.equal(flat.supportGrams, 0)
    assert.ok(flat.timeHours <= upright.timeHours)
    console.log(`✓ 견적 서포트: 세움 ${upright.supportGrams.toFixed(2)}g / 눕힘 0g`)
}

// 6) 비스듬히 놓인 판: 큰 평면을 바닥에 놓는 배치(layFlat)가 후보로 잡히고 자동 배치가 선택
{
    const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.5, 0.35, 0.2))
    const plate = new THREE.BoxGeometry(40, 30, 6).toNonIndexed().applyQuaternion(tilt)
    const base = analyzeGeometry(plate)
    const faces = base.faceOrientations ?? []
    const plateUp = new THREE.Vector3(0, 0, 1).applyQuaternion(tilt)
    const face = faces.find((f) => Math.abs(new THREE.Vector3(...f.down).dot(plateUp)) > 0.999)
    assert.ok(face, `판 큰 면 후보 없음: ${JSON.stringify(faces.map((f) => f.down))}`)
    assert.ok(near(face.box.z, 6, 1e-3), `면 배치 높이 ${face.box.z}`)
    assert.ok(near(face.supportVolume, 0, 1e-6), `면 배치 서포트 ${face.supportVolume}`)
    assert.ok(near(face.bedArea!, 12, 1e-3), `면 배치 베드 접촉 ${face.bedArea}`)

    const r = findAutoOrientTransform(base, DEFAULT_MODEL_TRANSFORM)!
    assert.ok(r.transform.layFlat, '자동 배치가 평면 배치를 선택')
    assert.equal(r.upAxis, null)
    const placed = applyTransformToAnalysis(base, r.transform)
    assert.ok(near(placed.boundingBox.z, 6, 1e-3), `자동 배치 높이 ${placed.boundingBox.z}`)
    assert.equal(placed.supportVolume, 0)

    // 뷰어(layFlat 행렬 → 쿼터니언 → Euler 'ZYX')와 견적 치수 일치 + 바닥 면이 -Z를 향함
    const m = layFlatMatrix(r.transform.layFlat!)
    const q = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().set(m[0], m[1], m[2], 0, m[3], m[4], m[5], 0, m[6], m[7], m[8], 0, 0, 0, 0, 1)
    )
    const euler = new THREE.Euler(
        THREE.MathUtils.degToRad(r.transform.rotX),
        THREE.MathUtils.degToRad(r.transform.rotY),
        THREE.MathUtils.degToRad(r.transform.rotZ),
        'ZYX'
    )
    const viewer = plate.clone().applyQuaternion(q).applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(euler))
    viewer.computeBoundingBox()
    const size = new THREE.Vector3()
    viewer.boundingBox!.getSize(size)
    const pb = placed.boundingBox
    assert.ok(near(size.x, pb.x) && near(size.y, pb.y) && near(size.z, pb.z), `뷰어 ${size.toArray()} / 견적 ${JSON.stringify(pb)}`)
    const down = new THREE.Vector3(...r.transform.layFlat!).applyQuaternion(q).applyEuler(euler)
    assert.ok(down.z < -0.999, `바닥 면 법선 ${down.toArray()}`)

    // 관리자 STL 베이크도 같은 자세·치수
    const pos = plate.attributes.position
    const stl = new ArrayBuffer(84 + (pos.count / 3) * 50)
    const view = new DataView(stl)
    view.setUint32(80, pos.count / 3, true)
    for (let i = 0; i < pos.count; i++) {
        const o = 84 + Math.floor(i / 3) * 50 + 12 + (i % 3) * 12
        view.setFloat32(o, pos.getX(i), true)
        view.setFloat32(o + 4, pos.getY(i), true)
        view.setFloat32(o + 8, pos.getZ(i), true)
    }
    const baked = new DataView(bakeStlToTargetMm(stl, pb, { ...r.transform }))
    const lo = [Infinity, Infinity, Infinity]
    const hi = [-Infinity, -Infinity, -Infinity]
    for (let i = 0; i < pos.count; i++) {
        const o = 84 + Math.floor(i / 3) * 50 + 12 + (i % 3) * 12
        for (let k = 0; k < 3; k++) {
            const v = baked.getFloat32(o + k * 4, true)
            lo[k] = Math.min(lo[k], v)
            hi[k] = Math.max(hi[k], v)
        }
    }
    assert.ok(near(hi[0] - lo[0], pb.x, 0.05) && near(hi[1] - lo[1], pb.y, 0.05) && near(hi[2] - lo[2], pb.z, 0.05),
        `베이크 치수 ${hi.map((h, k) => h - lo[k])}`)
    assert.ok(near(lo[2], 0, 1e-3), `베이크 바닥 Z ${lo[2]}`)

    // 축 정렬 상자는 평면 후보 없음 (6방향 배치로 충분)
    assert.equal(analyzeGeometry(new THREE.BoxGeometry(10, 20, 30)).faceOrientations, undefined)
    console.log(`✓ 평면 배치: 기울어진 판 → 높이 ${placed.boundingBox.z.toFixed(1)}mm, 서포트 0, 뷰어·베이크 일치`)
}

console.log('모든 배치 테스트 통과')
