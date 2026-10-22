/**
 * 견적/주문 항목의 고객 출력 설정 표시용 헬퍼
 */

import { formatPrintColor } from '@/lib/print-color'

export type QuotePrintSettings = {
    print_method?: string | null
    guide_source?: string | null
    guide_topic?: string | null
    fdm_material?: string | null
    fdm_material_name?: string | null
    material_name?: string | null
    fdm_infill?: number | null
    fdm_layer_height?: number | null
    fdm_support?: number | boolean | null
    resin_type?: string | null
    resin_type_name?: string | null
    layer_thickness?: number | null
    post_processing?: number | boolean | null
    print_color?: string | null
    print_color_note?: string | null
    dimensions_x?: number | null
    dimensions_y?: number | null
    dimensions_z?: number | null
    model_transform?: unknown
    spec?: string | null
}

function asBool(v: unknown): boolean {
    return v === true || v === 1 || v === '1'
}

/** 관리자·견적서에 보여줄 한 줄 요약 (예: "PLA · 블랙 · 채움 20% · 레이어 0.2mm · 서포트") */
export function formatQuotePrintSettings(
    q: QuotePrintSettings | null | undefined,
    locale: string = 'ko'
): string {
    if (!q) return ''
    const rawMethod = String(q.print_method || '').toLowerCase()
    const isEn = locale === 'en'
    const method = rawMethod.includes('sla')
        ? 'sla'
        : rawMethod.includes('dlp')
          ? 'dlp'
          : rawMethod.includes('fdm')
            ? 'fdm'
            : rawMethod

    if (method === 'fdm') {
        const parts: string[] = []
        const mat = q.fdm_material_name || q.fdm_material || q.material_name
        const color = formatPrintColor(q.print_color, q.print_color_note, locale, mat)
        if (mat) parts.push(String(mat))
        if (color) parts.push(color)
        if (q.fdm_infill != null && Number.isFinite(Number(q.fdm_infill))) {
            parts.push(isEn ? `Infill ${Number(q.fdm_infill)}%` : `채움 ${Number(q.fdm_infill)}%`)
        }
        if (q.fdm_layer_height != null && Number.isFinite(Number(q.fdm_layer_height))) {
            parts.push(isEn ? `Layer ${Number(q.fdm_layer_height)}mm` : `레이어 ${Number(q.fdm_layer_height)}mm`)
        }
        if (q.fdm_support != null) {
            const hasSupport = asBool(q.fdm_support)
            parts.push(isEn ? (hasSupport ? 'Support included' : 'No support') : (hasSupport ? '서포트 사용' : '서포트 없음'))
        }
        return parts.join(' · ')
    }

    if (method === 'sla' || method === 'dlp') {
        const parts: string[] = []
        const resin = q.resin_type_name || q.resin_type || q.material_name
        const color = formatPrintColor(q.print_color, q.print_color_note, locale, resin)
        if (resin) parts.push(String(resin))
        if (color) parts.push(color)
        if (q.layer_thickness != null && Number.isFinite(Number(q.layer_thickness))) {
            parts.push(isEn ? `Layer ${Number(q.layer_thickness)}mm` : `레이어 ${Number(q.layer_thickness)}mm`)
        }
        if (q.post_processing != null) {
            const hasPost = asBool(q.post_processing)
            parts.push(isEn ? (hasPost ? 'Post-processing included' : 'No post-processing') : (hasPost ? '기본 후처리 포함' : '기본 후처리 없음'))
        }
        return parts.join(' · ')
    }

    if (q.material_name) {
        return String(q.material_name)
    }

    return ''
}

/** 견적서 테이블용 출력방식 / 출력조건 / 치수 분리 파서 */
export function parseEstimateItemSpecs(
    item: any,
    locale: string = 'ko'
): { methodText: string; conditionText: string; sizeText: string } {
    if (!item) return { methodText: '', conditionText: '', sizeText: '' }

    // 1. 방식 (FDM, SLA, DLP 등) 파싱
    let rawMethod = String(item.print_method || item.spec || '').trim()
    let methodText = ''

    if (/fdm/i.test(rawMethod)) {
        methodText = 'FDM'
    } else if (/sla/i.test(rawMethod)) {
        methodText = 'SLA'
    } else if (/dlp/i.test(rawMethod)) {
        methodText = 'DLP'
    } else if (rawMethod && !rawMethod.includes('·') && !rawMethod.includes('/') && rawMethod.length <= 8) {
        methodText = rawMethod.toUpperCase()
    }

    // 2. 출력 조건 파싱
    let conditionText = formatQuotePrintSettings(
        {
            ...item,
            print_method: methodText ? methodText.toLowerCase() : item.print_method,
        },
        locale
    )

    // 세부 옵션 문자열이 없으면 material_name 또는 spec에서 폴백
    if (!conditionText) {
        const mat = item.material_name || item.fdm_material || item.resin_type
        if (mat) {
            conditionText = String(mat)
        }
    }

    // spec 필드가 있을 때 '/' 뒤 내용이 있다면 보완
    if (!conditionText && item.spec) {
        const parts = String(item.spec).split('/')
        if (parts.length > 1) {
            conditionText = parts.slice(1).join('/').trim()
        } else if (methodText && item.spec !== methodText) {
            conditionText = item.spec.replace(new RegExp(`^${methodText}\\s*`, 'i'), '').trim()
        }
    }

    // 만약 conditionText가 methodText와 동일한 단순 중복이면 제거
    if (conditionText && methodText && conditionText.toUpperCase() === methodText.toUpperCase()) {
        conditionText = ''
    }

    // 3. 치수(크기) 파싱
    const sizeText = formatQuotePrintSizeMm(
        item.dimensions_x,
        item.dimensions_y,
        item.dimensions_z,
        scalePercentFromModelTransform(item.model_transform)
    )

    return { methodText, conditionText, sizeText }
}

