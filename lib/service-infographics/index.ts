import { getCapstoneInfographic } from './capstone'
import { getFdmInfographic } from './fdm'
import { getGraduationInfographic } from './graduation'
import { getModelingInfographic } from './modeling'
import { getPhotoTo3DInfographic } from './photo-to-3d'
import { getPrintingInfographic } from './printing'
import { getPrototypeInfographic } from './prototype'
import { getSlaInfographic } from './sla'
import { getSmallBatchInfographic } from './small-batch'
import type { ServiceInfographicContent } from './types'

export type { ServiceInfographicContent } from './types'

const BY_SLUG: Record<string, (locale: string) => ServiceInfographicContent> = {
    printing: getPrintingInfographic,
    prototype: getPrototypeInfographic,
    fdm: getFdmInfographic,
    sla: getSlaInfographic,
    graduation: getGraduationInfographic,
    capstone: getCapstoneInfographic,
    'small-batch': getSmallBatchInfographic,
    modeling: getModelingInfographic,
    'photo-to-3d': getPhotoTo3DInfographic,
}

/** 인포그래픽 구성이 있는 서비스만 반환, 없으면 null (기본 텍스트 레이아웃 사용) */
export function getServiceInfographic(slug: string, locale: string): ServiceInfographicContent | null {
    return BY_SLUG[slug]?.(locale) ?? null
}
