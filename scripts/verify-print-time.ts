/**
 * FDM 레이어 높이(0.1/0.2/0.3) 시간 산출 검증 (Bambu급 유량식)
 * 실행: npx tsx scripts/verify-print-time.ts
 */
import {
    estimateFdmPrintTimeHours,
    formatEstimatedPrintTime,
} from '../lib/print-time-estimate'

const samples = [
    { name: '소형 (H50 / 30g / S80)', heightMm: 50, weightGrams: 30, surfaceAreaCm2: 80 },
    { name: '중형 (H100 / 120g / S200)', heightMm: 100, weightGrams: 120, surfaceAreaCm2: 200 },
    { name: '대형 (H150 / 300g / S450)', heightMm: 150, weightGrams: 300, surfaceAreaCm2: 450 },
    {
        name: '마스크+서포트 (Bambu≈7.2h)',
        heightMm: 107.58,
        weightGrams: 66,
        surfaceAreaCm2: 480,
        supportGrams: 154,
        overhangAreaCm2: 220,
    },
]

const layers = [0.1, 0.2, 0.3]

for (const sample of samples) {
    console.log(`\n=== ${sample.name} ===`)
    console.log('layer | hours  | vs0.2 | UI')
    const after02 = estimateFdmPrintTimeHours({ ...sample, layerHeightMm: 0.2, density: 1.24 }).hours
    for (const lh of layers) {
        const after = estimateFdmPrintTimeHours({ ...sample, layerHeightMm: lh, density: 1.24 })
        console.log(
            `${lh.toFixed(1).padStart(5)} | ${after.hours.toFixed(2).padStart(6)} | ${(after.hours / after02).toFixed(2).padStart(5)} | ${formatEstimatedPrintTime(after.hours)}`
        )
    }
}
