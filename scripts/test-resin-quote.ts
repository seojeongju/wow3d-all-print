/**
 * SLA/DLP 견적 모듈 스모크 테스트
 * 실행: npx --yes tsx scripts/test-resin-quote.ts
 */
import assert from 'node:assert/strict'
import {
    calculateResinQuote,
    SLA_LAYER_DEFAULT,
    snapSlaLayerHeight,
} from '../lib/resin-quote'

const base = {
    volumeCm3: 8,
    heightMm: 35,
    layerHeightMm: SLA_LAYER_DEFAULT,
    pricePerMlKr: 150,
    postProcessing: false,
    hourlyRateKr: 8000,
    layerExposureSec: 8,
    laborCostKrw: 9100,
    consumablesKrw: 3900,
    postProcessKrw: 10400,
    applyVat: false as const,
}

const sla = calculateResinQuote({ ...base, method: 'sla' })
const dlp = calculateResinQuote({
    ...base,
    method: 'dlp',
    hourlyRateKr: 9000,
    layerExposureSec: 3,
})

assert.ok(sla.volumeMl === 8, 'volumeMl equals volumeCm3')
assert.ok(sla.subtotal > 0, 'sla subtotal > 0')
assert.ok(dlp.subtotal > 0, 'dlp subtotal > 0')
assert.ok(dlp.timeHours < sla.timeHours, 'dlp faster than sla for same model')
assert.ok(sla.costBreakdown.material === 8 * 150, 'material = price × volume')

const withPost = calculateResinQuote({ ...base, method: 'sla', postProcessing: true })
assert.ok(withPost.subtotal > sla.subtotal, 'post-processing increases subtotal')
assert.ok(withPost.costBreakdown.other > sla.costBreakdown.other)

const thinLayer = calculateResinQuote({ ...base, method: 'sla', layerHeightMm: 0.025 })
const thickLayer = calculateResinQuote({ ...base, method: 'sla', layerHeightMm: 0.1 })
assert.ok(thinLayer.timeHours > thickLayer.timeHours, 'thinner layer => longer time')

const withVat = calculateResinQuote({ ...base, method: 'sla', applyVat: true, minPriceKr: 0 })
assert.ok(withVat.total >= withVat.subtotal * 1.09, 'VAT should increase total')

assert.equal(snapSlaLayerHeight(0.05), 0.05)
assert.equal(snapSlaLayerHeight(0.03), null)

console.log('OK resin-quote tests passed')
console.log(
    JSON.stringify(
        {
            slaSubtotal: Math.round(sla.subtotal),
            dlpSubtotal: Math.round(dlp.subtotal),
            slaHours: +sla.timeHours.toFixed(3),
            dlpHours: +dlp.timeHours.toFixed(3),
            postDelta: Math.round(withPost.subtotal - sla.subtotal),
        },
        null,
        2
    )
)
