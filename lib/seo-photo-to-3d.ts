/**
 * 사진→AI 3D 견적 SEO/AEO 공용 콘텐츠
 */
import { absoluteUrl } from '@/lib/site-url'

export const PHOTO_TO_3D_GUIDE_PATH = '/guides/photo-to-3d-printing-quote'
export const PHOTO_TO_3D_QUOTE_PATH = '/quote?entry=photo'
export const PHOTO_TO_3D_SERVICE_PATH = '/services/photo-to-3d'

export const PHOTO_TO_3D_GUIDE_TITLE =
    '사진(이미지)으로 3D 프린팅 견적 받는 방법 | AI 3D 모델링 · 자동견적'
export const PHOTO_TO_3D_GUIDE_DESCRIPTION =
    '3D 파일 없이 제품 사진(이미지)(JPG/PNG)만으로 AI 3D 모델링 후 STL 자동견적·출력 주문까지 이어지는 WOW3D 사진(이미지)→3D 프린팅 가이드입니다. 촬영 방법, 한도, Maker와의 차이를 정리했습니다.'

export const PHOTO_TO_3D_GUIDE_TITLE_EN =
    'Get a 3D printing quote from a photo | AI 3D modeling · auto quote'
export const PHOTO_TO_3D_GUIDE_DESCRIPTION_EN =
    'No 3D file needed — upload a product photo (JPG/PNG), generate an AI 3D model, then auto-quote and order print on WOW3D. Photo tips, daily limits, and how it differs from Maker.'

export const PHOTO_TO_3D_FAQS = [
    {
        q: '사진(이미지) 파일을 3D 모델링으로 변환할 수 있나요?',
        a: '가능합니다. WOW3D에서는 JPG·PNG 제품 사진(이미지)을 올리면 AI가 입체 3D 모델(STL)로 변환하고, 바로 3D 프린팅 자동견적·출력 주문까지 이어집니다. 자동견적에서 「3D 모델이 없어요」를 선택한 뒤 정면 사진(이미지)을 업로드하면 됩니다.',
    },
    {
        q: '3D 파일 없이 3D 프린팅 견적을 받을 수 있나요?',
        a: '가능합니다. WOW3D 자동견적에서 「3D 모델이 없어요」를 선택하고 JPG 또는 PNG 제품 사진(이미지)을 업로드하면 AI가 3D 메시(STL)를 생성한 뒤 부피·가격 자동견적으로 이어집니다.',
    },
    {
        q: '사진(이미지) 3D 모델링은 어떤 사진(이미지)이 좋나요?',
        a: '물체가 화면 중앙에 크게, 단색·밝은 배경, 한 장에 한 물체, 그림자·반사가 적은 사진(이미지)이 좋습니다. 우·뒤·좌 추가 사진(이미지)을 올리면 형상 정확도가 올라갈 수 있습니다.',
    },
    {
        q: 'AI로 만든 3D 모델로 바로 출력 주문할 수 있나요?',
        a: '생성된 STL로 자동견적(소재·레이어·인필) 후 장바구니·주문까지 한 번에 진행할 수 있습니다.',
    },
    {
        q: '사진(이미지)→3D와 CAD·STL 업로드 중 무엇을 써야 하나요?',
        a: '조립 공차·정밀 치수가 중요하면 STL 또는 STEP 업로드를 권장합니다. 형상 확인·시제품·피규어 아이디어 검증에는 사진(이미지) AI 3D가 적합합니다.',
    },
    {
        q: '사진(이미지)→AI 3D는 하루에 몇 번 사용할 수 있나요?',
        a: '로그인 회원 기준 하루 1회(한국 시간)입니다. 생성에 실패한 경우에는 횟수가 차감되지 않습니다.',
    },
    {
        q: 'AI 3D Maker와 사진(이미지)→AI 3D 견적의 차이는 무엇인가요?',
        a: 'AI 3D Maker는 스케치·로고 PNG의 2.5D 돌출용이고, 사진(이미지)→AI 3D 견적은 실사 사진(이미지) 기반 입체 메시 생성 후 즉시 출력 견적·주문으로 이어집니다.',
    },
    {
        q: '지원하는 사진(이미지) 형식과 크기는?',
        a: 'JPG, PNG (최대 8MB)를 지원합니다. 결과는 STL로 3D 뷰어와 자동견적에 사용됩니다.',
    },
] as const

