/**
 * 출력방식(장비 type) · 견적 공식(quote_family) 공용 헬퍼
 * - type: 관리자가 추가한 코드 (예: FDM, LCD, MJF) — 견적·주문에 저장
 * - quote_family: 실제 단가 산출에 쓰는 FDM | SLA | DLP
 */

export const CORE_QUOTE_FAMILIES = ['FDM', 'SLA', 'DLP'] as const
export type QuoteFamily = (typeof CORE_QUOTE_FAMILIES)[number]
export type QuoteFamilyKey = 'fdm' | 'sla' | 'dlp'

/** 관리자 장비 type 코드: 영문·숫자·_- , 2~16자 */
export function normalizeEquipmentTypeCode(raw: unknown): string | null {
    const s = String(raw ?? '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '_')
    if (!/^[A-Z][A-Z0-9_-]{1,15}$/.test(s)) return null
    return s
}

export function normalizeQuoteFamily(raw: unknown, fallbackType?: string): QuoteFamily {
    const s = String(raw ?? fallbackType ?? '')
        .trim()
        .toUpperCase()
    if (s === 'SLA') return 'SLA'
    if (s === 'DLP') return 'DLP'
    if (s === 'FDM') return 'FDM'
    const fb = String(fallbackType ?? '')
        .trim()
        .toUpperCase()
    if (fb === 'SLA' || fb === 'DLP' || fb === 'FDM') return fb
    return 'FDM'
}

export function quoteFamilyKey(family: QuoteFamily | string): QuoteFamilyKey {
    const f = normalizeQuoteFamily(family)
    return f.toLowerCase() as QuoteFamilyKey
}

export function isCoreEquipmentType(type: string): boolean {
    const t = String(type).trim().toUpperCase()
    return (CORE_QUOTE_FAMILIES as readonly string[]).includes(t)
}

/** 견적 로그 등에 허용하는 print_method (소문자 type 코드) */
export function isValidPrintMethodCode(raw: unknown): boolean {
    const s = String(raw ?? '')
        .trim()
        .toLowerCase()
    return /^[a-z][a-z0-9_-]{1,15}$/.test(s)
}
