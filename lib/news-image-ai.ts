/**
 * 최신 동향 대표 이미지 AI 생성 (Cloudflare Workers AI, 서버 전용)
 * - 글 제목·요약으로 영어 장면 묘사(scene)와 한국어 대체 텍스트(alt)를 만든 뒤 FLUX로 생성
 * - FLUX schnell 출력은 1024×1024 정사각형이므로, 브라우저에서 16:9로 잘라 업로드한다
 */

import { NEWS_CATEGORY_LABEL_KO, type NewsCategory } from '@/lib/news'

export const NEWS_IMAGE_STYLES = ['photo', 'render', 'illustration'] as const
export type NewsImageStyle = (typeof NEWS_IMAGE_STYLES)[number]

export const NEWS_IMAGE_STYLE_LABEL_KO: Record<NewsImageStyle, string> = {
    photo: '실사 사진풍',
    render: '3D 렌더',
    illustration: '일러스트',
}

const STYLE_SUFFIX: Record<NewsImageStyle, string> = {
    photo:
        'professional editorial photograph, realistic, natural soft lighting, shallow depth of field, shot on a full-frame camera, clean modern workshop background',
    render:
        'clean high-end 3D product render, studio lighting, soft shadows, smooth materials, minimal gradient background, octane render style',
    illustration:
        'modern flat vector illustration, clean geometric shapes, limited teal and navy color palette with white, tech editorial style',
}

/** 16:9로 가운데를 자르므로 위아래 여백을 두게 하고, 글자·로고는 깨지므로 금지 */
const COMMON_SUFFIX =
    'wide composition, main subject centered with generous empty space at the top and bottom, no text, no letters, no logos, no watermark, no people faces'

const IMAGE_MODEL = '@cf/black-forest-labs/flux-1-schnell'

const PROMPT_MODELS = [
    '@cf/meta/llama-3.1-8b-instruct-fast',
    '@cf/zai-org/glm-4.7-flash',
    '@cf/meta/llama-4-scout-17b-16e-instruct',
] as const

const CATEGORY_FALLBACK_SCENE: Record<NewsCategory, string> = {
    material: 'close-up of colorful 3D printing filament spools and a freshly printed engineering part on a workbench',
    equipment: 'a modern desktop FDM 3D printer printing a precise mechanical part, nozzle and build plate in focus',
    industry: 'an industrial additive manufacturing facility with rows of 3D printers producing parts',
    support: 'a bright innovation lab with 3D printers and a startup team planning a prototype project, no faces visible',
    case: 'a finished 3D printed prototype part next to calipers and design sketches on a workbench',
    company: 'a tidy professional 3D printing studio with several printers running and finished parts on shelves',
}

const SYSTEM_PROMPT = `You write prompts for an AI image generator that creates cover images for a Korean 3D printing news blog.
Given a Korean article title and summary, return JSON only: {"scene": "...", "alt": "..."}
- scene: ONE English sentence (max 45 words) describing a concrete visual scene related to the article: 3D printers, printed parts, filaments, materials, factories, prototypes.
- Describe objects, setting and lighting only. Never include text, letters, brand names, logos, or recognizable people.
- alt: a natural Korean sentence (max 60 characters) describing what the image shows, for accessibility.`

type AiEnv = {
    AI?: { run: (model: string, input: Record<string, unknown>) => Promise<unknown> }
}

export type NewsImageInput = {
    title: string
    summary?: string
    category?: NewsCategory
    tags?: string
    style: NewsImageStyle
    /** 관리자가 직접 고친 장면 묘사. 있으면 AI 프롬프트 생성을 건너뜀 */
    scene?: string
}

export type NewsImageResult = {
    /** base64 JPEG */
    image: string
    scene: string
    alt: string
}

function readAiText(raw: unknown): string {
    if (typeof raw === 'string') return raw
    if (!raw || typeof raw !== 'object') return ''
    const o = raw as Record<string, unknown>
    if (typeof o.response === 'string') return o.response
    if (o.response && typeof o.response === 'object') return JSON.stringify(o.response)
    if (typeof o.result === 'string') return o.result
    const choices = o.choices as Array<{ message?: { content?: string } }> | undefined
    return choices?.[0]?.message?.content ?? ''
}

function parseScenePayload(text: string): { scene: string; alt: string } | null {
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) return null
    try {
        const j = JSON.parse(m[0]) as { scene?: unknown; alt?: unknown }
        const scene = typeof j.scene === 'string' ? j.scene.replace(/\s+/g, ' ').trim().slice(0, 500) : ''
        const alt = typeof j.alt === 'string' ? j.alt.replace(/\s+/g, ' ').trim().slice(0, 120) : ''
        return scene.length >= 15 ? { scene, alt } : null
    } catch {
        return null
    }
}

async function buildScene(env: AiEnv, input: NewsImageInput): Promise<{ scene: string; alt: string }> {
    const category = input.category ?? 'industry'
    const fallback = {
        scene: CATEGORY_FALLBACK_SCENE[category],
        alt: `${NEWS_CATEGORY_LABEL_KO[category]} 관련 3D프린팅 이미지`,
    }
    if (!env.AI?.run) return fallback

    const user = [
        `제목: ${input.title.slice(0, 200)}`,
        input.summary?.trim() ? `요약:\n${input.summary.trim().slice(0, 800)}` : '',
        input.tags?.trim() ? `태그: ${input.tags.trim().slice(0, 200)}` : '',
        `분류: ${NEWS_CATEGORY_LABEL_KO[category]}`,
    ]
        .filter(Boolean)
        .join('\n')

    for (const model of PROMPT_MODELS) {
        try {
            const raw = await env.AI.run(model, {
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: user },
                ],
                max_tokens: 300,
                temperature: 0.6,
            })
            const parsed = parseScenePayload(readAiText(raw))
            if (parsed) return { scene: parsed.scene, alt: parsed.alt || fallback.alt }
        } catch (e) {
            console.warn('[news-image-ai] 장면 묘사 생성 실패', model, e)
        }
    }
    return fallback
}

export async function generateNewsCoverImage(env: AiEnv, input: NewsImageInput): Promise<NewsImageResult> {
    if (!env.AI?.run) throw new Error('Workers AI 바인딩이 없습니다. wrangler.toml의 [ai] 설정을 확인하세요.')

    const manualScene = input.scene?.replace(/\s+/g, ' ').trim().slice(0, 500) ?? ''
    const { scene, alt } = manualScene
        ? { scene: manualScene, alt: '' }
        : await buildScene(env, input)

    const prompt = `${scene}. ${STYLE_SUFFIX[input.style]}, ${COMMON_SUFFIX}`.slice(0, 2000)
    /** seed를 넣으면 "Additional properties '/seed' not allowed"(5006)로 실패 — prompt·steps만 허용 */
    const raw = (await env.AI.run(IMAGE_MODEL, { prompt, steps: 8 })) as { image?: unknown } | null

    const image = typeof raw?.image === 'string' ? raw.image : ''
    if (!image) throw new Error('이미지 생성 결과가 비어 있습니다. 잠시 후 다시 시도하세요.')
    return { image, scene, alt }
}
