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
assert.ok(qSupport.timeHours > q20.timeHours, 'support should increase print time')
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
    hourlyRateKr: 5000,
    fdmLaborCostKrw: 6500,
    applyVat: false,
})
assert.ok(mask.supportGrams > mask.weightGrams * 0.8, 'heavy-support geometry')
assert.ok(mask.timeHours > 6.5 && mask.timeHours < 8.5, `mask time ~Bambu 7h, got ${mask.timeHours}`)
// Bambu Studio 동일 조건 실측 ≈ 7h12m — 자동견적이 근사 범위에 들어야 함
assert.ok(Math.abs(mask.timeHours - 7.2) < 0.5, `mask within ±30m of Bambu 7.2h, got ${mask.timeHours}`)
assert.ok(Math.abs(mask.supportGrams - 154) < 25, `support grams near Bambu 154g, got ${mask.supportGrams}`)

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
    Math.max(screenshotGeo.boundingBox.x, screenshotGeo.boundingBox.y, screenshotGeo.boundingBox.z)
)
assert.ok(fitPct != null && fitPct < 30, `auto-fit scale expected ~18%, got ${fitPct}`)
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
