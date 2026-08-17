import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAuthOrGuest } from '@/lib/api-utils'
import { MESHY_TODAY_KST_SQL } from '@/lib/meshy'

type JobRow = {
    id: number
    status: string
    progress: number | null
    thumbnail_url: string | null
    result_file_name: string | null
    result_file_key: string | null
    error_message: string | null
    source_file_name: string | null
}

/**
 * GET /api/meshy/jobs/active
 * 오늘(KST) 진행 중·완료된 최신 작업 1건 (새로고침 후 폴링 복구용)
 */
export async function GET(request: NextRequest) {
    try {
        const auth = await requireAuthOrGuest(request)
        if (auth instanceof Response) return auth
        if (auth.isGuest) {
            return NextResponse.json({
                success: true,
                data: { job: null },
            })
        }

        const { env } = getCloudflareContext()
        if (!env?.DB) {
            return NextResponse.json({ error: 'DB를 사용할 수 없습니다' }, { status: 503 })
        }

        const job = await env.DB.prepare(
            `SELECT id, status, progress, thumbnail_url, result_file_name, result_file_key,
                    error_message, source_file_name
             FROM meshy_jobs
             WHERE user_id = ?
               AND ${MESHY_TODAY_KST_SQL}
               AND status IN ('uploading', 'queued', 'processing', 'succeeded')
             ORDER BY id DESC
             LIMIT 1`
        )
            .bind(auth.userId)
            .first<JobRow>()

        if (!job) {
            return NextResponse.json({ success: true, data: { job: null } })
        }

        return NextResponse.json({
            success: true,
            data: {
                job: {
                    jobId: job.id,
                    status: job.status,
                    progress: job.progress || 0,
                    thumbnailUrl: job.thumbnail_url,
                    resultFileName: job.result_file_name || `meshy-${job.id}.stl`,
                    sourceFileName: job.source_file_name,
                    modelReady: job.status === 'succeeded' && !!job.result_file_key,
                    error: job.error_message,
                },
            },
        })
    } catch (e) {
        console.error('GET /api/meshy/jobs/active', e)
        return NextResponse.json({ error: '활성 작업 조회 실패' }, { status: 500 })
    }
}
