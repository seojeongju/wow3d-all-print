/**
 * 캡스톤디자인 서비스 페이지 인포그래픽 데이터
 * 수치는 서비스·가이드 페이지에 이미 안내한 기준(평균 3~7일 수령, 발표 3~4주 전 시작, 2주 전 최종 주문)만 사용
 */

import type { ServiceInfographicContent } from './types'

const KO: ServiceInfographicContent = {
    stats: [
        { value: '5단계', label: '원스톱 진행', sub: '아이디어부터 수령까지' },
        { value: '3~7일', label: '평균 출력 수령', sub: '주문 확정 후 기준' },
        { value: '3가지', label: '출력 방식', sub: 'FDM · SLA · DLP' },
        { value: '3종', label: '결제 증빙 서류', sub: '견적서 · 거래명세서 · 세금계산서' },
    ],
    scope: {
        heading: '이런 팀에 맞춰 준비했습니다',
        items: [
            {
                icon: 'idea',
                title: '아이디어 컨설팅',
                body: '아이디어 단계부터 구조·크기·소재·제작 방식을 함께 정리합니다.',
            },
            {
                icon: 'modeling',
                title: '3D 모델링 대행',
                body: '스케치·도면·참고 이미지만 있어도 출력용 3D 파일을 만들어 드립니다.',
            },
            {
                icon: 'print',
                title: '외관 모형 ~ 기능 시제품',
                body: 'FDM·SLA·DLP로 발표용 외관 모형부터 작동하는 기능 시제품까지 제작합니다.',
            },
            {
                icon: 'docs',
                title: '산학협력단 결제 서류',
                body: '견적서·거래명세서·세금계산서를 발행합니다.',
            },
            {
                icon: 'schedule',
                title: '발표 일정 맞춤',
                body: '중간·최종 발표 일정에 맞춰 제작 일정을 상담합니다.',
            },
        ],
    },
    process: {
        eyebrow: 'Process',
        heading: '지금 가진 것에서 바로 시작하세요',
        body: '준비된 정도에 따라 시작 단계가 달라집니다. 3D 파일이 있다면 3단계부터 바로 견적을 받을 수 있습니다.',
        startLabel: '여기서 시작',
        outputLabel: '결과물',
        steps: [
            {
                icon: 'idea',
                title: '아이디어 상담',
                body: '해결할 문제·핵심 기능·크기·사용 환경을 정리하고 구조와 소재를 검토합니다.',
                output: '제작 방향·사양',
                entry: { label: '아이디어만 있어요', href: '/contact', cta: '컨설팅 문의' },
            },
            {
                icon: 'modeling',
                title: '3D 모델링',
                body: '직접 CAD로 만들거나, 스케치·도면을 보내 모델링을 대행합니다.',
                output: 'STL · STEP 파일',
                entry: { label: '스케치·도면이 있어요', href: '/contact', cta: '모델링 대행 문의' },
            },
            {
                icon: 'quote',
                title: '견적 · 주문',
                body: '자동견적으로 금액을 바로 확인하고, 필요하면 결제용 서류를 요청합니다.',
                output: '견적서 · 주문 확정',
                entry: { label: '3D 파일이 있어요', href: '/quote', cta: '자동견적 받기' },
            },
            {
                icon: 'print',
                title: '출력 · 후가공',
                body: '용도에 맞는 공정·소재로 출력하고 연마·도장 등 후가공을 진행합니다.',
                output: '시제품',
            },
            {
                icon: 'delivery',
                title: '검수 · 수령',
                body: '치수·외관을 검수한 뒤 발송합니다. 평균 3~7일 내 수령합니다.',
                output: '발표 준비 완료',
            },
        ],
    },
    timeline: {
        eyebrow: 'Schedule',
        heading: '발표일부터 거꾸로 계산한 권장 일정',
        body: '1차 시제품으로 크기·조립·동작을 확인할 시간을 남겨 두면 최종 발표 직전의 수정 부담이 크게 줄어듭니다.',
        ticks: [35, 28, 21, 14, 7, 0],
        mobileTicks: [35, 28, 14, 0],
        dayLabel: (d) => (d === 0 ? '발표일' : `D-${d}`),
        bars: [
            { label: '아이디어 정리 · 모델링', detail: '대행 시 상담 후 일정 안내', from: 35, to: 28, tone: 'violet' },
            { label: '1차 출력 · 검증', detail: 'FDM PLA로 크기·조립·동작 확인', from: 28, to: 21, tone: 'sky' },
            { label: '수정 · 보완', detail: '문제 부위 모델 수정', from: 21, to: 14, tone: 'amber' },
            { label: '최종 제작 · 후가공 · 수령', detail: '평균 3~7일', from: 14, to: 7, tone: 'teal' },
            { label: '조립 · 발표 리허설', detail: '여유 기간', from: 7, to: 0, tone: 'teal' },
        ],
        deadline: { day: 14, label: '최종 주문 마감 권장' },
        note: '권장 일정 예시입니다. 크기·수량·후가공에 따라 달라지며, 일정이 촉박하면 먼저 문의해 주세요.',
    },
    match: {
        eyebrow: 'Process & Material',
        heading: '목적에 맞는 공정 · 소재 고르기',
        body: '한 작품 안에서도 부품마다 목적이 다르면 공정과 소재를 섞어 제작할 수 있습니다.',
        metrics: ['표면 품질', '강도 · 내구성', '경제성'],
        note: '막대는 일반적인 경향을 비교한 것이며, 형상·두께·후가공에 따라 달라질 수 있습니다.',
        cards: [
            {
                purpose: '1차 검증용 시제품',
                method: 'FDM',
                materials: 'PLA',
                why: '비용이 낮아 크기·조립·동작을 먼저 확인하기 좋습니다.',
                scores: [3, 3, 5],
                tone: 'sky',
            },
            {
                purpose: '발표용 외관 모형',
                method: 'SLA · DLP',
                materials: '레진 + 후가공',
                why: '매끄러운 표면과 미세 디테일로 완성도 높은 외관을 보여 줍니다.',
                scores: [5, 2, 3],
                tone: 'violet',
            },
            {
                purpose: '작동 기능 시제품 · 전자부품 케이스',
                method: 'FDM',
                materials: 'PETG · ABS',
                why: '체결·조립·반복 사용에 강합니다. 보드·센서 치수에 맞춰 공차를 반영합니다.',
                scores: [3, 5, 4],
                tone: 'teal',
            },
        ],
    },
    docs: {
        eyebrow: 'Payment Documents',
        heading: '산학협력단 결제 서류, 단계별로 준비됩니다',
        body: '학교 예산으로 결제할 때 필요한 서류를 진행 단계에 맞춰 발행해 드립니다.',
        items: [
            { step: '01', title: '견적서', when: '주문 전', body: '예산 신청·구매 승인에 사용합니다.' },
            { step: '02', title: '거래명세서', when: '납품 시', body: '품목·수량·금액을 확인하는 납품 증빙입니다.' },
            { step: '03', title: '세금계산서', when: '결제 시', body: '산학협력단 사업자 정보로 발행합니다.' },
        ],
        note: '필요한 서류 종류와 학교·산학협력단 사업자 정보를 문의 시 함께 알려 주세요. 학교마다 절차가 다를 수 있습니다.',
    },
    team: {
        eyebrow: 'Team Order',
        heading: '팀 파일은 한 번에 묶어 주문하세요',
        body: '장바구니에 여러 파일을 담아 한 번에 주문하면, 같은 출력 방식·같은 소재끼리는 최소 주문금액이 한 번만 적용됩니다.',
        groups: [
            { label: 'FDM · PLA', files: ['하우징', '브라켓', '커버'], result: '최소 주문금액 1회' },
            { label: 'SLA · 레진', files: ['외관 패널'], result: '최소 주문금액 1회' },
        ],
        tipsHeading: '예산을 아끼는 방법',
        tips: [
            '1차 검증은 FDM PLA로 진행하기',
            '구조와 무관한 부품은 인필(내부 채움) 낮추기',
            '팀원 파일을 모아 한 번에 주문하기',
        ],
    },
}

