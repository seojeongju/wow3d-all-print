import { buildQuoteR2Key, sanitizeR2FileName } from '@/lib/r2-quote-file'

/** ai-photo-123.stl / meshy-123.stl / mesh-123.stl — AI 사진→3D job ID 추출 */
export function parseMeshyJobIdFromFileName(fileName?: string | null): number | null {
    const m = (fileName || '').trim().match(/^(?:ai-photo|meshy?)-(\d+)\.stl$/i)
    if (!m) return null
    const id = parseInt(m[1], 10)
    return Number.isInteger(id) && id > 0 ? id : null
}

/** 사용자에게 보이는 AI 사진→3D 결과 파일명 */
export function buildAiPhotoResultFileName(jobId: number): string {
    return `ai-photo-${jobId}.stl`
}

/** DB/R2에 meshy-* 등으로 저장된 경우 사용자용 ai-photo-* 로 변환 */
export function resolveUserAiPhotoFileName(jobId: number, storedName?: string | null): string {
    const name = (storedName || '').trim()
    if (/^ai-photo-\d+\.stl$/i.test(name)) return name
    return buildAiPhotoResultFileName(jobId)
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
        head?: (key: string) => Promise<{ size?: number } | null>
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

/** Worker 128MB 한도 안에서 안전하게 복사할 수 있는 최대 크기 */
export const MESHY_QUOTE_COPY_MAX_BYTES = 8 * 1024 * 1024

export function shouldInlineCopyMeshyObject(size?: number | null): boolean {
    const n = Number(size) || 0
    return n > 0 && n <= MESHY_QUOTE_COPY_MAX_BYTES
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

    if (!job) return { error: 'AI 3D 작업을 찾을 수 없습니다', status: 404 }
    if (job.status !== 'succeeded' || !job.result_file_key) {
        return { error: 'AI 3D 모델이 아직 준비되지 않았습니다', status: 409 }
    }

    const sourceKey = job.result_file_key
    const legacyMeshyName = /^meshy?-\d+\.stl$/i.test(job.result_file_name || '')
    const fileName = sanitizeR2FileName(
        preferredFileName ||
            (job.result_file_name && !legacyMeshyName ? job.result_file_name : buildAiPhotoResultFileName(jobId))
    )
    const destKey = buildQuoteR2Key(quoteId, fileName)

    let objectSize = 0
    try {
        const meta = env.BUCKET.head ? await env.BUCKET.head(sourceKey) : null
        objectSize = meta?.size ?? 0
    } catch {
        objectSize = 0
    }

    let fileUrl = sourceKey
    if (shouldInlineCopyMeshyObject(objectSize)) {
        const source = await env.BUCKET.get(sourceKey)
        if (!source?.body) return { error: 'AI 3D 모델 파일을 찾을 수 없습니다', status: 404 }
        try {
            const payload = await new Response(source.body as BodyInit).arrayBuffer()
            if (!payload.byteLength) {
                return { error: 'AI 3D 모델 파일 데이터가 비어 있습니다', status: 404 }
            }
            await env.BUCKET.put(destKey, payload, {
                httpMetadata: {
                    contentType: source.httpMetadata?.contentType || 'model/stl',
                },
            })
            fileUrl = destKey
        } catch (e) {
            console.error('[meshy-r2] copy to quote failed, linking meshy key', e)
            fileUrl = sourceKey
        }
    } else if (objectSize === 0) {
        const source = await env.BUCKET.get(sourceKey)
        if (!source) return { error: 'AI 3D 모델 파일을 찾을 수 없습니다', status: 404 }
    }

    await env.DB.prepare(
        `UPDATE quotes SET file_url = ?, file_name = COALESCE(?, file_name) WHERE id = ?`
    )
        .bind(fileUrl, fileName, quoteId)
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

    return { fileUrl, fileName }
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

export function buildMeshyThumbnailR2Key(jobId: number, ext: 'jpg' | 'png' | 'webp' = 'jpg'): string {
    return `meshy/${jobId}/thumbnail.${ext}`
}

/** 관리자 목록용 STL WebGL 렌더 썸네일 (Tripo 미리보기와 분리) */
export function buildMeshyStlThumbnailR2Key(jobId: number): string {
    return `meshy/${jobId}/stl-thumbnail.png`
}

type ThumbnailBucket = {
    put: (
        key: string,
        value: ArrayBuffer,
        options?: { httpMetadata?: { contentType?: string } }
    ) => Promise<unknown>
}

/** Tripo/Meshy CDN 썸네일을 R2에 저장하고 키를 반환 (URL 만료 방지) */
export async function persistMeshyJobThumbnail(
    bucket: ThumbnailBucket,
    jobId: number,
    thumbnailUrl: string | null | undefined
): Promise<string | null> {
    const url = (thumbnailUrl || '').trim()
    if (!url) return null
    if (url.startsWith('meshy/')) return url

    if (!url.startsWith('http')) return null

    try {
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) return null
        const buf = await res.arrayBuffer()
        if (!buf.byteLength) return null

        const ct = (res.headers.get('content-type') || 'image/jpeg').toLowerCase()
        const ext: 'jpg' | 'png' | 'webp' = ct.includes('png')
            ? 'png'
            : ct.includes('webp')
              ? 'webp'
              : 'jpg'
        const key = buildMeshyThumbnailR2Key(jobId, ext)
        await bucket.put(key, buf, { httpMetadata: { contentType: ct.split(';')[0] || 'image/jpeg' } })
        return key
    } catch (e) {
        console.error('[meshy-r2] persist thumbnail failed', jobId, e)
        return null
    }
}
