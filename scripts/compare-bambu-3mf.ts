/**
 * Bambu Studio(P2S) 3MF 플레이트 실측과 자동견적 비교 (다중 객체)
 * 실행: npx --yes tsx scripts/compare-bambu-3mf.ts "<3mf 경로>"
 * 사전 준비: npm i --no-save linkedom (Node에 DOMParser가 없음)
 * Bambu 값은 BAMBU_MIN(모델 출력 시간, 분)·BAMBU_MODEL_G·BAMBU_SUPPORT_G 환경변수로 지정
 */
import { readFileSync } from 'node:fs'
import { strFromU8, unzipSync } from 'fflate'
import { analyzeGeometry, MODEL_PARTS_USERDATA_KEY, type GeometryAnalysis } from '../lib/geometry'
import { calculateFdmQuote } from '../lib/fdm-quote'
import { parseModelArrayBuffer } from '../lib/parseModelGeometry'
import { applyTransformToAnalysis, DEFAULT_MODEL_TRANSFORM, findAutoOrientTransform } from '../lib/model-transform'

const path = process.argv[2]
if (!path) throw new Error('3MF 경로를 지정하세요')
const buf = readFileSync(path)
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer

const INFILL = Number(process.env.INFILL ?? 15)
const DENSITY = Number(process.env.DENSITY ?? 1.26)
const BAMBU_MIN = Number(process.env.BAMBU_MIN ?? 170.1)
const BAMBU_MODEL_G = Number(process.env.BAMBU_MODEL_G ?? 60.69)
const BAMBU_SUPPORT_G = Number(process.env.BAMBU_SUPPORT_G ?? 11.73)

const fmt = (h: number) => `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`
const m = (s: number) => (s / 60).toFixed(1)

function report(label: string, a: GeometryAnalysis) {
    const q = calculateFdmQuote({
        volumeCm3: a.volume,
        surfaceAreaCm2: a.surfaceArea,
        heightMm: a.boundingBox.z,
        density: DENSITY,
        pricePerGramKr: 50,
        infillPercent: INFILL,
        layerHeightMm: 0.2,
        supportEnabled: true,
        overhangAreaCm2: a.overhangArea,
        supportVolumeCm3: a.supportVolume,
        lateralAreaCm2: a.lateralArea,
        topAreaCm2: a.topArea,
        bottomAreaCm2: a.bottomArea,
        bedAreaCm2: a.bedArea,
        slowWallAreaCm2: a.slowWallArea,
        partCount: a.partCount,
        partHeightSumMm: a.partHeightSum,
        partSpacingMm: a.partSpacing,
        materialName: 'PLA Basic',
        hourlyRateKr: 5000,
    })
    const b = q.timeDetail.breakdownSec
    const s = q.timeDetail.structure
    const g = (mm3: number) => ((mm3 / 1000) * DENSITY).toFixed(1)
    const printMin = (q.timeHours * 3600 - b.prep) / 60
    console.log(
        `\n[${label}] 박스 ${a.boundingBox.x.toFixed(1)}×${a.boundingBox.y.toFixed(1)}×${a.boundingBox.z.toFixed(1)}mm · ` +
            `부피 ${a.volume.toFixed(2)}cm³ · 객체 ${a.partCount ?? 1} (높이합 ${a.partHeightSum?.toFixed(0) ?? '-'}mm, 간격 ${a.partSpacing?.toFixed(1) ?? '-'}mm)` +
            `\n    시간 ${fmt(q.timeHours)} · 모델 ${q.weightGrams.toFixed(1)}g + 서포트 ${q.supportGrams.toFixed(1)}g · 견적 ${q.total.toLocaleString()}원` +
            `\n    분: 벽 ${m(b.walls)} 솔리드 ${m(b.solid)} 인필 ${m(b.sparseInfill)} 첫층 ${m(b.firstLayer)} 서포트 ${m(b.support)} 이동 ${m(b.travel)} 레이어 ${m(b.layerOverhead)} 최소층 ${m(b.minLayerSlowdown)} 준비 ${m(b.prep)}` +
            `\n    무게 g: 벽 ${g(s.wallVolMm3)} 솔리드 ${g(s.solidVolMm3)} 인필 ${g(s.sparseVolMm3)} · 서포트 그림자 ${a.supportVolume?.toFixed(1)}cm³` +
            `\n    고정값: ${JSON.stringify({
                volumeCm3: +a.volume.toFixed(2), surfaceAreaCm2: +a.surfaceArea.toFixed(1), heightMm: +a.boundingBox.z.toFixed(1),
                lateralAreaCm2: +(a.lateralArea ?? 0).toFixed(1), topAreaCm2: +(a.topArea ?? 0).toFixed(1), bottomAreaCm2: +(a.bottomArea ?? 0).toFixed(1),
                bedAreaCm2: +(a.bedArea ?? 0).toFixed(1), slowWallAreaCm2: +(a.slowWallArea ?? 0).toFixed(1),
                overhangAreaCm2: +(a.overhangArea ?? 0).toFixed(1), supportVolumeCm3: +(a.supportVolume ?? 0).toFixed(1),
            })}` +
            `\n    형상: 두께 ${s.thicknessMm.toFixed(2)}mm · 대표길이 ${s.characteristicMm.toFixed(1)}mm · 층 ${s.numLayers} · 측면 ${a.lateralArea?.toFixed(0)} 윗면 ${a.topArea?.toFixed(0)} 바닥 ${a.bottomArea?.toFixed(0)} 베드 ${a.bedArea?.toFixed(0)} 오버행 ${a.overhangArea?.toFixed(0)}cm²` +
            `\n    Bambu 대비: 출력 시간 ${((printMin / BAMBU_MIN) * 100).toFixed(0)}% · 모델 ${((q.weightGrams / BAMBU_MODEL_G) * 100).toFixed(0)}% · 서포트 ${((q.supportGrams / BAMBU_SUPPORT_G) * 100).toFixed(0)}%`
    )
}

