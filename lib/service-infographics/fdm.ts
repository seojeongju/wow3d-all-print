/**
 * FDM 출력 서비스 페이지 인포그래픽 데이터
 * 소재 특성은 PLA·ABS·PETG 비교 가이드, 공정 특성은 출력 방식 비교표에 있는 내용 기준
 */

import type { ServiceInfographicContent } from './types'

const KO: ServiceInfographicContent = {
    stats: [
        { value: '4종+', label: 'FDM 소재', sub: 'PLA · ABS · PETG · TPU' },
        { value: '1.0mm', label: '최소 벽 두께', sub: 'FDM 권장 기준' },
        { value: '분할', label: '대형 모델', sub: '장비보다 크면 나눠 출력 후 조립' },
        { value: '3~7일', label: '평균 수령', sub: '주문 확정 후 기준' },
    ],
    scope: {
        heading: 'FDM 출력이 잘 맞는 작업',
        items: [
            { icon: 'idea', title: '기능성 시제품', body: '강도·내구성이 필요한 시험용 부품에 적합합니다.' },
            { icon: 'mesh', title: '조립 부품 · 툴링', body: '체결·조립을 확인하는 부품과 지그를 만듭니다.' },
            { icon: 'split', title: '대형 출력', body: '빌드 볼륨을 넘으면 분할 출력 후 조립합니다.' },
            { icon: 'modeling', title: '교육 · 외형 목업', body: 'PLA로 시제품·교육용·외형 목업을 경제적으로 만듭니다.' },
        ],
    },
    process: {
        eyebrow: 'How FDM Works',
        heading: '필라멘트를 녹여 한 층씩 쌓습니다',
        body: '소재와 레이어·인필(내부 채움) 설정이 가격과 강도를 결정합니다. 견적 단계에서 직접 조절할 수 있습니다.',
        startLabel: '여기서 시작',
        outputLabel: '결정되는 것',
        steps: [
            {
                icon: 'layers',
                title: '소재 선택',
                body: 'PLA·ABS·PETG·TPU 중 용도에 맞는 필라멘트를 고릅니다.',
                output: '강도 · 내열 특성',
            },
            {
                icon: 'gauge',
                title: '레이어 · 인필 설정',
                body: '레이어 높이와 인필을 조절해 가격과 강도의 균형을 맞춥니다.',
                output: '견적 금액 · 제작 시간',
            },
            {
                icon: 'print',
                title: '용융 적층 출력',
                body: '노즐에서 녹인 필라멘트를 베드 위에 한 층씩 쌓아 올립니다.',
                output: '출력물',
            },
            {
                icon: 'delivery',
                title: '서포트 정리 · 검수',
                body: '서포트를 정리하고 치수·외관을 확인한 뒤 발송합니다.',
                output: '평균 3~7일 수령',
            },
        ],
    },
    match: {
        eyebrow: 'Filament',
        heading: '용도에 맞는 FDM 소재 고르기',
        body: '같은 형상도 소재에 따라 강도·내열·유연성이 달라집니다.',
        metrics: ['출력 안정성', '내충격', '내열성', '유연성'],
        note: '막대는 소재 비교 가이드의 일반적 경향을 옮긴 것이며, 형상·두께·출력 설정에 따라 달라질 수 있습니다.',
        cards: [
            {
                purpose: '디자인 목업 · 교육 · 전시',
                method: 'PLA',
                materials: '출력이 쉬움',
                why: '표면이 깔끔하고 출력이 쉬워 외관 확인·초기 아이디어 검증에 많이 쓰입니다. 내열·내충격에는 한계가 있습니다.',
                scores: [5, 2, 2, 1],
                tone: 'sky',
            },
            {
                purpose: '하우징 · 기능 시험',
                method: 'ABS',
                materials: '내열 · 내충격',
                why: '내열성과 내충격성이 좋아 하우징·조립성 검토 부품에 적합합니다. 수축이 있어 출력 환경 관리가 중요합니다.',
                scores: [3, 4, 4, 1],
                tone: 'teal',
            },
            {
                purpose: '기능 부품 · 보호 케이스',
                method: 'PETG',
                materials: '균형형',
                why: 'PLA보다 강하고 ABS보다 다루기 쉬운 편이라 균형형 기능성 소재로 많이 선택됩니다.',
                scores: [4, 4, 3, 2],
                tone: 'violet',
            },
            {
                purpose: '그립 · 완충 부품',
                method: 'TPU',
                materials: '유연 소재',
                why: '고무처럼 휘어지는 유연 소재로, 충격을 흡수하거나 손에 닿는 부품에 씁니다.',
                scores: [2, 5, 2, 5],
                tone: 'teal',
            },
        ],
    },
    team: {
        eyebrow: 'Large Parts',
        heading: '장비보다 큰 모델은 나눠서 출력합니다',
        body: '빌드 볼륨을 넘는 모델은 구조를 고려해 분할 출력한 뒤 정렬·접합해 하나로 완성합니다.',
        groups: [
            { label: '빌드 볼륨 안', files: ['단일 파일'], result: '통째로 출력' },
            { label: '빌드 볼륨 초과', files: ['파트 A', '파트 B', '파트 C'], result: '분할 출력 · 접합' },
        ],
        tipsHeading: '가격과 강도 맞추기',
        tipsIcon: 'gauge',
        tipIcons: ['layers', 'gauge', 'wallet'],
        tips: [
            '레이어 높이·인필이 가격과 제작 시간을 좌우',
            '강도가 필요한 부품만 인필 올리기',
            '보이지 않는 내부는 인필 낮춰 비용 절감',
        ],
    },
}

