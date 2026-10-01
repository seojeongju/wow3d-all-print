import { routing } from '@/i18n/routing'

const LOCALE_PREFIX_RE = new RegExp(`^/(?:${routing.locales.join('|')})(?=/|$)`)

/**
 * 경로에서 언어 접두어(/ko, /en)를 뗀다.
 * 서버 렌더링 때 usePathname()은 접두어 없는 한국어 주소도 내부 경로인 '/ko/...'로 돌려준다.
 */
export function stripLocalePrefix(pathname: string | null | undefined): string {
  if (!pathname) return '/'
  return pathname.replace(LOCALE_PREFIX_RE, '') || '/'
}

/** 언어 접두어를 뗀 경로가 prefixes 중 하나이거나 그 하위 경로인지 */
export function matchesPathPrefix(
  pathname: string | null | undefined,
  prefixes: readonly string[]
): boolean {
  const path = stripLocalePrefix(pathname)
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`))
}
