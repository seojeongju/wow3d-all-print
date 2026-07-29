import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/** 대표 호스트 — apex(non-www)는 www로 301 통합 */
const CANONICAL_HOST = 'www.wow3dp.co.kr'
const APEX_HOST = 'wow3dp.co.kr'

export function middleware(request: NextRequest) {
    const hostHeader = request.headers.get('host') || ''
    const hostname = hostHeader.split(':')[0]?.toLowerCase()

    if (hostname === APEX_HOST) {
        const url = request.nextUrl.clone()
        url.protocol = 'https:'
        url.hostname = CANONICAL_HOST
        url.port = ''
        return NextResponse.redirect(url, 301)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * 정적 자산·이미지·3D 파일만 제외.
         * sitemap.xml / robots.txt / llms.txt 등도 apex→www 301에 포함.
         */
        '/((?!_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|stl|obj|3mf)$).*)',
    ],
}
