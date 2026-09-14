import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

/** 공개 맞춤상품 미디어 (R2 custom-products/...) */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params
        const suffix = path.join('/')
        const r2Key = suffix.startsWith('custom-products/')
            ? suffix
            : `custom-products/${suffix}`

        const { env } = getCloudflareContext()
        if (!env?.BUCKET) {
            return NextResponse.json({ error: '스토리지 없음' }, { status: 503 })
        }

        const object = await env.BUCKET.get(r2Key)
        if (!object) {
            return NextResponse.json({ error: '파일을 찾을 수 없습니다' }, { status: 404 })
        }

        const headers = new Headers()
        headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg')
        headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400')

        return new NextResponse(object.body as BodyInit, { headers })
    } catch (e) {
        console.error('GET custom-products media', e)
        return NextResponse.json({ error: '다운로드 실패' }, { status: 500 })
    }
}
