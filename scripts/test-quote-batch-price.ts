/**
 * 다파일 배치 가격(hybrid / 소재묶음 / 라인별) 단위 테스트
 * 실행: npx --yes tsx scripts/test-quote-batch-price.ts
 */
import assert from 'node:assert/strict'
import {
    priceCartLinesByMaterialGroup,
    resolvePricingGroupKey,
    parseBatchMinPriceMode,
    DEFAULT_BATCH_MIN_PRICE_MODE,
    type CartBatchLineInput,
} from '../lib/quote-batch-price'
import { resolveEffectiveMinPriceKrw } from '../lib/min-price'

const bedFdm = { fdm: { x: 220, y: 220, z: 250 } }

function line(
    key: string,
    opts: Partial<CartBatchLineInput> & Pick<CartBatchLineInput, 'quantity'>
): CartBatchLineInput {
    return {
        key,
        printMethod: 'fdm',
        material: 'pla',
        totalPriceKrw: 22000,
        variableCostKrw: 3000,
        setupCostKrw: 6500,
        minPriceKrw: 20000,
        printSizeMm: { x: 50, y: 50, z: 20 },
        ...opts,
    }
}

assert.equal(parseBatchMinPriceMode(null), DEFAULT_BATCH_MIN_PRICE_MODE)
assert.equal(parseBatchMinPriceMode('hybrid'), 'hybrid')
assert.equal(parseBatchMinPriceMode('once_per_material'), 'once_per_material')
assert.equal(DEFAULT_BATCH_MIN_PRICE_MODE, 'hybrid')

// 소형 2파일·최소금액대: once_per_material → 최소 1회(≈반값)
const smallA = line('a', { quantity: 1, variableCostKrw: 2000, setupCostKrw: 6500 })
const smallB = line('b', { quantity: 1, variableCostKrw: 2500, setupCostKrw: 6500 })
const aloneSum = priceCartLinesByMaterialGroup(
    [smallA, smallB],
    { applyVat: true, minPriceMode: 'once_per_quote_line' }
).grandTotalKrw
const materialOnce = priceCartLinesByMaterialGroup(
    [smallA, smallB],
    { applyVat: true, minPriceMode: 'once_per_material', bedMaxByMethod: bedFdm }
).grandTotalKrw
assert.ok(aloneSum > materialOnce, '라인별 합 > 소재 1회 묶음')
assert.ok(materialOnce / aloneSum <= 0.55, `소형 묶음은 거의 반값에 가깝다 (실제 ${materialOnce}/${aloneSum})`)

// hybrid + 작은 발자국 → 묶음 허용 (소재 그룹)
const hybridSmall = priceCartLinesByMaterialGroup(
    [smallA, smallB],
    { applyVat: true, minPriceMode: 'hybrid', bedMaxByMethod: bedFdm }
)
assert.equal(hybridSmall.groups.length, 1, '작은 2파일은 한 그룹')
assert.equal(hybridSmall.grandTotalKrw, materialOnce)

// hybrid + 베드 초과 1파일 → solo
const oversized = line('big', {
    quantity: 1,
    printSizeMm: { x: 300, y: 150, z: 9 },
    variableCostKrw: 40000,
    setupCostKrw: 6500,
})
const fit = line('fit', {
    quantity: 1,
    printSizeMm: { x: 40, y: 40, z: 10 },
    variableCostKrw: 40000,
    setupCostKrw: 6500,
})
assert.equal(
    resolvePricingGroupKey(oversized, { minPriceMode: 'hybrid', bedMaxByMethod: bedFdm }),
    'solo:big'
)
assert.equal(
    resolvePricingGroupKey(fit, { minPriceMode: 'hybrid', bedMaxByMethod: bedFdm }),
    'fdm:pla'
)
const hybridMix = priceCartLinesByMaterialGroup(
    [oversized, fit],
    { applyVat: true, minPriceMode: 'hybrid', bedMaxByMethod: bedFdm }
)
assert.ok(hybridMix.groups.length >= 2, '베드 초과면 그룹 분리')
const materialMix = priceCartLinesByMaterialGroup(
    [oversized, fit],
    { applyVat: true, minPriceMode: 'once_per_material', bedMaxByMethod: bedFdm }
)
assert.ok(
    hybridMix.grandTotalKrw > materialMix.grandTotalKrw,
    'hybrid(분리)가 once_per_material보다 비쌈'
)

// hybrid + footprint 합이 베드 면적 초과 → 라인별 분리
const plateA = line('p1', {
    quantity: 1,
    printSizeMm: { x: 180, y: 180, z: 20 },
    variableCostKrw: 5000,
})
const plateB = line('p2', {
    quantity: 1,
    printSizeMm: { x: 180, y: 180, z: 20 },
    variableCostKrw: 5000,
})
const hybridFoot = priceCartLinesByMaterialGroup(
    [plateA, plateB],
    { applyVat: true, minPriceMode: 'hybrid', bedMaxByMethod: bedFdm, bedAreaFillRatio: 0.9 }
)
assert.equal(hybridFoot.groups.length, 2, '발자국 합 초과 시 2그룹')
const aloneFoot = priceCartLinesByMaterialGroup(
    [plateA, plateB],
    { applyVat: true, minPriceMode: 'once_per_quote_line' }
).grandTotalKrw
assert.equal(hybridFoot.grandTotalKrw, aloneFoot)

