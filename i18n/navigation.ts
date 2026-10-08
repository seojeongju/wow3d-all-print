import { createElement, useMemo, type ComponentProps } from 'react'
import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

const navigation = createNavigation(routing)

export const { redirect, usePathname, getPathname } = navigation

/**
 * 쿼리에 따라 다른 화면을 보여 주는 경로 (/quote?entry=file · entry=photo 등).
 * Next 라우터는 프리페치 캐시를 경로 기준으로 공유해서, 프리페치 응답이 빌드 ID 불일치(배포 직후·오래 열린 탭)나
 * 네트워크 오류로 전체 이동으로 처리되면 클릭한 링크가 아닌 먼저 프리페치된 쿼리(예: entry=photo)로 이동한다.
 * 쿼리까지 포함한 전체 프리페치(FULL)로 링크마다 별도 캐시 항목을 만들어 막는다.
 */
const QUERY_DISTINCT_PATHS = ['/quote']

type Href = ComponentProps<typeof navigation.Link>['href']

export function needsExactPrefetch(href: Href): boolean {
    if (typeof href === 'string') {
        const q = href.indexOf('?')
        if (q < 0) return false
        const pathname = href.slice(0, q).replace(/^\/en(?=\/|$)/, '') || '/'
        return QUERY_DISTINCT_PATHS.includes(pathname)
    }
    const query = href.query
    const hasQuery = typeof query === 'string' ? query.length > 0 : Boolean(query && Object.keys(query).length > 0)
    return hasQuery && QUERY_DISTINCT_PATHS.includes(href.pathname ?? '')
}

export function Link(props: ComponentProps<typeof navigation.Link>) {
    const prefetch = props.prefetch ?? (needsExactPrefetch(props.href) ? true : undefined)
    return createElement(navigation.Link, { ...props, prefetch })
}

type ExactPrefetchRouter = { prefetch: (href: string) => void }

/** next/navigation 라우터로 이동할 때도 같은 문제를 피하도록 이동 직전에 해당 URL을 전체 프리페치 */
export function prefetchExactIfNeeded(router: ExactPrefetchRouter, href: string): void {
    if (needsExactPrefetch(href)) router.prefetch(href)
}

export function useRouter() {
    const router = navigation.useRouter()
    return useMemo(() => {
        type PushArgs = Parameters<typeof router.push>
        type ReplaceArgs = Parameters<typeof router.replace>
        const prefetchFor = (href: PushArgs[0], options?: PushArgs[1]) => {
            if (typeof href !== 'string' || !needsExactPrefetch(href)) return
            router.prefetch(href, options?.locale ? { locale: options.locale } : undefined)
        }
        return {
            ...router,
            push: (...args: PushArgs) => {
                prefetchFor(args[0], args[1])
                router.push(...args)
            },
            replace: (...args: ReplaceArgs) => {
                prefetchFor(args[0], args[1])
                router.replace(...args)
            },
        }
    }, [router])
}