function printProjectSettings() {
    const files = unzipSync(new Uint8Array(ab), {
        filter: (f) => f.name === 'Metadata/project_settings.config' || f.name === 'Metadata/plate_1.json',
    })
    const plate = files['Metadata/plate_1.json']
    if (plate) {
        const p = JSON.parse(strFromU8(plate)) as { first_layer_time?: number; bbox_objects?: { name: string; area: number }[] }
        console.log(`Bambu 첫 레이어 ${((p.first_layer_time ?? 0) / 60).toFixed(1)}분 · 객체 ${p.bbox_objects?.length ?? 0}개 · 바닥 면적 ${p.bbox_objects?.map((o) => (o.area / 100).toFixed(1)).join(',')}cm²`)
    }
    const raw = files['Metadata/project_settings.config']
    if (!raw) return
    const cfg = JSON.parse(strFromU8(raw)) as Record<string, unknown>
    const v = (k: string) => (Array.isArray(cfg[k]) ? (cfg[k] as unknown[]).join(',') : String(cfg[k] ?? ''))
    const keys = [
        'print_settings_id', 'sparse_infill_density', 'sparse_infill_pattern', 'wall_loops', 'top_shell_layers',
        'bottom_shell_layers', 'enable_support', 'support_type', 'support_threshold_angle', 'brim_type', 'filament_density',
    ]
    console.log(`설정: ${keys.map((k) => `${k}=${v(k)}`).join(' · ')}`)
    console.log(`기본값과 다른 설정: ${v('different_settings_to_system')}`)
}

async function main() {
    // 선택 의존성이라 타입 체크 대상에서 빠지도록 모듈 이름을 변수로 둠
    const linkedom = 'linkedom'
    const { DOMParser } = (await import(linkedom)) as { DOMParser: unknown }
    ;(globalThis as unknown as { DOMParser: unknown }).DOMParser = DOMParser
    printProjectSettings()
    const geo = await parseModelArrayBuffer('plate.3mf', ab)
    if (!geo) throw new Error('3MF 파싱 실패')
    geo.computeBoundingBox()
    geo.translate(0, 0, -geo.boundingBox!.min.z)

    const base = analyzeGeometry(geo)
    report('사이트 분석(객체별 합산)', base)
    const auto = findAutoOrientTransform(base, DEFAULT_MODEL_TRANSFORM)
    if (auto) {
        const t = auto.transform
        report(`자동 배치 ${t.layFlat ? '면' : auto.upAxis} rotZ ${t.rotZ}`, applyTransformToAnalysis(base, t))
    }

    delete geo.userData[MODEL_PARTS_USERDATA_KEY]
    report('객체 정보 없이 단일 병합', analyzeGeometry(geo))

    console.log(`\n[Bambu P2S] 모델 출력 ${BAMBU_MIN}분 + 준비 7분 · 모델 ${BAMBU_MODEL_G}g + 서포트 ${BAMBU_SUPPORT_G}g`)
}

void main()
