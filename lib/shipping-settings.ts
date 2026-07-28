export type ShippingSettings = {
    baseFee: number
    freeThreshold: number
}

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
    baseFee: 3000,
    freeThreshold: 50000,
}

type StoreSettingRow = {
    setting_key?: string
    setting_value?: string | number | null
}

function parseSettingNumber(value: unknown, fallback: number): number {
    if (value == null || value === '') return fallback
    const normalized = String(value).replace(/,/g, '').trim()
    const parsed = Number(normalized)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export function parseShippingSettings(rows: StoreSettingRow[] | null | undefined): ShippingSettings {
    let baseFee = DEFAULT_SHIPPING_SETTINGS.baseFee
    let freeThreshold = DEFAULT_SHIPPING_SETTINGS.freeThreshold

    for (const row of rows ?? []) {
        if (row.setting_key === 'shipping_base_fee') {
            baseFee = parseSettingNumber(row.setting_value, baseFee)
        }
        if (row.setting_key === 'shipping_free_threshold') {
            freeThreshold = parseSettingNumber(row.setting_value, freeThreshold)
        }
    }

    return { baseFee, freeThreshold }
}

export function calculateShippingFee(subtotal: number, settings: ShippingSettings): number {
    if (subtotal <= 0) return 0
    return subtotal >= settings.freeThreshold ? 0 : settings.baseFee
}

export function formatKoreanWonShort(amount: number): string {
    if (amount >= 10000 && amount % 10000 === 0) {
        return `${amount / 10000}만원`
    }
    return `${amount.toLocaleString('ko-KR')}원`
}

export function formatShippingChargeHint(threshold: number): string {
    return `${formatKoreanWonShort(threshold)} 미만 부과`
}

export function formatFreeShippingHint(threshold: number): string {
    return `${formatKoreanWonShort(threshold)} 이상 무료배송`
}

export function formatFreeShippingBenefit(threshold: number): string {
    return `${formatKoreanWonShort(threshold)} ↑ 무료배송 혜택`
}
