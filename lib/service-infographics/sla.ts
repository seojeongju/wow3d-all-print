/**
 * SLA·레진 출력 서비스 페이지 인포그래픽 데이터
 * 레진 특성은 레진 비교 가이드, 공정 특성은 출력 방식 비교표에 있는 내용 기준
 */

import type { ServiceInfographicContent } from './types'

const KO: ServiceInfographicContent = {
    stats: [
        { value: '4종', label: '레진', sub: 'Standard · Tough · Clear · Flexible' },
        { value: '0.6mm', label: '최소 벽 두께', sub: '레진 권장 기준' },
        { value: '세척·경화', label: '후처리 포함', sub: '출력부터 일관 진행' },
        { value: '3~7일', label: '평균 수령', sub: '주문 확정 후 기준' },
    ],
    scope: {
        heading: '레진 출력이 빛나는 작업',
        items: [
            { icon: 'eye', title: '디자인 검증', body: '매끄러운 표면으로 실제 제품에 가까운 외관을 확인합니다.' },
            { icon: 'focus', title: '정밀 시제품', body: '복잡한 형상과 미세 구조까지 표현합니다.' },
            { icon: 'mesh', title: '마스터 · 몰드 원형', body: '실리콘 몰드용 원형처럼 표면이 중요한 원본을 만듭니다.' },
            { icon: 'finish', title: '보석 · 치과 모형', body: '작고 정교한 디테일이 필요한 모형에 적합합니다.' },
        ],
    },
    process: {
        eyebrow: 'How Resin Works',
        heading: '빛으로 레진을 굳혀 한 층씩 쌓습니다',
        body: '출력 뒤 세척·2차 경화까지 거쳐야 레진 출력물이 완성됩니다. 이 후처리까지 함께 진행합니다.',
        startLabel: '여기서 시작',
        outputLabel: '결과물',
        steps: [
            {
                icon: 'resin',
                title: '레진 선택',
                body: '외관은 Standard, 기능 시험은 Tough, 투명은 Clear, 유연은 Flexible.',
                output: '레진 확정',
            },
            {
                icon: 'sun',
                title: '광경화 적층',
                body: 'SLA는 레이저로 한 점씩, DLP는 한 레이어를 동시에 경화합니다.',
                output: '출력물',
            },
            {
                icon: 'finish',
                title: '세척 · 2차 경화',
                body: '남은 레진을 세척하고 2차 경화로 물성을 마무리합니다.',
                output: '후처리 완료',
            },
            {
                icon: 'delivery',
                title: '서포트 정리 · 검수',
                body: '서포트 자국을 정리하고 치수·외관을 확인한 뒤 발송합니다.',
                output: '평균 3~7일 수령',
            },
        ],
    },
    match: {
        eyebrow: 'Resin',
        heading: '용도에 맞는 레진 고르기',
        body: '외관 중심이면 Standard, 기능 시험이면 Tough, 투명 부품은 Clear, 완충이 필요하면 Flexible이 맞는 경우가 많습니다.',
        metrics: ['표면 · 디테일', '강도 · 내충격', '투명도', '유연성'],
        note: '막대는 레진 비교 가이드의 일반적 경향을 옮긴 것이며, 형상·두께·후처리에 따라 달라질 수 있습니다.',
        cards: [
            {
                purpose: '시각 프로토타입',
                method: 'Standard',
                materials: '경제적',
                why: '표면 품질과 디테일 표현이 좋습니다. 기능성 하중에는 한계가 있습니다.',
                scores: [5, 2, 1, 1],
                tone: 'sky',
            },
            {
                purpose: '조립 · 기능 시험',
                method: 'Tough',
                materials: '내구성',
                why: '강도·내충격이 좋아 체결·조립 검토에 적합합니다. 단가가 오를 수 있습니다.',
                scores: [4, 5, 1, 2],
                tone: 'teal',
            },
            {
                purpose: '커버 · 창 · 관찰 부품',
                method: 'Clear',
                materials: '투명',
                why: '후처리를 거치면 높은 투명도를 얻을 수 있습니다.',
                scores: [4, 3, 5, 1],
                tone: 'violet',
            },
            {
                purpose: '그립 · 완충 부품',
                method: 'Flexible',
                materials: '유연',
                why: '변형을 허용하고 충격을 흡수합니다. 경도·보관 조건의 영향을 받습니다.',
                scores: [3, 3, 1, 5],
                tone: 'teal',
            },
        ],
    },
    team: {
        eyebrow: 'SLA vs DLP',
        heading: 'SLA와 DLP, 경화 방식이 다릅니다',
        body: '둘 다 레진을 빛으로 굳히는 정밀 공정이며 같은 레진을 씁니다. 빛을 비추는 방식에 따라 속도와 장비 특성이 달라집니다.',
        chipIcon: 'sun',
        groups: [
            { label: 'SLA', files: ['UV 레이저', '점 단위 스캔'], result: '정밀 디테일 · 외관 모형' },
            { label: 'DLP', files: ['광원 투사', '레이어 동시 경화'], result: '소형 부품 반복 제작' },
        ],
        tipsHeading: '정밀 부품 출력 팁',
        tipsIcon: 'unit',
        tipIcons: ['unit', 'wall', 'support'],
        tips: [
            '조립 부품은 공차 가이드를 보고 여유 두기',
            '최소 벽 두께 0.6mm 이상 확보하기',
            '서포트 자국이 남으면 안 되는 면 정해 두기',
        ],
    },
}

