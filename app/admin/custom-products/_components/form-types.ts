import {
    CUSTOM_OPTION_PRESETS,
    type CustomProductCta,
    type CustomProductMethod,
    type CustomProductOption,
    type CustomProductPublic,
} from '@/lib/custom-products'

export type OptionComposeType = 'standalone' | 'combination'
export type OptionInputMethod = 'direct' | 'excel' | 'import'
export type OptionSortOrder = 'registered' | 'name'

export type OptionDraftRow = {
    name: string
    valuesText: string
}

export type CustomProductFormState = {
    slug: string
    title: string
    summary: string
    description: string
    detailBody: string
    priceNote: string
    method: CustomProductMethod
    primaryCta: CustomProductCta
    secondaryCta: CustomProductCta | ''
    /** 선택형 옵션 사용 여부 */
    optionsEnabled: boolean
    optionInputMethod: OptionInputMethod
    optionComposeType: OptionComposeType
    optionNameCount: number
    optionSortOrder: OptionSortOrder
    /** 입력 중인 옵션명/값 행 */
    optionDrafts: OptionDraftRow[]
    /** 적용된 옵션 목록 (저장 대상) */
    options: CustomProductOption[]
    highlightsText: string
    sortOrder: number
    isActive: boolean
}

function defaultDrafts(count: number, seed?: CustomProductOption[]): OptionDraftRow[] {
    const rows: OptionDraftRow[] = []
    for (let i = 0; i < count; i++) {
        const s = seed?.[i]
        rows.push({
            name: s?.label || '',
            valuesText: s?.choices?.join(',') || '',
        })
    }
    return rows
}

export const emptyCustomProductForm = (): CustomProductFormState => {
    const presets = CUSTOM_OPTION_PRESETS.slice(0, 2)
    return {
        slug: '',
        title: '',
        summary: '',
        description: '',
        detailBody: '',
        priceNote: '맞춤 견적가',
        method: 'fdm',
        primaryCta: 'quote',
        secondaryCta: 'inquiry',
        optionsEnabled: true,
        optionInputMethod: 'direct',
        optionComposeType: 'combination',
        optionNameCount: Math.max(1, presets.length),
        optionSortOrder: 'registered',
        optionDrafts: defaultDrafts(Math.max(1, presets.length), presets),
        options: [],
        highlightsText: '',
        sortOrder: 0,
        isActive: true,
    }
}

export function parseValuesText(text: string): string[] {
    return text
        .split(/[,|/]/)
        .map((s) => s.trim())
        .filter(Boolean)
}

export function draftsToOptions(
    drafts: OptionDraftRow[],
    sortOrder: OptionSortOrder
): CustomProductOption[] {
    const opts = drafts
        .map((d, idx) => {
            const label = d.name.trim()
            const choices = parseValuesText(d.valuesText)
            if (!label || choices.length === 0) return null
            return {
                id: `opt-${idx + 1}`,
                label,
                choices,
            } satisfies CustomProductOption
        })
        .filter((o): o is CustomProductOption => o !== null)

    if (sortOrder === 'name') {
        return [...opts].sort((a, b) => a.label.localeCompare(b.label, 'ko'))
    }
    return opts
}

/** 조합형 옵션값 카테시안 곱 */
export function buildCombinations(options: CustomProductOption[]): string[] {
    if (options.length === 0) return []
    return options.reduce<string[]>(
        (acc, opt) => {
            if (acc.length === 0) return opt.choices.slice()
            const next: string[] = []
            for (const left of acc) {
                for (const choice of opt.choices) {
                    next.push(`${left} / ${choice}`)
                }
            }
            return next
        },
        []
    )
}

export function productToForm(p: CustomProductPublic): CustomProductFormState {
    const count = Math.min(5, Math.max(1, p.options.length || 1))
    return {
        slug: p.slug,
        title: p.title,
        summary: p.summary,
        description: p.description,
        detailBody: p.detailBody,
        priceNote: p.priceNote,
        method: p.method,
        primaryCta: p.primaryCta,
        secondaryCta: p.secondaryCta || '',
        optionsEnabled: p.options.length > 0,
        optionInputMethod: 'direct',
        optionComposeType: 'combination',
        optionNameCount: count,
        optionSortOrder: 'registered',
        optionDrafts: defaultDrafts(
            count,
            p.options.length > 0 ? p.options : undefined
        ),
        options: p.options,
        highlightsText: p.highlights.join('\n'),
        sortOrder: p.sortOrder,
        isActive: p.isActive,
    }
}

export function formToPayload(form: CustomProductFormState) {
    return {
        slug: form.slug,
        title: form.title,
        summary: form.summary,
        description: form.description,
        detailBody: form.detailBody,
        priceNote: form.priceNote,
        method: form.method,
        primaryCta: form.primaryCta,
        secondaryCta: form.secondaryCta || null,
        options: form.optionsEnabled ? form.options : [],
        highlights: form.highlightsText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
        sortOrder: form.sortOrder,
        isActive: form.isActive,
    }
}

export function resizeOptionDrafts(
    drafts: OptionDraftRow[],
    count: number
): OptionDraftRow[] {
    const next = drafts.slice(0, count)
    while (next.length < count) {
        next.push({ name: '', valuesText: '' })
    }
    return next
}
