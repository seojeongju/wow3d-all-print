import type { LucideIcon } from 'lucide-react'
import {
    BookOpen,
    Camera,
    Calculator,
    TrendingDown,
    Box,
    Layers,
    FileCheck,
    Clock,
    ClipboardCheck,
    Grid3x3,
    AlertTriangle,
    Ruler,
    HelpCircle,
    Crosshair,
    Scissors,
    GraduationCap,
    Droplets,
    FlaskConical,
    Eye,
    HardDrive,
    Flame,
    Gem,
    Sparkles,
    Wrench,
    Scale,
} from 'lucide-react'
import { NEW_SEO_GUIDES } from '@/lib/seo-guide-pages'

export type GuideHubItem = {
    href: string
    title: string
    desc: string
    icon: LucideIcon
    accent: string
    readMin: number
}

export type GuideHubSection = {
    id: string
    title: string
    subtitle: string
    icon: LucideIcon
    gradient: string
    iconBg: string
    iconColor: string
    items: GuideHubItem[]
}

const iconBySlug: Record<string, { icon: LucideIcon; accent: string }> = {
    'choosing-infill-density': { icon: Grid3x3, accent: 'text-cyan-400' },
    'fixing-stl-file-errors': { icon: AlertTriangle, accent: 'text-amber-400' },
    'minimum-wall-thickness': { icon: Ruler, accent: 'text-orange-400' },
    'why-support-costs': { icon: HelpCircle, accent: 'text-rose-400' },
    '3d-printing-tolerances': { icon: Crosshair, accent: 'text-violet-400' },
    'splitting-large-3d-prints': { icon: Scissors, accent: 'text-indigo-400' },
    'graduation-project-checklist': { icon: GraduationCap, accent: 'text-emerald-400' },
}

