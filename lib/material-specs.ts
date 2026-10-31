/**
 * 소재 상세 스펙 — 가이드·안전 안내·소재 페이지에 이미 있는 수치·표현만 사용한다.
 * (지어낸 물성·평점 금지)
 */

export type MaterialSpecId = 'pla' | 'abs' | 'petg' | 'pc' | 'tpu' | 'standard' | 'tough' | 'clear' | 'flexible'

export type MaterialProcess = 'fdm' | 'resin'

export type LocaleText = { ko: string; en: string }

/** 스펙 항목 키 — UI 라벨은 messages Materials.specLabels.* 를 쓴다 */
export type MaterialSpecFieldId =
    | 'heatDeflection'
    | 'meltRange'
    | 'nozzleTemp'
    | 'bedTemp'
    | 'strength'
    | 'flexibility'
    | 'surface'
    | 'postProcess'
    | 'printNote'

export type MaterialSpecField = {
    id: MaterialSpecFieldId
    value: LocaleText
}

export type MaterialSpecDef = {
    id: MaterialSpecId
    process: MaterialProcess
    /** 화면·견적에 보이는 영문 표기 */
    name: string
    /** 견적 DB 소재명 매칭용 (소문자 비교) */
    matchNames: string[]
    summary: LocaleText
    fields: MaterialSpecField[]
}

export const MATERIAL_SPEC_IDS = [
    'pla',
    'abs',
    'petg',
    'pc',
    'tpu',
    'standard',
    'tough',
    'clear',
    'flexible',
] as const satisfies readonly MaterialSpecId[]

