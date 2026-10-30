import { DLP_DEFAULT_SUPPORT_PER_CM2_KRW, SLA_DEFAULT_SUPPORT_PER_CM2_KRW } from '@/lib/resin-quote'
import { normalizeQuoteFamily, quoteFamilyKey } from '@/lib/print-method'

/**
 * 공개 견적 데이터(소재 단가·장비 사양) D1 조회.
 * /api/materials · /api/print-specs 와 서버 렌더링 페이지(가격 예시 가이드)가 같은 값을 쓰도록 한곳에 둔다.
 */

export type PublicMaterial = {
    id: number
    name: string
    type: string
    price_per_gram: number
    price_per_ml: number | null
    density: number
    /** 소재별 기본(최소) 견적금액. 없으면 null → 장비 폴백 */
    min_price_krw: number | null
}

export type PublicPrintSpec = {
    /** 사용자에게 보여줄 이름 (없으면 type 대문자) */
    label?: string
    /** 견적 공식: fdm | sla | dlp */
    quoteFamily: 'fdm' | 'sla' | 'dlp'
    max: { x: number; y: number; z: number }
    layerHeights: number[]
    hourlyRate: number
    minPriceKr?: number
    layerCosts?: Record<string, number>
    fdm_layer_hours_factor?: number
    fdm_labor_cost_krw?: number
    fdm_support_per_cm2_krw?: number
    sla_layer_exposure_sec?: number
    sla_labor_cost_krw?: number
    sla_consumables_krw?: number
    sla_post_process_krw?: number
    sla_support_per_cm2_krw?: number
    dlp_layer_exposure_sec?: number
    dlp_labor_cost_krw?: number
    dlp_consumables_krw?: number
    dlp_post_process_krw?: number
    dlp_support_per_cm2_krw?: number
}

export type PublicPrintSpecs = Record<string, PublicPrintSpec>

function coreDefault(family: 'fdm' | 'sla' | 'dlp'): PublicPrintSpec {
    if (family === 'sla') {
        return {
            label: 'SLA',
            quoteFamily: 'sla',
            max: { x: 145, y: 145, z: 175 },
            layerHeights: [0.025, 0.05, 0.1],
            hourlyRate: 11100,
            sla_layer_exposure_sec: 9,
            sla_labor_cost_krw: 10700,
            sla_consumables_krw: 3900,
            sla_post_process_krw: 10400,
            sla_support_per_cm2_krw: SLA_DEFAULT_SUPPORT_PER_CM2_KRW,
        }
    }
    if (family === 'dlp') {
        return {
            label: 'DLP',
            quoteFamily: 'dlp',
            max: { x: 120, y: 68, z: 200 },
            layerHeights: [0.025, 0.05, 0.1],
            hourlyRate: 7100,
            dlp_layer_exposure_sec: 3,
            dlp_labor_cost_krw: 9100,
            dlp_consumables_krw: 3900,
            dlp_post_process_krw: 10400,
            dlp_support_per_cm2_krw: DLP_DEFAULT_SUPPORT_PER_CM2_KRW,
        }
    }
    return {
        label: 'FDM',
        quoteFamily: 'fdm',
        max: { x: 220, y: 220, z: 250 },
        layerHeights: [0.1, 0.2, 0.3],
        hourlyRate: 5000,
        fdm_layer_hours_factor: 0.02,
        fdm_labor_cost_krw: 6500,
        fdm_support_per_cm2_krw: 26,
    }
}

/** DB가 없을 때 쓰는 기본 사양 */
export const PRINT_SPECS_NO_DB: PublicPrintSpecs = {
    fdm: coreDefault('fdm'),
    sla: { ...coreDefault('sla'), hourlyRate: 11100 },
    dlp: { ...coreDefault('dlp'), hourlyRate: 7100 },
}

/** 조회 실패 시 기본 사양 */
export const PRINT_SPECS_ON_ERROR: PublicPrintSpecs = {
    fdm: coreDefault('fdm'),
    sla: { ...coreDefault('sla'), hourlyRate: 8000 },
    dlp: { ...coreDefault('dlp'), hourlyRate: 9000 },
}

/** 견적용 활성 소재 (관리자 "소재"와 동일 테이블) */
export async function loadPublicMaterials(db: CloudflareEnv['DB']): Promise<PublicMaterial[]> {
    let results: unknown[] | undefined
    try {
        const q = await db
            .prepare(
                'SELECT id, name, type, price_per_gram, price_per_ml, density, min_price_krw FROM materials WHERE (is_active = 1 OR is_active IS NULL) ORDER BY type ASC, sort_order ASC, name ASC'
            )
            .all()
        results = q.results
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes('no such column') && msg.includes('min_price_krw')) {
            const q = await db
                .prepare(
                    'SELECT id, name, type, price_per_gram, price_per_ml, density FROM materials WHERE (is_active = 1 OR is_active IS NULL) ORDER BY type ASC, sort_order ASC, name ASC'
                )
                .all()
            results = q.results
        } else {
            throw e
        }
    }
    const rows = (results || []) as Array<{
        id: number
        name: string
        type: string
        price_per_gram: number
        price_per_ml?: number | null
        density: number
        min_price_krw?: number | null
    }>
    return rows.map((r) => {
        const min =
            r.min_price_krw != null && Number.isFinite(Number(r.min_price_krw)) && Number(r.min_price_krw) > 0
                ? Number(r.min_price_krw)
                : null
        return {
            id: r.id,
            name: r.name,
            type: r.type,
            price_per_gram: Number(r.price_per_gram) || 0,
            price_per_ml: r.price_per_ml != null && Number.isFinite(r.price_per_ml) ? Number(r.price_per_ml) : null,
            density: Number(r.density) || 1.24,
            min_price_krw: min,
        }
    })
}