export const PHOTO_TO_3D_FAQS_EN = [
    {
        q: 'Can I turn a photo into a 3D model?',
        a: 'Yes. On WOW3D, upload a JPG or PNG product photo and AI converts it to a 3D model (STL), then you can continue to auto quote and print order. In auto quote, choose “I don’t have a 3D model” and upload a front photo.',
    },
    {
        q: 'Can I get a 3D printing quote without a 3D file?',
        a: 'Yes. In WOW3D auto quote, choose “I don’t have a 3D model,” upload a JPG or PNG product photo, and AI builds a 3D mesh (STL) before volume and price quoting.',
    },
    {
        q: 'What photos work best for photo-to-3D modeling?',
        a: 'Prefer an object large and centered, a plain bright background, one object per shot, and low shadow or glare. Adding right, back, and left views can improve shape accuracy.',
    },
    {
        q: 'Can I order a print from an AI-generated 3D model?',
        a: 'Yes. Use the generated STL for auto quote (material, layer, infill), then continue to cart and order in one flow.',
    },
    {
        q: 'Should I use photo → 3D or upload CAD/STL?',
        a: 'If assembly tolerances and precise dimensions matter, upload STL or STEP. For shape checks, prototypes, and figurine ideas, photo AI 3D is a good fit.',
    },
    {
        q: 'How many photo → AI 3D runs per day?',
        a: 'One run per signed-in account per day (Korea time). Failed generations do not count against the limit.',
    },
    {
        q: 'How is AI 3D Maker different from photo → AI 3D quote?',
        a: 'AI 3D Maker is for 2.5D extrusion from sketch or logo PNGs. Photo → AI 3D quote builds a full mesh from a real photo, then goes straight to print quote and order.',
    },
    {
        q: 'What photo formats and sizes are supported?',
        a: 'JPG and PNG up to 8MB. Results are STL for the 3D viewer and auto quote.',
    },
] as const

export const MAKER_VS_PHOTO_ROWS = [
    {
        label: '입력',
        maker: '스케치·로고 PNG',
        photo: '제품·피규어 실사 사진(이미지)',
    },
    {
        label: '결과',
        maker: '2.5D 돌출 메시',
        photo: '입체 STL',
    },
    {
        label: '견적 연결',
        maker: 'STL 저장 후 quote 업로드',
        photo: '생성 직후 자동견적',
    },
    {
        label: '적합 용도',
        maker: '로고·간판·단순 실루엣',
        photo: '시제품·피규어 형상 확인',
    },
] as const

export const MAKER_VS_PHOTO_ROWS_EN = [
    {
        label: 'Input',
        maker: 'Sketch / logo PNG',
        photo: 'Product or figurine photo',
    },
    {
        label: 'Result',
        maker: '2.5D extruded mesh',
        photo: 'Full 3D STL',
    },
    {
        label: 'Quote link',
        maker: 'Save STL, then upload on quote',
        photo: 'Auto quote right after generation',
    },
    {
        label: 'Best for',
        maker: 'Logos, signs, simple silhouettes',
        photo: 'Prototypes and figurine shape checks',
    },
] as const

export function getPhotoTo3DFaqs(locale: string = 'ko') {
    return locale === 'en' ? PHOTO_TO_3D_FAQS_EN : PHOTO_TO_3D_FAQS
}

export function getMakerVsPhotoRows(locale: string = 'ko') {
    return locale === 'en' ? MAKER_VS_PHOTO_ROWS_EN : MAKER_VS_PHOTO_ROWS
}

export function getPhotoTo3DGuideTitle(locale: string = 'ko') {
    return locale === 'en' ? PHOTO_TO_3D_GUIDE_TITLE_EN : PHOTO_TO_3D_GUIDE_TITLE
}

