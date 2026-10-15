/**
 * 시제품·목업 제작 서비스 페이지 인포그래픽 데이터
 * 서비스 안내(외관 SLA/DLP · 기능 FDM, 평균 3~7일, 견적 단계 후가공 선택)에 있는 내용만 사용
 */

import type { ServiceInfographicContent } from './types'

const KO: ServiceInfographicContent = {
    stats: [
        { value: '3~7일', label: '평균 수령', sub: '주문 확정 후 기준' },
        { value: '3가지', label: '출력 공정', sub: 'FDM · SLA · DLP' },
        { value: '1개부터', label: '소량 반복', sub: '금형 없이 바로 제작' },
        { value: '연마·도장', label: '후가공 옵션', sub: '견적 단계에서 선택' },
    ],
    scope: {
        heading: '시제품, 목적부터 정하세요',
        items: [
            { icon: 'eye', title: '디자인 검증', body: '화면으로는 알기 어려운 비율·질감을 실물로 확인합니다.' },
            { icon: 'finish', title: '투자 · 발표용 샘플', body: '후가공으로 완성도를 높인 샘플을 만듭니다.' },
            { icon: 'mesh', title: '조립 테스트', body: '부품 간 체결과 맞물림을 직접 확인합니다.' },
            { icon: 'repeat', title: '개선 반복', body: '소량으로 다시 출력해 수정 사이클을 짧게 가져갑니다.' },
        ],
    },
    process: {
        eyebrow: 'Iteration',
        heading: '출력 → 검증 → 수정, 짧게 반복하세요',
        body: '한 번에 완성하려 하기보다 작게 출력해 확인하고 고치는 편이 빠릅니다. 같은 옵션으로 재주문하면 기준이 그대로 유지됩니다.',
        startLabel: '여기서 시작',
        outputLabel: '결과물',
        steps: [
            {
                icon: 'quote',
                title: '업로드 · 자동견적',
                body: '파일을 올리고 공정·소재를 고르면 금액이 바로 보입니다.',
                output: '견적 금액',
            },
            {
                icon: 'print',
                title: '1차 출력',
                body: '외관 확인은 SLA/DLP, 기능 시험은 FDM으로 출력합니다.',
                output: '1차 시제품',
            },
            {
                icon: 'eye',
                title: '검증',
                body: '외관·조립·기능을 확인하고 고칠 부분을 찾습니다.',
                output: '수정 목록',
            },
            {
                icon: 'repeat',
                title: '수정 · 재출력',
                body: '수정한 파일로 다시 견적·주문해 개선 사이클을 이어갑니다.',
                output: '개선된 시제품',
            },
        ],
    },
    match: {
        eyebrow: 'Process & Material',
        heading: '검증 목적에 맞는 공정 고르기',
        body: '무엇을 확인하려는 시제품인지에 따라 공정과 소재가 달라집니다.',
        metrics: ['표면 품질', '강도 · 내구성', '경제성'],
        note: '막대는 일반적인 경향을 비교한 것이며, 형상·두께·후가공에 따라 달라질 수 있습니다.',
        cards: [
            {
                purpose: '외관 · 디자인 검증',
                method: 'SLA · DLP',
                materials: '레진',
                why: '매끄러운 표면과 미세 디테일로 실제 제품에 가까운 외관을 확인합니다.',
                scores: [5, 2, 3],
                tone: 'violet',
            },
            {
                purpose: '조립 · 기능 시험',
                method: 'FDM',
                materials: 'PETG · ABS',
                why: '강도·내구성이 좋아 체결·반복 동작 시험에 적합합니다.',
                scores: [3, 5, 4],
                tone: 'teal',
            },
            {
                purpose: '초기 형상 확인',
                method: 'FDM',
                materials: 'PLA',
                why: '출력이 쉽고 부담이 적어 초기 아이디어 검증에 많이 쓰입니다.',
                scores: [3, 3, 5],
                tone: 'sky',
            },
        ],
    },
    team: {
        eyebrow: 'Finishing',
        heading: '단계에 맞춰 후가공을 더하세요',
        body: '후가공 옵션은 견적 단계에서 고릅니다. 검증 단계에서는 줄이고, 발표·투자용 샘플에서 더하는 것이 효율적입니다.',
        chipIcon: 'finish',
        groups: [
            { label: '빠른 검증용', files: ['기본 출력'], result: '비용 · 시간 절약' },
            { label: '레진 출력물', files: ['세척', '경화'], result: '후처리 일관 진행' },
            { label: '발표 · 투자용 샘플', files: ['연마', '도장'], result: '외관 완성도 강화' },
        ],
        tipsHeading: '시제품 비용 줄이는 방법',
        tipIcons: ['print', 'layers', 'file'],
        tips: [
            '초기 형상 확인은 PLA FDM으로',
            '보이지 않는 내부는 인필(내부 채움) 낮추기',
            '여러 부품은 한 번에 묶어 주문하기',
        ],
    },
}

