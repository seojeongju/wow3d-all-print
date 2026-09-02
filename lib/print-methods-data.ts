import type { LucideIcon } from 'lucide-react'
import {
    Printer,
    Droplets,
    Zap,
    Layers,
    Gauge,
    Sparkles,
    Shield,
    Clock,
    Coins,
    Target,
    BookOpen,
    Calculator,
    Boxes,
    Paintbrush,
} from 'lucide-react'

export type PrintMethodSubtype = {
    name: string
    description: string
}

export type PrintMethod = {
    id: string
    name: string
    fullName: string
    nameKo: string
    icon: LucideIcon
    accent: string
    iconBg: string
    gradient: string
    category: 'wow3d' | 'reference'
    serviceHref?: string
    guideHref?: string
    principle: string
    materials: string[]
    strengths: string[]
    weaknesses: string[]
    uses: string[]
    specs: { label: string; value: string; icon: LucideIcon }[]
    subtypes?: PrintMethodSubtype[]
}

export const WOW3D_PRINT_METHODS: PrintMethod[] = [
    {
        id: 'fdm',
        name: 'FDM',
        fullName: 'Fused Deposition Modeling',
        nameKo: '용융 적층 조형',
        category: 'wow3d',
        icon: Printer,
        accent: 'text-amber-400',
        iconBg: 'bg-amber-400/15 border-amber-400/25',
        gradient: 'from-amber-500/15 via-amber-500/5 to-transparent',
        serviceHref: '/services/fdm',
        guideHref: '/guides/fdm-vs-sla-vs-dlp',
        principle:
            '필라멘트(고체)를 노즐에서 가열·용융한 뒤 베드 위에 층층이 쌓아 올리는 방식입니다. 가장 널리 쓰이는 3D 프린팅 기술입니다.',
        materials: ['PLA', 'ABS', 'PETG', 'TPU', '나일론', 'PC'],
        strengths: ['비용 대비 효율 우수', '강한 기계적 성능·내구성', '소재 선택지 다양', '기능 시험·조립 부품에 적합'],
        weaknesses: ['레이어 선(층선)이 보일 수 있음', '표면 정밀도는 SLA·DLP보다 낮음'],
        uses: ['시제품·프로토타입', '기능 시험·내구 테스트', '조립용 부품·툴링', '교육·취미 제작'],
        specs: [
            { label: '표면 품질', value: '보통', icon: Sparkles },
            { label: '내구성', value: '높음', icon: Shield },
            { label: '제작 속도', value: '빠름', icon: Clock },
            { label: '비용', value: '경제적', icon: Coins },
        ],
    },
    {
        id: 'sla',
        name: 'SLA',
        fullName: 'Stereolithography',
        nameKo: '광조형 (스테레오리소그래피)',
        category: 'wow3d',
        icon: Droplets,
        accent: 'text-cyan-400',
        iconBg: 'bg-cyan-400/15 border-cyan-400/25',
        gradient: 'from-cyan-500/15 via-cyan-500/5 to-transparent',
        serviceHref: '/services/sla',
        guideHref: '/guides/fdm-vs-sla-vs-dlp',
        principle:
            '액상 광경화 레진 위를 UV 레이저가 스캔하며 선택적으로 경화시켜 한 층씩 쌓는 방식입니다. 표면이 매끄럽고 디테일이 뛰어납니다.',
        materials: ['Standard 레진', 'Tough 레진', 'Clear 레진', 'Flexible 레진'],
        strengths: ['매끄러운 표면·높은 디테일', '복잡한 형상·미세 구조 표현', '치과·보석·시각 모형에 최적'],
        weaknesses: ['레진 단가·후처리(세척·2차 경화) 필요', '내충격·내열은 소재에 따라 제한'],
        uses: ['디자인 검증·시각 프로토타입', '보석·치과·의료 모형', '마스터·실리콘 몰드 원형', '정밀 시제품'],
        specs: [
            { label: '표면 품질', value: '매우 높음', icon: Sparkles },
            { label: '내구성', value: '소재별', icon: Shield },
            { label: '제작 속도', value: '보통', icon: Clock },
            { label: '비용', value: '중간', icon: Coins },
        ],
    },
    {
        id: 'dlp',
        name: 'DLP',
        fullName: 'Digital Light Processing',
        nameKo: '디지털 광조형',
        category: 'wow3d',
        icon: Zap,
        accent: 'text-violet-400',
        iconBg: 'bg-violet-400/15 border-violet-400/25',
        gradient: 'from-violet-500/15 via-violet-500/5 to-transparent',
        serviceHref: '/services/sla',
        guideHref: '/guides/fdm-vs-sla-vs-dlp',
        principle:
            '광원(프로젝터·UV 패널)으로 한 레이어 전체를 동시에 비춰 레진을 경화시킵니다. 레이어당 경화 시간이 짧아 SLA 대비 빠른 제작이 가능합니다.',
        materials: ['Standard·Tough·Clear·Flexible 레진'],
        strengths: ['레이어당 경화 속도 빠름', '동일 부품 다량 제작에 유리', '정밀도·표면 품질 우수'],
        weaknesses: ['빌드 영역이 기기별로 제한', '레진 저장·관리 필요'],
        uses: ['치과·보석·소형 정밀 부품', '동일 부품 소량·다량 생산', '미세한 디테일이 중요한 모형'],
        specs: [
            { label: '표면 품질', value: '매우 높음', icon: Sparkles },
            { label: '내구성', value: '소재별', icon: Shield },
            { label: '제작 속도', value: '빠름', icon: Clock },
            { label: '비용', value: '중간', icon: Coins },
        ],
    },
]

