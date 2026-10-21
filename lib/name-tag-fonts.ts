/** 이름표에 쓰는 구글 폰트. 파일은 SIL OFL이고, 고른 폰트만 내려받는다. */

export const NAME_TAG_FONTS = [
    { id: 'gowun-dodum', file: '/fonts/GowunDodum-Regular.ttf', cssFamily: 'Wow Name Dodum', group: 'ko' },
    { id: 'jua', file: '/fonts/Jua-Regular.ttf', cssFamily: 'Wow Name Jua', group: 'ko' },
    { id: 'do-hyeon', file: '/fonts/DoHyeon-Regular.ttf', cssFamily: 'Wow Name DoHyeon', group: 'ko' },
    { id: 'black-han', file: '/fonts/BlackHanSans-Regular.ttf', cssFamily: 'Wow Name BlackHan', group: 'ko' },
    { id: 'nanum-gothic', file: '/fonts/NanumGothic-Bold.ttf', cssFamily: 'Wow Name Nanum', group: 'ko' },
    { id: 'gothic-a1', file: '/fonts/GothicA1-Bold.ttf', cssFamily: 'Wow Name GothicA1', group: 'ko' },
    { id: 'poor-story', file: '/fonts/PoorStory-Regular.ttf', cssFamily: 'Wow Name PoorStory', group: 'ko' },
    { id: 'sunflower', file: '/fonts/Sunflower-Bold.ttf', cssFamily: 'Wow Name Sunflower', group: 'ko' },
    { id: 'gaegu', file: '/fonts/Gaegu-Bold.ttf', cssFamily: 'Wow Name Gaegu', group: 'ko' },
    { id: 'single-day', file: '/fonts/SingleDay-Regular.ttf', cssFamily: 'Wow Name SingleDay', group: 'ko' },
    { id: 'lilita-one', file: '/fonts/LilitaOne-Regular.ttf', cssFamily: 'Wow Name Lilita', group: 'en' },
    { id: 'pacifico', file: '/fonts/Pacifico-Regular.ttf', cssFamily: 'Wow Name Pacifico', group: 'en' },
    { id: 'bangers', file: '/fonts/Bangers-Regular.ttf', cssFamily: 'Wow Name Bangers', group: 'en' },
    { id: 'bebas-neue', file: '/fonts/BebasNeue-Regular.ttf', cssFamily: 'Wow Name Bebas', group: 'en' },
    { id: 'righteous', file: '/fonts/Righteous-Regular.ttf', cssFamily: 'Wow Name Righteous', group: 'en' },
    { id: 'boogaloo', file: '/fonts/Boogaloo-Regular.ttf', cssFamily: 'Wow Name Boogaloo', group: 'en' },
] as const

export type NameTagFontId = (typeof NAME_TAG_FONTS)[number]['id']
export type NameTagFontGroup = (typeof NAME_TAG_FONTS)[number]['group']

export const NAME_TAG_FONT_GROUPS = ['ko', 'en'] as const

export const NAME_TAG_PLATE_SIZES = [
    { id: 's', widthMm: 42, heightMm: 18, holeMm: 3.2 },
    { id: 'm', widthMm: 60, heightMm: 24, holeMm: 4 },
    { id: 'l', widthMm: 80, heightMm: 32, holeMm: 5 },
] as const

export type NameTagPlateSizeId = (typeof NAME_TAG_PLATE_SIZES)[number]['id']

export function isNameTagFontId(value: unknown): value is NameTagFontId {
    return NAME_TAG_FONTS.some((font) => font.id === value)
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
