/**
 * 견적/주문 항목의 고객 출력 설정 표시용 헬퍼
 */

export type QuotePrintSettings = {
    print_method?: string | null
    fdm_material?: string | null
    fdm_material_name?: string | null
    fdm_infill?: number | null
    fdm_layer_height?: number | null
    fdm_support?: number | boolean | null
    resin_type?: string | null
    resin_type_name?: string | null
    layer_thickness?: number | null
    post_processing?: number | boolean | null
}

function asBool(v: unknown): boolean {
    return v === true || v === 1 || v === '1'
}

/** 관리자·견적서에 보여줄 한 줄 요약 (예: "PLA · 채움 20% · 레이어 0.2mm · 서포트") */
export function formatQuotePrintSettings(q: QuotePrintSettings | null | undefined): string {
    if (!q) return ''
    const method = String(q.print_method || '').toLowerCase()

    if (method === 'fdm') {
        const parts: string[] = []
        const mat = q.fdm_material_name || q.fdm_material
        if (mat) parts.push(String(mat))
        if (q.fdm_infill != null && Number.isFinite(Number(q.fdm_infill))) {
            parts.push(`채움 ${Number(q.fdm_infill)}%`)
        }
        if (q.fdm_layer_height != null && Number.isFinite(Number(q.fdm_layer_height))) {
            parts.push(`레이어 ${Number(q.fdm_layer_height)}mm`)
        }
        parts.push(asBool(q.fdm_support) ? '서포트 사용' : '서포트 없음')
        return parts.join(' · ')
    }

    if (method === 'sla' || method === 'dlp') {
        const parts: string[] = []
        const resin = q.resin_type_name || q.resin_type
        if (resin) parts.push(String(resin))
        if (q.layer_thickness != null && Number.isFinite(Number(q.layer_thickness))) {
            parts.push(`레이어 ${Number(q.layer_thickness)}mm`)
        }
        parts.push(asBool(q.post_processing) ? '후가공 적용' : '후가공 없음')
        return parts.join(' · ')
    }

    return ''
}

export const QUOTE_PRINT_SETTINGS_SQL = `
    q.print_method,
    q.fdm_material,
    q.fdm_material_name,
    q.fdm_infill,
    q.fdm_layer_height,
    q.fdm_support,
    q.resin_type,
    q.resin_type_name,
    q.layer_thickness,
    q.post_processing
`.replace(/\s+/g, ' ').trim()

/** JSON_OBJECT용 키-값 조각 (D1 JSON_GROUP_ARRAY) */
export const QUOTE_PRINT_SETTINGS_JSON_FIELDS = `
    'print_method', q.print_method,
    'fdm_material', COALESCE(q.fdm_material_name, q.fdm_material),
    'fdm_infill', q.fdm_infill,
    'fdm_layer_height', q.fdm_layer_height,
    'fdm_support', q.fdm_support,
    'resin_type', COALESCE(q.resin_type_name, q.resin_type),
    'layer_thickness', q.layer_thickness,
    'post_processing', q.post_processing
`.replace(/\s+/g, ' ').trim()
