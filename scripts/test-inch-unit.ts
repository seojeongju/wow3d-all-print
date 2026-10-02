/**
 * STL 인치 단위 감지·변환 검증
 * 실행: npx --yes tsx scripts/test-inch-unit.ts
 */
import assert from 'node:assert/strict'
import {
    AI_PHOTO_SCALE_PERCENT_MAX,
    applyTransformToAnalysis,
    getScalePercentMax,
    scalePercentFromTargetMm,
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
// 크기 기준 상한: 최장축 1000mm까지 (최대 15000%), 큰 모델은 기존 400%
assert.equal(getScalePercentMax('upload', false, 300), SCALE_PERCENT_MAX)
assert.equal(getScalePercentMax('upload', false, 50), 2000)
assert.equal(getScalePercentMax('upload', false, 0.98), AI_PHOTO_SCALE_PERCENT_MAX)
assert.equal(getScalePercentMax('upload', true, 50), UPLOAD_INCH_SCALE_PERCENT_MAX)

// 1mm 미만 모델도 치수 입력으로 100mm까지 확대 (구: 400%에서 멈춤)
const micro = { volume: 0.0002, surfaceArea: 0.02, boundingBox: { x: 0.85, y: 0.975, z: 0.545 } }
useFileStore.setState({ fileSource: { kind: 'upload', meshyJobId: null }, baseAnalysis: micro, unitInch: false })
const toX100 = scalePercentFromTargetMm(
    micro,
    useFileStore.getState().transform,
    'x',
    100,
    getScalePercentMax('upload', false, 0.975)
)
useFileStore.getState().setScalePercent(toX100)
assert.equal(useFileStore.getState().transform.scalePercent, 11765)
useFileStore.getState().setScalePercent(500)
assert.equal(useFileStore.getState().transform.scalePercent, 500)
useFileStore.getState().setScalePercent(100)

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

// 새 견적은 인치 여부를 기록 — 400% 초과로 확대만 한 견적은 인치로 오인하지 않음
const scaledOnly = parseStoredModelTransform(
    JSON.stringify({ scalePercent: 5000, rotX: 0, rotY: 0, rotZ: 0, unitInch: false })
)
assert.equal(scaledOnly?.unitInch, false)
store.setState({ unitInch: false, baseAnalysis: null })
store.getState().setTransformFull(scaledOnly!)
assert.equal(store.getState().unitInch, false)
assert.equal(store.getState().transform.scalePercent, 5000, '원본 분석 전에는 저장 배율을 자르지 않음')
store.setState({ baseAnalysis: tiny })

// 사진→AI 모델은 대상 아님
store.setState({ fileSource: { kind: 'meshy-photo', meshyJobId: 1 }, unitInch: false })
store.getState().setUnitInch(true)
assert.equal(store.getState().unitInch, false)

console.log('OK inch-unit tests passed')