const EN: ServiceInfographicContent = {
    stats: [
        { value: '4+', label: 'FDM materials', sub: 'PLA · ABS · PETG · TPU' },
        { value: '1.0mm', label: 'Minimum wall', sub: 'Recommended for FDM' },
        { value: 'Split', label: 'Large models', sub: 'Printed in parts, then assembled' },
        { value: '3–7 days', label: 'Typical delivery', sub: 'After order confirmation' },
    ],
    scope: {
        heading: 'Where FDM printing fits best',
        items: [
            { icon: 'idea', title: 'Functional prototypes', body: 'Test parts that need strength and durability.' },
            { icon: 'mesh', title: 'Assembly parts · tooling', body: 'Parts and jigs for fit and fastening checks.' },
            { icon: 'split', title: 'Large prints', body: 'Split beyond the build volume and assembled.' },
            { icon: 'modeling', title: 'Education · mockups', body: 'Economical PLA prototypes, teaching aids, and form mockups.' },
        ],
    },
    process: {
        eyebrow: 'How FDM Works',
        heading: 'Melted filament, built up layer by layer',
        body: 'Material, layer height, and infill decide price and strength — and you can adjust them in the quote.',
        startLabel: 'Start here',
        outputLabel: 'Determines',
        steps: [
            { icon: 'layers', title: 'Choose material', body: 'Pick PLA, ABS, PETG, or TPU filament for the use case.', output: 'Strength · heat resistance' },
            { icon: 'gauge', title: 'Layer · infill', body: 'Balance price and strength with layer height and infill.', output: 'Price · print time' },
            { icon: 'print', title: 'Extrude & stack', body: 'Melted filament is laid down on the bed, one layer at a time.', output: 'Printed part' },
            { icon: 'delivery', title: 'Supports · inspection', body: 'Supports are cleaned up and the part is checked before shipping.', output: 'Typically 3–7 days' },
        ],
    },
    match: {
        eyebrow: 'Filament',
        heading: 'Pick the FDM material for the job',
        body: 'The same shape behaves differently in strength, heat, and flexibility by material.',
        metrics: ['Printability', 'Impact', 'Heat', 'Flexibility'],
        note: 'Bars reflect general tendencies from our material guide; results vary with geometry, thickness, and print settings.',
        cards: [
            {
                purpose: 'Mockups · education · display',
                method: 'PLA',
                materials: 'Easy to print',
                why: 'Clean surfaces and easy printing — popular for form checks and early ideas. Limited heat and impact resistance.',
                scores: [5, 2, 2, 1],
                tone: 'sky',
            },
            {
                purpose: 'Housings · functional tests',
                method: 'ABS',
                materials: 'Heat · impact',
                why: 'Good heat and impact resistance for housings and fit checks. Shrinkage makes print conditions important.',
                scores: [3, 4, 4, 1],
                tone: 'teal',
            },
            {
                purpose: 'Functional parts · cases',
                method: 'PETG',
                materials: 'Balanced',
                why: 'Stronger than PLA and easier than ABS — a popular balanced functional material.',
                scores: [4, 4, 3, 2],
                tone: 'violet',
            },
            {
                purpose: 'Grips · cushioning',
                method: 'TPU',
                materials: 'Flexible',
                why: 'A rubber-like flexible material for shock absorption and parts that touch the hand.',
                scores: [2, 5, 2, 5],
                tone: 'teal',
            },
        ],
    },
    team: {
        eyebrow: 'Large Parts',
        heading: 'Models bigger than the printer are split',
        body: 'Models beyond the build volume are split with structure in mind, then aligned and joined into one piece.',
        groups: [
            { label: 'Within build volume', files: ['Single file'], result: 'Printed whole' },
            { label: 'Beyond build volume', files: ['Part A', 'Part B', 'Part C'], result: 'Split · joined' },
        ],
        tipsHeading: 'Balancing price and strength',
        tipsIcon: 'gauge',
        tipIcons: ['layers', 'gauge', 'wallet'],
        tips: [
            'Layer height and infill drive price and time',
            'Raise infill only where strength matters',
            'Lower infill on hidden interiors to save cost',
        ],
    },
}

export function getFdmInfographic(locale: string): ServiceInfographicContent {
    return locale === 'en' ? EN : KO
}