export function getPhotoTo3DGuideDescription(locale: string = 'ko') {
    return locale === 'en' ? PHOTO_TO_3D_GUIDE_DESCRIPTION_EN : PHOTO_TO_3D_GUIDE_DESCRIPTION
}

function schemaImageUrl(src: string) {
    return src.startsWith('http') ? src : absoluteUrl(src)
}

export type PhotoTo3DShowcaseItem = {
    title: string
    caption?: string
    beforeSrc: string
    beforeAlt: string
    afterSrc: string
    afterAlt: string
    printMethod?: string
    material?: string
}

/** 사진→3D Before/After 쇼케이스 (이미지는 `/public/images/photo-to-3d/`로 교체 가능) */
export const PHOTO_TO_3D_SHOWCASE: readonly PhotoTo3DShowcaseItem[] = [
    {
        title: '피규어 · 캐릭터 형상 확인',
        caption:
            '단색 배경 캐릭터 사진(이미지)에서 입체 메시를 생성한 뒤 SLA/DLP로 키캡·피규어 외관 시제품을 출력하는 흐름에 적합합니다.',
        beforeSrc: '/images/photo-to-3d/keycap-golden-retriever.png',
        beforeAlt: '골든 리트리버 키캡 사진(이미지) 예시 — 사진(이미지)→AI 3D 입력',
        afterSrc: '/images/photo-to-3d/keycap-golden-retriever-mesh.png',
        afterAlt: 'AI 3D 모델링된 키캡 메시 예시',
        printMethod: 'SLA',
        material: 'Standard Resin',
    },
    {
        title: '시제품 · 부품 외관 검증',
        caption:
            '실물·레퍼런스 사진(이미지)으로 형상을 빠르게 확인하고 FDM·SLA 견적·출력까지 이어지는 사례 유형입니다.',
        beforeSrc: '/images/expert/industrial.png',
        beforeAlt: '산업용 부품 제품 사진(이미지) 예시 — 사진(이미지)→AI 3D 입력',
        afterSrc: '/og-image-v2.jpg',
        afterAlt: '3D 프린팅 시제품·출력물 결과 예시',
        printMethod: 'FDM',
        material: 'PLA',
    },
] as const

type ShowcaseSchemaOptions = {
    locale?: string
    path?: string
    name?: string
    description?: string
}

export function buildPhotoTo3DShowcaseSchema(
    items: readonly PhotoTo3DShowcaseItem[] = PHOTO_TO_3D_SHOWCASE,
    options: ShowcaseSchemaOptions = {}
) {
    const locale = options.locale ?? 'ko'
    const isEn = locale === 'en'
    const path = options.path ?? PHOTO_TO_3D_GUIDE_PATH
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name:
            options.name ??
            (isEn
                ? 'Photo → AI 3D conversion and print examples'
                : '사진(이미지)→AI 3D 변환·출력 사례'),
        description:
            options.description ??
            (isEn
                ? 'WOW3D workflow examples from product photos to AI 3D models and 3D printing'
                : '제품 사진(이미지)에서 AI 3D 모델을 생성하고 3D 프린팅 출력까지 진행하는 WOW3D 워크플로 예시'),
        url: absoluteUrl(path),
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
                '@type': 'ImageObject',
                name: item.title,
                description: item.caption,
                contentUrl: schemaImageUrl(item.afterSrc),
                thumbnailUrl: schemaImageUrl(item.beforeSrc),
            },
        })),
    }
}

type HowToSchemaOptions = {
    locale?: string
    guidePath?: string
    quotePath?: string
}

