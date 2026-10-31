/** 이름표 프리셋 — 획 검사(0.8mm) 통과한 굵은 글꼴. */

/**
 * 이름 칸·글자 크기 1에서 가는 획 검사를 통과한 굵은 글꼴만 둔다.
 * 나눔명조·펜·브러시 등 가는 글꼴은 제외. 직접 올린 글꼴은 가는 획 안내로 남긴다.
 */
export const NAME_TAG_FONTS = [
    // 고딕 — 읽기 좋은 기본
    { id: 'nanum-gothic', file: '/fonts/NanumGothic-Bold.ttf', cssFamily: 'Wow Name NanumGothic', group: 'gothic' },
    {
        id: 'nanum-gothic-extra',
        file: '/fonts/NanumGothic-ExtraBold.ttf',
        cssFamily: 'Wow Name NanumGothicExtra',
        group: 'gothic',
    },
    {
        id: 'nanum-barun-gothic',
        file: '/fonts/NanumBarunGothicBold.ttf',
        cssFamily: 'Wow Name NanumBarun',
        group: 'gothic',
    },
    // 스퀘어 — 각진·둥근 디스플레이
    { id: 'nanum-square', file: '/fonts/NanumSquareB.ttf', cssFamily: 'Wow Name NanumSquare', group: 'square' },
    {
        id: 'nanum-square-extra',
        file: '/fonts/NanumSquareEB.ttf',
        cssFamily: 'Wow Name NanumSquareExtra',
        group: 'square',
    },
    {
        id: 'nanum-square-round',
        file: '/fonts/NanumSquareRoundB.ttf',
        cssFamily: 'Wow Name NanumSquareRound',
        group: 'square',
    },
    {
        id: 'nanum-square-round-extra',
        file: '/fonts/NanumSquareRoundEB.ttf',
        cssFamily: 'Wow Name NanumSquareRoundExtra',
        group: 'square',
    },
    // 필기 — 손글씨·붓글씨 (굵고 획 검사 통과분)
    { id: 'gaegu', file: '/fonts/Gaegu-Bold.ttf', cssFamily: 'Wow Name Gaegu', group: 'hand' },
    { id: 'single-day', file: '/fonts/SingleDay-Regular.ttf', cssFamily: 'Wow Name SingleDay', group: 'hand' },
    { id: 'poor-story', file: '/fonts/PoorStory-Regular.ttf', cssFamily: 'Wow Name PoorStory', group: 'hand' },
    { id: 'yeon-sung', file: '/fonts/YeonSung-Regular.ttf', cssFamily: 'Wow Name YeonSung', group: 'hand' },
] as const

export type PresetNameTagFontId = (typeof NAME_TAG_FONTS)[number]['id']
export type NameTagFontId = PresetNameTagFontId | (string & {})
export type NameTagFontGroup = (typeof NAME_TAG_FONTS)[number]['group']

export const NAME_TAG_FONT_GROUPS = ['gothic', 'square', 'hand'] as const

export const NAME_TAG_PLATE_SIZES = [
    { id: 's', widthMm: 42, heightMm: 18, holeMm: 3.2 },
    { id: 'm', widthMm: 60, heightMm: 24, holeMm: 4 },
    { id: 'l', widthMm: 80, heightMm: 32, holeMm: 5 },
] as const

export type NameTagPlateSizeId = (typeof NAME_TAG_PLATE_SIZES)[number]['id']

export function isCustomFontId(value: unknown): value is string {
    return typeof value === 'string' && value.startsWith('custom:')
}

export function isNameTagPresetFontId(value: unknown): value is PresetNameTagFontId {
    return NAME_TAG_FONTS.some((font) => font.id === value)
}

export function isNameTagFontId(value: unknown): value is NameTagFontId {
    return isNameTagPresetFontId(value) || isCustomFontId(value)
}

export function textHasHangul(text: string): boolean {
    return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text)
}

export function getNameTagFont(id: NameTagFontId) {
    return NAME_TAG_FONTS.find((font) => font.id === id) ?? NAME_TAG_FONTS[0]
}

/** 두 줄이면 판을 높이고 모서리를 덜 둥글게 한다. */
export function plateForSize(sizeId: NameTagPlateSizeId, twoLines: boolean) {
    const base = NAME_TAG_PLATE_SIZES.find((size) => size.id === sizeId) ?? NAME_TAG_PLATE_SIZES[1]
    const heightMm = twoLines ? Math.round(base.heightMm * 1.5) : base.heightMm
    return {
        widthMm: base.widthMm,
        heightMm,
        cornerRadiusMm: twoLines ? Math.round(heightMm * 0.32) : Math.round(heightMm / 2),
        ringHoleMm: base.holeMm,
    }
}
