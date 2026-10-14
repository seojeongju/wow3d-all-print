/**
 * 견적 출력 색상 옵션 (화이트·블랙·기타)
 * - 기타는 고객이 원하는 색상을 직접 적고, 담당자가 재고 확인 후 금액·일정을 확정한다.
 * - 색상은 자동 견적 금액에 영향을 주지 않는다.
 */

export const PRINT_COLORS = ['white', 'black', 'other'] as const
export type PrintColor = (typeof PRINT_COLORS)[number]

export const PRINT_COLOR_DEFAULT: PrintColor = 'white'
export const PRINT_COLOR_NOTE_MAX = 50

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
    ko: { white: '화이트', black: '블랙', other: '기타' },
    en: { white: 'White', black: 'Black', other: 'Other' },
}

/** 표시용 색상 라벨 (예: "블랙", "기타(빨강)"). 저장값이 없으면 빈 문자열 */
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