const EN: ServiceInfographicContent = {
    stats: [
        { value: '5 steps', label: 'One-stop service', sub: 'From idea to delivery' },
        { value: '3–7 days', label: 'Typical delivery', sub: 'After order confirmation' },
        { value: '3', label: 'Print processes', sub: 'FDM · SLA · DLP' },
        { value: '3', label: 'Payment documents', sub: 'Quote · Statement · Tax invoice' },
    ],
    scope: {
        heading: 'Built for capstone teams',
        items: [
            { icon: 'idea', title: 'Idea consulting', body: 'Define structure, size, material, and process from the concept stage.' },
            { icon: 'modeling', title: '3D modeling service', body: 'Sketches, drawings, or reference images are enough for print-ready files.' },
            { icon: 'print', title: 'Models to working parts', body: 'FDM, SLA, and DLP from presentation models to functional prototypes.' },
            { icon: 'docs', title: 'Payment documents', body: 'Quotes, transaction statements, and tax invoices.' },
            { icon: 'schedule', title: 'Presentation schedule', body: 'Production planning around mid-term and final presentations.' },
        ],
    },
    process: {
        eyebrow: 'Process',
        heading: 'Start from what you already have',
        body: 'Your starting step depends on how far along you are. With a 3D file, jump straight to step 3 for an instant quote.',
        startLabel: 'Start here',
        outputLabel: 'Output',
        steps: [
            {
                icon: 'idea',
                title: 'Idea consulting',
                body: 'Clarify the problem, key functions, size, and use environment, then review structure and materials.',
                output: 'Direction & specs',
                entry: { label: 'I only have an idea', href: '/contact', cta: 'Ask for consulting' },
            },
            {
                icon: 'modeling',
                title: '3D modeling',
                body: 'Model it yourself in CAD, or send sketches and drawings for us to model.',
                output: 'STL · STEP files',
                entry: { label: 'I have sketches', href: '/contact', cta: 'Request modeling' },
            },
            {
                icon: 'quote',
                title: 'Quote & order',
                body: 'Check the price instantly in auto-quote and request payment documents if needed.',
                output: 'Quote · Order',
                entry: { label: 'I have a 3D file', href: '/quote', cta: 'Get auto-quote' },
            },
            {
                icon: 'print',
                title: 'Print & finish',
                body: 'Printed with the right process and material, then sanded or painted as needed.',
                output: 'Prototype',
            },
            {
                icon: 'delivery',
                title: 'Inspect & deliver',
                body: 'Dimensions and finish are checked before shipping. Typically 3–7 days.',
                output: 'Ready to present',
            },
        ],
    },
    timeline: {
        eyebrow: 'Schedule',
        heading: 'Recommended schedule, counted back from presentation day',
        body: 'Leaving time to check size, fit, and motion with a first prototype greatly reduces last-minute fixes.',
        ticks: [35, 28, 21, 14, 7, 0],
        mobileTicks: [35, 28, 14, 0],
        dayLabel: (d) => (d === 0 ? 'Day' : `D-${d}`),
        bars: [
            { label: 'Ideation · modeling', detail: 'Timeline set after consulting', from: 35, to: 28, tone: 'violet' },
            { label: 'First print · validation', detail: 'Check size, fit, motion in FDM PLA', from: 28, to: 21, tone: 'sky' },
            { label: 'Revise', detail: 'Fix problem areas in the model', from: 21, to: 14, tone: 'amber' },
            { label: 'Final print · finish · delivery', detail: 'Typically 3–7 days', from: 14, to: 7, tone: 'teal' },
            { label: 'Assembly · rehearsal', detail: 'Buffer', from: 7, to: 0, tone: 'teal' },
        ],
        deadline: { day: 14, label: 'Final order recommended by' },
        note: 'Example schedule. It varies with size, quantity, and finishing — contact us first if your timeline is tight.',
    },
    match: {
        eyebrow: 'Process & Material',
        heading: 'Pick the process and material by purpose',
        body: 'Different parts of one project can use different processes and materials.',
        metrics: ['Surface quality', 'Strength', 'Cost efficiency'],
        note: 'Bars compare general tendencies; results vary with geometry, thickness, and finishing.',
        cards: [
            {
                purpose: 'First validation prototype',
                method: 'FDM',
                materials: 'PLA',
                why: 'Low cost — ideal for checking size, fit, and motion first.',
                scores: [3, 3, 5],
                tone: 'sky',
            },
            {
                purpose: 'Presentation model',
                method: 'SLA · DLP',
                materials: 'Resin + finishing',
                why: 'Smooth surfaces and fine detail for a polished look.',
                scores: [5, 2, 3],
                tone: 'violet',
            },
            {
                purpose: 'Functional prototype · electronics case',
                method: 'FDM',
                materials: 'PETG · ABS',
                why: 'Tough for fastening, assembly, and repeated use, with tolerances for boards and sensors.',
                scores: [3, 5, 4],
                tone: 'teal',
            },
        ],
    },
    docs: {
        eyebrow: 'Payment Documents',
        heading: 'University payment documents at every step',
        body: 'We issue the documents needed for university-budget payments at each stage.',
        items: [
            { step: '01', title: 'Quote', when: 'Before order', body: 'For budget requests and purchase approval.' },
            { step: '02', title: 'Transaction statement', when: 'On delivery', body: 'Proof of delivery with items, quantities, and amounts.' },
            { step: '03', title: 'Tax invoice', when: 'On payment', body: 'Issued to your research foundation.' },
        ],
        note: 'Tell us which documents you need and the foundation’s business details when you contact us. Procedures vary by school.',
    },
    team: {
        eyebrow: 'Team Order',
        heading: 'Bundle team files into one order',
        body: 'Add multiple files to the cart and order at once — the minimum order amount applies only once per process and material.',
        groups: [
            { label: 'FDM · PLA', files: ['Housing', 'Bracket', 'Cover'], result: 'Minimum applied once' },
            { label: 'SLA · Resin', files: ['Front panel'], result: 'Minimum applied once' },
        ],
        tipsHeading: 'Ways to save budget',
        tips: [
            'Validate first in FDM PLA',
            'Lower infill on non-structural parts',
            'Collect team files into one order',
        ],
    },
}

export function getCapstoneInfographic(locale: string): ServiceInfographicContent {
    return locale === 'en' ? EN : KO
}
