/**
 * AMR zig 샘플 + 다파일 배치 가격 분석
 * 실행: npx --yes tsx scripts/analyze-amr-multi-quote.ts
 *
 * public/AMR_*_zig_Black.3mf 필요. 고객 샘플은 커밋하지 말 것.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import * as THREE from 'three'
import { parseThreeMF } from '../lib/threemf-fast-parser'
import { analyzeGeometry } from '../lib/geometry'
import { calculateFdmQuote } from '../lib/fdm-quote'
import { priceCartLinesByMaterialGroup, calculateQuoteBatchPrice } from '../lib/quote-batch-price'

const MIN_PRICE = 20_000
const LABOR = 6_500
const HOURLY = 5_000
const SUPPORT_CM2 = 26
const DENSITY = 1.24
const PRICE_G = 50

const FILES = [
    resolve('public/AMR_VA_zig_Black.3mf'),
    resolve('public/AMR_GA_zig_Black.3mf'),
]

/** Creality Print 스크린샷 실측 (0.2mm · 인필 70%) */
const SLICER_REF = {
    AMR_VA_zig_Black: {
        hours: 6 + 23 / 60,
        grams: 94.48,
        supportGrams: 19.48 + 4.5,
        note: 'K1 Max · 플레이트 경계 경고 · 서포트 비중 큼',
    },
    AMR_GA_zig_Black: {
        hours: 1 + 19 / 60,
        grams: 51.06,
        note: '0.2mm Standard · 인필 70%',
    },
} as const

function quoteAt(analysis: ReturnType<typeof analyzeGeometry>, infill: number) {
    return calculateFdmQuote({
        volumeCm3: analysis.volume,
        surfaceAreaCm2: analysis.surfaceArea,
        heightMm: analysis.boundingBox.z,
        density: DENSITY,
        pricePerGramKr: PRICE_G,
        infillPercent: infill,
        layerHeightMm: 0.2,
        supportEnabled: true,
        overhangAreaCm2: analysis.overhangArea ?? 0,
        hourlyRateKr: HOURLY,
        fdmLaborCostKrw: LABOR,
        fdmSupportPerCm2Krw: SUPPORT_CM2,
        applyVat: true,
        minPriceKr: MIN_PRICE,
        lateralAreaCm2: analysis.lateralArea,
        topAreaCm2: analysis.topArea,
        bottomAreaCm2: analysis.bottomArea,
        bedAreaCm2: analysis.bedArea,
        slowWallAreaCm2: analysis.slowWallArea,
        curvedWallAreaCm2: analysis.curvedWallArea,
        contourLoopsMm: analysis.contourLoops,
        supportVolumeCm3: analysis.supportVolume,
        supportColumnMm: analysis.supportColumnMm,
        partCount: analysis.partCount,
        partHeightSumMm: analysis.partHeightSum,
        partSpacingMm: analysis.partSpacing,
    })
}

function loadThreeMf(path: string): THREE.BufferGeometry {
    const buf = readFileSync(path)
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    const parsed = parseThreeMF(ab)
    if (!parsed) throw new Error(`3MF 해석 실패: ${path}`)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(parsed.position, 3))
    geo.setIndex(new THREE.BufferAttribute(parsed.index, 1))
    geo.center()
    geo.computeVertexNormals()
    return geo
}

async function analyzeFile(path: string) {
    const geo = loadThreeMf(path)
    const a = analyzeGeometry(geo)
    const base = path.split(/[/\\]/).pop()!.replace(/\.3mf$/i, '')
    const q15 = quoteAt(a, 15)
    const q70 = quoteAt(a, 70)
    const slicer = SLICER_REF[base as keyof typeof SLICER_REF]
    return {
        file: base,
        volumeCm3: round(a.volume, 2),
        surfaceAreaCm2: round(a.surfaceArea, 1),
        boxMm: {
            x: round(a.boundingBox.x, 1),
            y: round(a.boundingBox.y, 1),
            z: round(a.boundingBox.z, 1),
        },
        overhangCm2: round(a.overhangArea ?? 0, 1),
        our15: summarizeQuote(q15),
        our70: summarizeQuote(q70),
        slicer,
        vsSlicer70: slicer
            ? {
                  hoursRatio: round(q70.timeHours / slicer.hours, 2),
                  gramsRatio: round(q70.weightGrams / slicer.grams, 2),
              }
            : null,
    }
}

function summarizeQuote(q: ReturnType<typeof calculateFdmQuote>) {
    return {
        totalKrw: q.total,
        hours: round(q.timeHours, 2),
        grams: round(q.weightGrams, 1),
        variableCostKrw: q.variableCostKrw,
        setupCostKrw: q.setupCostKrw,
        costBreakdown: q.costBreakdown,
    }
}

function round(n: number, d: number) {
    const f = 10 ** d
    return Math.round(n * f) / f
}

