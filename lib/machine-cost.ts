/**
 * 장비비(출력 시간 × 시간당 단가) — 장시간 출력 구간별 누진 할인
 * - 0~5시간: 100%
 * - 5~10시간 구간: 90%
 * - 10시간 초과분: 80%
 * 구간마다 해당 시간에만 할인율을 적용하므로 시간이 늘면 장비비도 항상 늘어난다.
 */

export const MACHINE_RATE_TIERS: ReadonlyArray<{ upToHours: number; factor: number }> = [
    { upToHours: 5, factor: 1 },
    { upToHours: 10, factor: 0.9 },
    { upToHours: Number.POSITIVE_INFINITY, factor: 0.8 },
]

export function calculateMachineCost(hours: number, rateKr: number): number {
    const h = Math.max(0, Number(hours) || 0)
    const rate = Math.max(0, Number(rateKr) || 0)
    let cost = 0
    let from = 0
    for (const tier of MACHINE_RATE_TIERS) {
        if (h <= from) break
        const span = Math.min(h, tier.upToHours) - from
        cost += span * rate * tier.factor
        from = tier.upToHours
    }
    return cost
}
