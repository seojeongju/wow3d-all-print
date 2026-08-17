/**
 * 사진→AI 3D 일일 한도 + 관리자 보너스 횟수
 */

import {
    MESHY_TODAY_KST_SQL,
    MESHY_USER_DAILY_LIMIT,
} from '@/lib/meshy'

export type MeshyQuotaSnapshot = {
    limit: number
    usedToday: number
    remainingDaily: number
    bonusRemaining: number
    /** 오늘 무료 슬롯 + 보너스 합 */
    remainingTotal: number
}

export type MeshySlotKind = 'daily' | 'bonus'

type D1Like = {
    prepare: (sql: string) => {
        bind: (...args: unknown[]) => {
            first: <T>() => Promise<T | null>
            run: () => Promise<unknown>
            all: <T>() => Promise<{ results?: T[] }>
        }
    }
}

export async function countMeshyUsedToday(db: D1Like, userId: number): Promise<number> {
    const r = await db
        .prepare(
            `SELECT COUNT(*) AS c FROM meshy_jobs
             WHERE user_id = ?
               AND ${MESHY_TODAY_KST_SQL}
               AND status != 'failed'`
        )
        .bind(userId)
        .first<{ c: number }>()
    return Number(r?.c) || 0
}

export async function sumMeshyBonusRemaining(db: D1Like, userId: number): Promise<number> {
    try {
        const r = await db
            .prepare(
                `SELECT COALESCE(SUM(remaining), 0) AS s FROM meshy_bonus_credits
                 WHERE user_id = ? AND remaining > 0`
            )
            .bind(userId)
            .first<{ s: number }>()
        return Number(r?.s) || 0
    } catch {
        return 0
    }
}

export async function getMeshyQuotaSnapshot(db: D1Like, userId: number): Promise<MeshyQuotaSnapshot> {
    const usedToday = await countMeshyUsedToday(db, userId)
    const limit = MESHY_USER_DAILY_LIMIT
    const remainingDaily = Math.max(0, limit - usedToday)
    const bonusRemaining = await sumMeshyBonusRemaining(db, userId)
    return {
        limit,
        usedToday,
        remainingDaily,
        bonusRemaining,
        remainingTotal: remainingDaily + bonusRemaining,
    }
}

/** 생성 가능 여부만 확인 (차감 없음). daily 우선 */
export async function peekMeshySlot(db: D1Like, userId: number): Promise<MeshySlotKind | null> {
    const snap = await getMeshyQuotaSnapshot(db, userId)
    if (snap.remainingDaily > 0) return 'daily'
    if (snap.bonusRemaining > 0) return 'bonus'
    return null
}

/** Meshy task 생성 성공 후 보너스만 차감 (일일 슬롯은 job COUNT로 집계) */
export async function consumeMeshyBonusCredit(db: D1Like, userId: number): Promise<boolean> {
    try {
        const row = await db
            .prepare(
                `SELECT id FROM meshy_bonus_credits
                 WHERE user_id = ? AND remaining > 0
                 ORDER BY id ASC
                 LIMIT 1`
            )
            .bind(userId)
            .first<{ id: number }>()

        if (!row) return false

        await db
            .prepare(
                `UPDATE meshy_bonus_credits
                 SET remaining = remaining - 1, updated_at = datetime('now')
                 WHERE id = ? AND remaining > 0`
            )
            .bind(row.id)
            .run()

        return true
    } catch {
        return false
    }
}

export async function grantMeshyBonusCredits(
    db: D1Like,
    userId: number,
    amount: number,
    note: string | null,
    grantedBy: number | null
): Promise<number> {
    const n = Math.max(1, Math.min(100, Math.floor(amount)))
    const insert = await db
        .prepare(
            `INSERT INTO meshy_bonus_credits (user_id, amount, remaining, note, granted_by)
             VALUES (?, ?, ?, ?, ?)`
        )
        .bind(userId, n, n, note, grantedBy)
        .run()
    return Number((insert as { meta?: { last_row_id?: number } })?.meta?.last_row_id) || 0
}
