import { getCapstoneInfographic } from './capstone'
import { getGraduationInfographic } from './graduation'
import type { ServiceInfographicContent } from './types'

export type { ServiceInfographicContent } from './types'

const BY_SLUG: Record<string, (locale: string) => ServiceInfographicContent> = {
    capstone: getCapstoneInfographic,
    graduation: getGraduationInfographic,
}

/** 인포그래픽 구성이 있는 서비스만 반환, 없으면 null (기본 텍스트 레이아웃 사용) */
export function getServiceInfographic(slug: string, locale: string): ServiceInfographicContent | null {
    return BY_SLUG[slug]?.(locale) ?? null
}