export function buildPhotoTo3DHowToSchema(options: HowToSchemaOptions | string = {}) {
    // 하위 호환: 예전 호출 `buildPhotoTo3DHowToSchema()` / 실수로 locale 문자열만 넘긴 경우
    const opts: HowToSchemaOptions =
        typeof options === 'string' ? { locale: options } : options
    const locale = opts.locale ?? 'ko'
    const isEn = locale === 'en'
    const guidePath = opts.guidePath ?? PHOTO_TO_3D_GUIDE_PATH
    const quotePath = opts.quotePath ?? PHOTO_TO_3D_QUOTE_PATH

    if (isEn) {
        return {
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: 'How to get a 3D printing quote from a photo',
            description:
                'Upload a product photo (JPG/PNG), generate an AI 3D model on WOW3D, then continue to STL auto quote and print order.',
            totalTime: 'PT20M',
            supply: [
                { '@type': 'HowToSupply', name: 'Product photo (JPG or PNG, max 8MB)' },
                { '@type': 'HowToSupply', name: 'WOW3D member sign-in' },
            ],
            tool: [{ '@type': 'HowToTool', name: 'WOW3D photo → AI 3D auto quote' }],
            step: [
                {
                    '@type': 'HowToStep',
                    position: 1,
                    name: 'Sign in and upload a photo',
                    text: 'In auto quote, choose “I don’t have a 3D model” and upload a front photo. Add right, back, and left views if needed.',
                    url: absoluteUrl(quotePath),
                },
                {
                    '@type': 'HowToStep',
                    position: 2,
                    name: 'Generate an AI 3D model',
                    text: 'AI analyzes the photo and builds a 3D mesh (STL). Review the shape in the 3D viewer when ready.',
                    url: absoluteUrl(quotePath),
                },
                {
                    '@type': 'HowToStep',
                    position: 3,
                    name: 'Review the auto quote',
                    text: 'After volume and size analysis, pick FDM, SLA, or DLP, material, layer, and infill for a live quote.',
                    url: absoluteUrl('/quote'),
                },
                {
                    '@type': 'HowToStep',
                    position: 4,
                    name: 'Order and print',
                    text: 'If the quote looks right, continue to cart and order for 3D printing.',
                    url: absoluteUrl('/checkout'),
                },
            ],
            url: absoluteUrl(guidePath),
        }
    }

    return {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: '사진(이미지)으로 3D 프린팅 견적 받는 방법',
        description:
            '제품 사진(이미지)(JPG/PNG)을 업로드해 AI 3D 모델을 생성하고, STL 자동견적·출력 주문까지 진행하는 WOW3D 절차입니다.',
        totalTime: 'PT20M',
        supply: [
            { '@type': 'HowToSupply', name: '제품 사진(이미지) (JPG 또는 PNG, 최대 8MB)' },
            { '@type': 'HowToSupply', name: 'WOW3D 회원 로그인' },
        ],
        tool: [{ '@type': 'HowToTool', name: '와우쓰리디 사진(이미지)→AI 3D 자동견적' }],
        step: [
            {
                '@type': 'HowToStep',
                position: 1,
                name: '로그인 후 사진(이미지) 업로드',
                text: '자동견적에서 「3D 모델이 없어요」를 선택하고 정면 사진(이미지)을 업로드합니다. 필요하면 우·뒤·좌 추가 사진(이미지)도 함께 올릴 수 있습니다.',
                url: absoluteUrl(quotePath),
            },
            {
                '@type': 'HowToStep',
                position: 2,
                name: 'AI 3D 모델 생성',
                text: 'AI가 사진(이미지)을 분석해 입체 3D 메시(STL)를 생성합니다. 완료되면 3D 뷰어에서 형상을 확인할 수 있습니다.',
                url: absoluteUrl(quotePath),
            },
            {
                '@type': 'HowToStep',
                position: 3,
                name: '자동견적 확인',
                text: '부피·치수 분석 후 FDM·SLA·DLP, 소재, 레이어, 인필을 선택해 실시간 견적을 확인합니다.',
                url: absoluteUrl('/quote'),
            },
            {
                '@type': 'HowToStep',
                position: 4,
                name: '주문·출력',
                text: '견적이 맞으면 장바구니·주문으로 이어 3D 프린팅 출력을 진행합니다.',
                url: absoluteUrl('/checkout'),
            },
        ],
        url: absoluteUrl(guidePath),
    }
}
