/** 이름표에 쓰는 구글 폰트. 파일은 SIL OFL이고, 고른 폰트만 내려받는다. */

/**
 * 이름 칸·글자 크기 1에서 0.8mm 획 검사를 통과한 굵은 글꼴만 둔다.
 * 보통 굵기·필기체는 빼 두었고, 직접 올린 글꼴과 아주 작은 글자는 가는 획 안내로 남긴다.
 */
export const NAME_TAG_FONTS = [
    // 한글 — 고딕·읽기 좋은 기본
    { id: 'nanum-gothic', file: '/fonts/NanumGothic-Bold.ttf', cssFamily: 'Wow Name Nanum', group: 'ko' },
    { id: 'gothic-a1', file: '/fonts/GothicA1-Bold.ttf', cssFamily: 'Wow Name GothicA1', group: 'ko' },
    { id: 'orbit', file: '/fonts/Orbit-Regular.ttf', cssFamily: 'Wow Name Orbit', group: 'ko' },
    // 한글 — 둥근·귀여운 디스플레이
    { id: 'jua', file: '/fonts/Jua-Regular.ttf', cssFamily: 'Wow Name Jua', group: 'ko' },
    { id: 'dongle', file: '/fonts/Dongle-Bold.ttf', cssFamily: 'Wow Name Dongle', group: 'ko' },
    { id: 'cute-font', file: '/fonts/CuteFont-Regular.ttf', cssFamily: 'Wow Name Cute', group: 'ko' },
    { id: 'bagel-fat', file: '/fonts/BagelFatOne-Regular.ttf', cssFamily: 'Wow Name Bagel', group: 'ko' },
    { id: 'gaegu', file: '/fonts/Gaegu-Bold.ttf', cssFamily: 'Wow Name Gaegu', group: 'ko' },
    { id: 'poor-story', file: '/fonts/PoorStory-Regular.ttf', cssFamily: 'Wow Name PoorStory', group: 'ko' },
    // 한글 — 굵은·강한 디스플레이
    { id: 'do-hyeon', file: '/fonts/DoHyeon-Regular.ttf', cssFamily: 'Wow Name DoHyeon', group: 'ko' },
    { id: 'black-han', file: '/fonts/BlackHanSans-Regular.ttf', cssFamily: 'Wow Name BlackHan', group: 'ko' },
    { id: 'gasoek', file: '/fonts/GasoekOne-Regular.ttf', cssFamily: 'Wow Name Gasoek', group: 'ko' },
    { id: 'sunflower', file: '/fonts/Sunflower-Bold.ttf', cssFamily: 'Wow Name Sunflower', group: 'ko' },
    { id: 'gugi', file: '/fonts/Gugi-Regular.ttf', cssFamily: 'Wow Name Gugi', group: 'ko' },
    // 한글 — 손글씨·붓글씨 느낌 (굵기 통과분)
    { id: 'single-day', file: '/fonts/SingleDay-Regular.ttf', cssFamily: 'Wow Name SingleDay', group: 'ko' },
    { id: 'yeon-sung', file: '/fonts/YeonSung-Regular.ttf', cssFamily: 'Wow Name YeonSung', group: 'ko' },
    { id: 'dokdo', file: '/fonts/Dokdo-Regular.ttf', cssFamily: 'Wow Name Dokdo', group: 'ko' },
    { id: 'kirang-haerang', file: '/fonts/KirangHaerang-Regular.ttf', cssFamily: 'Wow Name Kirang', group: 'ko' },
    // 영문 — 디스플레이
    { id: 'lilita-one', file: '/fonts/LilitaOne-Regular.ttf', cssFamily: 'Wow Name Lilita', group: 'en' },
    { id: 'bangers', file: '/fonts/Bangers-Regular.ttf', cssFamily: 'Wow Name Bangers', group: 'en' },
    { id: 'bebas-neue', file: '/fonts/BebasNeue-Regular.ttf', cssFamily: 'Wow Name Bebas', group: 'en' },
    { id: 'righteous', file: '/fonts/Righteous-Regular.ttf', cssFamily: 'Wow Name Righteous', group: 'en' },
    { id: 'boogaloo', file: '/fonts/Boogaloo-Regular.ttf', cssFamily: 'Wow Name Boogaloo', group: 'en' },
    { id: 'anton', file: '/fonts/Anton-Regular.ttf', cssFamily: 'Wow Name Anton', group: 'en' },
    { id: 'passion-one', file: '/fonts/PassionOne-Bold.ttf', cssFamily: 'Wow Name Passion', group: 'en' },
    { id: 'russo-one', file: '/fonts/RussoOne-Regular.ttf', cssFamily: 'Wow Name Russo', group: 'en' },
] as const

export type PresetNameTagFontId = (typeof NAME_TAG_FONTS)[number]['id']
export type NameTagFontId = PresetNameTagFontId | (string & {})
export type NameTagFontGroup = (typeof NAME_TAG_FONTS)[number]['group']

export const NAME_TAG_FONT_GROUPS = ['ko', 'en'] as const

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
