import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAuthOrGuest } from '@/lib/api-utils'
import {
    getMeshyImageTo3DTask,
    mapMeshyStatusToJob,
    resolveMeshyApiKey,
} from '@/lib/meshy'

type JobRow = {
    id: number
    user_id: number | null
    session_id: string | null
    status: string
    meshy_task_id: string | null
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

/**
 * GET /api/meshy/jobs/[id]
 * Meshy 상태 폴링. 성공 시 STL을 R2에 저장.
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

        if (job.status === 'succeeded' && job.result_file_key) {
            return NextResponse.json({
                success: true,
                data: {
                    jobId: job.id,
                    status: 'succeeded',
                    progress: 100,
                    resultFileKey: job.result_file_key,
                    resultFileName: job.result_file_name || 'meshy-model.stl',
                    thumbnailUrl: job.thumbnail_url,
                    thumbnailUrls: undefined,
                    creditsUsed: job.credits_used,
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
                    error: job.error_message || '작업이 실패했습니다',
                    modelReady: false,
                },
            })
        }

        const apiKey = resolveMeshyApiKey(env as unknown as Record<string, unknown>)
        if (!apiKey || !job.meshy_task_id) {
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

        const task = await getMeshyImageTo3DTask(apiKey, job.meshy_task_id)
        const mapped = mapMeshyStatusToJob(task.status)
        const progress = Math.max(0, Math.min(100, Number(task.progress) || 0))

        if (mapped === 'succeeded') {
            const stlUrl = task.model_urls?.stl
            if (!stlUrl) {
                await env.DB.prepare(
                    `UPDATE meshy_jobs SET status = 'failed', error_message = ?, updated_at = datetime('now') WHERE id = ?`
                )
                    .bind('STL 결과 URL이 없습니다', jobId)
                    .run()
                return NextResponse.json({
                    success: true,
                    data: {
                        jobId,
                        status: 'failed',
                        progress: 100,
                        error: 'STL 결과 URL이 없습니다',
                        modelReady: false,
                    },
                })
            }

            const stlRes = await fetch(stlUrl)
            if (!stlRes.ok) {
                return NextResponse.json({
                    success: true,
                    data: {
                        jobId,
                        status: 'processing',
                        progress: Math.max(progress, 90),
                        modelReady: false,
                        message: '모델 파일을 준비 중입니다…',
                    },
                })
            }

            const stlBuf = await stlRes.arrayBuffer()
            const resultName = `meshy-${jobId}.stl`
            const resultKey = `meshy/${jobId}/${resultName}`
            await env.BUCKET.put(resultKey, stlBuf, {
                httpMetadata: { contentType: 'model/stl' },
            })

            await env.DB.prepare(
                `UPDATE meshy_jobs
                 SET status = 'succeeded', progress = 100, result_file_key = ?, result_file_name = ?,
                     thumbnail_url = ?, credits_used = ?, error_message = NULL, updated_at = datetime('now')
                 WHERE id = ?`
            )
                .bind(
                    resultKey,
                    resultName,
                    task.thumbnail_url || null,
                    task.credits_used ?? null,
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
                    thumbnailUrl: task.thumbnail_url || null,
                    thumbnailUrls: task.thumbnail_urls || null,
                    creditsUsed: task.credits_used ?? null,
                    modelReady: true,
                },
            })
        }

        if (mapped === 'failed' || mapped === 'canceled') {
            const errMsg = task.task_error?.message || 'AI 모델링에 실패했습니다'
            await env.DB.prepare(
                `UPDATE meshy_jobs
                 SET status = ?, progress = ?, error_message = ?, credits_used = ?, updated_at = datetime('now')
                 WHERE id = ?`
            )
                .bind(mapped, progress, errMsg, task.credits_used ?? null, jobId)
                .run()

            return NextResponse.json({
                success: true,
                data: {
                    jobId,
                    status: mapped,
                    progress,
                    error: errMsg,
                    modelReady: false,
                },
            })
        }

        await env.DB.prepare(
            `UPDATE meshy_jobs SET status = ?, progress = ?, updated_at = datetime('now') WHERE id = ?`
        )
            .bind(mapped, progress, jobId)
            .run()

        return NextResponse.json({
            success: true,
            data: {
                jobId,
                status: mapped,
                progress,
                modelReady: false,
            },
        })
    } catch (e) {
        console.error('GET /api/meshy/jobs/[id]', e)
        return NextResponse.json({ error: '상태 조회 실패' }, { status: 500 })
    }
}
