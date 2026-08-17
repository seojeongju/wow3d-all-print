import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAuthOrGuest } from '@/lib/api-utils'

type JobRow = {
    id: number
    user_id: number | null
    session_id: string | null
    status: string
    result_file_key: string | null
    result_file_name: string | null
}

/**
 * GET /api/meshy/jobs/[id]/model
 * 생성된 STL 다운로드 (작업 소유자만)
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

        const job = await env.DB.prepare(
            `SELECT id, user_id, session_id, status, result_file_key, result_file_name FROM meshy_jobs WHERE id = ?`
        )
            .bind(jobId)
            .first<JobRow>()

        if (!job) return NextResponse.json({ error: '작업을 찾을 수 없습니다' }, { status: 404 })

        const allowed = auth.isGuest
            ? job.session_id === auth.sessionId
            : job.user_id === auth.userId
        if (!allowed) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })

        if (job.status !== 'succeeded' || !job.result_file_key) {
            return NextResponse.json({ error: '모델이 아직 준비되지 않았습니다' }, { status: 409 })
        }

        const object = await env.BUCKET.get(job.result_file_key)
        if (!object) return NextResponse.json({ error: '모델 파일을 찾을 수 없습니다' }, { status: 404 })

        const fileName = job.result_file_name || `meshy-${jobId}.stl`
        const headers = new Headers()
        headers.set('Content-Type', object.httpMetadata?.contentType || 'model/stl')
        headers.set('Cache-Control', 'private, max-age=3600')
        headers.set(
            'Content-Disposition',
            `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
        )

        return new NextResponse(object.body as BodyInit, { headers })
    } catch (e) {
        console.error('GET /api/meshy/jobs/[id]/model', e)
        return NextResponse.json({ error: '모델 다운로드 실패' }, { status: 500 })
    }
}
