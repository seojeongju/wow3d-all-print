import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

/** 공개 최신 동향 이미지 (R2 news/...) */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    try {
        const { path } = await params
        const suffix = path.join('/')
        if (suffix.includes('..')) return NextResponse.json({ error: '잘못된 경로' }, { status: 400 })
        const r2Key = suffix.startsWith('news/') ? suffix : `news/${suffix}`

        const { env } = getCloudflareContext()
        if (!env?.BUCKET) return NextResponse.json({ error: '스토리지 없음' }, { status: 503 })

        const object = await env.BUCKET.get(r2Key)
        if (!object) return NextResponse.json({ error: '파일을 찾을 수 없습니다' }, { status: 404 })

        const headers = new Headers()
        headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg')
        headers.set('Cache-Control', 'public, max-age=604800, s-maxage=604800, immutable')
        return new NextResponse(object.body as BodyInit, { headers })
    } catch (e) {
        console.error('GET news media', e)
        return NextResponse.json({ error: '다운로드 실패' }, { status: 500 })
    }
}
