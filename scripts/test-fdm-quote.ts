/**
 * FDM 견적 모듈 스모크 테스트
 * 실행: npx --yes tsx scripts/test-fdm-quote.ts
 */
import assert from 'node:assert/strict'
import {
    calculateFdmQuote,
    estimateFdmWeightGrams,
    estimateFdmSupportGrams,
    FDM_INFILL_DEFAULT,
    FDM_INFILL_PRESETS,
} from '../lib/fdm-quote'
import { formatEstimatedPrintTime } from '../lib/print-time-estimate'
import { sanitizeGeometryAnalysis } from '../lib/geometry'
import { applyTransformToAnalysis, meshyAutoFitScalePercent } from '../lib/model-transform'

const base = {
    volumeCm3: 10,
    surfaceAreaCm2: 50,
    heightMm: 40,
    density: 1.24,
    pricePerGramKr: 50,
    layerHeightMm: 0.2,
    supportEnabled: false,
    hourlyRateKr: 5000,
    fdmLaborCostKrw: 6500,
    applyVat: false as const,
}

const w20 = estimateFdmWeightGrams({ ...base, infillPercent: 20 })
const w100 = estimateFdmWeightGrams({ ...base, infillPercent: 100 })
const w10 = estimateFdmWeightGrams({ ...base, infillPercent: 10 })

assert.ok(w20.shellVolCm3 > 0, 'shell volume should be > 0')
assert.ok(w20.infillVolCm3 >= 0, 'infill volume >= 0')
assert.ok(w10.weightGrams < w20.weightGrams, '10% infill lighter than 20%')
assert.ok(w20.weightGrams < w100.weightGrams, '20% lighter than 100%')
assert.equal(w10.effectiveInfill, 10)
assert.equal(w100.effectiveInfill, 100)

const q20 = calculateFdmQuote({ ...base, infillPercent: 20 })
const q100 = calculateFdmQuote({ ...base, infillPercent: 100 })
assert.ok(q20.subtotal < q100.subtotal, 'higher infill => higher subtotal')
assert.ok(q20.timeHours <= q100.timeHours + 1e-9, 'higher infill => time not lower')
assert.ok(q20.costBreakdown.material < q100.costBreakdown.material)
assert.equal(q20.supportGrams, 0)

const qSupport = calculateFdmQuote({
    ...base,
    infillPercent: 20,
    supportEnabled: true,
    overhangAreaCm2: 25,
})
assert.ok(qSupport.supportGrams > 0, 'support should estimate grams')
// 작은 모델은 최소 레이어 시간에 묶여 서포트가 늘어도 총 시간이 같을 수 있음 (Bambu도 동일)
assert.ok(qSupport.timeHours >= q20.timeHours, 'support should not decrease print time')
assert.ok(
    qSupport.timeDetail.breakdownSec.support > 0,
    'support extrusion time should be counted'
)
assert.ok(qSupport.costBreakdown.support > 0)

const withVat = calculateFdmQuote({ ...base, infillPercent: FDM_INFILL_DEFAULT, applyVat: true, minPriceKr: 0 })
assert.ok(withVat.total >= withVat.subtotal * 1.09, 'VAT should increase total')

assert.equal(FDM_INFILL_PRESETS.length, 3)
assert.deepEqual(
    FDM_INFILL_PRESETS.map((p) => p.percent),
    [20, 40, 80]
)

// 마스크형(서포트 다량) — Bambu ~7h12m 근사 목표
const mask = calculateFdmQuote({
    volumeCm3: 54.59,
    surfaceAreaCm2: 480,
    heightMm: 107.58,
    density: 1.24,
    pricePerGramKr: 50,
    infillPercent: 20,
    layerHeightMm: 0.2,
    supportEnabled: true,
    overhangAreaCm2: 220,
    materialName: 'PLA',
    hourlyRateKr: 5000,
    fdmLaborCostKrw: 6500,
    applyVat: false,
})
assert.ok(mask.supportGrams > mask.weightGrams * 0.8, 'heavy-support geometry')
assert.ok(mask.timeHours > 6.5 && mask.timeHours < 8.5, `mask time ~Bambu 7h, got ${mask.timeHours}`)
// Bambu Studio 실측 ≈ 7h12m (면적 지표 없는 근사 입력) — ±10%
assert.ok(Math.abs(mask.timeHours - 7.2) / 7.2 < 0.1, `mask within ±10% of Bambu 7.2h, got ${mask.timeHours}`)
assert.ok(Math.abs(mask.supportGrams - 154) < 25, `support grams near Bambu 154g, got ${mask.supportGrams}`)

