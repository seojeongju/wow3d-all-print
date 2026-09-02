import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'
import { buildMeshyThumbnailR2Key } from '@/lib/meshy-r2'

function parseDataUrl(dataUrl: string): { buffer: ArrayBuffer; contentType: string } | null {
    const m = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl.trim())
    if (!m) return null
    const contentType = m[1].toLowerCase()
    const b64 = m[2]
    try {
        const binary = atob(b64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
        return { buffer: bytes.buffer, contentType }
    } catch {
        return null
    }
}

/**
 * POST /api/admin/meshy/jobs/[id]/thumbnail
 * 클라이언트 STL 렌더 썸네일을 R2에 저장 (목록 재방문 시 빠른 로드)
 */
export async function POST(
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

        const body = (await req.json()) as { dataUrl?: string }
        const parsed = parseDataUrl(body.dataUrl || '')
        if (!parsed || parsed.buffer.byteLength < 64) {
            return NextResponse.json({ error: '유효한 이미지 데이터가 아닙니다' }, { status: 400 })
        }

        const ext = parsed.contentType.includes('png')
            ? 'png'
            : parsed.contentType.includes('webp')
              ? 'webp'
              : 'jpg'
        const key = buildMeshyThumbnailR2Key(jobId, ext)

        await env.BUCKET.put(key, parsed.buffer, {
            httpMetadata: { contentType: parsed.contentType },
        })

        await env.DB.prepare(
            `UPDATE meshy_jobs SET thumbnail_url = ?, updated_at = datetime('now') WHERE id = ?`
        )
            .bind(key, jobId)
            .run()

        return NextResponse.json({ success: true, data: { thumbnailKey: key } })
    } catch (e) {
        console.error('POST /api/admin/meshy/jobs/[id]/thumbnail', e)
        return NextResponse.json({ error: '썸네일 저장 실패' }, { status: 500 })
    }
}
