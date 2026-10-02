/**
 * 견적 유효기간·단가 변경 판정 + 주문 차단 테스트
 * 실행: npx --yes tsx scripts/test-quote-validity.ts
 */
import assert from 'node:assert/strict'
import {
    evaluateQuoteValidity,
    loadPricingStamps,
    parseDbUtcMs,
    QUOTE_VALID_DAYS,
} from '../lib/quote-validity'
import { resolveOrderLinesFromDb } from '../lib/resolve-order-quote-prices'

const now = parseDbUtcMs('2026-10-02 07:00:00')!
assert.equal(parseDbUtcMs('2026-10-02 07:00:00'), Date.UTC(2026, 9, 2, 7, 0, 0), 'D1 문자열은 UTC')
assert.equal(parseDbUtcMs('2026-10-02T07:00:00.000Z'), Date.UTC(2026, 9, 2, 7, 0, 0))
assert.equal(QUOTE_VALID_DAYS, 7)

const stamps = {
    equipment: new Map([['FDM', parseDbUtcMs('2026-10-02 05:44:44')!]]),
    materials: new Map([['FDM:abs', parseDbUtcMs('2026-01-27 04:10:46')!]]),
}

// 실제 컴플레인 사례: 단가 변경(05:44) 이전 견적 693 → 단가 변경, 이후 견적 699 → 정상
const q693 = { created_at: '2026-10-02 04:46:09', updated_at: '2026-10-02 04:46:09', print_method: 'fdm', fdm_material: 'ABS' }
const q699 = { created_at: '2026-10-02 06:53:54', updated_at: '2026-10-02 06:53:54', print_method: 'fdm', fdm_material: 'ABS' }
assert.equal(evaluateQuoteValidity(q693, stamps, now).status, 'price_changed')
assert.equal(evaluateQuoteValidity(q699, stamps, now).status, 'ok')
assert.equal(evaluateQuoteValidity(q699, stamps, now).expiresAt, '2026-10-09T06:53:54.000Z')

// 다른 출력방식 장비 변경은 무관
assert.equal(evaluateQuoteValidity({ ...q693, print_method: 'sla', fdm_material: null, resin_type_name: 'Standard 레진' }, stamps, now).status, 'ok')

// 소재 단가 변경
const matStamps = { equipment: new Map<string, number>(), materials: new Map([['FDM:pla', parseDbUtcMs('2026-10-01 00:00:00')!]]) }
assert.equal(evaluateQuoteValidity({ updated_at: '2026-09-30 00:00:00', print_method: 'fdm', fdm_material_name: 'PLA' }, matStamps, now).status, 'price_changed')

// 재저장(updated_at 갱신)하면 해소
assert.equal(evaluateQuoteValidity({ ...q693, updated_at: '2026-10-02 06:00:00' }, stamps, now).status, 'ok')

// 유효기간 7일
const empty = { equipment: new Map<string, number>(), materials: new Map<string, number>() }
assert.equal(evaluateQuoteValidity({ updated_at: '2026-09-25 07:00:01', print_method: 'fdm' }, empty, now).status, 'ok')
assert.equal(evaluateQuoteValidity({ updated_at: '2026-09-25 06:59:59', print_method: 'fdm' }, empty, now).status, 'expired')
assert.equal(evaluateQuoteValidity({ created_at: '2026-09-20 00:00:00', print_method: 'fdm' }, empty, now).status, 'expired', 'updated_at 없으면 created_at')
assert.equal(evaluateQuoteValidity({}, empty, now).status, 'ok', '시각 정보 없으면 판정 생략')

async function run() {
    // 장비·소재 시각 로드 (all() 지원 DB)
    const stampDb = {
        prepare(sql: string) {
            return {
                async all<T>() {
                    if (sql.includes('printer_equipment')) return { results: [{ type: 'FDM', updated_at: '2026-10-02 05:44:44' }] as T[] }
                    return { results: [{ type: 'FDM', name: 'ABS', updated_at: '2026-01-27 04:10:46' }] as T[] }
                },
            }
        },
    }
    const loaded = await loadPricingStamps(stampDb)
    assert.equal(loaded.equipment.get('FDM'), stamps.equipment.get('FDM'))
    assert.equal(loaded.materials.get('FDM:abs'), stamps.materials.get('FDM:abs'))

    // 주문 차단: 오래된 견적은 409
    const rows = [
        { id: 1, total_price: 22000, volume_cm3: 5, cart_quantity: 1, print_method: 'fdm', fdm_material: 'PLA', created_at: '2020-01-01 00:00:00', updated_at: '2020-01-01 00:00:00' },
        { id: 2, total_price: 22000, volume_cm3: 5, cart_quantity: 1, print_method: 'fdm', fdm_material: 'PLA', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ]
    const orderDb = {
        prepare(sql: string) {
            return {
                bind: (...args: unknown[]) => ({
                    async all<T>() {
                        const ids = args.slice(0, -1) as number[]
                        return { results: rows.filter((r) => ids.includes(r.id)) as T[] }
                    },
                }),
                async all<T>() {
                    void sql
                    return { results: [] as T[] }
                },
            }
        },
    }
    const blocked = await resolveOrderLinesFromDb(orderDb, [{ quoteId: 1, quantity: 1 }], { isGuest: false, userId: 42 })
    assert.equal(blocked.ok, false)
    if (!blocked.ok) {
        assert.equal(blocked.status, 409)
        assert.match(blocked.error, /유효기간/)
    }
    const fresh = await resolveOrderLinesFromDb(orderDb, [{ quoteId: 2, quantity: 1 }], { isGuest: false, userId: 42 })
    assert.equal(fresh.ok, true)

    console.log('OK quote-validity tests passed')
}

void run()