export const MATERIAL_SPECS: MaterialSpecDef[] = [
    {
        id: 'pla',
        process: 'fdm',
        name: 'PLA',
        matchNames: ['pla', 'pla+', 'pla plus'],
        summary: {
            ko: '출력이 쉽고 표면이 깔끔해 외관 시제품·교육용에 가장 많이 쓰입니다. 내열·내충격은 낮은 편입니다.',
            en: 'Easy to print with clean surfaces—most common for visual prototypes and education. Heat and impact resistance are modest.',
        },
        fields: [
            { id: 'heatDeflection', value: { ko: '약 55~60℃', en: 'About 55–60°C' } },
            { id: 'meltRange', value: { ko: '약 180~220℃', en: 'About 180–220°C' } },
            { id: 'nozzleTemp', value: { ko: '약 190~220℃', en: 'About 190–220°C' } },
            { id: 'bedTemp', value: { ko: '약 50~60℃', en: 'About 50–60°C' } },
            { id: 'strength', value: { ko: '경량·강성, 충격 시 부러지기 쉬움', en: 'Light and stiff; tends to snap under impact' } },
            { id: 'flexibility', value: { ko: '거의 없음 (경질)', en: 'Very low (rigid)' } },
            {
                id: 'postProcess',
                value: { ko: '사포·퍼티·도장 (아세톤 스무딩 어려움)', en: 'Sanding, filler, paint (acetone smoothing not practical)' },
            },
            {
                id: 'printNote',
                value: {
                    ko: '수축·뒤틀림이 적어 개방형 장비에서도 다루기 쉽습니다.',
                    en: 'Low shrinkage/warping—friendly on open-frame printers.',
                },
            },
        ],
    },
    {
        id: 'abs',
        process: 'fdm',
        name: 'ABS',
        matchNames: ['abs'],
        summary: {
            ko: '내열·내충격과 후가공성이 좋아 하우징·조립 시험에 적합합니다. 환기·챔버 관리가 중요합니다.',
            en: 'Good heat/impact resistance and post-processing for housings and assembly tests. Ventilation and chamber control matter.',
        },
        fields: [
            { id: 'heatDeflection', value: { ko: '약 90~100℃', en: 'About 90–100°C' } },
            { id: 'meltRange', value: { ko: '약 220~260℃', en: 'About 220–260°C' } },
            { id: 'nozzleTemp', value: { ko: '약 230~260℃', en: 'About 230–260°C' } },
            { id: 'bedTemp', value: { ko: '약 90~110℃', en: 'About 90–110°C' } },
            { id: 'strength', value: { ko: '내충격·인성 우수', en: 'Strong impact resistance and toughness' } },
            { id: 'flexibility', value: { ko: '낮음 (약간 인성)', en: 'Low (some toughness)' } },
            {
                id: 'postProcess',
                value: { ko: '연마·도장·아세톤 스무딩·접착에 적합', en: 'Sanding, paint, acetone smoothing, bonding' },
            },
            {
                id: 'printNote',
                value: {
                    ko: '수축·휨이 있어 밀폐형 챔버가 유리하고, 출력 시 환기가 필요합니다.',
                    en: 'Warping risk—enclosed chamber preferred; ventilate while printing.',
                },
            },
        ],
    },
    {
        id: 'petg',
        process: 'fdm',
        name: 'PETG',
        matchNames: ['petg'],
        summary: {
            ko: 'PLA보다 강하고 ABS보다 출력이 안정적인 균형형 기능 소재입니다.',
            en: 'A balanced functional filament—tougher than PLA, usually easier than ABS.',
        },
        fields: [
            { id: 'heatDeflection', value: { ko: '약 70~80℃', en: 'About 70–80°C' } },
            { id: 'meltRange', value: { ko: '약 220~250℃', en: 'About 220–250°C' } },
            { id: 'nozzleTemp', value: { ko: '약 230~250℃', en: 'About 230–250°C' } },
            { id: 'bedTemp', value: { ko: '약 70~85℃', en: 'About 70–85°C' } },
            { id: 'strength', value: { ko: '층간 접착·내충격 양호', en: 'Good layer adhesion and impact resistance' } },
            { id: 'flexibility', value: { ko: '약간 있음 (강성+인성)', en: 'Slight flex with toughness' } },
            {
                id: 'postProcess',
                value: { ko: '사포·도장 가능, 스트링 관리 필요', en: 'Sanding/paint OK; watch for stringing' },
            },
            {
                id: 'printNote',
                value: {
                    ko: '휨이 적어 개방형 장비에서도 비교적 안정적이며, 습기 관리가 중요합니다.',
                    en: 'Low warping on open frames; keep filament dry.',
                },
            },
        ],
    },
    {
        id: 'pc',
        process: 'fdm',
        name: 'PC',
        matchNames: ['pc', 'polycarbonate'],
        summary: {
            ko: 'FDM 중 상위권 내열·내충격 소재입니다. 고온 출력·수축 관리가 필요합니다.',
            en: 'Among the highest FDM heat/impact grades—needs high temps and warp control.',
        },
        fields: [
            { id: 'heatDeflection', value: { ko: '약 110~130℃', en: 'About 110–130°C' } },
            { id: 'nozzleTemp', value: { ko: '약 260~300℃', en: 'About 260–300°C' } },
            { id: 'bedTemp', value: { ko: '약 100~120℃', en: 'About 100–120°C' } },
            { id: 'strength', value: { ko: '최상위 내충격·강성', en: 'Top-tier impact and stiffness' } },
            { id: 'flexibility', value: { ko: '낮음 (고강성)', en: 'Low (high stiffness)' } },
            {
                id: 'surface',
                value: { ko: '투명 제형 가능, 치수 안정성 우수', en: 'Clear grades available; good dimensional stability' },
            },
            {
                id: 'printNote',
                value: {
                    ko: '밀폐형 챔버·고온 베드가 필요하며, 습기·수축 관리가 중요합니다.',
                    en: 'Needs enclosed chamber and hot bed; control moisture and shrinkage.',
                },
            },
        ],
    },
    {
        id: 'tpu',
        process: 'fdm',
        name: 'TPU',
        matchNames: ['tpu'],
        summary: {
            ko: '고무처럼 유연하고 충격·마모에 강한 탄성 소재입니다. 출력 설정에 더 신경이 갑니다.',
            en: 'Rubber-like flex with wear and impact absorption—more print-setting care needed.',
        },
        fields: [
            { id: 'meltRange', value: { ko: '약 210~240℃', en: 'About 210–240°C' } },
            { id: 'flexibility', value: { ko: '높음 (쇼어 A 수십~90대)', en: 'High (Shore A tens–90s)' } },
            { id: 'strength', value: { ko: '내마모·충격 흡수', en: 'Abrasion resistance and shock absorption' } },
            {
                id: 'printNote',
                value: {
                    ko: '유연 필라멘트라 인피드·속도 설정이 중요하고, 습기·UV 장기 노출에 주의합니다.',
                    en: 'Flexible feed needs careful speed/extrusion; watch moisture and long UV exposure.',
                },
            },
        ],
    },
    {
        id: 'standard',
        process: 'resin',
        name: 'Standard',
        matchNames: ['standard', 'standard resin', '기본', '표준'],
        summary: {
            ko: '표면·디테일이 뛰어나 외관 시제품·정밀 모형에 기본으로 선택합니다. 충격에는 약합니다.',
            en: 'Best surface/detail for visual prototypes and fine models. Brittle under impact.',
        },
        fields: [
            { id: 'surface', value: { ko: '매끄러운 표면·높은 디테일', en: 'Smooth surface, high detail' } },
            { id: 'strength', value: { ko: '경도·강성 양호, 취성(충격에 약함)', en: 'Stiff/hard; brittle under impact' } },
            { id: 'flexibility', value: { ko: '거의 없음', en: 'Very low' } },
            {
                id: 'postProcess',
                value: { ko: '세척(IPA 등)·2차 UV 경화·도장', en: 'Wash (e.g. IPA), UV post-cure, paint' },
            },
            {
                id: 'printNote',
                value: {
                    ko: '벽 두께 약 1mm 이상 권장. 속이 빈 형상은 배출 구멍이 필요합니다.',
                    en: 'Aim for ~1 mm+ walls; hollow parts need drain holes.',
                },
            },
        ],
    },
    {
        id: 'tough',
        process: 'resin',
        name: 'Tough',
        matchNames: ['tough', 'tough resin', '고강도'],
        summary: {
            ko: '내충격·체결에 강한 기능성 레진입니다. 조립·스냅핏 시험에 적합합니다.',
            en: 'Functional resin with better impact and fastening—good for snap-fits and assembly tests.',
        },
        fields: [
            { id: 'surface', value: { ko: '레진급 정밀 표면 유지', en: 'Keeps resin-level surface precision' } },
            { id: 'strength', value: { ko: '내충격·인장 강도 우수', en: 'Stronger impact and tensile performance' } },
            { id: 'flexibility', value: { ko: '약간 인성 (ABS에 가까운 목표)', en: 'Some toughness (ABS-like goal)' } },
            {
                id: 'postProcess',
                value: { ko: '세척·후경화 조건이 물성에 영향', en: 'Wash/post-cure settings affect properties' },
            },
            {
                id: 'printNote',
                value: {
                    ko: '고온 환경에서는 물러질 수 있어, 열이 많은 부품은 별도 내열 검토가 필요합니다.',
                    en: 'Can soften in heat—review heat-resistant options for hot environments.',
                },
            },
        ],
    },
    {
        id: 'clear',
        process: 'resin',
        name: 'Clear',
        matchNames: ['clear', 'clear resin', '투명'],
        summary: {
            ko: '투명·시인성이 필요한 커버·창·관측 부품에 맞습니다. 연마·코팅 후 투명도가 올라갑니다.',
            en: 'For clear covers, windows, and inspection parts—polishing/coating improves clarity.',
        },
        fields: [
            { id: 'surface', value: { ko: '높은 투명도·시인성', en: 'High clarity and visibility' } },
            { id: 'strength', value: { ko: 'Standard에 가까운 경질', en: 'Rigid, similar to Standard' } },
            { id: 'flexibility', value: { ko: '거의 없음', en: 'Very low' } },
            {
                id: 'postProcess',
                value: { ko: '연마·코팅으로 유리에 가까운 투명도', en: 'Polish/coat for glass-like clarity' },
            },
            {
                id: 'printNote',
                value: {
                    ko: 'UV·열에 따라 변색될 수 있어 장기 야외·강UV 환경은 주의합니다.',
                    en: 'May yellow under UV/heat—careful with long outdoor/strong UV use.',
                },
            },
        ],
    },
    {
        id: 'flexible',
        process: 'resin',
        name: 'Flexible',
        matchNames: ['flexible', 'flexible resin', '연성', '플렉서블'],
        summary: {
            ko: '고무에 가까운 변형·완충이 가능한 연성 레진입니다. 경도는 제품·경화 조건에 따라 달라집니다.',
            en: 'Rubber-like flex and cushioning—hardness varies by grade and cure.',
        },
        fields: [
            { id: 'flexibility', value: { ko: '높음 (고무형 변형)', en: 'High (rubber-like deformation)' } },
            { id: 'strength', value: { ko: '충격 흡수·압입 적합', en: 'Shock absorption; press-fit friendly' } },
            { id: 'surface', value: { ko: '레진 디테일 + 유연 표면', en: 'Resin detail with flexible surface' } },
            {
                id: 'postProcess',
                value: { ko: '세척·경화·보관 조건이 경도에 영향', en: 'Wash/cure/storage affect hardness' },
            },
            {
                id: 'printNote',
                value: {
                    ko: '그립·완충·밀봉 부품에 적합하며, 장기 하중 변형(크리프)에 유의합니다.',
                    en: 'Good for grips, pads, seals; watch creep under long load.',
                },
            },
        ],
    },
]

const BY_ID = new Map(MATERIAL_SPECS.map((m) => [m.id, m]))

export function getMaterialSpec(id: MaterialSpecId): MaterialSpecDef | undefined {
    return BY_ID.get(id)
}

export function localeText(text: LocaleText, locale: string): string {
    return locale.startsWith('en') ? text.en : text.ko
}

/** 견적에 선택된 소재명 → 스펙 ID */
export function resolveMaterialSpecId(materialName: string | null | undefined): MaterialSpecId | null {
    if (!materialName?.trim()) return null
    const raw = materialName.trim().toLowerCase()
    const compact = raw.replace(/\s+/g, '')

    for (const spec of MATERIAL_SPECS) {
        if (spec.id === raw || spec.id === compact) return spec.id
        for (const alias of spec.matchNames) {
            const a = alias.toLowerCase()
            if (raw === a || compact === a.replace(/\s+/g, '')) return spec.id
            if (raw.includes(a) || compact.includes(a.replace(/\s+/g, ''))) return spec.id
        }
    }
    return null
}

export function materialAnchorId(id: MaterialSpecId): string {
    return `material-${id}`
}
