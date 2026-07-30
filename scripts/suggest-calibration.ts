/**
 * 슬라이서 실측 vs 자동견적 오차 분석 + SLA/DLP 계수 조정 제안
 * 실행: npx --yes tsx scripts/suggest-calibration.ts
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { calculateFdmQuote, estimateFdmWeightGrams, FDM_INFILL_DEFAULT } from '../lib/fdm-quote'
import { calculateResinQuote, resinDefaults, SLA_LAYER_DEFAULT } from '../lib/resin-quote'

const TARGET_SLA_RATIO = 6
const TARGET_DLP_RATIO = 3.5
const MAT_OK = 20
const TIME_OK = 30

type Sample = {
    model: string
    method: 'fdm' | 'sla' | 'dlp'
    materialAmount: number | null
    hours: number | null
    file?: string
    volumeCm3?: number
    surfaceAreaCm2?: number
    heightMm?: number
}

type RefModel = {
    name: string
    volumeCm3: number
    surfaceAreaCm2: number
    heightMm: number
}

const REF_BY_LABEL: Record<string, RefModel> = {
    소형: { name: '소형', volumeCm3: 10, surfaceAreaCm2: 50, heightMm: 40 },
    중형: { name: '중형', volumeCm3: 30, surfaceAreaCm2: 120, heightMm: 80 },
    대형: { name: '대형', volumeCm3: 80, surfaceAreaCm2: 280, heightMm: 120 },
}

const FDM_DEFAULTS = {
    density: 1.24,
    pricePerGramKr: 50,
    layerHeightMm: 0.2,
    hourlyRateKr: 5000,
    fdmLaborCostKrw: 6500,
}

function resolveModel(s: Sample): RefModel {
    if (s.volumeCm3 != null && s.heightMm != null) {
        return {
            name: s.model,
            volumeCm3: s.volumeCm3,
            surfaceAreaCm2: s.surfaceAreaCm2 ?? s.volumeCm3 * 5,
            heightMm: s.heightMm,
        }
    }
    return REF_BY_LABEL[s.model] ?? REF_BY_LABEL['소형']
}

function autoMaterialAndHours(s: Sample, m: RefModel): { material: number; hours: number } {
    if (s.method === 'fdm') {
        const w = estimateFdmWeightGrams({
            volumeCm3: m.volumeCm3,
            surfaceAreaCm2: m.surfaceAreaCm2,
            density: FDM_DEFAULTS.density,
            infillPercent: FDM_INFILL_DEFAULT,
        })
        const q = calculateFdmQuote({
            volumeCm3: m.volumeCm3,
            surfaceAreaCm2: m.surfaceAreaCm2,
            heightMm: m.heightMm,
            density: FDM_DEFAULTS.density,
            pricePerGramKr: FDM_DEFAULTS.pricePerGramKr,
            infillPercent: FDM_INFILL_DEFAULT,
            layerHeightMm: FDM_DEFAULTS.layerHeightMm,
            supportEnabled: false,
            hourlyRateKr: FDM_DEFAULTS.hourlyRateKr,
            fdmLaborCostKrw: FDM_DEFAULTS.fdmLaborCostKrw,
            applyVat: false,
        })
        return { material: w.weightGrams, hours: q.timeHours }
    }
    const defs = resinDefaults(s.method)
    const q = calculateResinQuote({
        method: s.method,
        volumeCm3: m.volumeCm3,
        heightMm: m.heightMm,
        layerHeightMm: SLA_LAYER_DEFAULT,
        pricePerMlKr: 150,
        postProcessing: false,
        hourlyRateKr: defs.hourlyRateKr,
        layerExposureSec: defs.layerExposureSec,
        laborCostKrw: defs.laborCostKrw,
        consumablesKrw: defs.consumablesKrw,
        postProcessKrw: defs.postProcessKrw,
        applyVat: false,
    })
    return { material: q.volumeMl, hours: q.timeHours }
}

function pctErr(auto: number, slicer: number) {
    if (!slicer) return null
    return ((auto - slicer) / slicer) * 100
}

function status(err: number | null, ok: number) {
    if (err == null) return '-'
    const a = Math.abs(err)
    if (a <= ok) return 'OK'
    if (a <= ok * 1.5) return '주의'
    return '조정필요'
}

const samplesPath = resolve(__dirname, 'calibrate-samples.json')
if (!existsSync(samplesPath)) {
    console.error('calibrate-samples.json 없음. 먼저 npm run calibrate:extract 실행')
    process.exit(1)
}

const raw = JSON.parse(readFileSync(samplesPath, 'utf8')) as { samples?: Sample[] }
const samples = (raw.samples ?? []).filter(
    (s) => s.materialAmount != null && s.hours != null && s.materialAmount > 0 && s.hours > 0
)

console.log('=== 슬라이서 vs 자동견적 오차 분석 ===\n')
console.log('모델 | 방식 | 슬라이서 | 자동 | 재료오차% | 시간오차% | 재료 | 시간')

let matIssues = 0
let timeIssues = 0

for (const s of samples) {
    const m = resolveModel(s)
    const auto = autoMaterialAndHours(s, m)
    const matE = pctErr(auto.material, s.materialAmount!)
    const timeE = pctErr(auto.hours, s.hours!)
    if (status(matE, MAT_OK) !== 'OK') matIssues++
    if (status(timeE, TIME_OK) !== 'OK') timeIssues++

    console.log(
        [
            s.model,
            s.method.toUpperCase(),
            `${s.method === 'fdm' ? s.materialAmount!.toFixed(1) + 'g' : s.materialAmount!.toFixed(1) + 'mL'}`,
            `${s.method === 'fdm' ? auto.material.toFixed(1) + 'g' : auto.material.toFixed(1) + 'mL'}`,
            matE != null ? `${matE > 0 ? '+' : ''}${matE.toFixed(1)}%` : '-',
            timeE != null ? `${timeE > 0 ? '+' : ''}${timeE.toFixed(1)}%` : '-',
            status(matE, MAT_OK),
            status(timeE, TIME_OK),
        ].join(' | ')
    )
}

console.log('\n=== 조정 제안 ===\n')

if (matIssues > 0) {
    console.log('• 재료량: FDM은 FDM_SHELL_THICKNESS_MM·인필 반영 확인. 레진은 volumeCalibrationFactor(0.97) 검토.')
}
if (timeIssues > 0) {
    console.log('• 시간: print-time-estimate.ts 계수 또는 slicer timeCalibrationFactor 검토.')
}
if (matIssues === 0 && timeIssues === 0 && samples.length > 0) {
    console.log('• 재료·시간 오차가 목표(±20%/±30%) 이내입니다.')
}

// SLA/DLP 비율 튜닝 제안 (중형 기준)
const mid = REF_BY_LABEL['중형']
const fdmQ = calculateFdmQuote({
    volumeCm3: mid.volumeCm3,
    surfaceAreaCm2: mid.surfaceAreaCm2,
    heightMm: mid.heightMm,
    density: FDM_DEFAULTS.density,
    pricePerGramKr: FDM_DEFAULTS.pricePerGramKr,
    infillPercent: FDM_INFILL_DEFAULT,
    layerHeightMm: FDM_DEFAULTS.layerHeightMm,
    supportEnabled: false,
    hourlyRateKr: FDM_DEFAULTS.hourlyRateKr,
    fdmLaborCostKrw: FDM_DEFAULTS.fdmLaborCostKrw,
    applyVat: false,
})
const slaDefs = resinDefaults('sla')
const dlpDefs = resinDefaults('dlp')
const slaQ = calculateResinQuote({
    method: 'sla',
    volumeCm3: mid.volumeCm3,
    heightMm: mid.heightMm,
    layerHeightMm: SLA_LAYER_DEFAULT,
    pricePerMlKr: 150,
    postProcessing: false,
    ...slaDefs,
    hourlyRateKr: slaDefs.hourlyRateKr,
    applyVat: false,
})
const dlpQ = calculateResinQuote({
    method: 'dlp',
    volumeCm3: mid.volumeCm3,
    heightMm: mid.heightMm,
    layerHeightMm: SLA_LAYER_DEFAULT,
    pricePerMlKr: 150,
    postProcessing: false,
    ...dlpDefs,
    hourlyRateKr: dlpDefs.hourlyRateKr,
    applyVat: false,
})

const slaR = slaQ.subtotal / fdmQ.subtotal
const dlpR = dlpQ.subtotal / fdmQ.subtotal

console.log(`\n현재 비율(중형): SLA/FDM=${slaR.toFixed(2)} (목표 ${TARGET_SLA_RATIO}), DLP/FDM=${dlpR.toFixed(2)} (목표 ${TARGET_DLP_RATIO})`)

if (slaR < TARGET_SLA_RATIO * 0.9) {
    const factor = TARGET_SLA_RATIO / slaR
    const newRate = Math.round(slaDefs.hourlyRateKr * factor / 100) * 100
    const newLabor = Math.round(slaDefs.laborCostKrw * Math.sqrt(factor) / 100) * 100
    console.log(`\n[SLA 상향 제안] 목표 6배 달성을 위해 (중형 기준):`)
    console.log(`  hourly_rate: ${slaDefs.hourlyRateKr} → ${newRate} (×${factor.toFixed(2)})`)
    console.log(`  sla_labor_cost_krw: ${slaDefs.laborCostKrw} → ${newLabor}`)
    console.log(`  또는 sla_layer_exposure_sec: ${slaDefs.layerExposureSec} → ${Math.min(12, Math.ceil(slaDefs.layerExposureSec * Math.sqrt(factor)))}`)
}

if (dlpR > TARGET_DLP_RATIO * 1.1) {
    const factor = TARGET_DLP_RATIO / dlpR
    const newRate = Math.round(dlpDefs.hourlyRateKr * factor / 100) * 100
    console.log(`\n[DLP 하향 제안] 목표 3.5배 달성을 위해:`)
    console.log(`  hourly_rate: ${dlpDefs.hourlyRateKr} → ${newRate}`)
} else if (dlpR < TARGET_DLP_RATIO * 0.9) {
    const factor = TARGET_DLP_RATIO / dlpR
    const newRate = Math.round(dlpDefs.hourlyRateKr * factor / 100) * 100
    console.log(`\n[DLP 상향 제안] hourly_rate: ${dlpDefs.hourlyRateKr} → ${newRate}`)
}

console.log('\n관리자 설정 → 장비 탭에서 적용 후 npm run calibrate:quotes 로 재확인')
