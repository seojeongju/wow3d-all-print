/**
 * 올려 둔 SVG 템플릿의 판 외곽.
 * 좌표는 viewBox 픽셀(y 아래)이고, 형상 엔진이 mm·y 위로 바꾼다.
 */
import plates from '@/lib/name-tag/template-plates.json'

export type NameTagTemplateSet = 'kids' | 'pet'

export type NameTagTemplate = {
    id: string
    set: NameTagTemplateSet
    name: string
    file: string
    view: [number, number]
    /** 이름을 놓을 사각형. x, y, 너비, 높이. y는 아래 방향 */
    nameBox: [number, number, number, number]
    rings: [number, number][][]
}

const WIDTH_MM = [25, 150] as const
const HEIGHT_MM = [12, 100] as const

function asTemplates(set: NameTagTemplateSet, rows: unknown[]): NameTagTemplate[] {
    return rows.map((row) => {
        const item = row as NameTagTemplate
        return { ...item, set }
    })
}

export const NAME_TAG_TEMPLATES: Record<NameTagTemplateSet, NameTagTemplate[]> = {
    kids: asTemplates('kids', plates.kids),
    pet: asTemplates('pet', plates.pet),
}

const BY_ID = new Map<string, NameTagTemplate>(
    [...NAME_TAG_TEMPLATES.kids, ...NAME_TAG_TEMPLATES.pet].map((template) => [template.id, template])
)

export function isNameTagTemplateId(value: unknown): value is string {
    return typeof value === 'string' && BY_ID.has(value)
}

export function getNameTagTemplate(id: string | null | undefined): NameTagTemplate | null {
    if (!id) return null
    return BY_ID.get(id) ?? null
}

/** 가로를 기준으로 템플릿 비율을 유지한 판 크기. 허용 범위를 넘으면 같이 줄인다. */
export function templatePlateSize(template: NameTagTemplate, widthMm: number): { widthMm: number; heightMm: number } {
    const aspect = template.view[1] / template.view[0]
    let width = Math.min(WIDTH_MM[1], Math.max(WIDTH_MM[0], widthMm))
    let height = width * aspect
    if (height > HEIGHT_MM[1]) {
        height = HEIGHT_MM[1]
        width = height / aspect
    }
    if (height < HEIGHT_MM[0]) {
        height = HEIGHT_MM[0]
        width = height / aspect
    }
    return {
        widthMm: Math.round(width * 10) / 10,
        heightMm: Math.round(height * 10) / 10,
    }
}
