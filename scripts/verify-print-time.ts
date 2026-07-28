/**
 * FDM 레이어 높이(0.1/0.2/0.3) 시간 산출 before/after 검증
 * 실행: npx tsx scripts/verify-print-time.ts
 */
import {
    estimateFdmPrintTimeHours,
    formatEstimatedPrintTime,
} from '../lib/print-time-estimate'

function legacyHours(w: number, h: number, s: number, lh: number) {
    const numLayers = Math.max(1, Math.ceil(h / lh))
    const volumeTime = Math.pow(w + 1, 0.85) * 0.0297
    const movementTime = numLayers * 0.02 * 0.08
    const surfaceTime = Math.pow(s + 1, 0.8) * 0.00126
    return Math.max(0.5, volumeTime + movementTime + surfaceTime)
}

const samples = [
    { name: '소형 (H50 / 30g / S80)', heightMm: 50, weightGrams: 30, surfaceAreaCm2: 80 },
    { name: '중형 (H100 / 120g / S200)', heightMm: 100, weightGrams: 120, surfaceAreaCm2: 200 },
    { name: '대형 (H150 / 300g / S450)', heightMm: 150, weightGrams: 300, surfaceAreaCm2: 450 },
]

const layers = [0.1, 0.2, 0.3]

for (const sample of samples) {
    console.log(`\n=== ${sample.name} ===`)
    console.log('layer | before(h) | after(h) | vs0.2 | UI')
    const after02 = estimateFdmPrintTimeHours({ ...sample, layerHeightMm: 0.2 }).hours
    for (const lh of layers) {
        const before = legacyHours(sample.weightGrams, sample.heightMm, sample.surfaceAreaCm2, lh)
        const after = estimateFdmPrintTimeHours({ ...sample, layerHeightMm: lh })
        console.log(
            `${lh.toFixed(1).padStart(5)} | ${before.toFixed(2).padStart(9)} | ${after.hours.toFixed(2).padStart(8)} | ${(after.hours / after02).toFixed(2).padStart(5)} | ${formatEstimatedPrintTime(after.hours)}`
        )
    }
}
