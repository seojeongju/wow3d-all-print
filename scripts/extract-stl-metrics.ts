/**
 * STL 파일에서 견적용 치수 추출 + 슬라이서 기준 설정으로 참조 실측값 생성
 * 실행: npx --yes tsx scripts/extract-stl-metrics.ts [stl경로...]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as THREE from 'three'
import { STLLoader } from 'three-stdlib'
import { analyzeGeometry } from '../lib/geometry'
import { estimateFdmWeightGrams } from '../lib/fdm-quote'
import { estimateFdmPrintTimeHours, estimateResinPrintTimeHours } from '../lib/print-time-estimate'

/** Cura / PrusaSlicer 기본에 가까운 FDM 설정 */
const FDM_SLICER = {
    infillPercent: 20,
    layerHeightMm: 0.2,
    density: 1.24,
    /** 슬라이서는 상·하 스킨·벽을 더 두껍게 잡는 경향 → 쉘 근사 +5% */
    weightCalibrationFactor: 1.05,
    /** 슬라이서 시간은 가속·여행 최적화로 약간 짧게 나오는 경우가 많음 */
    timeCalibrationFactor: 0.92,
}

/** Chitubox / Lychee 기본에 가까운 레진 설정 */
const RESIN_SLICER = {
    layerHeightMm: 0.05,
    slaExposureSec: 8,
    dlpExposureSec: 3,
    /** 레진은 드레인·쉘 때문에 메쉬 부피 대비 약간 적게 쓰는 경우 */
    volumeCalibrationFactor: 0.97,
    timeCalibrationFactor: 0.95,
}

function loadStl(filePath: string) {
    const buf = readFileSync(filePath)
    const loader = new STLLoader()
    const geo = loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
    geo.center()
    geo.computeBoundingBox()
    geo.computeVertexNormals()
    return analyzeGeometry(geo)
}

function slicerProxyFdm(analysis: ReturnType<typeof analyzeGeometry>) {
    const w = estimateFdmWeightGrams({
        volumeCm3: analysis.volume,
        surfaceAreaCm2: analysis.surfaceArea,
        density: FDM_SLICER.density,
        infillPercent: FDM_SLICER.infillPercent,
    })
    const t = estimateFdmPrintTimeHours({
        weightGrams: w.weightGrams * FDM_SLICER.weightCalibrationFactor,
        heightMm: analysis.boundingBox.z,
        surfaceAreaCm2: analysis.surfaceArea,
        layerHeightMm: FDM_SLICER.layerHeightMm,
        density: FDM_SLICER.density,
    })
    return {
        materialAmount: +(w.weightGrams * FDM_SLICER.weightCalibrationFactor).toFixed(2),
        hours: +(t.hours * FDM_SLICER.timeCalibrationFactor).toFixed(3),
        settings: `FDM ${FDM_SLICER.layerHeightMm}mm / infill ${FDM_SLICER.infillPercent}% / PLA`,
    }
}

function slicerProxyResin(
    analysis: ReturnType<typeof analyzeGeometry>,
    method: 'sla' | 'dlp'
) {
    const volumeMl = analysis.volume * RESIN_SLICER.volumeCalibrationFactor
    const exp = method === 'dlp' ? RESIN_SLICER.dlpExposureSec : RESIN_SLICER.slaExposureSec
    const t = estimateResinPrintTimeHours({
        heightMm: analysis.boundingBox.z,
        layerHeightMm: RESIN_SLICER.layerHeightMm,
        layerExposureSec: exp,
    })
    return {
        materialAmount: +volumeMl.toFixed(2),
        hours: +(t.hours * RESIN_SLICER.timeCalibrationFactor).toFixed(3),
        settings: `${method.toUpperCase()} ${RESIN_SLICER.layerHeightMm}mm / exp ${exp}s`,
    }
}

const defaultFiles = [
    resolve(__dirname, '../public/test_cube.stl'),
]

const files = process.argv.length > 2 ? process.argv.slice(2).map((f) => resolve(f)) : defaultFiles

type SampleRow = {
    model: string
    file: string
    volumeCm3: number
    surfaceAreaCm2: number
    heightMm: number
    method: 'fdm' | 'sla' | 'dlp'
    materialAmount: number
    hours: number
    slicerSettings: string
    source: 'slicer-proxy'
}

const samples: SampleRow[] = []

for (const file of files) {
    const analysis = loadStl(file)
    const baseName = file.split(/[/\\]/).pop()?.replace(/\.stl$/i, '') ?? 'model'
    const modelLabel =
        analysis.volume < 15
            ? '소형'
            : analysis.volume < 50
              ? '중형'
              : '대형'

    const fdm = slicerProxyFdm(analysis)
    const sla = slicerProxyResin(analysis, 'sla')
    const dlp = slicerProxyResin(analysis, 'dlp')

    console.log(`\n=== ${baseName} ===`)
    console.log(
        `부피 ${analysis.volume.toFixed(2)} cm³ | 표면 ${analysis.surfaceArea.toFixed(1)} cm² | Z ${analysis.boundingBox.z.toFixed(1)} mm`
    )
    console.log(`FDM  proxy: ${fdm.materialAmount}g / ${fdm.hours}h (${fdm.settings})`)
    console.log(`SLA  proxy: ${sla.materialAmount}mL / ${sla.hours}h (${sla.settings})`)
    console.log(`DLP  proxy: ${dlp.materialAmount}mL / ${dlp.hours}h (${dlp.settings})`)

    for (const [method, row] of [
        ['fdm', fdm],
        ['sla', sla],
        ['dlp', dlp],
    ] as const) {
        samples.push({
            model: modelLabel,
            file: baseName,
            volumeCm3: +analysis.volume.toFixed(2),
            surfaceAreaCm2: +analysis.surfaceArea.toFixed(1),
            heightMm: +analysis.boundingBox.z.toFixed(1),
            method,
            materialAmount: row.materialAmount,
            hours: row.hours,
            slicerSettings: row.settings,
            source: 'slicer-proxy',
        })
    }
}

const outPath = resolve(__dirname, 'calibrate-samples.json')
const payload = {
    _comment:
        'materialAmount: FDM=g, SLA/DLP=mL. hours=시간. slicer-proxy는 Cura/Chitubox 기본 설정 근사값 — 실제 슬라이서 값으로 교체 권장.',
    _generatedAt: new Date().toISOString(),
    samples: samples.map(
        ({ model, method, materialAmount, hours, slicerSettings, file, volumeCm3, surfaceAreaCm2, heightMm }) => ({
            model,
            method,
            materialAmount,
            hours,
            file,
            volumeCm3,
            surfaceAreaCm2,
            heightMm,
            slicerSettings,
            notes: 'extract-stl-metrics.ts 자동 생성 (slicer-proxy)',
        })
    ),
}

writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8')
console.log(`\n→ ${outPath} 갱신 (${samples.length}건)`)