// Bambu Studio P2S 실측 (PLA Basic, 0.20mm Standard, 인필 30% 그리드, 일반(자동) 서포트, 빌드 플레이트 위에만)
// 같은 부품(43.45cm³) 두 자세 — 형상 분석값 고정, 준비 7분 포함 총 시간·모델 g·서포트 g
const bambuP2S = [
    {
        name: '원본 자세',
        geom: { heightMm: 57.5, lateralAreaCm2: 200.5, topAreaCm2: 42.0, bottomAreaCm2: 32.5, bedAreaCm2: 0, slowWallAreaCm2: 326.0, overhangAreaCm2: 19.6, supportVolumeCm3: 56.0 },
        hours: 2 + 13 / 60,
        modelG: 37.25,
        supportG: 20.74,
    },
    {
        name: '면에 놓기',
        geom: { heightMm: 75.9, lateralAreaCm2: 190.2, topAreaCm2: 41.7, bottomAreaCm2: 37.8, bedAreaCm2: 21.1, slowWallAreaCm2: 179.7, overhangAreaCm2: 16.7, supportVolumeCm3: 22.0 },
        hours: 1 + 46 / 60,
        modelG: 36.59,
        supportG: 10.9,
    },
]
for (const c of bambuP2S) {
    const q = calculateFdmQuote({
        volumeCm3: 43.45,
        surfaceAreaCm2: 260.2,
        ...c.geom,
        density: 1.24,
        pricePerGramKr: 50,
        infillPercent: 30,
        layerHeightMm: 0.2,
        supportEnabled: true,
        materialName: 'PLA Basic',
        hourlyRateKr: 5000,
    })
    const rel = (a: number, b: number) => Math.abs(a - b) / b
    assert.ok(rel(q.timeHours, c.hours) < 0.1, `${c.name} 시간 ${q.timeHours.toFixed(2)}h vs Bambu ${c.hours.toFixed(2)}h`)
    assert.ok(rel(q.weightGrams, c.modelG) < 0.05, `${c.name} 모델 ${q.weightGrams.toFixed(1)}g vs ${c.modelG}g`)
    assert.ok(rel(q.supportGrams, c.supportG) < 0.25, `${c.name} 서포트 ${q.supportGrams.toFixed(1)}g vs ${c.supportG}g`)
    console.log(
        `✓ Bambu P2S ${c.name}: ${formatEstimatedPrintTime(q.timeHours)} (실측 ${formatEstimatedPrintTime(c.hours)}), ` +
            `모델 ${q.weightGrams.toFixed(1)}g (${c.modelG}g), 서포트 ${q.supportGrams.toFixed(1)}g (${c.supportG}g)`
    )
}

const sg = estimateFdmSupportGrams({
    supportEnabled: false,
    overhangAreaCm2: 100,
    heightMm: 100,
    density: 1.24,
})
assert.equal(sg, 0)

// 고폴리 내부면으로 표면/오버행이 폭주해도 서포트비가 수억 원이 되면 안 됨
const inflatedTiny = calculateFdmQuote({
    volumeCm3: 2000,
    surfaceAreaCm2: 24_000_000,
    heightMm: 500,
    density: 1.24,
    pricePerGramKr: 50,
    infillPercent: 20,
    layerHeightMm: 0.2,
    supportEnabled: true,
    overhangAreaCm2: 7_300_000,
    hourlyRateKr: 5000,
    fdmLaborCostKrw: 6500,
    applyVat: true,
    minPriceKr: 0,
})
assert.ok(
    inflatedTiny.total < 2_000_000,
    `inflated surface on ~1kg model should not explode, got ₩${Math.round(inflatedTiny.total)}`
)
assert.ok(
    inflatedTiny.costBreakdown.support <= inflatedTiny.costBreakdown.material * 3 + 5_000 + 1,
    'support cost capped vs material'
)

const screenshotGeo = sanitizeGeometryAnalysis({
    volume: 81833.71,
    surfaceArea: 24_473_147,
    overhangArea: 7_341_944,
    boundingBox: { x: 655.25, y: 812.35, z: 500 },
})
const fitPct = meshyAutoFitScalePercent(
    Math.max(screenshotGeo.boundingBox.x, screenshotGeo.boundingBox.y, screenshotGeo.boundingBox.z),
    'fdm'
)
assert.ok(fitPct != null && fitPct < 30, `auto-fit scale expected ~14%, got ${fitPct}`)
const fittedGeo = applyTransformToAnalysis(screenshotGeo, {
    scalePercent: fitPct!,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    snapToBed: true,
})
const fittedQuote = calculateFdmQuote({
    volumeCm3: fittedGeo.volume,
    surfaceAreaCm2: fittedGeo.surfaceArea,
    heightMm: fittedGeo.boundingBox.z,
    density: 1.24,
    pricePerGramKr: 50,
    infillPercent: 20,
    layerHeightMm: 0.2,
    supportEnabled: true,
    overhangAreaCm2: fittedGeo.overhangArea,
    hourlyRateKr: 5000,
    fdmLaborCostKrw: 6500,
    applyVat: true,
    minPriceKr: 0,
})
assert.ok(
    fittedQuote.total < 250_000,
    `auto-fitted screenshot model quote too high, got ₩${Math.round(fittedQuote.total)}`
)

console.log('OK fdm-quote tests passed')
console.log(
    JSON.stringify(
        {
            weight10: +w10.weightGrams.toFixed(2),
            weight20: +w20.weightGrams.toFixed(2),
            weight100: +w100.weightGrams.toFixed(2),
            subtotal20: Math.round(q20.subtotal),
            subtotal100: Math.round(q100.subtotal),
            hours20: +q20.timeHours.toFixed(3),
            hours100: +q100.timeHours.toFixed(3),
            hoursSupport: +qSupport.timeHours.toFixed(3),
            mask: {
                modelG: +mask.weightGrams.toFixed(1),
                supportG: +mask.supportGrams.toFixed(1),
                hours: +mask.timeHours.toFixed(2),
                ui: formatEstimatedPrintTime(mask.timeHours),
            },
        },
        null,
        2
    )
)
