import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { routing } from './i18n/routing'

/** 대표 호스트 — apex(non-www)는 www로 301 통합 */
const CANONICAL_HOST = 'www.wow3dp.co.kr'
const APEX_HOST = 'wow3dp.co.kr'

const intlMiddleware = createMiddleware(routing)

export function middleware(request: NextRequest) {
    const hostHeader = request.headers.get('host') || ''
    const hostname = hostHeader.split(':')[0]?.toLowerCase()
    const { pathname } = request.nextUrl

    // Chrome lookalike allowlist는 apex에서 리다이렉트 없이 제공해야 한다.
    if (pathname.startsWith('/.well-known/')) {
        return NextResponse.next()
    }

    if (hostname === APEX_HOST) {
        const url = request.nextUrl.clone()
        url.protocol = 'https:'
        url.hostname = CANONICAL_HOST
        url.port = ''
        return NextResponse.redirect(url, 301)
    }

    // 관리자는 locale 밖 — /en/admin, /ko/admin → /admin (영문 대시보드 미지원)
    const localeAdmin = pathname.match(/^\/(en|ko)\/admin(\/.*)?$/)
    if (localeAdmin) {
        const url = request.nextUrl.clone()
        url.pathname = `/admin${localeAdmin[2] || ''}`
        return NextResponse.redirect(url)
    }

    // API·관리자·정적 메타는 locale 라우팅 제외
    if (
        pathname.startsWith('/api') ||
        pathname.startsWith('/admin') ||
        pathname === '/sitemap.xml' ||
        pathname === '/robots.txt' ||
        pathname.startsWith('/llms.txt')
    ) {
        return NextResponse.next()
    }

    return intlMiddleware(request)
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|\\.well-known|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|stl|obj|3mf)$).*)',
    ],
}
