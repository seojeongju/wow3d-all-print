/**
 * FDM / SLA / DLP 견적 비율·캘리브레이션 리포트
 * 실행: npx --yes tsx scripts/calibrate-quotes.ts
 *
 * 목표 비율(관리자 설정 가이드): DLP ≈ FDM×3.5, SLA ≈ FDM×6
 * 슬라이서 실측 비교: scripts/calibrate-samples.json (선택)
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { calculateFdmQuote, FDM_INFILL_DEFAULT } from '../lib/fdm-quote'
import { calculateResinQuote, SLA_LAYER_DEFAULT } from '../lib/resin-quote'

const TARGET_DLP_RATIO = 3.5
const TARGET_SLA_RATIO = 6
const OK_BAND = 0.1 // ±10%

type RefModel = {
    name: string
    volumeCm3: number
    surfaceAreaCm2: number
    heightMm: number
}

/** 관리자 PricingCalculator 기본값과 동일한 대표 파라미터 */
const DEFAULTS = {
    fdm: {
        density: 1.24,
        pricePerGramKr: 50,
        infillPercent: FDM_INFILL_DEFAULT,
        layerHeightMm: 0.2,
        hourlyRateKr: 5000,
        fdmLaborCostKrw: 6500,
        fdmSupportPerCm2Krw: 26,
        fdmLayerHoursFactor: 0.02,
    },
    sla: {
        pricePerMlKr: 150,
        layerHeightMm: SLA_LAYER_DEFAULT,
        hourlyRateKr: 11100,
        layerExposureSec: 9,
        laborCostKrw: 10700,
        consumablesKrw: 3900,
        postProcessKrw: 10400,
        postProcessing: false,
    },
    dlp: {
        pricePerMlKr: 150,
        layerHeightMm: SLA_LAYER_DEFAULT,
        hourlyRateKr: 7100,
        layerExposureSec: 3,
        laborCostKrw: 9100,
        consumablesKrw: 3900,
        postProcessKrw: 10400,
        postProcessing: false,
    },
}

const REF_MODELS: RefModel[] = [
    { name: '소형 (10cm³ / H40)', volumeCm3: 10, surfaceAreaCm2: 50, heightMm: 40 },
    { name: '중형 (30cm³ / H80)', volumeCm3: 30, surfaceAreaCm2: 120, heightMm: 80 },
    { name: '대형 (80cm³ / H120)', volumeCm3: 80, surfaceAreaCm2: 280, heightMm: 120 },
]

type SlicerSample = {
    model: string
    method: 'fdm' | 'sla' | 'dlp'
    materialAmount?: number | null
    hours?: number | null
    volumeCm3?: number
    surfaceAreaCm2?: number
    heightMm?: number
    file?: string
    notes?: string
}

function refFromSample(s: SlicerSample): RefModel | null {
    if (s.volumeCm3 != null && s.heightMm != null) {
        return {
            name: s.file ?? s.model,
            volumeCm3: s.volumeCm3,
            surfaceAreaCm2: s.surfaceAreaCm2 ?? s.volumeCm3 * 5,
            heightMm: s.heightMm,
        }
    }
    return REF_MODELS.find((m) => m.name.startsWith(s.model) || m.name.includes(s.model)) ?? null
}

function fmtKr(n: number) {
    return `₩${Math.round(n).toLocaleString('ko-KR')}`
}

function ratioStatus(actual: number, target: number) {
    const lo = target * (1 - OK_BAND)
    const hi = target * (1 + OK_BAND)
    if (actual >= lo && actual <= hi) return '✓'
    if (actual < lo) return '↓ 낮음'
    return '↑ 높음'
}

function quoteFdm(m: RefModel, infill = DEFAULTS.fdm.infillPercent) {
    return calculateFdmQuote({
        volumeCm3: m.volumeCm3,
        surfaceAreaCm2: m.surfaceAreaCm2,
        heightMm: m.heightMm,
        density: DEFAULTS.fdm.density,
        pricePerGramKr: DEFAULTS.fdm.pricePerGramKr,
        infillPercent: infill,
        layerHeightMm: DEFAULTS.fdm.layerHeightMm,
        supportEnabled: false,
        hourlyRateKr: DEFAULTS.fdm.hourlyRateKr,
        fdmLaborCostKrw: DEFAULTS.fdm.fdmLaborCostKrw,
        fdmSupportPerCm2Krw: DEFAULTS.fdm.fdmSupportPerCm2Krw,
        fdmLayerHoursFactor: DEFAULTS.fdm.fdmLayerHoursFactor,
        applyVat: false,
    })
}

