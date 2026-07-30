/**
 * 주문 견적 단가 DB 확정 로직 스모크 테스트
 * 실행: npx --yes tsx scripts/test-order-quote-prices.ts
 */
import assert from 'node:assert/strict'
import { resolveOrderLinesFromDb } from '../lib/resolve-order-quote-prices'

type Row = { id: number; total_price: number; volume_cm3: number; cart_quantity: number }

function mockDb(rows: Row[]) {
    return {
        prepare(_sql: string) {
            return {
                bind: (...args: unknown[]) => ({
                    async all<T>() {
                        const ids = args.slice(0, -1) as number[]
                        const owner = args[args.length - 1]
                        if (owner !== 42) return { results: [] as T[] }
                        const filtered = rows.filter((r) => ids.includes(r.id))
                        return { results: filtered as T[] }
                    },
                }),
            }
        },
    }
}

async function run() {
    const db = mockDb([{ id: 10, total_price: 55000, volume_cm3: 30, cart_quantity: 2 }])
    const ok = await resolveOrderLinesFromDb(
        db,
        [{ quoteId: 10, quantity: 2, totalPrice: 1 }],
        { isGuest: false, userId: 42 }
    )
    assert.equal(ok.ok, true)
    if (!ok.ok) throw new Error('expected ok')
    assert.equal(ok.lines[0].unitPrice, 55000)
    assert.equal(ok.lines[0].quantity, 2)
    assert.equal(ok.totalAmount, 110000)

    const bad = await resolveOrderLinesFromDb(db, [{ quoteId: 99, quantity: 1 }], {
        isGuest: false,
        userId: 42,
    })
    assert.equal(bad.ok, false)

    console.log('OK order-quote-prices tests passed')
}

run()
