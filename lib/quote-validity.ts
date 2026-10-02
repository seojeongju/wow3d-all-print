/**
 * 저장 견적 유효성 — 장바구니 안내·주문 차단 공통
 * - 유효기간: 금액 산출(저장) 후 QUOTE_VALID_DAYS일
 * - 단가 변경: 산출 이후 해당 출력방식 장비 설정 또는 소재 단가가 수정됨
 * 모든 시각은 D1 CURRENT_TIMESTAMP 형식(UTC 'YYYY-MM-DD HH:MM:SS')
 */

export const QUOTE_VALID_DAYS = 7

export type QuotePriceStatus = 'ok' | 'expired' | 'price_changed'

export type QuoteValidity = {
    status: QuotePriceStatus
    /** 금액 산출 시각 (UTC ISO) */
    pricedAt: string | null
    /** 유효기간 만료 시각 (UTC ISO) */
    expiresAt: string | null
}

export type PricingStamps = {
    /** 'FDM' | 'SLA' | 'DLP' → 장비 설정 최종 변경 시각(ms) */
    equipment: Map<string, number>
    /** 'FDM:PLA' 형식 → 소재 최종 변경 시각(ms) */
    materials: Map<string, number>
}

export type QuoteValidityRow = {
    created_at?: string | null
    updated_at?: string | null
    print_method?: string | null
    fdm_material?: string | null
    fdm_material_name?: string | null
    resin_type_name?: string | null
}

const DAY_MS = 24 * 60 * 60 * 1000

/** D1 UTC 문자열·ISO 문자열 → ms (타임존 없으면 UTC로 해석) */
export function parseDbUtcMs(value: string | null | undefined): number | null {
    if (!value) return null
    const s = String(value).trim()
    if (!s) return null
    const hasZone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)
    const ms = Date.parse(hasZone ? s : `${s.replace(' ', 'T')}Z`)
    return Number.isFinite(ms) ? ms : null
}

function materialKey(type: string, name: string): string {
    return `${type.toUpperCase()}:${name.trim().toLowerCase()}`
}

function quoteMaterialKey(row: QuoteValidityRow): string | null {
    const type = String(row.print_method || '').toUpperCase()
    if (!type) return null
    const name = type === 'FDM' ? row.fdm_material_name || row.fdm_material : row.resin_type_name
    return name ? materialKey(type, name) : null
}

type D1Like = {
    prepare: (sql: string) => {
        all: <T = Record<string, unknown>>() => Promise<{ results?: T[] }>
    }
}

/** 장비·소재 최종 변경 시각 로드 (테이블·컬럼이 없으면 빈 값 → 단가 변경 판정 생략) */
export async function loadPricingStamps(db: D1Like): Promise<PricingStamps> {
    const equipment = new Map<string, number>()
    const materials = new Map<string, number>()
    try {
        const { results } = await db
            .prepare('SELECT type, MAX(updated_at) AS updated_at FROM printer_equipment GROUP BY type')
            .all<{ type: string; updated_at: string | null }>()
        for (const r of results || []) {
            const ms = parseDbUtcMs(r.updated_at)
            if (r.type && ms != null) equipment.set(String(r.type).toUpperCase(), ms)
        }
    } catch {
        /* 구 스키마 */
    }
    try {
        const { results } = await db
            .prepare('SELECT type, name, MAX(updated_at) AS updated_at FROM materials GROUP BY type, name')
            .all<{ type: string; name: string; updated_at: string | null }>()
        for (const r of results || []) {
            const ms = parseDbUtcMs(r.updated_at)
            if (r.type && r.name && ms != null) materials.set(materialKey(r.type, r.name), ms)
        }
    } catch {
        /* 구 스키마 */
    }
    return { equipment, materials }
}

export function evaluateQuoteValidity(
    row: QuoteValidityRow,
    stamps: PricingStamps | null,
    nowMs: number = Date.now()
): QuoteValidity {
    const pricedMs = parseDbUtcMs(row.updated_at) ?? parseDbUtcMs(row.created_at)
    if (pricedMs == null) return { status: 'ok', pricedAt: null, expiresAt: null }
    const expiresMs = pricedMs + QUOTE_VALID_DAYS * DAY_MS
    const base = {
        pricedAt: new Date(pricedMs).toISOString(),
        expiresAt: new Date(expiresMs).toISOString(),
    }

    if (stamps) {
        const type = String(row.print_method || '').toUpperCase()
        const equipMs = type ? stamps.equipment.get(type) : undefined
        const matKey = quoteMaterialKey(row)
        const matMs = matKey ? stamps.materials.get(matKey) : undefined
        if ((equipMs != null && equipMs > pricedMs) || (matMs != null && matMs > pricedMs)) {
            return { status: 'price_changed', ...base }
        }
    }
    if (nowMs > expiresMs) return { status: 'expired', ...base }
    return { status: 'ok', ...base }
}

export function quoteValidityErrorMessage(status: QuotePriceStatus, quoteId: number): string | null {
    if (status === 'expired') {
        return `견적 유효기간(${QUOTE_VALID_DAYS}일)이 지난 견적(ID ${quoteId})이 있습니다. 장바구니에서 다시 계산한 뒤 주문해 주세요.`
    }
    if (status === 'price_changed') {
        return `단가가 변경된 견적(ID ${quoteId})이 있습니다. 장바구니에서 다시 계산한 뒤 주문해 주세요.`
    }
    return null
}
