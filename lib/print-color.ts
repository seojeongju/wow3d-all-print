/**
 * 견적 출력 색상 옵션
 * - 소재별 기본 색상 + 모든 소재에 투명·기타색상 문의 공통 제공 (getAllowedPrintColors).
 * - 기타색상 문의는 고객이 원하는 색상을 직접 적고, 담당자가 재고 확인 후 금액·일정을 확정한다.
 * - 색상은 자동 견적 금액에 영향을 주지 않는다.
 */

/** UI·표시 순서 */
export const PRINT_COLOR_ORDER = ['white', 'black', 'clear', 'other'] as const
export const PRINT_COLORS = PRINT_COLOR_ORDER
export type PrintColor = (typeof PRINT_COLORS)[number]

export const PRINT_COLOR_DEFAULT: PrintColor = 'white'
export const PRINT_COLOR_NOTE_MAX = 50

/** 모든 소재에 공통으로 붙는 옵션 */
const PRINT_COLOR_EXTRAS: readonly PrintColor[] = ['clear', 'other']

export function normalizePrintColor(value: unknown): PrintColor | null {
    const v = String(value ?? '').trim().toLowerCase()
    return (PRINT_COLORS as readonly string[]).includes(v) ? (v as PrintColor) : null
}

/** 기타 색상 메모 정리 — 제어문자 제거·공백 정리·길이 제한, 비면 null */
export function normalizePrintColorNote(value: unknown): string | null {
    if (value == null) return null
    const s = String(value)
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, PRINT_COLOR_NOTE_MAX)
    return s || null
}

const LABELS: Record<'ko' | 'en', Record<PrintColor, string>> = {
    ko: { white: '화이트', black: '블랙', clear: '투명', other: '기타색상 문의' },
    en: { white: 'White', black: 'Black', clear: 'Clear', other: 'Other color inquiry' },
}

/** 표시용 색상 라벨 (예: "블랙", "기타색상 문의(빨강)", "투명"). 저장값이 없으면 빈 문자열 */
export function formatPrintColor(
    color: unknown,
    note?: unknown,
    locale: string = 'ko'
): string {
    const c = normalizePrintColor(color)
    if (!c) return ''
    const label = LABELS[locale === 'en' ? 'en' : 'ko'][c]
    if (c !== 'other') return label
    const n = normalizePrintColorNote(note)
    return n ? `${label}(${n})` : label
}

/** 레진 소재 계열 (이름 앞부분·별칭 허용) */
function resinFamily(materialName: string): 'standard' | 'tough' | 'clear' | 'flexible' | 'other' {
    const s = materialName.trim().toLowerCase()
    if (!s) return 'other'
    if (s === 'clear' || s.startsWith('clear')) return 'clear'
    if (s === 'flexible' || s.startsWith('flexible')) return 'flexible'
    if (s === 'tough' || s.startsWith('tough')) return 'tough'
    if (s === 'standard' || s.startsWith('standard')) return 'standard'
    return 'other'
}

/** 기본 옵션에 투명·기타색상 문의를 합치고 표시 순서로 정렬 */
function withCommonColorExtras(base: readonly PrintColor[]): readonly PrintColor[] {
    const set = new Set<PrintColor>([...base, ...PRINT_COLOR_EXTRAS])
    return PRINT_COLOR_ORDER.filter((c) => set.has(c))
}

/**
 * 출력 방식·소재별 선택 가능한 색상
 * - FDM: 화이트·블랙 (+ 투명·기타색상 문의)
 * - DLP/SLA Standard·Tough: 화이트·블랙 (+ 투명·기타색상 문의)
 * - DLP/SLA Clear: 투명 (+ 기타색상 문의)
 * - DLP/SLA Flexible: 화이트 (+ 투명·기타색상 문의)
 */
export function getAllowedPrintColors(
    printMethod: string,
    materialName: string
): readonly PrintColor[] {
    const method = String(printMethod ?? '').trim().toLowerCase()
    const mat = String(materialName ?? '').trim()

    if (method === 'fdm') {
        return withCommonColorExtras(['white', 'black'])
    }

    // DLP / SLA (및 기타 레진 방식)
    const family = resinFamily(mat)
    if (family === 'clear') return withCommonColorExtras(['clear'])
    if (family === 'flexible') return withCommonColorExtras(['white'])
    // Standard · Tough · 미분류 레진
    return withCommonColorExtras(['white', 'black'])
}

/** 현재 색상이 소재에서 허용되면 유지, 아니면 허용 목록의 첫 항목으로 보정 */
export function coercePrintColorForMaterial(
    color: unknown,
    printMethod: string,
    materialName: string
): PrintColor {
    const allowed = getAllowedPrintColors(printMethod, materialName)
    const current = normalizePrintColor(color)
    if (current && allowed.includes(current)) return current
    return allowed[0] ?? PRINT_COLOR_DEFAULT
}

export function isPrintColorAllowed(
    color: unknown,
    printMethod: string,
    materialName: string
): boolean {
    const c = normalizePrintColor(color)
    if (!c) return false
    return getAllowedPrintColors(printMethod, materialName).includes(c)
}