async function main() {
    const missing = FILES.filter((f) => !existsSync(f))
    if (missing.length) {
        console.error('파일 없음:', missing.join(', '))
        process.exit(1)
    }

    const rows = []
    for (const f of FILES) {
        console.log('분석 중…', f)
        rows.push(await analyzeFile(f))
    }

    const cart70 = priceCartLinesByMaterialGroup(
        rows.map((r, i) => ({
            key: i,
            printMethod: 'fdm',
            material: 'pla',
            quantity: 1,
            totalPriceKrw: r.our70.totalKrw,
            variableCostKrw: r.our70.variableCostKrw,
            setupCostKrw: r.our70.setupCostKrw,
            minPriceKrw: MIN_PRICE,
        })),
        { applyVat: true }
    )
    const soloSum70 = rows.reduce((s, r) => s + r.our70.totalKrw, 0)

    const cart15 = priceCartLinesByMaterialGroup(
        rows.map((r, i) => ({
            key: i,
            printMethod: 'fdm',
            material: 'pla',
            quantity: 1,
            totalPriceKrw: r.our15.totalKrw,
            variableCostKrw: r.our15.variableCostKrw,
            setupCostKrw: r.our15.setupCostKrw,
            minPriceKrw: MIN_PRICE,
        })),
        { applyVat: true }
    )
    const soloSum15 = rows.reduce((s, r) => s + r.our15.totalKrw, 0)

    const synthetic = [
        { name: '둘 다 최소금액대', v1: 4000, v2: 5000 },
        { name: '중간 변동비', v1: 12000, v2: 15000 },
        { name: '높은 변동비', v1: 25000, v2: 30000 },
    ].map(({ name, v1, v2 }) => {
        const s1 = calculateQuoteBatchPrice({
            variableCostKrw: v1,
            setupCostKrw: LABOR,
            minPriceKrw: MIN_PRICE,
            quantity: 1,
            applyVat: true,
        }).lineTotalKrw
        const s2 = calculateQuoteBatchPrice({
            variableCostKrw: v2,
            setupCostKrw: LABOR,
            minPriceKrw: MIN_PRICE,
            quantity: 1,
            applyVat: true,
        }).lineTotalKrw
        const cart = priceCartLinesByMaterialGroup(
            [
                {
                    key: 'a',
                    printMethod: 'fdm',
                    material: 'pla',
                    quantity: 1,
                    totalPriceKrw: s1,
                    variableCostKrw: v1,
                    setupCostKrw: LABOR,
                    minPriceKrw: MIN_PRICE,
                },
                {
                    key: 'b',
                    printMethod: 'fdm',
                    material: 'pla',
                    quantity: 1,
                    totalPriceKrw: s2,
                    variableCostKrw: v2,
                    setupCostKrw: LABOR,
                    minPriceKrw: MIN_PRICE,
                },
            ],
            { applyVat: true }
        )
        return {
            name,
            soloSum: s1 + s2,
            cartTotal: cart.grandTotalKrw,
            ratio: round(cart.grandTotalKrw / (s1 + s2), 3),
            savedKrw: s1 + s2 - cart.grandTotalKrw,
        }
    })

    const out = {
        generatedAt: new Date().toISOString(),
        assumptions: {
            minPriceKrw: MIN_PRICE,
            laborSetupKrw: LABOR,
            hourlyRateKr: HOURLY,
            density: DENSITY,
            pricePerGram: PRICE_G,
            note: '장바구니 동일 FDM+소재 시 셋업·최소금액 1회만 적용 (quote-batch-price)',
        },
        files: rows,
        multiFile: {
            infill70: {
                soloSumKrw: soloSum70,
                cartTotalKrw: cart70.grandTotalKrw,
                ratio: round(cart70.grandTotalKrw / soloSum70, 3),
                savedKrw: soloSum70 - cart70.grandTotalKrw,
                groups: cart70.groups,
                lines: cart70.lines,
            },
            infill15: {
                soloSumKrw: soloSum15,
                cartTotalKrw: cart15.grandTotalKrw,
                ratio: round(cart15.grandTotalKrw / soloSum15, 3),
                savedKrw: soloSum15 - cart15.grandTotalKrw,
            },
        },
        syntheticBatchEffect: synthetic,
    }

    const outPath = resolve('scripts/amr-multi-quote-report.json')
    writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8')
    console.log('\n=== 단건 vs 장바구니(동일 FDM·PLA) ===')
    console.log(
        `인필 70%: 단건합 ${soloSum70.toLocaleString()} → 장바구니 ${cart70.grandTotalKrw.toLocaleString()} (${out.multiFile.infill70.ratio}배, ${out.multiFile.infill70.savedKrw.toLocaleString()}원 절감)`
    )
    console.log(
        `인필 15%: 단건합 ${soloSum15.toLocaleString()} → 장바구니 ${cart15.grandTotalKrw.toLocaleString()} (${out.multiFile.infill15.ratio}배)`
    )
    console.log('\n합성 시나리오(배치 효과):')
    for (const s of synthetic) {
        console.log(
            `  ${s.name}: 단건합 ${s.soloSum} → 카트 ${s.cartTotal} (${s.ratio}배, -${s.savedKrw})`
        )
    }
    console.log('\n리포트:', outPath)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
