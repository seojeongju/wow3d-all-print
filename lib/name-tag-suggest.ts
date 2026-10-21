/**
 * 이름표 추천 — 허용된 판·아이콘 id만 받는다.
 * 모델이 치수, SVG, 메시를 내도 여기서 버린다.
 */
import {
    iconsForAudience,
    isIconForAudience,
    recipesForAudience,
    type NameTagAudience,
    type NameTagIconId,
    type NameTagRecipeId,
} from '@/lib/name-tag'

export type NameTagSuggestion = {
    recipeId: NameTagRecipeId
    icon: NameTagIconId
    /** workers-ai | keyword */
    source: 'workers-ai' | 'keyword'
}

const MODELS = [
    '@cf/meta/llama-3.1-8b-instruct-fast',
    '@cf/zai-org/glm-4.7-flash',
] as const

type AiRunner = {
    run: (model: string, input: Record<string, unknown>) => Promise<unknown>
}

function recipeFor(audience: NameTagAudience, id: unknown): NameTagRecipeId | null {
    if (typeof id !== 'string') return null
    const found = recipesForAudience(audience).find((recipe) => recipe.id === id)
    return found ? found.id : null
}

/** 모델 JSON에서 허용 id만 남긴다. 하나라도 벗어나면 null. */
export function sanitizeNameTagSuggestion(
    audience: NameTagAudience,
    raw: unknown
): Pick<NameTagSuggestion, 'recipeId' | 'icon'> | null {
    if (!raw || typeof raw !== 'object') return null
    const row = raw as { recipeId?: unknown; icon?: unknown }
    const recipeId = recipeFor(audience, row.recipeId)
    if (!recipeId || !isIconForAudience(audience, row.icon)) return null
    return { recipeId, icon: row.icon }
}

/** AI가 없을 때 문장 속 단어로 허용 목록만 고른다. */
export function keywordNameTagSuggestion(audience: NameTagAudience, wish: string): NameTagSuggestion {
    const text = wish.toLowerCase()
    if (audience === 'child') {
        if (/꽃|flower/.test(text)) return { recipeId: 'child-bag', icon: 'flower', source: 'keyword' }
        if (/하트|heart|네모/.test(text)) return { recipeId: 'child-rect', icon: 'heart', source: 'keyword' }
        return { recipeId: 'child-bag', icon: 'star', source: 'keyword' }
    }
    if (audience === 'dog') {
        if (/공|ball/.test(text)) return { recipeId: 'dog-bone', icon: 'ball', source: 'keyword' }
        if (/뼈|bone|타원/.test(text)) return { recipeId: 'dog-oval', icon: 'bone', source: 'keyword' }
        return { recipeId: 'dog-bone', icon: 'paw', source: 'keyword' }
    }
    if (/달|moon/.test(text)) return { recipeId: 'cat-oval', icon: 'moon', source: 'keyword' }
    if (/하트|heart|동그|둥근|원/.test(text)) return { recipeId: 'cat-round', icon: 'heart', source: 'keyword' }
    return { recipeId: 'cat-oval', icon: 'fish', source: 'keyword' }
}

function promptFor(audience: NameTagAudience, wish: string): string {
    const recipes = recipesForAudience(audience).map((recipe) => recipe.id).join(', ')
    const icons = iconsForAudience(audience).join(', ')
    return [
        '이름표 판과 아이콘 id만 고른다.',
        '치수, SVG, 3D, 설명 문장은 출력하지 않는다.',
        `대상: ${audience}`,
        `recipeId 허용: ${recipes}`,
        `icon 허용: ${icons}`,
        `요청: ${wish}`,
        'JSON 한 줄만 출력한다. 예: {"recipeId":"...","icon":"..."}',
    ].join('\n')
}

function textFromAi(result: unknown): string {
    if (!result || typeof result !== 'object') return ''
    const row = result as { response?: unknown; result?: unknown }
    if (typeof row.response === 'string') return row.response
    if (typeof row.result === 'string') return row.result
    return ''
}

function parseJsonObject(text: string): unknown {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    try {
        return JSON.parse(match[0]) as unknown
    } catch {
        return null
    }
}

export async function suggestNameTag(
    audience: NameTagAudience,
    wish: string,
    ai: AiRunner | null
): Promise<NameTagSuggestion> {
    const trimmed = wish.replace(/\s+/g, ' ').trim().slice(0, 80)
    if (!trimmed || !ai?.run) return keywordNameTagSuggestion(audience, trimmed)

    for (const model of MODELS) {
        try {
            const raw = await ai.run(model, {
                messages: [
                    { role: 'system', content: '허용된 id만 JSON으로 답한다.' },
                    { role: 'user', content: promptFor(audience, trimmed) },
                ],
                max_tokens: 80,
                temperature: 0,
            })
            const picked = sanitizeNameTagSuggestion(audience, parseJsonObject(textFromAi(raw)))
            if (picked) return { ...picked, source: 'workers-ai' }
        } catch (error) {
            console.warn('[name-tag-suggest] Workers AI 실패', model, error)
        }
    }
    return keywordNameTagSuggestion(audience, trimmed)
}
