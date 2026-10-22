import type { NameTagDesign } from '@/lib/name-tag/design'
import { getNameTagTemplate } from '@/lib/name-tag/templates'

/** plateFrame의 테두리 여백과 같다. borderWidthMm 1.2 + 0.6 */
const BORDER_MARGIN_MM = 1.8

export type TextLimitsMm = {
    /** 처음부터 글자가 채워지는 칸 */
    widthMm: number
    heightMm: number
    /** 판 안쪽에서 더 키울 수 있는 칸 */
    maxWidthMm: number
    maxHeightMm: number
}

/**
 * 글자가 놓일 수 있는 칸.
 * 일러스트 베이스는 이름 칸에서 시작하고 판 안쪽까지 키울 수 있다.
 * 기본 도형은 판 안쪽 여백이 상한이다.
 */
export function textLimitsMm(design: NameTagDesign): TextLimitsMm {
    const template = getNameTagTemplate(design.baseId)
    if (template) {
        const scale = design.plate.widthMm / template.view[0]
        const [, , nw, nh] = template.nameBox
        const padX = nw * 0.08
        const padY = nh * 0.12
        const widthMm = Math.max(1, (nw - padX * 2) * scale)
        const heightMm = Math.max(1, (nh - padY * 2) * scale)
        const plateH = design.plate.heightMm
        return {
            widthMm,
            heightMm,
            maxWidthMm: Math.max(widthMm, design.plate.widthMm - 2.4),
            maxHeightMm: Math.max(heightMm, plateH - 2.4),
        }
    }

    const shape = design.plate.shape
    const isCircle = shape === 'circle'
    const w = design.plate.widthMm
    const h = isCircle ? w : design.plate.heightMm
    const margin = Math.max(1.5, Math.min(w, h) * 0.08) + (design.border ? BORDER_MARGIN_MM : 0)
    if (isCircle) {
        const widthMm = Math.max(1, w - margin * 2)
        const heightMm = Math.max(1, h * 0.68)
        return { widthMm, heightMm, maxWidthMm: widthMm, maxHeightMm: heightMm }
    }
    let widthMm = w - margin * 2
    let heightMm = h - margin * 2
    if (design.hole.position === 'left') widthMm -= design.hole.diameterMm + 2
    if (design.hole.position === 'top') heightMm -= design.hole.diameterMm + 2
    widthMm = Math.max(1, widthMm)
    heightMm = Math.max(1, heightMm)
    return { widthMm, heightMm, maxWidthMm: widthMm, maxHeightMm: heightMm }
}