/** WOW3D에서 직접 제공하지 않지만 비교·이해를 위한 참고 공정 */
export const REFERENCE_PRINT_METHODS: PrintMethod[] = [
    {
        id: 'powder-sintering',
        name: 'SLS / SLM / DMLS',
        fullName: 'Powder Bed Fusion (분말 소결·용융)',
        nameKo: '분말 소결 방식',
        category: 'reference',
        icon: Boxes,
        accent: 'text-rose-400',
        iconBg: 'bg-rose-400/15 border-rose-400/25',
        gradient: 'from-rose-500/15 via-rose-500/5 to-transparent',
        principle:
            '분말 소재를 얇게 펴고 레이저로 선택적으로 소결·용융해 층을 쌓는 방식입니다. 서포트 없이 복잡한 형상을 만들 수 있으며, 플라스틱(SLS)과 금속(SLM·DMLS) 모두에 적용됩니다.',
        materials: ['나일론(PA12)', 'TPU', '알루미늄', '티타늄', '스테인리스', '인코넬 등 금속 합금'],
        strengths: [
            '서포트 없이 복잡한 내부 구조·언더컷 구현',
            '기능 시험용 강도·내열성 우수 (소재별)',
            '소량·다품종 금속 부품 제작에 활용',
            '양산 전 검증 단계에서 널리 사용',
        ],
        weaknesses: [
            '장비·운영 비용이 FDM·레진 대비 높음',
            '표면 거칠기·치수 정밀도는 후가공에 따라 달라짐',
            '금속 공정은 투입·안전·후처리 요구가 큼',
        ],
        uses: ['기능 시제품·소량 양산', '금속 부품·항공·의료', '힌지·클립 등 조립 구조', '내장 채널·격자 구조'],
        specs: [
            { label: '표면 품질', value: '소재·후처리별', icon: Sparkles },
            { label: '내구성', value: '매우 높음', icon: Shield },
            { label: '제작 속도', value: '보통', icon: Clock },
            { label: '비용', value: '높음', icon: Coins },
        ],
        subtypes: [
            {
                name: 'SLS',
                description:
                    'Selective Laser Sintering. 나일론·TPU 등 분말을 레이저로 소결합니다. 플라스틱 기능 부품·시제품에 많이 쓰입니다.',
            },
            {
                name: 'SLM',
                description:
                    'Selective Laser Melting. 금속 분말을 완전 용융해 치밀한 금속 부품을 만듭니다. 항공·의료·자동차 금속 부품에 활용됩니다.',
            },
            {
                name: 'DMLS',
                description:
                    'Direct Metal Laser Sintering. EOS 등에서 쓰는 금속 분말 레이저 공정 명칭으로, SLM과 유사하게 금속 부품을 제작합니다.',
            },
        ],
    },
    {
        id: 'material-jetting',
        name: 'PolyJet / MJP',
        fullName: 'Material Jetting (재료 분사)',
        nameKo: '재료 분사 방식',
        category: 'reference',
        icon: Paintbrush,
        accent: 'text-sky-400',
        iconBg: 'bg-sky-400/15 border-sky-400/25',
        gradient: 'from-sky-500/15 via-sky-500/5 to-transparent',
        principle:
            '노즐에서 액상 소재를 미세하게 분사·경화시키며 층을 쌓는 방식입니다. 한 번에 여러 소재·색상을 조합할 수 있어 시각 모형·고해상도 외관 시제품에 강점이 있습니다.',
        materials: ['아크릴계 수지', '고무형 소재', '투명·다색 수지', '의료·시뮬레이션용 소재'],
        strengths: [
            '매우 높은 해상도와 매끄러운 표면',
            '멀티머티리얼·풀컬러 출력 가능 (PolyJet)',
            '디자인 검증·의료·치과 모형에 적합',
            '미세한 라벨·텍스처 표현 우수',
        ],
        weaknesses: [
            '대형·대량 생산 비용이 높을 수 있음',
            '기계적 강도는 FDM·금속 공정보다 제한적',
            '소재·장비 종속성이 큼',
        ],
        uses: ['고해상도 외관 시제품', '멀티컬러·오버몰드 모형', '치과·의료 가이드·모형', '디자인 리뷰·마케팅 샘플'],
        specs: [
            { label: '표면 품질', value: '최상', icon: Sparkles },
            { label: '내구성', value: '용도별', icon: Shield },
            { label: '제작 속도', value: '보통', icon: Clock },
            { label: '비용', value: '높음', icon: Coins },
        ],
        subtypes: [
            {
                name: 'PolyJet',
                description:
                    'Stratasys 계열 재료 분사 공정. 한 빌드에서 여러 소재·색을 동시에 분사해 고해상도 다색 모형을 만듭니다.',
            },
            {
                name: 'MJP',
                description:
                    'Multi Jet Printing. 3D Systems 등의 분사 기반 공정으로, 왁스·수지 소재의 정밀 시각 모형·주조 패턴에 활용됩니다.',
            },
        ],
    },
]

