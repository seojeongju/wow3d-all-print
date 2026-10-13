/**
 * 사진→AI 3D 슬롯 예약 로직 검증 (node:sqlite로 D1 흉내)
 * 실행: npx tsx scripts/test-meshy-quota.ts
 */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import {
    getMeshyQuotaSnapshot,
    grantMeshyBonusCredits,
    grantMeshyOrderBonus,
    hashClientIp,
    refundMeshyBonusCredit,
    reserveMeshyJob,
    sumMeshyBonusRemaining,
} from '../lib/meshy-quota'
import { MESHY_IP_DAILY_LIMIT } from '../lib/meshy'

type SqlValue = string | number | null

/** node:sqlite(Node 22.5+) 최소 타입 — 설치된 @types/node에 선언이 없어 직접 정의 */
type SqliteStatement = {
    get: (...params: SqlValue[]) => unknown
    run: (...params: SqlValue[]) => { changes: number | bigint; lastInsertRowid: number | bigint }
    all: (...params: SqlValue[]) => unknown[]
}
type DatabaseSync = { exec: (sql: string) => void; prepare: (sql: string) => SqliteStatement }
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as {
    DatabaseSync: new (path: string) => DatabaseSync
}

function d1(db: DatabaseSync) {
    return {
        prepare(sql: string) {
            return {
                bind(...args: unknown[]) {
                    const params = args.map((a) => (a === undefined ? null : a)) as SqlValue[]
                    return {
                        async first<T>() {
                            return (db.prepare(sql).get(...params) as T | undefined) ?? null
                        },
                        async run() {
                            const r = db.prepare(sql).run(...params)
                            return { meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } }
                        },
                        async all<T>() {
                            return { results: db.prepare(sql).all(...params) as T[] }
                        },
                    }
                },
            }
        },
    }
}

function createDb(withSlotColumns: boolean) {
    const db = new DatabaseSync(':memory:')
    db.exec(`
        CREATE TABLE meshy_jobs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER, session_id TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          meshy_task_id TEXT, source_image_key TEXT, source_file_name TEXT,
          result_file_key TEXT, result_file_name TEXT, thumbnail_url TEXT,
          progress INTEGER DEFAULT 0, credits_used INTEGER, error_message TEXT,
          quote_id INTEGER, provider TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE meshy_bonus_credits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL, amount INTEGER NOT NULL DEFAULT 1,
          remaining INTEGER NOT NULL DEFAULT 1, note TEXT, granted_by INTEGER,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER);
    `)
    if (withSlotColumns) {
        db.exec(`ALTER TABLE meshy_jobs ADD COLUMN slot TEXT; ALTER TABLE meshy_jobs ADD COLUMN ip_hash TEXT;`)
    }
    return { raw: db, db: d1(db) }
}

const base = { sourceFileName: 'a.jpg', provider: 'tripo', unlimited: false }