const EN: ServiceInfographicContent = {
    stats: [
        { value: '3–7 days', label: 'Typical delivery', sub: 'After order confirmation' },
        { value: '3', label: 'Processes', sub: 'FDM · SLA · DLP' },
        { value: 'From 1', label: 'Small repeats', sub: 'No tooling needed' },
        { value: 'Sand·paint', label: 'Finishing', sub: 'Selected in the quote' },
    ],
    scope: {
        heading: 'Start with the purpose of your prototype',
        items: [
            { icon: 'eye', title: 'Design validation', body: 'Check proportions and feel that are hard to judge on screen.' },
            { icon: 'finish', title: 'Investor · pitch samples', body: 'Samples polished with post-processing.' },
            { icon: 'mesh', title: 'Assembly tests', body: 'Verify how parts fasten and fit together.' },
            { icon: 'repeat', title: 'Rapid iteration', body: 'Reprint in small runs to shorten each revision cycle.' },
        ],
    },
    process: {
        eyebrow: 'Iteration',
        heading: 'Print → validate → revise, in short loops',
        body: 'Small prints you can check and fix beat trying to perfect it in one go. Reorder with the same options to keep the same baseline.',
        startLabel: 'Start here',
        outputLabel: 'Output',
        steps: [
            { icon: 'quote', title: 'Upload · auto-quote', body: 'Upload, pick process and material, and see the price.', output: 'Quoted price' },
            { icon: 'print', title: 'First print', body: 'SLA/DLP for appearance, FDM for functional tests.', output: 'First prototype' },
            { icon: 'eye', title: 'Validate', body: 'Check looks, fit, and function; list what to change.', output: 'Revision list' },
            { icon: 'repeat', title: 'Revise · reprint', body: 'Quote and order the revised file to keep iterating.', output: 'Improved prototype' },
        ],
    },
    match: {
        eyebrow: 'Process & Material',
        heading: 'Pick the process for what you are validating',
        body: 'The process and material depend on what the prototype needs to prove.',
        metrics: ['Surface quality', 'Strength', 'Cost efficiency'],
        note: 'Bars compare general tendencies; results vary with geometry, thickness, and finishing.',
        cards: [
            {
                purpose: 'Appearance · design',
                method: 'SLA · DLP',
                materials: 'Resin',
                why: 'Smooth surfaces and fine detail close to the final product look.',
                scores: [5, 2, 3],
                tone: 'violet',
            },
            {
                purpose: 'Assembly · function',
                method: 'FDM',
                materials: 'PETG · ABS',
                why: 'Strong and durable for fastening and repeated motion tests.',
                scores: [3, 5, 4],
                tone: 'teal',
            },
            {
                purpose: 'Early form check',
                method: 'FDM',
                materials: 'PLA',
                why: 'Easy and affordable — popular for validating early ideas.',
                scores: [3, 3, 5],
                tone: 'sky',
            },
        ],
    },
    team: {
        eyebrow: 'Finishing',
        heading: 'Add finishing as the stage requires',
        body: 'Finishing options are chosen in the quote. Keep them light while validating, and add them for pitch and investor samples.',
        chipIcon: 'finish',
        groups: [
            { label: 'Quick validation', files: ['Raw print'], result: 'Saves cost · time' },
            { label: 'Resin parts', files: ['Wash', 'Cure'], result: 'Post-processing included' },
            { label: 'Pitch · investor samples', files: ['Sanding', 'Painting'], result: 'Polished appearance' },
        ],
        tipsHeading: 'Ways to cut prototype cost',
        tipIcons: ['print', 'layers', 'file'],
        tips: [
            'Use PLA FDM for early form checks',
            'Lower infill on hidden interiors',
            'Bundle multiple parts into one order',
        ],
    },
}

export function getPrototypeInfographic(locale: string): ServiceInfographicContent {
    return locale === 'en' ? EN : KO
}
