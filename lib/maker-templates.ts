import type { BasePlateType } from '@/lib/maker-geometry'

export type MakerTemplateId = 'badge-circle' | 'badge-rect' | 'keycap-1u'

export type MakerTemplate = {
    id: MakerTemplateId
    name: string
    description: string
    basePlateType: Exclude<BasePlateType, 'none'>
    /** 판 한 변(원형은 지름) mm */
    baseSizeMm: number
    /** 베이스(1층) 두께 mm */
    baseHeight: number
    /** 로고/스케치(2층) 돌출 mm */
    extrusionHeight: number
    /** 테두리 림(3층) mm — 0이면 없음 */
    rimHeightMm: number
    bevelMm: number
    cornerRadiusMm: number
    mxStem: boolean
    backMount: 'none' | 'magnet' | 'pin'
}

export const MAKER_TEMPLATES: MakerTemplate[] = [
    {
        id: 'badge-circle',
        name: '원형 배지',
        description: 'Ø40mm 원판 + 테두리. 뒷면 마그넷 컵(Ø10).',
        basePlateType: 'circle',
        baseSizeMm: 40,
        baseHeight: 2,
        extrusionHeight: 1.2,
        rimHeightMm: 1.2,
        bevelMm: 0.4,
        cornerRadiusMm: 4,
        mxStem: false,
        backMount: 'magnet',
    },
    {
        id: 'badge-rect',
        name: '사각 배지',
        description: '40×40mm 라운드 판 + 테두리. 뒷면 옷핀 홈.',
        basePlateType: 'rounded',
        baseSizeMm: 40,
        baseHeight: 2,
        extrusionHeight: 1.2,
        rimHeightMm: 1,
        bevelMm: 0.4,
        cornerRadiusMm: 4,
        mxStem: false,
        backMount: 'pin',
    },
    {
        id: 'keycap-1u',
        name: '키캡 1U',
        description: '18×18mm 키캡형 + Cherry MX 간이 스템(FDM 여유).',
        basePlateType: 'rounded',
        baseSizeMm: 18,
        baseHeight: 8,
        extrusionHeight: 0.6,
        rimHeightMm: 0,
        bevelMm: 0.8,
        cornerRadiusMm: 3.2,
        mxStem: true,
        backMount: 'none',
    },
]

export function getMakerTemplate(id: MakerTemplateId): MakerTemplate | undefined {
    return MAKER_TEMPLATES.find((t) => t.id === id)
}

/** 미리보기용 레이어 색. STL은 형상만 저장되며, 실제 이색 출력은 소재·도색 공정으로 진행합니다. */
export const MAKER_LAYER_SWATCHES = [
    { id: 'ink', label: '잉크', value: '#1f1f2e' },
    { id: 'white', label: '화이트', value: '#f4f4f5' },
    { id: 'teal', label: '틸', value: '#14b8a6' },
    { id: 'indigo', label: '인디고', value: '#4f46e5' },
    { id: 'red', label: '레드', value: '#e11d48' },
    { id: 'gold', label: '골드', value: '#d4a017' },
] as const
