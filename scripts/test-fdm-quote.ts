/**
 * FDM 견적 모듈 스모크 테스트
 * 실행: npx --yes tsx scripts/test-fdm-quote.ts
 */
import assert from 'node:assert/strict'
import {
    calculateFdmQuote,
    estimateFdmWeightGrams,
    FDM_INFILL_DEFAULT,
    FDM_INFILL_PRESETS,
} from '../lib/fdm-quote'

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

const withVat = calculateFdmQuote({ ...base, infillPercent: FDM_INFILL_DEFAULT, applyVat: true, minPriceKr: 0 })
assert.ok(withVat.total >= withVat.subtotal * 1.09, 'VAT should increase total')

assert.equal(FDM_INFILL_PRESETS.length, 3)
assert.deepEqual(
    FDM_INFILL_PRESETS.map((p) => p.percent),
    [20, 40, 80]
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
        },
        null,
        2
    )
)
