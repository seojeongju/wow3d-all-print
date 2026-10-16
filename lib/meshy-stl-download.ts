/**
 * 사진→AI 3D STL 「내 PC 저장」권한
 * - 사이트 안 프리뷰·견적·주문은 소유자라면 가능
 * - 파일 저장(download=1)은 해당 모델이 들어간 주문이 「제작 중」이상일 때만
 */
import {
    buildAiPhotoResultFileName,
    parseMeshyJobIdFromFileName,
} from '@/lib/meshy-r2'

/** 관리자가 「제작 중」으로 바꾼 뒤(및 이후 배송·완료)에만 STL 저장 허용 */
export const MESHY_STL_DOWNLOAD_ORDER_STATUSES = [
    'production',
    'shipping',
    'delivered',
    'completed',
] as const

export type MeshyStlDownloadOrderStatus = (typeof MESHY_STL_DOWNLOAD_ORDER_STATUSES)[number]

export function isMeshyStlDownloadOrderStatus(status: string): status is MeshyStlDownloadOrderStatus {
    return (MESHY_STL_DOWNLOAD_ORDER_STATUSES as readonly string[]).includes(status)
}

type D1Like = {
    prepare: (sql: string) => {
        bind: (...args: unknown[]) => {
            first: <T>() => Promise<T | null>
            all: <T>() => Promise<{ results?: T[] }>
        }
    }
}

const STATUS_PLACEHOLDERS = MESHY_STL_DOWNLOAD_ORDER_STATUSES.map(() => '?').join(', ')

/**
 * 회원 userId가 jobId STL을 PC에 저장할 수 있는지
 * — meshy_jobs.quote_id 연결 또는 견적 파일명(ai-photo-{id}.stl)으로 주문과 매칭
 */
export async function canUserDownloadMeshyStl(
    db: D1Like,
    jobId: number,
    userId: number
): Promise<boolean> {
    if (!Number.isInteger(jobId) || jobId < 1 || !Number.isInteger(userId) || userId < 1) {
        return false
    }
    const aiName = buildAiPhotoResultFileName(jobId)
    const meshyName = `meshy-${jobId}.stl`
    const meshName = `mesh-${jobId}.stl`

    const row = await db
        .prepare(
            `SELECT 1 AS ok
             FROM orders o
             INNER JOIN order_items oi ON oi.order_id = o.id
             INNER JOIN quotes q ON q.id = oi.quote_id
             LEFT JOIN meshy_jobs mj ON mj.quote_id = q.id
             WHERE o.user_id = ?
               AND o.status IN (${STATUS_PLACEHOLDERS})
               AND (
                 mj.id = ?
                 OR lower(q.file_name) = lower(?)
                 OR lower(q.file_name) = lower(?)
                 OR lower(q.file_name) = lower(?)
               )
             LIMIT 1`
        )
        .bind(userId, ...MESHY_STL_DOWNLOAD_ORDER_STATUSES, jobId, aiName, meshyName, meshName)
        .first<{ ok: number }>()

    return !!row
}

/** 여러 job에 대해 저장 허용 여부를 한 번에 조회 */
export async function meshyStlDownloadAllowedByJobIds(
    db: D1Like,
    userId: number,
    jobIds: number[]
): Promise<Set<number>> {
    const ids = [...new Set(jobIds.filter((id) => Number.isInteger(id) && id > 0))]
    const allowed = new Set<number>()
    if (!ids.length || !Number.isInteger(userId) || userId < 1) return allowed

    const idPlaceholders = ids.map(() => '?').join(', ')

    // 1) meshy_jobs.quote_id → 주문 연결
    const byQuote = await db
        .prepare(
            `SELECT DISTINCT mj.id AS job_id
             FROM meshy_jobs mj
             INNER JOIN order_items oi ON oi.quote_id = mj.quote_id
             INNER JOIN orders o ON o.id = oi.order_id
             WHERE o.user_id = ?
               AND o.status IN (${STATUS_PLACEHOLDERS})
               AND mj.id IN (${idPlaceholders})
               AND mj.quote_id IS NOT NULL`
        )
        .bind(userId, ...MESHY_STL_DOWNLOAD_ORDER_STATUSES, ...ids)
        .all<{ job_id: number }>()
    for (const r of byQuote.results ?? []) allowed.add(Number(r.job_id))

    // 2) 견적 파일명으로 연결 (quote_id 미기입 폴백)
    const names = ids.flatMap((id) => [
        buildAiPhotoResultFileName(id),
        `meshy-${id}.stl`,
        `mesh-${id}.stl`,
    ])
    const byName = await db
        .prepare(
            `SELECT DISTINCT q.file_name AS file_name
             FROM orders o
             INNER JOIN order_items oi ON oi.order_id = o.id
             INNER JOIN quotes q ON q.id = oi.quote_id
             WHERE o.user_id = ?
               AND o.status IN (${STATUS_PLACEHOLDERS})
               AND lower(q.file_name) IN (${names.map(() => 'lower(?)').join(', ')})`
        )
        .bind(userId, ...MESHY_STL_DOWNLOAD_ORDER_STATUSES, ...names)
        .all<{ file_name: string | null }>()
    for (const r of byName.results ?? []) {
        const fromName = parseMeshyJobIdFromFileName(r.file_name)
        if (fromName != null && ids.includes(fromName)) allowed.add(fromName)
    }

    return allowed
}

/** R2 키 meshy/{jobId}/... 에서 job ID 추출 */
export function parseMeshyJobIdFromR2Key(key: string): number | null {
    const m = key.trim().match(/^meshy\/(\d+)(?:\/|$)/i)
    if (!m) return null
    const id = parseInt(m[1], 10)
    return Number.isInteger(id) && id > 0 ? id : null
}