/** 저장 견적함·장바구니 등 고객 칩 UI용 라벨 목록 (서포트·기본 후처리는 항상 포함이라 표시하지 않음) */
export function getQuotePrintSettingChips(
    q: QuotePrintSettings | null | undefined,
    locale: string = 'ko'
): string[] {
    if (!q) return []
    const method = String(q.print_method || '').toLowerCase()
    const en = locale === 'en'
    const infillLabel = en ? 'Infill' : '채움'
    const layerLabel = en ? 'Layer' : '레이어'
    if (method === 'fdm') {
        const chips: string[] = []
        const mat = q.fdm_material_name || q.fdm_material
        const color = formatPrintColor(q.print_color, q.print_color_note, locale, mat)
        if (mat) chips.push(String(mat))
        if (color) chips.push(color)
        if (q.fdm_infill != null && Number.isFinite(Number(q.fdm_infill))) {
            chips.push(`${infillLabel} ${Number(q.fdm_infill)}%`)
        }
        if (q.fdm_layer_height != null && Number.isFinite(Number(q.fdm_layer_height))) {
            chips.push(`${layerLabel} ${Number(q.fdm_layer_height)}mm`)
        }
        return chips
    }

    if (method === 'sla' || method === 'dlp') {
        const chips: string[] = []
        const resin = q.resin_type_name || q.resin_type
        const color = formatPrintColor(q.print_color, q.print_color_note, locale, resin)
        if (resin) chips.push(String(resin))
        if (color) chips.push(color)
        if (q.layer_thickness != null && Number.isFinite(Number(q.layer_thickness))) {
            chips.push(`${layerLabel} ${Number(q.layer_thickness)}mm`)
        }
        return chips
    }

    return []
}

/** 견적에 저장된 최종 출력 사이즈 (사용자가 스케일 조정 후 견적에 적용한 mm) */
export function formatQuotePrintSizeMm(
    x: unknown,
    y: unknown,
    z: unknown,
    scalePercent?: unknown
): string {
    const nx = Number(x)
    const ny = Number(y)
    const nz = Number(z)
    if (!(nx > 0.05) || !(ny > 0.05) || !(nz > 0.05)) return ''
    const fmt = (n: number) => (Math.abs(n - Math.round(n)) < 0.05 ? String(Math.round(n)) : n.toFixed(1))
    const size = `${fmt(nx)} × ${fmt(ny)} × ${fmt(nz)} mm`
    const scale = Number(scalePercent)
    if (Number.isFinite(scale) && scale > 0 && Math.abs(scale - 100) >= 0.5) {
        return `${size} · 스케일 ${Math.round(scale)}%`
    }
    return size
}

export function scalePercentFromModelTransform(raw: unknown): number | null {
    if (raw == null) return null
    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        const scale = Number((parsed as { scalePercent?: unknown })?.scalePercent)
        return Number.isFinite(scale) && scale > 0 ? scale : null
    } catch {
        return null
    }
}

export function formatQuoteGuideContext(q: QuotePrintSettings | null | undefined): string {
    if (!q) return ''
    const topic = String(q.guide_topic || '').trim()
    if (topic) return topic
    const source = String(q.guide_source || '').trim()
    if (!source) return ''

    const labels: Record<string, string> = {
        prototypes: '시제품용 소재 추천',
        transparent_parts: '투명 부품용 소재 추천',
        housings_cases: '하우징·케이스용 소재 추천',
        heat_impact_parts: '내열·내충격 부품용 소재 추천',
        miniatures_figurines: '정밀 모형·피규어용 소재 추천',
    }
    return labels[source] || source
}

export const QUOTE_PRINT_SETTINGS_SQL = `
    q.print_method,
    q.guide_source,
    q.guide_topic,
    q.fdm_material,
    q.fdm_material_name,
    q.fdm_infill,
    q.fdm_layer_height,
    q.fdm_support,
    q.resin_type,
    q.resin_type_name,
    q.layer_thickness,
    q.post_processing,
    q.print_color,
    q.print_color_note
`.replace(/\s+/g, ' ').trim()

/** JSON_OBJECT용 키-값 조각 (D1 JSON_GROUP_ARRAY) */
export const QUOTE_PRINT_SETTINGS_JSON_FIELDS = `
    'print_method', q.print_method,
    'guide_source', q.guide_source,
    'guide_topic', q.guide_topic,
    'fdm_material', COALESCE(q.fdm_material_name, q.fdm_material),
    'fdm_infill', q.fdm_infill,
    'fdm_layer_height', q.fdm_layer_height,
    'fdm_support', q.fdm_support,
    'resin_type', COALESCE(q.resin_type_name, q.resin_type),
    'layer_thickness', q.layer_thickness,
    'post_processing', q.post_processing,
    'print_color', q.print_color,
    'print_color_note', q.print_color_note
`.replace(/\s+/g, ' ').trim()
