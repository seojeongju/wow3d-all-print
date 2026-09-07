import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getMakerspace } from '@/lib/makerspaces'

function getKakaoRestKey(): string {
    try {
        const cfEnv = (getCloudflareContext().env || {}) as unknown as Record<string, string | undefined>
        return (cfEnv.KAKAO_REST_API_KEY || process.env.KAKAO_REST_API_KEY || '').trim()
    } catch {
        return (process.env.KAKAO_REST_API_KEY || '').trim()
    }
}

/**
 * GET /api/makerspace/static-map?id=hongdae
 * 카카오 정적지도(REST) — 인터랙티브 SDK 키가 없을 때 폴백
 */
export async function GET(request: NextRequest) {
    const id = request.nextUrl.searchParams.get('id')
    const center = getMakerspace(id)
    if (!center) {
        return NextResponse.json({ error: '알 수 없는 센터입니다.' }, { status: 404 })
    }

    const restKey = getKakaoRestKey()
    if (!restKey) {
        return NextResponse.json({ error: '카카오 REST API 키가 없습니다.' }, { status: 503 })
    }

    const width = Math.min(Number(request.nextUrl.searchParams.get('w') || 640) || 640, 640)
    const height = Math.min(Number(request.nextUrl.searchParams.get('h') || 400) || 400, 640)
    const level = Math.min(Math.max(Number(request.nextUrl.searchParams.get('level') || 3) || 3, 1), 14)

    let lat = center.lat
    let lng = center.lng

    try {
        const geoRes = await fetch(
            `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(center.address)}`,
            { headers: { Authorization: `KakaoAK ${restKey}` } },
        )
        if (geoRes.ok) {
            const geoJson = (await geoRes.json()) as {
                documents?: Array<{ x: string; y: string }>
            }
            const doc = geoJson.documents?.[0]
            if (doc) {
                lng = Number(doc.x)
                lat = Number(doc.y)
            }
        }
    } catch {
        // 폴백 좌표 유지
    }

    const params = new URLSearchParams({
        center: `${lng},${lat}`,
        level: String(level),
        size: `${width}x${height}`,
        markers: `color:0x14b8a6|size:mid|${lng},${lat}`,
    })

    const mapRes = await fetch(`https://dapi.kakao.com/v2/maps/staticmap?${params.toString()}`, {
        headers: { Authorization: `KakaoAK ${restKey}` },
    })

    if (!mapRes.ok) {
        const text = await mapRes.text().catch(() => '')
        return NextResponse.json(
            { error: '정적지도를 불러오지 못했습니다.', detail: text.slice(0, 200) },
            { status: 502 },
        )
    }

    const buffer = await mapRes.arrayBuffer()
    const contentType = mapRes.headers.get('content-type') || 'image/png'

    return new NextResponse(buffer, {
        status: 200,
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
    })
}
