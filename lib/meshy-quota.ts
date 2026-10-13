/**
 * 사진→AI 3D 일일 한도 + 관리자 보너스 횟수
 * - 회원: 한국 시간 기준 하루 MESHY_USER_DAILY_LIMIT회 (실패 작업은 미집계)
 * - 같은 IP: 무료(daily) 생성 합계 MESHY_IP_DAILY_LIMIT회 — 다중 계정 우회 방지
 * - 보너스: 관리자 지급·주문 결제 보너스. IP 한도와 무관하게 사용 가능
 * - 관리자(admin·super_admin): 제한 없음
 */

import {
    MESHY_IP_DAILY_LIMIT,
    MESHY_ORDER_BONUS_CREDITS,
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
    /** 관리자 등 제한 없음 */
    unlimited: boolean
}

export type MeshySlotKind = 'daily' | 'bonus' | 'admin'

type D1Like = {
    prepare: (sql: string) => {
        bind: (...args: unknown[]) => {
            first: <T>() => Promise<T | null>
            run: () => Promise<unknown>
            all: <T>() => Promise<{ results?: T[] }>
        }
    }
}

const UNLIMITED_ROLES = new Set(['admin', 'super_admin'])
const UNLIMITED_REMAINING = 999

export function isMeshyUnlimitedRole(role: string | null | undefined): boolean {
    return !!role && UNLIMITED_ROLES.has(role)
}

function changesOf(result: unknown): number {
    return Number((result as { meta?: { changes?: number } })?.meta?.changes) || 0
}

function isMissingColumnError(e: unknown): boolean {
    return e instanceof Error && /no such column|has no column named/i.test(e.message)
}

/** 원본 IP 대신 저장하는 해시 (솔트는 환경변수 IP_HASH_SALT, 없으면 고정값) */
export async function hashClientIp(ip: string | null, salt?: string | null): Promise<string | null> {
    const v = ip?.trim()
    if (!v) return null
    const data = new TextEncoder().encode(`${salt || 'wow3d-meshy-ip'}|${v}`)
    const buf = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(buf))
        .slice(0, 16)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
}

export function getClientIp(request: Request): string | null {
    return (
        request.headers.get('CF-Connecting-IP') ||
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        null
    )
}

/** 오늘 무료(daily) 슬롯 사용 조건 — 보너스·관리자 생성분 제외 (slot 없는 구 데이터는 daily로 간주) */
const USER_DAILY_WHERE = `user_id = ? AND ${MESHY_TODAY_KST_SQL} AND status != 'failed'
                          AND COALESCE(slot, 'daily') = 'daily'`
const USER_DAILY_WHERE_LEGACY = `user_id = ? AND ${MESHY_TODAY_KST_SQL} AND status != 'failed'`