// AMR형: 둘 다 300×150 → 각각 solo (베드 220 기준)
const va = line('va', {
    quantity: 1,
    printSizeMm: { x: 300, y: 150, z: 9 },
    variableCostKrw: 40000,
    setupCostKrw: 6500,
    minPriceKrw: 20000,
})
const ga = line('ga', {
    quantity: 1,
    printSizeMm: { x: 300, y: 150, z: 9 },
    variableCostKrw: 40000,
    setupCostKrw: 6500,
    minPriceKrw: 20000,
})
const amrHybrid = priceCartLinesByMaterialGroup(
    [va, ga],
    { applyVat: true, minPriceMode: 'hybrid', bedMaxByMethod: bedFdm }
)
const amrAlone = priceCartLinesByMaterialGroup(
    [va, ga],
    { applyVat: true, minPriceMode: 'once_per_quote_line' }
)
assert.equal(amrHybrid.groups.length, 2, 'AMR형 대형 2파일은 hybrid에서 분리')
assert.equal(amrHybrid.grandTotalKrw, amrAlone.grandTotalKrw)

// WOW2610193A10MH 재현: 소형 PLA 2파일 묶음은 고객 최소 22,000원 이상
const realA: CartBatchLineInput = {
    key: 864,
    printMethod: 'fdm',
    material: 'PLA',
    quantity: 1,
    totalPriceKrw: 22000,
    variableCostKrw: 3583.3396691274306,
    setupCostKrw: 6500,
    minPriceKrw: 20000,
    printSizeMm: { x: 3.05, y: 31.5, z: 32.5 },
}
const realB: CartBatchLineInput = {
    key: 866,
    printMethod: 'fdm',
    material: 'PLA',
    quantity: 1,
    totalPriceKrw: 22000,
    variableCostKrw: 4478.212607385838,
    setupCostKrw: 6500,
    minPriceKrw: 20000,
    printSizeMm: { x: 6, y: 44, z: 42 },
}
const realBatch = priceCartLinesByMaterialGroup([realA, realB], {
    applyVat: true,
    minPriceMode: 'hybrid',
    bedMaxByMethod: bedFdm,
})
assert.equal(realBatch.groups.length, 1, '소형 PLA 2파일은 한 그룹')
assert.ok(realBatch.grandTotalKrw >= 22000, `묶음 최소 미달: ${realBatch.grandTotalKrw}`)
assert.equal(realBatch.grandTotalKrw, 22000)
assert.equal(realBatch.groups[0]?.minApplied, true)

// min 누락 시(버그 경로)에는 22,000 미만이 될 수 있음 — 주문 서버는 장비 최소로 보완
const noMinBatch = priceCartLinesByMaterialGroup(
    [
        { ...realA, minPriceKrw: null },
        { ...realB, minPriceKrw: null },
    ],
    { applyVat: true, minPriceMode: 'hybrid', bedMaxByMethod: bedFdm }
)
assert.ok(noMinBatch.grandTotalKrw < 22000, 'min 없으면 과소 가능(서버 폴백 필요)')

// 같은 FDM이라도 소재별 기본금액이 다르면 그룹마다 다른 최소 적용
const plaMin = line('pla1', {
    quantity: 1,
    material: 'PLA',
    variableCostKrw: 1000,
    setupCostKrw: 6500,
    minPriceKrw: 20000,
    printSizeMm: { x: 30, y: 30, z: 10 },
})
const absMin = line('abs1', {
    quantity: 1,
    material: 'ABS',
    variableCostKrw: 1000,
    setupCostKrw: 6500,
    minPriceKrw: 30000,
    printSizeMm: { x: 30, y: 30, z: 10 },
})
const materialDiffMins = priceCartLinesByMaterialGroup([plaMin, absMin], {
    applyVat: true,
    minPriceMode: 'once_per_material',
    bedMaxByMethod: bedFdm,
})
assert.equal(materialDiffMins.groups.length, 2, 'PLA·ABS는 별도 그룹')
assert.equal(materialDiffMins.grandTotalKrw, 55000, '소재별 최소 2만+3만 + VAT')

assert.equal(resolveEffectiveMinPriceKrw(25000, 20000), 25000, '소재 우선')
assert.equal(resolveEffectiveMinPriceKrw(null, 20000), 20000, '장비 폴백')
assert.equal(resolveEffectiveMinPriceKrw(undefined, null), undefined, '둘 다 없으면 undefined')

console.log('test-quote-batch-price: OK')
console.log({
    aloneSum,
    materialOnce,
    hybridSmall: hybridSmall.grandTotalKrw,
    hybridMix: hybridMix.grandTotalKrw,
    materialMix: materialMix.grandTotalKrw,
    amrHybrid: amrHybrid.grandTotalKrw,
    realBatch: realBatch.grandTotalKrw,
    noMinBatch: noMinBatch.grandTotalKrw,
    materialDiffMins: materialDiffMins.grandTotalKrw,
})
