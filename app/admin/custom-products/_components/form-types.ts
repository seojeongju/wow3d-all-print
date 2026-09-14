import {
    CUSTOM_OPTION_PRESETS,
    type CustomProductCta,
    type CustomProductMethod,
    type CustomProductOption,
    type CustomProductPublic,
} from '@/lib/custom-products'

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
    optionsText: string
    highlightsText: string
    sortOrder: number
    isActive: boolean
}

export const emptyCustomProductForm = (): CustomProductFormState => ({
    slug: '',
    title: '',
    summary: '',
    description: '',
    detailBody: '',
    priceNote: '맞춤 견적가',
    method: 'fdm',
    primaryCta: 'quote',
    secondaryCta: 'inquiry',
    optionsText: CUSTOM_OPTION_PRESETS.map(
        (o) => `${o.label}: ${o.choices.join(', ')}`
    ).join('\n'),
    highlightsText: '',
    sortOrder: 0,
    isActive: true,
})

export function optionsFromText(text: string): CustomProductOption[] {
    return text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, idx) => {
            const [labelPart, choicesPart] = line.split(':')
            const label = (labelPart || `옵션${idx + 1}`).trim()
            const choices = (choicesPart || '')
                .split(/[,|/]/)
                .map((s) => s.trim())
                .filter(Boolean)
            return {
                id: `opt-${idx + 1}`,
                label,
                choices: choices.length > 0 ? choices : ['기본'],
            }
        })
}

export function productToForm(p: CustomProductPublic): CustomProductFormState {
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
        optionsText:
            p.options.length > 0
                ? p.options.map((o) => `${o.label}: ${o.choices.join(', ')}`).join('\n')
                : emptyCustomProductForm().optionsText,
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
        options: optionsFromText(form.optionsText),
        highlights: form.highlightsText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
        sortOrder: form.sortOrder,
        isActive: form.isActive,
    }
}
