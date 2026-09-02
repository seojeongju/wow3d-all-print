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
} from 'lucide-react'

export type PrintMethod = {
    id: string
    name: string
    fullName: string
    nameKo: string
    icon: LucideIcon
    accent: string
    iconBg: string
    gradient: string
    serviceHref: string
    guideHref: string
    principle: string
    materials: string[]
    strengths: string[]
    weaknesses: string[]
    uses: string[]
    specs: { label: string; value: string; icon: LucideIcon }[]
}

export const PRINT_METHODS: PrintMethod[] = [
    {
        id: 'fdm',
        name: 'FDM',
        fullName: 'Fused Deposition Modeling',
        nameKo: '용융 적층 조형',
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
]

export const PRINT_METHOD_STATS = [
    { label: '핵심 공정', value: '3' },
    { label: '소재 옵션', value: '10+' },
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

export const PRINT_METHOD_FEATURED = [
    {
        href: '/guides/fdm-vs-sla-vs-dlp',
        eyebrow: 'Guide',
        title: 'FDM vs SLA vs DLP 비교 가이드',
        desc: '기능성 시제품, 외관 모델, 정밀 부품에 어떤 공정이 맞는지 질문형으로 정리했습니다.',
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
