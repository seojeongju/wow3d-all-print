/**
 * STL 인치 단위 감지·변환 검증
 * 실행: npx --yes tsx scripts/test-inch-unit.ts
 */
import assert from 'node:assert/strict'
import {
    applyTransformToAnalysis,
    getScalePercentMax,
    INCH_SCALE_PERCENT,
    isLikelyInchModel,
    isUnitlessModelFile,
    SCALE_PERCENT_MAX,
    UPLOAD_INCH_SCALE_PERCENT_MAX,
} from '../lib/model-transform'
import { parseStoredModelTransform } from '../lib/quote-reload'
import { useFileStore } from '../store/useFileStore'

// 3×2×1.5mm 상자(0.009cm³, 0.27cm²) 안에 들어가는 현실적인 값
const tiny = { volume: 0.005, surfaceArea: 0.2, boundingBox: { x: 3, y: 2, z: 1.5 } }
const normal = { volume: 20, surfaceArea: 50, boundingBox: { x: 60, y: 40, z: 30 } }

assert.equal(isUnitlessModelFile('part.STL'), true)
assert.equal(isUnitlessModelFile('part.obj'), true)
assert.equal(isUnitlessModelFile('part.step'), false)
assert.equal(isUnitlessModelFile('part.3mf'), false)
assert.equal(isLikelyInchModel('part.stl', tiny), true)
assert.equal(isLikelyInchModel('part.stl', normal), false)
assert.equal(isLikelyInchModel('part.step', tiny), false, 'STEP은 단위가 있으므로 제외')

assert.equal(INCH_SCALE_PERCENT, 2540)
assert.equal(getScalePercentMax('upload'), SCALE_PERCENT_MAX)
assert.equal(getScalePercentMax('upload', true), UPLOAD_INCH_SCALE_PERCENT_MAX)

// 스토어: 변환 → ×25.4, 되돌리기 → 원래 값
const store = useFileStore
store.setState({ fileSource: { kind: 'upload', meshyJobId: null }, baseAnalysis: tiny })
store.getState().setUnitInch(true)
assert.equal(store.getState().unitInch, true)
assert.equal(store.getState().transform.scalePercent, 2540)

const eff = applyTransformToAnalysis(tiny, store.getState().transform)
assert.ok(Math.abs(eff.boundingBox.x - 3 * 25.4) < 0.01, 'bbox ×25.4')
assert.ok(Math.abs(eff.volume - 0.005 * 25.4 ** 3) / (0.005 * 25.4 ** 3) < 1e-6, '부피 ×25.4³')

// 변환 후 추가 200% 조절 허용
store.getState().setScalePercent(5080)
assert.equal(store.getState().transform.scalePercent, 5080)
store.getState().setScalePercent(2540)

// 초기화 버튼은 변환 상태의 기준(2540%)으로
store.getState().setScalePercent(3000)
store.getState().resetTransform()
assert.equal(store.getState().transform.scalePercent, 2540)

store.getState().setUnitInch(false)
assert.equal(store.getState().unitInch, false)
assert.equal(store.getState().transform.scalePercent, 100)

// 저장 견적 복원: 2540%가 400%로 잘리지 않고 변환 상태도 켜짐
const restored = parseStoredModelTransform(JSON.stringify({ scalePercent: 2540, rotX: 0, rotY: 0, rotZ: 0 }))
assert.equal(restored?.scalePercent, 2540)
store.setState({ unitInch: false })
store.getState().setTransformFull(restored!)
assert.equal(store.getState().unitInch, true)
assert.equal(store.getState().transform.scalePercent, 2540)

// 사진→AI 모델은 대상 아님
store.setState({ fileSource: { kind: 'meshy-photo', meshyJobId: 1 }, unitInch: false })
store.getState().setUnitInch(true)
assert.equal(store.getState().unitInch, false)

console.log('OK inch-unit tests passed')