const EN: ServiceInfographicContent = {
    stats: [
        { value: '4', label: 'Resins', sub: 'Standard · Tough · Clear · Flexible' },
        { value: '0.6mm', label: 'Minimum wall', sub: 'Recommended for resin' },
        { value: 'Wash·cure', label: 'Post-processing', sub: 'Handled end to end' },
        { value: '3–7 days', label: 'Typical delivery', sub: 'After order confirmation' },
    ],
    scope: {
        heading: 'Where resin printing shines',
        items: [
            { icon: 'eye', title: 'Design validation', body: 'Smooth surfaces close to the final product look.' },
            { icon: 'focus', title: 'Precision prototypes', body: 'Complex shapes and fine micro-features.' },
            { icon: 'mesh', title: 'Master patterns', body: 'Originals for silicone molds where the surface matters.' },
            { icon: 'finish', title: 'Jewelry · dental models', body: 'Small models that demand intricate detail.' },
        ],
    },
    process: {
        eyebrow: 'How Resin Works',
        heading: 'Light cures resin, one layer at a time',
        body: 'Resin parts are finished only after washing and post-curing — we handle that too.',
        startLabel: 'Start here',
        outputLabel: 'Output',
        steps: [
            { icon: 'resin', title: 'Choose resin', body: 'Standard for looks, Tough for tests, Clear for transparency, Flexible for give.', output: 'Resin selected' },
            { icon: 'sun', title: 'Photo-cure layers', body: 'SLA cures point by point with a laser; DLP cures a whole layer at once.', output: 'Printed part' },
            { icon: 'finish', title: 'Wash · post-cure', body: 'Excess resin is washed off and the part is post-cured.', output: 'Post-processed' },
            { icon: 'delivery', title: 'Supports · inspection', body: 'Support marks are cleaned up and the part is checked before shipping.', output: 'Typically 3–7 days' },
        ],
    },
    match: {
        eyebrow: 'Resin',
        heading: 'Pick the resin for the job',
        body: 'Standard for appearance, Tough for functional tests, Clear for transparent parts, Flexible for cushioning.',
        metrics: ['Surface · detail', 'Strength', 'Clarity', 'Flexibility'],
        note: 'Bars reflect general tendencies from our resin guide; results vary with geometry, thickness, and post-processing.',
        cards: [
            {
                purpose: 'Visual prototypes',
                method: 'Standard',
                materials: 'Economical',
                why: 'Great surface quality and detail. Limited under functional loads.',
                scores: [5, 2, 1, 1],
                tone: 'sky',
            },
            {
                purpose: 'Assembly · functional tests',
                method: 'Tough',
                materials: 'Durable',
                why: 'Strong and impact-resistant for fastening and fit checks. May cost more.',
                scores: [4, 5, 1, 2],
                tone: 'teal',
            },
            {
                purpose: 'Covers · windows',
                method: 'Clear',
                materials: 'Transparent',
                why: 'High transparency after post-processing.',
                scores: [4, 3, 5, 1],
                tone: 'violet',
            },
            {
                purpose: 'Grips · cushioning',
                method: 'Flexible',
                materials: 'Flexible',
                why: 'Allows deformation and absorbs shock. Affected by hardness and storage conditions.',
                scores: [3, 3, 1, 5],
                tone: 'teal',
            },
        ],
    },
    team: {
        eyebrow: 'SLA vs DLP',
        heading: 'SLA and DLP cure resin differently',
        body: 'Both are precision processes that cure the same resins with light. How the light is applied changes speed and equipment traits.',
        chipIcon: 'sun',
        groups: [
            { label: 'SLA', files: ['UV laser', 'Point-by-point scan'], result: 'Fine detail · visual models' },
            { label: 'DLP', files: ['Projected light', 'Whole-layer cure'], result: 'Repeat small parts' },
        ],
        tipsHeading: 'Tips for precision parts',
        tipsIcon: 'unit',
        tipIcons: ['unit', 'wall', 'support'],
        tips: [
            'Leave clearance for assemblies — see the tolerance guide',
            'Keep walls at least 0.6mm',
            'Mark faces that must stay free of support marks',
        ],
    },
}

export function getSlaInfographic(locale: string): ServiceInfographicContent {
    return locale === 'en' ? EN : KO
}
