/**
 * 최신 동향 대표 이미지 AI 생성 (Cloudflare Workers AI, 서버 전용)
 * - 글 제목·요약으로 영어 장면 묘사(scene)와 한국어 장면 설명·대체 텍스트(alt)를 만든 뒤 FLUX로 생성
 * - 관리자가 한국어로 쓴 장면 설명은 영어로 옮겨 생성한다 (FLUX는 영어 프롬프트만 제대로 이해함)
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

const TRANSLATE_MODEL = '@cf/meta/m2m100-1.2b'
const HANGUL_RE = /[\u3131-\u318e\uac00-\ud7a3]/

const SYSTEM_PROMPT = `You write prompts for an AI image generator that creates cover images for a Korean 3D printing news blog.
Given a Korean article title and summary, return JSON only: {"scene": "...", "sceneKo": "...", "alt": "..."}
- scene: ONE English sentence (max 45 words) describing a concrete visual scene related to the article: 3D printers, printed parts, filaments, materials, factories, prototypes.
- Describe objects, setting and lighting only. Never include text, letters, brand names, logos, or recognizable people.
- sceneKo: the same scene written as one natural Korean sentence (max 100 characters), so a Korean editor can read and tweak it.
- alt: a natural Korean sentence (max 60 characters) describing what the image shows, for accessibility.`

const TRANSLATE_PROMPT = `You turn a Korean scene description into an English prompt for an AI image generator.
Return JSON only: {"scene": "..."}
- scene: ONE English sentence (max 45 words) describing exactly the same visual scene: objects, setting, lighting. Keep the meaning; do not add a different subject.
- Never include text, letters, brand names, logos, or recognizable people.`

type AiEnv = {
    AI?: { run: (model: string, input: Record<string, unknown>) => Promise<unknown> }
}

export type NewsImageInput = {
    title: string
    summary?: string
    category?: NewsCategory
    tags?: string
    style: NewsImageStyle
    /** 관리자가 직접 고친 장면 설명(한국어·영어). 있으면 AI 프롬프트 생성을 건너뜀 */
    scene?: string
}

export type NewsImageResult = {
    /** base64 JPEG */
    image: string
    /** 편집 칸에 다시 보여 줄 장면 설명 (가능하면 한국어) */
    scene: string
    /** 실제 이미지 생성에 쓴 영어 장면 묘사 */
    promptScene: string
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

function cleanLine(v: unknown, max: number): string {
    return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : ''
}

function parseScenePayload(text: string): { scene: string; sceneKo: string; alt: string } | null {
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) return null
    try {
        const j = JSON.parse(m[0]) as { scene?: unknown; sceneKo?: unknown; alt?: unknown }
        const scene = cleanLine(j.scene, 500)
        const sceneKo = cleanLine(j.sceneKo, 200)
        const alt = cleanLine(j.alt, 120)
        // 영어 프롬프트 자리에 한국어가 섞이면 FLUX가 엉뚱한 그림을 그리므로 버린다
        if (scene.length < 15 || HANGUL_RE.test(scene)) return null
        return { scene, sceneKo: HANGUL_RE.test(sceneKo) ? sceneKo : '', alt }
    } catch {
        return null
    }
}

/** 한국어 장면 설명 → 영어 프롬프트. LLM으로 다듬고, 실패하면 번역 모델로 직역한다 */
async function translateScene(env: AiEnv, sceneKo: string): Promise<string | null> {
    if (!env.AI?.run) return null
    for (const model of PROMPT_MODELS) {
        try {
            const raw = await env.AI.run(model, {
                messages: [
                    { role: 'system', content: TRANSLATE_PROMPT },
                    { role: 'user', content: sceneKo },
                ],
                max_tokens: 200,
                temperature: 0.2,
            })
            const parsed = parseScenePayload(readAiText(raw))
            if (parsed) return parsed.scene
        } catch (e) {
            console.warn('[news-image-ai] 장면 설명 번역 실패', model, e)
        }
    }
    try {
        const raw = (await env.AI.run(TRANSLATE_MODEL, { text: sceneKo, source_lang: 'ko', target_lang: 'en' })) as {
            translated_text?: unknown
        } | null
        const text = cleanLine(raw?.translated_text, 500)
        if (text.length >= 10 && !HANGUL_RE.test(text)) return text
    } catch (e) {
        console.warn('[news-image-ai] 번역 모델 실패', e)
    }
    return null
}

async function buildScene(env: AiEnv, input: NewsImageInput): Promise<{ scene: string; sceneKo: string; alt: string }> {
    const category = input.category ?? 'industry'
    const fallback = {
        scene: CATEGORY_FALLBACK_SCENE[category],
        sceneKo: '',
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
            if (parsed) return { ...parsed, alt: parsed.alt || fallback.alt }
        } catch (e) {
            console.warn('[news-image-ai] 장면 묘사 생성 실패', model, e)
        }
    }
    return fallback
}

export async function generateNewsCoverImage(env: AiEnv, input: NewsImageInput): Promise<NewsImageResult> {
    if (!env.AI?.run) throw new Error('Workers AI 바인딩이 없습니다. wrangler.toml의 [ai] 설정을 확인하세요.')

    const manualScene = cleanLine(input.scene, 500)
    let promptScene: string
    let displayScene: string
    let alt: string
    if (manualScene && HANGUL_RE.test(manualScene)) {
        const translated = await translateScene(env, manualScene)
        if (!translated) {
            throw new Error('한국어 장면 설명을 영어로 옮기지 못했습니다. 잠시 후 다시 시도하거나 영어로 입력해 주세요.')
        }
        promptScene = translated
        displayScene = manualScene
        alt = manualScene.slice(0, 120)
    } else if (manualScene) {
        promptScene = manualScene
        displayScene = manualScene
        alt = ''
    } else {
        const built = await buildScene(env, input)
        promptScene = built.scene
        displayScene = built.sceneKo || built.scene
        alt = built.alt
    }

    const prompt = `${promptScene}. ${STYLE_SUFFIX[input.style]}, ${COMMON_SUFFIX}`.slice(0, 2000)
    /** seed를 넣으면 "Additional properties '/seed' not allowed"(5006)로 실패 — prompt·steps만 허용 */
    const raw = (await env.AI.run(IMAGE_MODEL, { prompt, steps: 8 })) as { image?: unknown } | null

    const image = typeof raw?.image === 'string' ? raw.image : ''
    if (!image) throw new Error('이미지 생성 결과가 비어 있습니다. 잠시 후 다시 시도하세요.')
    return { image, scene: displayScene, promptScene, alt }
}
