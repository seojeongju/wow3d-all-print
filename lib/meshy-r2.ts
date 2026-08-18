import { buildQuoteR2Key, sanitizeR2FileName } from '@/lib/r2-quote-file'

/** meshy-123.stl 형식 파일명에서 Meshy job ID 추출 */
export function parseMeshyJobIdFromFileName(fileName?: string | null): number | null {
    const m = (fileName || '').trim().match(/^meshy-(\d+)\.stl$/i)
    if (!m) return null
    const id = parseInt(m[1], 10)
    return Number.isInteger(id) && id > 0 ? id : null
}

/** Meshy 결과 STL의 기본 R2 키 */
export function buildMeshyResultR2Key(jobId: number, fileName?: string | null): string {
    const safe = sanitizeR2FileName(fileName || `meshy-${jobId}.stl`)
    return `meshy/${jobId}/${safe}`
}

export type MeshyJobFileRow = {
    id: number
    user_id: number | null
    session_id: string | null
    status: string
    result_file_key: string | null
    result_file_name: string | null
    quote_id: number | null
}

type CopyMeshyEnv = {
    DB: {
        prepare: (sql: string) => {
            bind: (...args: unknown[]) => {
                first: <T>() => Promise<T | null>
                run: () => Promise<unknown>
            }
        }
    }
    BUCKET: {
        get: (key: string) => Promise<{
            body: ReadableStream | ArrayBuffer | ArrayBufferView | string | null | Blob
            httpMetadata?: { contentType?: string; contentLength?: number }
            size?: number
        } | null>
        put: (
            key: string,
            value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob,
            options?: { httpMetadata?: { contentType?: string } }
        ) => Promise<unknown>
    }
}

/** Meshy job 소유자 확인 (회원·비회원) */
export function meshyJobOwnedBy(
    job: Pick<MeshyJobFileRow, 'user_id' | 'session_id'>,
    auth: { isGuest: boolean; userId?: number; sessionId?: string }
): boolean {
    if (auth.isGuest) return job.session_id === auth.sessionId
    return job.user_id === auth.userId
}

/**
 * Meshy R2 오브젝트를 견적 quotes/ 경로로 복사하고 DB를 갱신합니다.
 */
export async function copyMeshyJobResultToQuote(
    env: CopyMeshyEnv,
    jobId: number,
    quoteId: number,
    preferredFileName?: string | null
): Promise<{ fileUrl: string; fileName: string } | { error: string; status: number }> {
    const job = await env.DB.prepare(
        `SELECT id, status, result_file_key, result_file_name FROM meshy_jobs WHERE id = ?`
    )
        .bind(jobId)
        .first<Pick<MeshyJobFileRow, 'id' | 'status' | 'result_file_key' | 'result_file_name'>>()

    if (!job) return { error: 'Meshy 작업을 찾을 수 없습니다', status: 404 }
    if (job.status !== 'succeeded' || !job.result_file_key) {
        return { error: 'AI 3D 모델이 아직 준비되지 않았습니다', status: 409 }
    }

    const source = await env.BUCKET.get(job.result_file_key)
    if (!source?.body) return { error: 'Meshy 모델 파일을 R2에서 찾을 수 없습니다', status: 404 }

    const fileName = sanitizeR2FileName(preferredFileName || job.result_file_name || `meshy-${jobId}.stl`)
    const destKey = buildQuoteR2Key(quoteId, fileName)

    await env.BUCKET.put(destKey, source.body, {
        httpMetadata: {
            contentType: source.httpMetadata?.contentType || 'model/stl',
        },
    })

    await env.DB.prepare(
        `UPDATE quotes SET file_url = ?, file_name = COALESCE(?, file_name) WHERE id = ?`
    )
        .bind(destKey, fileName, quoteId)
        .run()

    try {
        await env.DB.prepare(
            `UPDATE meshy_jobs SET quote_id = ?, updated_at = datetime('now') WHERE id = ?`
        )
            .bind(quoteId, jobId)
            .run()
    } catch {
        /* quote_id 컬럼 없는 구 DB */
    }

    return { fileUrl: destKey, fileName }
}

/** 관리자 다운로드용 Meshy R2 키 후보 */
export function resolveMeshyR2KeyCandidates(opts: {
    fileUrl?: string | null
    fileName?: string | null
    resultFileKey?: string | null
}): string[] {
    const out: string[] = []
    const push = (k?: string | null) => {
        const t = (k || '').trim()
        if (t && !out.includes(t)) out.push(t)
    }

    push(opts.resultFileKey)

    const raw = opts.fileUrl?.trim() || ''
    if (raw.startsWith('meshy/')) push(raw)

    const jobId = parseMeshyJobIdFromFileName(opts.fileName)
    if (jobId) {
        push(buildMeshyResultR2Key(jobId, opts.fileName))
        push(`meshy/${jobId}/meshy-${jobId}.stl`)
    }

    return out
}
