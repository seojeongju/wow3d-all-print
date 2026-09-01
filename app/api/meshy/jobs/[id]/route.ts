import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAuthOrGuest } from '@/lib/api-utils'
import { buildAiPhotoResultFileName, persistMeshyJobThumbnail, resolveUserAiPhotoFileName } from '@/lib/meshy-r2'
import {
    parseImageTo3DProvider,
    pollImageTo3DTask,
    sanitizeImageTo3DUserMessage,
} from '@/lib/image-to-3d-provider'

type JobRow = {
    id: number
    user_id: number | null
    session_id: string | null
    status: string
    provider: string | null
    meshy_task_id: string | null
    aux_task_id: string | null
    source_image_key: string | null
    result_file_key: string | null
    result_file_name: string | null
    thumbnail_url: string | null
    progress: number | null
    credits_used: number | null
    error_message: string | null
}

function canAccessJob(
    job: JobRow,
    auth: { isGuest: false; userId: number } | { isGuest: true; sessionId: string }
): boolean {
    if (!auth.isGuest) return job.user_id === auth.userId
    return !!job.session_id && job.session_id === auth.sessionId
}

function userResultFileName(job: JobRow): string {
    return resolveUserAiPhotoFileName(job.id, job.result_file_name)
}

/**
 * GET /api/meshy/jobs/[id]
 * AI 3D 작업 상태 폴링. 성공 시 STL을 R2에 저장.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAuthOrGuest(request)
        if (auth instanceof Response) return auth

        const { id } = await params
        const jobId = Number(id)
        if (!Number.isInteger(jobId) || jobId < 1) {
            return NextResponse.json({ error: '잘못된 작업 ID' }, { status: 400 })
        }

        const { env } = getCloudflareContext()
        if (!env?.DB || !env?.BUCKET) {
            return NextResponse.json({ error: '스토리지를 사용할 수 없습니다' }, { status: 503 })
        }

        const job = await env.DB.prepare(`SELECT * FROM meshy_jobs WHERE id = ?`)
            .bind(jobId)
            .first<JobRow>()

        if (!job) return NextResponse.json({ error: '작업을 찾을 수 없습니다' }, { status: 404 })
        if (!canAccessJob(job, auth)) {
            return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
        }

        const provider = parseImageTo3DProvider(job.provider)

        if (job.status === 'succeeded' && job.result_file_key) {
            return NextResponse.json({
                success: true,
                data: {
                    jobId: job.id,
                    status: 'succeeded',
                    progress: 100,
                    resultFileKey: job.result_file_key,
                    resultFileName: userResultFileName(job),
                    thumbnailUrl: job.thumbnail_url,
                    modelReady: true,
                },
            })
        }

        if (job.status === 'failed' || job.status === 'canceled') {
            return NextResponse.json({
                success: true,
                data: {
                    jobId: job.id,
                    status: job.status,
                    progress: job.progress || 0,
                    error: sanitizeImageTo3DUserMessage(job.error_message || '작업이 실패했습니다'),
                    modelReady: false,
                },
            })
        }

        if (!job.meshy_task_id) {
            return NextResponse.json({
                success: true,
                data: {
                    jobId: job.id,
                    status: job.status,
                    progress: job.progress || 0,
                    modelReady: false,
                },
            })
        }

        const envRecord = env as unknown as Record<string, unknown>
        const polled = await pollImageTo3DTask(provider, envRecord, {
            provider,
            externalTaskId: job.meshy_task_id,
            auxTaskId: job.aux_task_id,
        })

        if (polled.newAuxTaskId) {
            const thumbStored = polled.thumbnailUrl
                ? await persistMeshyJobThumbnail(env.BUCKET, jobId, polled.thumbnailUrl)
                : null
            await env.DB.prepare(
                `UPDATE meshy_jobs SET aux_task_id = ?, status = 'processing', progress = ?,
                 thumbnail_url = COALESCE(?, thumbnail_url), updated_at = datetime('now') WHERE id = ?`
            )
                .bind(polled.newAuxTaskId, polled.progress, thumbStored, jobId)
                .run()

            return NextResponse.json({
                success: true,
                data: {
                    jobId,
                    status: polled.status,
                    progress: polled.progress,
                    thumbnailUrl: thumbStored || polled.thumbnailUrl || null,
                    modelReady: false,
                    message: '모델 파일을 준비 중입니다…',
                },
            })
        }

        if (polled.status === 'succeeded' && polled.stlUrl) {
            const stlRes = await fetch(polled.stlUrl)
            if (!stlRes.ok) {
                return NextResponse.json({
                    success: true,
                    data: {
                        jobId,
                        status: 'processing',
                        progress: Math.max(polled.progress, 90),
                        modelReady: false,
                        message: '모델 파일을 준비 중입니다…',
                    },
                })
            }

            const stlBuf = await stlRes.arrayBuffer()
            const resultName = buildAiPhotoResultFileName(jobId)
            const resultKey = `meshy/${jobId}/${resultName}`
            await env.BUCKET.put(resultKey, stlBuf, {
                httpMetadata: { contentType: 'model/stl' },
            })

            const thumbStored = polled.thumbnailUrl
                ? await persistMeshyJobThumbnail(env.BUCKET, jobId, polled.thumbnailUrl)
                : null

            await env.DB.prepare(
                `UPDATE meshy_jobs
                 SET status = 'succeeded', progress = 100, result_file_key = ?, result_file_name = ?,
                     thumbnail_url = ?, credits_used = ?, error_message = NULL, updated_at = datetime('now')
                 WHERE id = ?`
            )
                .bind(
                    resultKey,
                    resultName,
                    thumbStored || polled.thumbnailUrl || null,
                    polled.creditsUsed ?? null,
                    jobId
                )
                .run()

            return NextResponse.json({
                success: true,
                data: {
                    jobId,
                    status: 'succeeded',
                    progress: 100,
                    resultFileKey: resultKey,
                    resultFileName: resultName,
                    thumbnailUrl: thumbStored || polled.thumbnailUrl || null,
                    modelReady: true,
                },
            })
        }

        if (polled.status === 'failed' || polled.status === 'canceled') {
            const errMsg = sanitizeImageTo3DUserMessage(polled.error || 'AI 모델링에 실패했습니다')
            await env.DB.prepare(
                `UPDATE meshy_jobs
                 SET status = ?, progress = ?, error_message = ?, credits_used = ?, updated_at = datetime('now')
                 WHERE id = ?`
            )
                .bind(polled.status, polled.progress, errMsg, polled.creditsUsed ?? null, jobId)
                .run()

            return NextResponse.json({
                success: true,
                data: {
                    jobId,
                    status: polled.status,
                    progress: polled.progress,
                    error: errMsg,
                    modelReady: false,
                },
            })
        }

        const thumbStored = polled.thumbnailUrl
            ? await persistMeshyJobThumbnail(env.BUCKET, jobId, polled.thumbnailUrl)
            : null

        await env.DB.prepare(
            `UPDATE meshy_jobs SET status = ?, progress = ?,
             thumbnail_url = COALESCE(?, thumbnail_url), updated_at = datetime('now') WHERE id = ?`
        )
            .bind(polled.status, polled.progress, thumbStored, jobId)
            .run()

        return NextResponse.json({
            success: true,
            data: {
                jobId,
                status: polled.status,
                progress: polled.progress,
                thumbnailUrl: thumbStored || polled.thumbnailUrl || null,
                modelReady: false,
            },
        })
    } catch (e) {
        console.error('GET /api/meshy/jobs/[id]', e)
        return NextResponse.json({ error: '상태 조회 실패' }, { status: 500 })
    }
}