function quoteSla(m: RefModel, post = DEFAULTS.sla.postProcessing) {
    return calculateResinQuote({
        method: 'sla',
        volumeCm3: m.volumeCm3,
        heightMm: m.heightMm,
        layerHeightMm: DEFAULTS.sla.layerHeightMm,
        pricePerMlKr: DEFAULTS.sla.pricePerMlKr,
        postProcessing: post,
        hourlyRateKr: DEFAULTS.sla.hourlyRateKr,
        layerExposureSec: DEFAULTS.sla.layerExposureSec,
        laborCostKrw: DEFAULTS.sla.laborCostKrw,
        consumablesKrw: DEFAULTS.sla.consumablesKrw,
        postProcessKrw: DEFAULTS.sla.postProcessKrw,
        applyVat: false,
    })
}

function quoteDlp(m: RefModel, post = DEFAULTS.dlp.postProcessing) {
    return calculateResinQuote({
        method: 'dlp',
        volumeCm3: m.volumeCm3,
        heightMm: m.heightMm,
        layerHeightMm: DEFAULTS.dlp.layerHeightMm,
        pricePerMlKr: DEFAULTS.dlp.pricePerMlKr,
        postProcessing: post,
        hourlyRateKr: DEFAULTS.dlp.hourlyRateKr,
        layerExposureSec: DEFAULTS.dlp.layerExposureSec,
        laborCostKrw: DEFAULTS.dlp.laborCostKrw,
        consumablesKrw: DEFAULTS.dlp.consumablesKrw,
        postProcessKrw: DEFAULTS.dlp.postProcessKrw,
        applyVat: false,
    })
}

console.log('=== WOW3D 견적 캘리브레이션 리포트 ===\n')
console.log(`목표: DLP ≈ FDM×${TARGET_DLP_RATIO}, SLA ≈ FDM×${TARGET_SLA_RATIO} (±${OK_BAND * 100}%)\n`)

console.log('--- 1. 대표 모델 비율 (공급가, VAT 제외) ---')
console.log('모델 | FDM | DLP | SLA | DLP/FDM | SLA/FDM | DLP상태 | SLA상태')
for (const m of REF_MODELS) {
    const fdm = quoteFdm(m)
    const dlp = quoteDlp(m)
    const sla = quoteSla(m)
    const dlpR = fdm.subtotal > 0 ? dlp.subtotal / fdm.subtotal : 0
    const slaR = fdm.subtotal > 0 ? sla.subtotal / fdm.subtotal : 0
    console.log(
        [
            m.name.padEnd(22),
            fmtKr(fdm.subtotal).padStart(10),
            fmtKr(dlp.subtotal).padStart(10),
            fmtKr(sla.subtotal).padStart(10),
            dlpR.toFixed(2).padStart(7),
            slaR.toFixed(2).padStart(7),
            ratioStatus(dlpR, TARGET_DLP_RATIO).padStart(8),
            ratioStatus(slaR, TARGET_SLA_RATIO).padStart(8),
        ].join(' | ')
    )
}

console.log('\n--- 2. FDM 인필 민감도 (중형 모델) ---')
const mid = REF_MODELS[1]
console.log('인필% | 무게(g) | 공급가 | 시간(h)')
for (const infill of [10, 20, 40, 80, 100]) {
    const q = quoteFdm(mid, infill)
    console.log(
        `${String(infill).padStart(4)} | ${q.weightGrams.toFixed(1).padStart(7)} | ${fmtKr(q.subtotal).padStart(8)} | ${q.timeHours.toFixed(2)}`
    )
}