/** @deprecated WOW3D_PRINT_METHODS 사용 권장 */
export const PRINT_METHODS = WOW3D_PRINT_METHODS

export const PRINT_METHOD_FAQS = [
    {
        q: '기능성 시제품에는 FDM과 SLA 중 어떤 방식이 더 적합한가요?',
        a: '조립성 확인, 내구성 테스트, 기능 시험이 목적이라면 일반적으로 FDM이 더 적합합니다. 외관과 디테일이 더 중요하다면 SLA 또는 DLP가 유리합니다.',
    },
    {
        q: 'SLA와 DLP는 비슷해 보이는데 어떤 차이가 있나요?',
        a: '둘 다 레진 기반 정밀 공정이지만, SLA는 레이저로 한 점씩 경화하고 DLP는 한 레이어를 동시에 경화합니다. 같은 소형 정밀 부품을 반복 제작할 때는 DLP가 유리할 수 있습니다.',
    },
    {
        q: '표면 품질이 가장 중요한 제품은 어떤 3D 프린팅 방식을 선택해야 하나요?',
        a: '매끄러운 표면과 미세한 디테일이 중요하다면 SLA 또는 DLP가 적합합니다. FDM은 상대적으로 경제적이지만 층선이 보일 수 있습니다.',
    },
    {
        q: 'SLS·SLM·DMLS는 FDM과 어떻게 다른가요?',
        a: '분말 소결·용융 방식은 서포트 없이 복잡한 형상과 금속 부품을 만들 수 있지만, 장비·비용이 높은 편입니다. 일반적인 시제품·프로토타입은 FDM·SLA·DLP가 더 경제적인 경우가 많습니다.',
    },
    {
        q: 'PolyJet과 SLA의 차이는 무엇인가요?',
        a: '둘 다 높은 해상도를 내지만, PolyJet/MJP는 재료를 분사하는 방식이라 멀티컬러·멀티머티리얼 표현에 강하고, SLA는 레진을 광경화하는 방식으로 정밀 디테일·투명 소재에 많이 쓰입니다.',
    },
]

