/**
 * 기본(최소) 견적금액 해석
 * - 소재에 값이 있으면 소재만 사용
 * - 없으면 장비(출력방식) 폴백
 * - 이미 저장된 quotes.min_price_krw 스냅샷은 호출부에서 우선 적용 (이 헬퍼로 덮어쓰지 않음)
 */

/** 양의 금액만 유효. 없으면 null */
export function positiveMinPriceKrw(raw: unknown): number | null {
    const n = Number(raw)
    if (!Number.isFinite(n) || n <= 0) return null
    return n
}

/**
 * 소재 우선 · 장비 폴백.
 * @returns 적용할 최소 공급가(원). 둘 다 없으면 undefined
 */
export function resolveEffectiveMinPriceKrw(
    materialMin: unknown,
    equipmentMin: unknown
): number | undefined {
    const fromMaterial = positiveMinPriceKrw(materialMin)
    if (fromMaterial != null) return fromMaterial
    const fromEquipment = positiveMinPriceKrw(equipmentMin)
    return fromEquipment ?? undefined
}
