/** 이름표에 쓰는 한글 폰트와 판 크기. 파일은 SIL OFL. */

export const NAME_TAG_FONTS = [
    { id: 'gowun-dodum', file: '/fonts/GowunDodum-Regular.ttf', cssFamily: 'Wow Name Dodum' },
    { id: 'jua', file: '/fonts/Jua-Regular.ttf', cssFamily: 'Wow Name Jua' },
    { id: 'do-hyeon', file: '/fonts/DoHyeon-Regular.ttf', cssFamily: 'Wow Name DoHyeon' },
    { id: 'black-han', file: '/fonts/BlackHanSans-Regular.ttf', cssFamily: 'Wow Name BlackHan' },
] as const

export type NameTagFontId = (typeof NAME_TAG_FONTS)[number]['id']

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