export const PRINT_METHOD_STATS = [
    { label: 'WOW3D 제공', value: '3' },
    { label: '참고 공정', value: '2' },
    { label: '맞춤 견적', value: '실시간' },
]

export const PRINT_METHOD_JOURNEY = [
    { step: '01', title: '공정 비교', desc: 'FDM·SLA·DLP 특성과 용도 확인', icon: Layers },
    { step: '02', title: '소재·옵션 선택', desc: '목적에 맞는 소재와 후가공 결정', icon: Target },
    { step: '03', title: '자동견적', desc: '파일 업로드 후 가격·납기 확인', icon: Calculator },
]

export const PRINT_METHOD_COMPARE_ROWS = [
    { label: '추천 용도', fdm: '기능 시제품·조립', sla: '외관·정밀 모형', dlp: '소형 정밀·반복' },
    { label: '표면 품질', fdm: '보통', sla: '매우 높음', dlp: '매우 높음' },
    { label: '기계적 강도', fdm: '높음', sla: '소재별', dlp: '소재별' },
    { label: '비용 효율', fdm: '우수', sla: '보통', dlp: '보통' },
]

export const REFERENCE_METHOD_COMPARE_ROWS = [
    { label: '원리', powder: '분말 레이저 소결·용융', jetting: '액상 소재 미세 분사' },
    { label: '대표 공정', powder: 'SLS · SLM · DMLS', jetting: 'PolyJet · MJP' },
    { label: '강점', powder: '서포트 없음·금속 가능', jetting: '고해상도·멀티컬러' },
    { label: 'WOW3D', powder: '정보 안내', jetting: '정보 안내' },
]

/** 가이드 페이지용 5개 공정 통합 비교 */
export const ALL_PRINT_METHOD_COMPARE_ROWS = [
    {
        label: '추천 용도',
        fdm: '기능 시제품·조립',
        sla: '외관·정밀 모형',
        dlp: '소형 정밀·반복',
        powder: '금속·복잡 형상·소량 양산',
        jetting: '고해상도 외관·멀티컬러',
    },
    {
        label: '표면 품질',
        fdm: '보통 (층선 가능)',
        sla: '매우 높음',
        dlp: '매우 높음',
        powder: '소재·후처리별',
        jetting: '최상',
    },
    {
        label: '기계적 강도',
        fdm: '높음',
        sla: '소재별',
        dlp: '소재별',
        powder: '매우 높음 (금속 가능)',
        jetting: '용도별 (제한적)',
    },
    {
        label: '서포트',
        fdm: '필요',
        sla: '필요',
        dlp: '필요',
        powder: '불필요',
        jetting: '필요',
    },
    {
        label: '비용 효율',
        fdm: '우수',
        sla: '보통',
        dlp: '보통',
        powder: '높음',
        jetting: '높음',
    },
    {
        label: 'WOW3D 제공',
        fdm: '제공',
        sla: '제공',
        dlp: '제공',
        powder: '참고 안내',
        jetting: '참고 안내',
    },
] as const

export const GUIDE_PRINT_METHOD_SUMMARIES = [
    ...WOW3D_PRINT_METHODS.map((m) => ({
        id: m.id,
        name: m.name,
        nameKo: m.nameKo,
        category: m.category as 'wow3d',
        summary: m.principle,
    })),
    ...REFERENCE_PRINT_METHODS.map((m) => ({
        id: m.id,
        name: m.name,
        nameKo: m.nameKo,
        category: m.category as 'reference',
        summary: m.principle,
        subtypes: m.subtypes,
    })),
]

export const PRINT_METHOD_FEATURED = [
    {
        href: '/guides/fdm-vs-sla-vs-dlp',
        eyebrow: 'Guide',
        title: '3D 프린팅 공정 비교 가이드',
        desc: 'FDM·SLA·DLP와 SLS/SLM/DMLS, PolyJet/MJP 등 주요 공정의 차이와 추천 용도를 정리했습니다.',
        icon: BookOpen,
    },
    {
        href: '/guides/3d-printing-quote-guide',
        eyebrow: 'Pricing',
        title: '견적 계산 방식 가이드',
        desc: '레이어 높이, 소재, 인필, 후가공이 가격과 시간에 어떤 영향을 주는지 설명합니다.',
        icon: Gauge,
    },
]