type EquipmentRow = {
    type: string
    name?: string | null
    quote_family?: string | null
    max_x_mm: number
    max_y_mm: number
    max_z_mm: number
    hourly_rate: number
    layer_heights_json: string | null
    layer_costs_json?: string | null
    min_price_krw?: number | null
    fdm_layer_hours_factor?: number | null
    fdm_labor_cost_krw?: number | null
    fdm_support_per_cm2_krw?: number | null
    sla_layer_exposure_sec?: number | null
    sla_labor_cost_krw?: number | null
    sla_consumables_krw?: number | null
    sla_post_process_krw?: number | null
    sla_support_per_cm2_krw?: number | null
    dlp_layer_exposure_sec?: number | null
    dlp_labor_cost_krw?: number | null
    dlp_consumables_krw?: number | null
    dlp_post_process_krw?: number | null
    dlp_support_per_cm2_krw?: number | null
}

function rowToSpec(r: EquipmentRow): PublicPrintSpec {
    const family = quoteFamilyKey(normalizeQuoteFamily(r.quote_family, r.type))
    const defaults = coreDefault(family)
    let arr: number[] = []
    try {
        if (r.layer_heights_json) arr = JSON.parse(r.layer_heights_json)
    } catch {
        /* ignore */
    }
    if (!Array.isArray(arr) || arr.length === 0) {
        arr = family === 'fdm' ? [0.1, 0.2, 0.3] : [0.025, 0.05, 0.1]
    }
    let layerCosts: Record<string, number> | undefined
    try {
        if (r.layer_costs_json && typeof r.layer_costs_json === 'string') {
            const o = JSON.parse(r.layer_costs_json)
            if (o && typeof o === 'object' && !Array.isArray(o)) {
                layerCosts = {}
                for (const [k, v] of Object.entries(o)) {
                    const n = Number(v)
                    if (Number.isFinite(n) && n >= 0) layerCosts[String(k)] = n
                }
                if (Object.keys(layerCosts).length === 0) layerCosts = undefined
            }
        }
    } catch {
        /* ignore */
    }
    const minPriceKr =
        r.min_price_krw != null && Number.isFinite(Number(r.min_price_krw)) && r.min_price_krw > 0
            ? Number(r.min_price_krw)
            : undefined
    return {
        label: (r.name && String(r.name).trim()) || r.type.toUpperCase(),
        quoteFamily: family,
        max: { x: r.max_x_mm, y: r.max_y_mm, z: r.max_z_mm },
        layerHeights: arr,
        hourlyRate: r.hourly_rate,
        ...(minPriceKr != null ? { minPriceKr } : {}),
        ...(layerCosts ? { layerCosts } : {}),
        fdm_layer_hours_factor: r.fdm_layer_hours_factor ?? defaults.fdm_layer_hours_factor,
        fdm_labor_cost_krw: r.fdm_labor_cost_krw ?? defaults.fdm_labor_cost_krw,
        fdm_support_per_cm2_krw: r.fdm_support_per_cm2_krw ?? defaults.fdm_support_per_cm2_krw,
        sla_layer_exposure_sec: r.sla_layer_exposure_sec ?? defaults.sla_layer_exposure_sec,
        sla_labor_cost_krw: r.sla_labor_cost_krw ?? defaults.sla_labor_cost_krw,
        sla_consumables_krw: r.sla_consumables_krw ?? defaults.sla_consumables_krw,
        sla_post_process_krw: r.sla_post_process_krw ?? defaults.sla_post_process_krw,
        sla_support_per_cm2_krw: r.sla_support_per_cm2_krw ?? defaults.sla_support_per_cm2_krw,
        dlp_layer_exposure_sec: r.dlp_layer_exposure_sec ?? defaults.dlp_layer_exposure_sec,
        dlp_labor_cost_krw: r.dlp_labor_cost_krw ?? defaults.dlp_labor_cost_krw,
        dlp_consumables_krw: r.dlp_consumables_krw ?? defaults.dlp_consumables_krw,
        dlp_post_process_krw: r.dlp_post_process_krw ?? defaults.dlp_post_process_krw,
        dlp_support_per_cm2_krw: r.dlp_support_per_cm2_krw ?? defaults.dlp_support_per_cm2_krw,
    }
}

/**
 * 활성 장비 사양만 반환 (관리자에서 끈 출력방식은 사용자 견적에 안 나옴).
 * DB에 활성 행이 없으면 기본 FDM/SLA/DLP를 쓴다.
 */
export async function loadPrintSpecs(db: CloudflareEnv['DB']): Promise<PublicPrintSpecs> {
    let results: unknown[] | undefined
    try {
        const q = await db.prepare('SELECT * FROM printer_equipment WHERE is_active = 1').all()
        results = q.results
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        // quote_family 컬럼 없는 구 DB도 동작
        if (msg.includes('no such column') && msg.includes('quote_family')) {
            const q = await db.prepare('SELECT * FROM printer_equipment WHERE is_active = 1').all()
            results = q.results
        } else {
            throw e
        }
    }
    const rows = (results || []) as EquipmentRow[]
    if (rows.length === 0) return { ...PRINT_SPECS_NO_DB }

    const specs: PublicPrintSpecs = {}
    for (const r of rows) {
        if (!r?.type) continue
        specs[String(r.type).toLowerCase()] = rowToSpec(r)
    }
    return Object.keys(specs).length > 0 ? specs : { ...PRINT_SPECS_NO_DB }
}