export const GUIDE_HUB_SECTIONS: GuideHubSection[] = [
    {
        id: 'basics',
        title: '기본 가이드',
        subtitle: '견적·공정·파일 준비의 출발점',
        icon: BookOpen,
        gradient: 'from-teal-500/15 via-teal-500/5 to-transparent',
        iconBg: 'bg-teal-400/15 border-teal-400/25',
        iconColor: 'text-teal-400',
        items: [
            { href: '/guides/photo-to-3d-printing-quote', title: '사진(이미지)으로 3D 프린팅 견적', desc: '3D 파일 없이 사진(이미지)→AI 3D→자동견적·주문 절차', icon: Camera, accent: 'text-indigo-400', readMin: 5 },
            { href: '/guides/3d-printing-quote-guide', title: '3D프린팅 비용 계산 방법', desc: '견적 산출 기준과 가격·시간에 영향을 주는 요소', icon: Calculator, accent: 'text-teal-400', readMin: 4 },
            { href: '/guides/how-to-reduce-3d-printing-cost', title: '3D프린팅 가격을 줄이는 방법', desc: '레이어·인필·서포트·소재로 비용 절감', icon: TrendingDown, accent: 'text-emerald-400', readMin: 5 },
            { href: '/guides/fdm-vs-sla-vs-dlp', title: '3D 프린팅 공정 비교', desc: 'FDM·SLA·DLP·SLS·PolyJet 등 출력 방식 비교', icon: Box, accent: 'text-blue-400', readMin: 8 },
            { href: '/guides/pla-vs-abs-vs-petg', title: 'PLA와 PETG 차이', desc: 'FDM 주요 필라멘트 비교', icon: Layers, accent: 'text-amber-400', readMin: 5 },
            { href: '/guides/3d-printing-file-preparation', title: '파일 준비 가이드', desc: '업로드 전 형식, 단위, 메쉬 오류 점검', icon: FileCheck, accent: 'text-sky-400', readMin: 4 },
            { href: '/guides/3d-printing-turnaround-time', title: '시제품 제작 기간', desc: '출력·후처리·검수·배송 납기 안내', icon: Clock, accent: 'text-violet-400', readMin: 3 },
        ],
    },
    {
        id: 'practical',
        title: '실무 체크',
        subtitle: '출력 전 반드시 확인할 체크리스트',
        icon: ClipboardCheck,
        gradient: 'from-indigo-500/15 via-indigo-500/5 to-transparent',
        iconBg: 'bg-indigo-400/15 border-indigo-400/25',
        iconColor: 'text-indigo-400',
        items: NEW_SEO_GUIDES.filter((g) =>
            [
                'choosing-infill-density',
                'fixing-stl-file-errors',
                'minimum-wall-thickness',
                'why-support-costs',
                '3d-printing-tolerances',
                'splitting-large-3d-prints',
                'graduation-project-checklist',
            ].includes(g.slug)
        ).map((g) => {
            const meta = iconBySlug[g.slug] ?? { icon: Wrench, accent: 'text-white/60' }
            return {
                href: g.path,
                title: g.title,
                desc: g.description,
                icon: meta.icon,
                accent: meta.accent,
                readMin: 4,
            }
        }),
    },
    {
        id: 'material-compare',
        title: '소재 비교',
        subtitle: '필라멘트·레진 계열 한눈에 비교',
        icon: Scale,
        gradient: 'from-violet-500/15 via-violet-500/5 to-transparent',
        iconBg: 'bg-violet-400/15 border-violet-400/25',
        iconColor: 'text-violet-400',
        items: [
            { href: '/guides/pla-vs-abs-vs-petg', title: 'PLA vs ABS vs PETG', desc: 'FDM 주요 필라멘트 비교', icon: Layers, accent: 'text-amber-400', readMin: 5 },
            { href: '/guides/standard-vs-tough-vs-clear-vs-flexible-resin', title: 'Standard vs Tough vs Clear vs Flexible', desc: 'SLA·DLP 주요 레진 비교', icon: Droplets, accent: 'text-cyan-400', readMin: 5 },
        ],
    },
    {
        id: 'by-use-case',
        title: '용도별 소재 추천',
        subtitle: '목적에 맞는 소재를 빠르게 선택',
        icon: Sparkles,
        gradient: 'from-rose-500/15 via-rose-500/5 to-transparent',
        iconBg: 'bg-rose-400/15 border-rose-400/25',
        iconColor: 'text-rose-400',
        items: [
            { href: '/guides/best-materials-for-3d-printing-prototypes', title: '시제품용 소재 추천', desc: '외관 확인, 기능 검토, 조립 테스트 기준 추천', icon: FlaskConical, accent: 'text-teal-400', readMin: 4 },
            { href: '/guides/best-materials-for-transparent-3d-printed-parts', title: '투명 부품용 소재 추천', desc: '투명 커버, 관찰창, 시인성 부품 기준 추천', icon: Eye, accent: 'text-cyan-400', readMin: 4 },
            { href: '/guides/best-materials-for-3d-printed-housings-and-cases', title: '하우징·케이스용 소재 추천', desc: '전자기기 하우징, 보호 케이스, 외장 커버 기준 추천', icon: HardDrive, accent: 'text-slate-300', readMin: 4 },
            { href: '/guides/best-materials-for-heat-resistant-and-impact-resistant-parts', title: '내열·내충격 부품용 소재 추천', desc: '기능성 부품과 열·충격 환경 기준 추천', icon: Flame, accent: 'text-orange-400', readMin: 4 },
            { href: '/guides/best-materials-for-miniatures-and-figurines', title: '정밀 모형·피규어용 소재 추천', desc: '미니어처, 피규어, 디오라마용 정밀 소재 추천', icon: Gem, accent: 'text-pink-400', readMin: 4 },
        ],
    },
]

export const GUIDE_HUB_STATS = [
    { label: '가이드', value: '20+' },
    { label: '주제', value: '4' },
    { label: '평균 읽기', value: '4분' },
]

export const GUIDE_HUB_JOURNEY = [
    { step: '01', title: '가이드 탐색', desc: '견적·소재·파일 준비 주제 선택', icon: BookOpen },
    { step: '02', title: '체크리스트 확인', desc: '실무 팁으로 오류·비용 절감', icon: ClipboardCheck },
    { step: '03', title: '자동견적 시작', desc: 'STL 업로드 또는 AI 3D로 견적', icon: Calculator },
]