console.log('\n--- 3. 레진 레이어 두께 민감도 (중형, SLA) ---')
console.log('레이어(mm) | 레이어수 | 공급가 | 시간(h)')
for (const lh of [0.025, 0.05, 0.1]) {
    const q = calculateResinQuote({
        method: 'sla',
        volumeCm3: mid.volumeCm3,
        heightMm: mid.heightMm,
        layerHeightMm: lh,
        pricePerMlKr: DEFAULTS.sla.pricePerMlKr,
        postProcessing: false,
        hourlyRateKr: DEFAULTS.sla.hourlyRateKr,
        layerExposureSec: DEFAULTS.sla.layerExposureSec,
        laborCostKrw: DEFAULTS.sla.laborCostKrw,
        consumablesKrw: DEFAULTS.sla.consumablesKrw,
        postProcessKrw: DEFAULTS.sla.postProcessKrw,
        applyVat: false,
    })
    console.log(
        `${lh.toFixed(3).padStart(9)} | ${String(q.numLayers).padStart(8)} | ${fmtKr(q.subtotal).padStart(8)} | ${q.timeHours.toFixed(2)}`
    )
}

console.log('\n--- 4. 후가공 영향 (중형) ---')
const baseSla = quoteSla(mid, false)
const postSla = quoteSla(mid, true)
const baseDlp = quoteDlp(mid, false)
const postDlp = quoteDlp(mid, true)
console.log(`SLA  미적용 ${fmtKr(baseSla.subtotal)} → 적용 ${fmtKr(postSla.subtotal)} (+${fmtKr(postSla.subtotal - baseSla.subtotal)})`)
console.log(`DLP  미적용 ${fmtKr(baseDlp.subtotal)} → 적용 ${fmtKr(postDlp.subtotal)} (+${fmtKr(postDlp.subtotal - baseDlp.subtotal)})`)

const samplesPath = resolve(__dirname, 'calibrate-samples.json')
if (existsSync(samplesPath)) {
    console.log('\n--- 5. 슬라이서 실측 비교 (calibrate-samples.json) ---')
    const raw = JSON.parse(readFileSync(samplesPath, 'utf8')) as { samples?: SlicerSample[] }
    const samples = raw.samples ?? []
    if (!samples.length) {
        console.log('(samples 배열이 비어 있습니다)')
    } else {
        console.log('모델 | 방식 | 슬라이서재료 | 자동견적재료 | 재료오차% | 슬라이서시간 | 자동시간 | 시간오차%')
        for (const s of samples) {
            const model = refFromSample(s)
            if (!model) {
                console.log(`${s.model} | ${s.method} | (모델 치수 없음 — volumeCm3/heightMm 추가 또는 REF_MODELS name 확인)`)
                continue
            }
            let autoMaterial = 0
            let autoHours = 0
            if (s.method === 'fdm') {
                const q = quoteFdm(model)
                autoMaterial = q.weightGrams
                autoHours = q.timeHours
            } else if (s.method === 'sla') {
                const q = quoteSla(model)
                autoMaterial = q.volumeMl
                autoHours = q.timeHours
            } else {
                const q = quoteDlp(model)
                autoMaterial = q.volumeMl
                autoHours = q.timeHours
            }
            const matErr =
                s.materialAmount != null && s.materialAmount > 0
                    ? (((autoMaterial - s.materialAmount) / s.materialAmount) * 100).toFixed(1)
                    : '-'
            const timeErr =
                s.hours != null && s.hours > 0
                    ? (((autoHours - s.hours) / s.hours) * 100).toFixed(1)
                    : '-'
            console.log(
                [
                    s.model,
                    s.method.toUpperCase(),
                    s.materialAmount?.toFixed(1) ?? '-',
                    autoMaterial.toFixed(1),
                    matErr,
                    s.hours?.toFixed(2) ?? '-',
                    autoHours.toFixed(2),
                    timeErr,
                ].join(' | ')
            )
        }
    }
} else {
    console.log('\n--- 5. 슬라이서 실측 비교 ---')
    console.log('scripts/calibrate-samples.json 을 만들면 슬라이서 실측과 자동견적 오차를 표시합니다.')
}

console.log('\n조정 레버: docs/QUOTE_FDM_SLA_DLP_RATIO_PROPOSAL.md')
console.log('완료.')
