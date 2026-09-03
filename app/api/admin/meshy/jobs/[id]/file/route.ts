import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'

import { buildMeshyStlThumbnailR2Key, buildMeshyThumbnailR2Key } from '@/lib/meshy-r2'

type JobFileRow = {
    id: number
    status: string
    source_image_key: string | null
    source_file_name: string | null
    result_file_key: string | null
    result_file_name: string | null
    thumbnail_url: string | null
}

/**
 * GET /api/admin/meshy/jobs/[id]/file?type=source|model|thumbnail
 * 관리자: 원본 사진 또는 결과 STL 스트리밍
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { env } = getCloudflareContext()
        if (!env?.DB || !env?.BUCKET) {
            return NextResponse.json({ error: '스토리지를 사용할 수 없습니다' }, { status: 503 })
        }

        const auth = await requireAdminAuth(req, env.DB)
        if (auth instanceof Response) return auth

        const { id } = await params
        const jobId = Number(id)
        if (!Number.isInteger(jobId) || jobId < 1) {
            return NextResponse.json({ error: '잘못된 작업 ID' }, { status: 400 })
        }

        const type = (req.nextUrl.searchParams.get('type') || 'model').trim()
        if (type !== 'source' && type !== 'model' && type !== 'thumbnail') {
            return NextResponse.json(
                { error: 'type은 source, model, thumbnail 이어야 합니다' },
                { status: 400 }
            )
        }

        const job = await env.DB.prepare(
            `SELECT id, status, source_image_key, source_file_name, result_file_key, result_file_name, thumbnail_url
             FROM meshy_jobs WHERE id = ?`
        )
            .bind(jobId)
            .first<JobFileRow>()

        if (!job) return NextResponse.json({ error: '작업을 찾을 수 없습니다' }, { status: 404 })

        if (type === 'source') {
            if (!job.source_image_key) {
                return NextResponse.json({ error: '원본 이미지가 없습니다' }, { status: 404 })
            }
            const object = await env.BUCKET.get(job.source_image_key)
            if (!object) return NextResponse.json({ error: '원본 파일을 찾을 수 없습니다' }, { status: 404 })

            const fileName = job.source_file_name || `meshy-${jobId}-source`
            const headers = new Headers()
            headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg')
            headers.set('Cache-Control', 'private, max-age=300')
            headers.set(
                'Content-Disposition',
                `inline; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
            )
            return new NextResponse(object.body as BodyInit, { headers })
        }

        if (type === 'thumbnail') {
            const kind = (req.nextUrl.searchParams.get('kind') || '').trim()
            const keyCandidates: string[] = []
            const pushKey = (k?: string | null) => {
                const t = (k || '').trim()
                if (t.startsWith('meshy/') && !keyCandidates.includes(t)) keyCandidates.push(t)
            }
            if (kind === 'stl') {
                pushKey(buildMeshyStlThumbnailR2Key(jobId))
            } else {
                pushKey(job.thumbnail_url)
                pushKey(buildMeshyThumbnailR2Key(jobId, 'jpg'))
                pushKey(buildMeshyThumbnailR2Key(jobId, 'png'))
                pushKey(buildMeshyThumbnailR2Key(jobId, 'webp'))
            }

            for (const key of keyCandidates) {
                const object = await env.BUCKET.get(key)
                if (!object?.body) continue
                const headers = new Headers()
                headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg')
                headers.set('Cache-Control', 'private, max-age=300')
                headers.set('Content-Disposition', `inline; filename="meshy-${jobId}-thumb"`)
                return new NextResponse(object.body as BodyInit, { headers })
            }

            return NextResponse.json({ error: '썸네일이 없습니다' }, { status: 404 })
        }

        if (job.status !== 'succeeded' || !job.result_file_key) {
            return NextResponse.json({ error: '모델이 아직 준비되지 않았습니다' }, { status: 409 })
        }

        const object = await env.BUCKET.get(job.result_file_key)
        if (!object) return NextResponse.json({ error: '모델 파일을 찾을 수 없습니다' }, { status: 404 })

        const fileName = job.result_file_name || `meshy-${jobId}.stl`
        const disposition = req.nextUrl.searchParams.get('disposition') === 'inline' ? 'inline' : 'attachment'
        const headers = new Headers()
        headers.set('Content-Type', object.httpMetadata?.contentType || 'model/stl')
        headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
        headers.set('Pragma', 'no-cache')
        headers.set(
            'Content-Disposition',
            `${disposition}; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
        )
        return new NextResponse(object.body as BodyInit, { headers })
    } catch (e) {
        console.error('GET /api/admin/meshy/jobs/[id]/file', e)
        return NextResponse.json({ error: '파일 조회 실패' }, { status: 500 })
    }
}
