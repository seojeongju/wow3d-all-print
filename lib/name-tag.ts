/** 이름표 1단계 — 아이·강아지·고양이 기본 판과 아이콘 */

export type NameTagAudience = 'child' | 'dog' | 'cat'

export type NameTagRecipeId =
    | 'child-bag'
    | 'child-rect'
    | 'dog-bone'
    | 'dog-oval'
    | 'cat-oval'
    | 'cat-round'

export type NameTagRecipe = {
    id: NameTagRecipeId
    audience: NameTagAudience
    widthMm: number
    heightMm: number
    cornerRadiusMm: number
    ringHoleMm: number
    circle: boolean
    icon: NameTagIconId
    /** 아이콘을 글자 왼쪽이 아니라 위에 둠 */
    stack: boolean
}

export type NameTagIconId = 'star' | 'heart' | 'paw' | 'bone' | 'fish'

export const NAME_TAG_RECIPES: NameTagRecipe[] = [
    { id: 'child-bag', audience: 'child', widthMm: 56, heightMm: 22, cornerRadiusMm: 11, ringHoleMm: 4, circle: false, icon: 'star', stack: false },
    { id: 'child-rect', audience: 'child', widthMm: 60, heightMm: 24, cornerRadiusMm: 4, ringHoleMm: 4, circle: false, icon: 'heart', stack: false },
    { id: 'dog-bone', audience: 'dog', widthMm: 42, heightMm: 22, cornerRadiusMm: 11, ringHoleMm: 4, circle: false, icon: 'paw', stack: false },
    { id: 'dog-oval', audience: 'dog', widthMm: 38, heightMm: 24, cornerRadiusMm: 12, ringHoleMm: 3.6, circle: false, icon: 'bone', stack: false },
    { id: 'cat-oval', audience: 'cat', widthMm: 32, heightMm: 18, cornerRadiusMm: 9, ringHoleMm: 3.2, circle: false, icon: 'fish', stack: false },
    { id: 'cat-round', audience: 'cat', widthMm: 28, heightMm: 28, cornerRadiusMm: 4, ringHoleMm: 3.2, circle: true, icon: 'heart', stack: true },
]

export function recipesForAudience(audience: NameTagAudience): NameTagRecipe[] {
    return NAME_TAG_RECIPES.filter((r) => r.audience === audience)
}

export function getNameTagRecipe(id: NameTagRecipeId): NameTagRecipe {
    return NAME_TAG_RECIPES.find((r) => r.id === id) ?? NAME_TAG_RECIPES[0]
}

const ICONS: Record<NameTagIconId, string> = {
    star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#000" d="M12 2.2 14.7 8.8 21.8 9.4 16.5 14.1 18.1 21.1 12 17.4 5.9 21.1 7.5 14.1 2.2 9.4 9.3 8.8Z"/></svg>`,
    heart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#000" d="M12 20.6C7 16.8 3.2 13.6 3.2 9.4 3.2 6.6 5.3 4.6 8 4.6c1.6 0 3 .8 4 2.1 1-1.3 2.4-2.1 4-2.1 2.7 0 4.8 2 4.8 4.8 0 4.2-3.8 7.4-8.8 11.2Z"/></svg>`,
    paw: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><ellipse fill="#000" cx="32" cy="42" rx="14" ry="11"/><ellipse fill="#000" cx="16" cy="26" rx="6" ry="8"/><ellipse fill="#000" cx="27" cy="16" rx="6" ry="8"/><ellipse fill="#000" cx="40" cy="16" rx="6" ry="8"/><ellipse fill="#000" cx="50" cy="27" rx="6" ry="8"/></svg>`,
    bone: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 36"><path fill="#000" d="M22 8c-6-7-18-4-16 6-6 2-8 12-2 16 2 8 12 10 16 4h40c4 6 14 4 16-4 6-4 4-14-2-16 2-10-10-13-16-6H22Z"/></svg>`,
    fish: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 40"><path fill="#000" d="M8 20 24 8c14-6 28 2 32 12-4 10-18 18-32 12L8 20Z"/><path fill="#000" d="M52 20 64 10v20L52 20Z"/></svg>`,
}

export function nameTagIconSvg(icon: NameTagIconId): string {
    return ICONS[icon]
}