async function main() {
    const { raw, db } = createDb(true)
    const ipA = await hashClientIp('1.2.3.4', 'salt')
    const ipB = await hashClientIp('5.6.7.8', 'salt')

    // IP 해시: 결정적·원본 미포함·빈 값은 null
    assert.equal(ipA, await hashClientIp('1.2.3.4', 'salt'))
    assert.notEqual(ipA, ipB)
    assert.ok(ipA && !ipA.includes('1.2.3.4'))
    assert.equal(await hashClientIp(null), null)

    // 회원 일일 1회
    const r1 = await reserveMeshyJob(db, { ...base, userId: 1, ipHash: ipA })
    assert.ok(r1.ok && r1.slot === 'daily')
    const r2 = await reserveMeshyJob(db, { ...base, userId: 1, ipHash: ipA })
    assert.deepEqual(r2, { ok: false, code: 'DAILY_LIMIT' })

    // 보너스 선차감 → 소진 → 환불
    await grantMeshyBonusCredits(db, 1, 1, '테스트', null)
    const r3 = await reserveMeshyJob(db, { ...base, userId: 1, ipHash: ipA })
    assert.ok(r3.ok && r3.slot === 'bonus' && r3.bonusCreditId)
    assert.equal(await sumMeshyBonusRemaining(db, 1), 0)
    assert.deepEqual(await reserveMeshyJob(db, { ...base, userId: 1, ipHash: ipA }), { ok: false, code: 'DAILY_LIMIT' })
    if (r3.ok && r3.bonusCreditId) await refundMeshyBonusCredit(db, r3.bonusCreditId)
    assert.equal(await sumMeshyBonusRemaining(db, 1), 1)
    // 환불은 지급량을 넘지 않음
    if (r3.ok && r3.bonusCreditId) await refundMeshyBonusCredit(db, r3.bonusCreditId)
    assert.equal(await sumMeshyBonusRemaining(db, 1), 1)

    // 실패 처리된 job은 일일 슬롯을 돌려줌
    raw.prepare(`UPDATE meshy_jobs SET status = 'failed' WHERE id = ?`).run(r1.ok ? r1.jobId : 0)
    const r4 = await reserveMeshyJob(db, { ...base, userId: 1, ipHash: ipA })
    assert.ok(r4.ok && r4.slot === 'daily')

    // 같은 IP 무료 합계 한도 (user 1의 daily 1건 포함)
    for (let u = 2; u <= MESHY_IP_DAILY_LIMIT; u++) {
        const r = await reserveMeshyJob(db, { ...base, userId: u, ipHash: ipA })
        assert.ok(r.ok && r.slot === 'daily', `user ${u} daily`)
    }
    const blocked = await reserveMeshyJob(db, { ...base, userId: 50, ipHash: ipA })
    assert.deepEqual(blocked, { ok: false, code: 'IP_DAILY_LIMIT' })
    // 다른 IP는 영향 없음
    const other = await reserveMeshyJob(db, { ...base, userId: 51, ipHash: ipB })
    assert.ok(other.ok && other.slot === 'daily')
    // 보너스는 IP 한도와 무관
    await grantMeshyBonusCredits(db, 50, 2, null, null)
    const bonusOnBlockedIp = await reserveMeshyJob(db, { ...base, userId: 50, ipHash: ipA })
    assert.ok(bonusOnBlockedIp.ok && bonusOnBlockedIp.slot === 'bonus')
    // IP를 알 수 없으면 회원 한도만 적용
    const noIp = await reserveMeshyJob(db, { ...base, userId: 52, ipHash: null })
    assert.ok(noIp.ok && noIp.slot === 'daily')

    // 관리자 무제한
    for (let i = 0; i < 5; i++) {
        const r = await reserveMeshyJob(db, { ...base, userId: 99, ipHash: ipA, unlimited: true })
        assert.ok(r.ok && r.slot === 'admin')
    }
    const adminSnap = await getMeshyQuotaSnapshot(db, 99, { unlimited: true })
    assert.ok(adminSnap.unlimited && adminSnap.remainingTotal > 0)
    // 관리자 생성분은 IP 무료 한도에 포함되지 않음
    const ipDaily = raw
        .prepare(`SELECT COUNT(*) AS c FROM meshy_jobs WHERE ip_hash = ? AND slot = 'daily' AND status != 'failed'`)
        .get(ipA) as { c: number }
    assert.equal(ipDaily.c, MESHY_IP_DAILY_LIMIT)

    // 주문 결제 보너스: 주문당 1번, 비회원 주문 제외
    raw.exec(`INSERT INTO orders (id, user_id) VALUES (10, 7), (11, NULL)`)
    assert.equal(await grantMeshyOrderBonus(db, 10), true)
    assert.equal(await grantMeshyOrderBonus(db, 10), false)
    assert.equal(await grantMeshyOrderBonus(db, 11), false)
    assert.equal(await sumMeshyBonusRemaining(db, 7), 1)

    // slot·ip_hash 컬럼 마이그레이션 전 DB에서도 회원 일일 한도는 동작
    const legacy = createDb(false)
    const l1 = await reserveMeshyJob(legacy.db, { ...base, userId: 1, ipHash: ipA })
    assert.ok(l1.ok && l1.slot === 'daily')
    const l2 = await reserveMeshyJob(legacy.db, { ...base, userId: 1, ipHash: ipA })
    assert.equal(l2.ok, false)
    await grantMeshyBonusCredits(legacy.db, 1, 1, null, null)
    const l3 = await reserveMeshyJob(legacy.db, { ...base, userId: 1, ipHash: ipA })
    assert.ok(l3.ok && l3.slot === 'bonus')

    console.log('test-meshy-quota: 모든 검증 통과')
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