export async function countMeshyUsedToday(db: D1Like, userId: number): Promise<number> {
    const count = async (where: string) => {
        const r = await db
            .prepare(`SELECT COUNT(*) AS c FROM meshy_jobs WHERE ${where}`)
            .bind(userId)
            .first<{ c: number }>()
        return Number(r?.c) || 0
    }
    try {
        return await count(USER_DAILY_WHERE)
    } catch (e) {
        if (!isMissingColumnError(e)) throw e
        return count(USER_DAILY_WHERE_LEGACY)
    }
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

export async function getMeshyQuotaSnapshot(
    db: D1Like,
    userId: number,
    opts: { unlimited?: boolean } = {}
): Promise<MeshyQuotaSnapshot> {
    const usedToday = await countMeshyUsedToday(db, userId)
    const limit = MESHY_USER_DAILY_LIMIT
    const bonusRemaining = await sumMeshyBonusRemaining(db, userId)
    if (opts.unlimited) {
        return {
            limit,
            usedToday,
            remainingDaily: UNLIMITED_REMAINING,
            bonusRemaining,
            remainingTotal: UNLIMITED_REMAINING,
            unlimited: true,
        }
    }
    const remainingDaily = Math.max(0, limit - usedToday)
    return {
        limit,
        usedToday,
        remainingDaily,
        bonusRemaining,
        remainingTotal: remainingDaily + bonusRemaining,
        unlimited: false,
    }
}

export type MeshyReserveInput = {
    userId: number
    sourceFileName: string
    provider: string
    ipHash: string | null
    unlimited: boolean
}

export type MeshyReserveResult =
    | { ok: true; jobId: number; slot: MeshySlotKind; bonusCreditId: number | null }
    | { ok: false; code: 'DAILY_LIMIT' | 'IP_DAILY_LIMIT' }

function lastRowId(result: unknown): number {
    return Number((result as { meta?: { last_row_id?: number } })?.meta?.last_row_id) || 0
}

async function insertJob(
    db: D1Like,
    input: MeshyReserveInput,
    slot: MeshySlotKind
): Promise<number> {
    try {
        const r = await db
            .prepare(
                `INSERT INTO meshy_jobs (user_id, session_id, status, source_file_name, progress, provider, slot, ip_hash)
                 VALUES (?, NULL, 'uploading', ?, 0, ?, ?, ?)`
            )
            .bind(input.userId, input.sourceFileName, input.provider, slot, input.ipHash)
            .run()
        return lastRowId(r)
    } catch (e) {
        if (!isMissingColumnError(e)) throw e
        const r = await db
            .prepare(
                `INSERT INTO meshy_jobs (user_id, session_id, status, source_file_name, progress, provider)
                 VALUES (?, NULL, 'uploading', ?, 0, ?)`
            )
            .bind(input.userId, input.sourceFileName, input.provider)
            .run()
        return lastRowId(r)
    }
}

/**
 * 오늘 무료 슬롯을 조건부 INSERT 한 문장으로 확보 — 동시 요청이 와도 한도를 넘지 않음
 * @returns 생성된 job id, 한도 초과면 0
 */
async function insertDailyJobIfAllowed(db: D1Like, input: MeshyReserveInput): Promise<number> {
    const userCond = (where: string) => `(SELECT COUNT(*) FROM meshy_jobs WHERE ${where}) < ?`
    try {
        const r = await db
            .prepare(
                `INSERT INTO meshy_jobs (user_id, session_id, status, source_file_name, progress, provider, slot, ip_hash)
                 SELECT ?, NULL, 'uploading', ?, 0, ?, 'daily', ?
                 WHERE ${userCond(USER_DAILY_WHERE)}
                   AND (? IS NULL OR (SELECT COUNT(*) FROM meshy_jobs
                                      WHERE ip_hash = ? AND ${MESHY_TODAY_KST_SQL}
                                        AND status != 'failed' AND slot = 'daily') < ?)`
            )
            .bind(
                input.userId,
                input.sourceFileName,
                input.provider,
                input.ipHash,
                input.userId,
                MESHY_USER_DAILY_LIMIT,
                input.ipHash,
                input.ipHash,
                MESHY_IP_DAILY_LIMIT
            )
            .run()
        return changesOf(r) > 0 ? lastRowId(r) : 0
    } catch (e) {
        if (!isMissingColumnError(e)) throw e
        // slot·ip_hash 컬럼 마이그레이션 전: 회원 일일 한도만 원자적으로 적용
        const r = await db
            .prepare(
                `INSERT INTO meshy_jobs (user_id, session_id, status, source_file_name, progress, provider)
                 SELECT ?, NULL, 'uploading', ?, 0, ?
                 WHERE ${userCond(USER_DAILY_WHERE_LEGACY)}`
            )
            .bind(input.userId, input.sourceFileName, input.provider, input.userId, MESHY_USER_DAILY_LIMIT)
            .run()
        return changesOf(r) > 0 ? lastRowId(r) : 0
    }
}

/** 보너스 1회를 조건부 UPDATE로 선차감. 성공 시 차감한 credit id */
async function takeBonusCredit(db: D1Like, userId: number): Promise<number | null> {
    try {
        const row = await db
            .prepare(
                `UPDATE meshy_bonus_credits
                 SET remaining = remaining - 1, updated_at = datetime('now')
                 WHERE id = (SELECT id FROM meshy_bonus_credits
                             WHERE user_id = ? AND remaining > 0
                             ORDER BY id ASC LIMIT 1)
                   AND remaining > 0
                 RETURNING id`
            )
            .bind(userId)
            .first<{ id: number }>()
        return row?.id ?? null
    } catch {
        return null
    }
}

/** 외부 작업 생성 실패 등으로 job이 무효가 됐을 때 선차감한 보너스 복구 */
export async function refundMeshyBonusCredit(db: D1Like, creditId: number): Promise<void> {
    try {
        await db
            .prepare(
                `UPDATE meshy_bonus_credits
                 SET remaining = MIN(amount, remaining + 1), updated_at = datetime('now')
                 WHERE id = ?`
            )
            .bind(creditId)
            .run()
    } catch (e) {
        console.error('refundMeshyBonusCredit', e)
    }
}

/**
 * 생성 슬롯 확보 + meshy_jobs 행 생성 (status 'uploading')
 * 순서: 관리자 무제한 → 오늘 무료(daily, IP 한도 포함) → 보너스
 */
export async function reserveMeshyJob(db: D1Like, input: MeshyReserveInput): Promise<MeshyReserveResult> {
    if (input.unlimited) {
        const jobId = await insertJob(db, input, 'admin')
        if (!jobId) throw new Error('작업 생성 실패')
        return { ok: true, jobId, slot: 'admin', bonusCreditId: null }
    }

    const dailyJobId = await insertDailyJobIfAllowed(db, input)
    if (dailyJobId) return { ok: true, jobId: dailyJobId, slot: 'daily', bonusCreditId: null }

    const creditId = await takeBonusCredit(db, input.userId)
    if (creditId) {
        try {
            const jobId = await insertJob(db, input, 'bonus')
            if (!jobId) throw new Error('작업 생성 실패')
            return { ok: true, jobId, slot: 'bonus', bonusCreditId: creditId }
        } catch (e) {
            await refundMeshyBonusCredit(db, creditId)
            throw e
        }
    }

    // 회원 일일 슬롯이 남아 있는데 막혔다면 IP 한도 때문
    const usedToday = await countMeshyUsedToday(db, input.userId)
    return {
        ok: false,
        code: usedToday < MESHY_USER_DAILY_LIMIT ? 'IP_DAILY_LIMIT' : 'DAILY_LIMIT',
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
    return lastRowId(insert)
}

export function meshyOrderBonusNote(orderId: number): string {
    return `주문 #${orderId} 결제 보너스`
}

/**
 * 회원 주문의 결제가 확인되면 보너스 지급 (주문당 1번만 — note로 중복 방지)
 * @returns 새로 지급했으면 true
 */
export async function grantMeshyOrderBonus(db: D1Like, orderId: number): Promise<boolean> {
    const note = meshyOrderBonusNote(orderId)
    const n = MESHY_ORDER_BONUS_CREDITS
    try {
        const r = await db
            .prepare(
                `INSERT INTO meshy_bonus_credits (user_id, amount, remaining, note, granted_by)
                 SELECT o.user_id, ?, ?, ?, NULL
                 FROM orders o
                 WHERE o.id = ? AND o.user_id IS NOT NULL
                   AND NOT EXISTS (SELECT 1 FROM meshy_bonus_credits WHERE note = ?)`
            )
            .bind(n, n, note, orderId, note)
            .run()
        return changesOf(r) > 0
    } catch (e) {
        console.error('grantMeshyOrderBonus', e)
        return false
    }
}
