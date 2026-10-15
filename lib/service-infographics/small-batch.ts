/**
 * 소량생산·맞춤 부품 서비스 페이지 인포그래픽 데이터
 * 서비스 안내(1개부터, 금형 없음, 반복 주문 동일 기준, 특수 공차는 관리자 검토)에 있는 내용만 사용
 */

import type { ServiceInfographicContent } from './types'

const KO: ServiceInfographicContent = {
    stats: [
        { value: '1개부터', label: '주문 수량', sub: '최소 수량 부담 없이 시작' },
        { value: '무금형', label: '초기 투자', sub: '금형 없이 소량 로트 생산' },
        { value: '3가지', label: '공정 조합', sub: 'FDM · SLA · DLP' },
        { value: '동일 기준', label: '반복 주문', sub: '같은 파일·옵션·소재로 재주문' },
    ],
    scope: {
        heading: '금형 없이, 필요한 만큼만',
        items: [
            { icon: 'factory', title: '금형 없는 소량 로트', body: '금형 투자 없이 필요한 수량만 생산합니다.' },
            { icon: 'repeat', title: '반복 주문 · 스펙 고정', body: '같은 부품을 같은 기준으로 다시 주문합니다.' },
            { icon: 'layers', title: '공정 조합', body: '부품마다 FDM·SLA·DLP를 용도에 맞게 나눕니다.' },
            { icon: 'gauge', title: '수량별 단가 조율', body: '수량이 늘면 공정·배치 최적화로 단가·납기를 조율합니다.' },
        ],
    },
    process: {
        eyebrow: 'Process',
        heading: '표준 부품은 바로, 특수 조건은 검토 후',
        body: '일반적인 형상은 자동견적으로 바로 확인하고, 특수 공차·후가공이 필요하면 관리자가 검토해 안내합니다.',
        startLabel: '여기서 시작',
        outputLabel: '결과물',
        steps: [
            {
                icon: 'quote',
                title: '자동견적',
                body: '파일을 올리고 수량·공정·소재를 고르면 금액이 바로 보입니다.',
                output: '수량별 견적',
                entry: { label: '표준 형상', href: '/quote', cta: '자동견적 받기' },
            },
            {
                icon: 'scan',
                title: '관리자 검토',
                body: '특수 공차·후가공은 검토 후 제작 방법과 금액을 안내합니다.',
                output: '맞춤 견적 안내',
                entry: { label: '특수 공차 · 후가공', href: '/contact', cta: '문의하기' },
            },
            {
                icon: 'factory',
                title: '배치 생산',
                body: '수량에 맞춰 공정·배치를 최적화해 제작합니다.',
                output: '소량 로트',
            },
            {
                icon: 'repeat',
                title: '재주문',
                body: '같은 파일·옵션·소재로 재주문하면 일관된 제작 기준을 적용합니다.',
                output: '같은 품질 반복',
            },
        ],
    },
    match: {
        eyebrow: 'Process Mix',
        heading: '부품 성격에 맞춰 공정을 나누세요',
        body: '한 제품의 부품이라도 요구 조건이 다르면 공정을 나눠 생산하는 편이 효율적입니다.',
        metrics: ['표면 품질', '기계적 강도', '비용 효율'],
        note: '막대는 출력 방식 비교표의 일반적 경향을 옮긴 것이며, 형상·수량·후가공에 따라 달라질 수 있습니다.',
        cards: [
            {
                purpose: '기능 · 조립 부품',
                method: 'FDM',
                materials: 'PETG · ABS',
                why: '강도와 비용 효율이 좋아 체결·조립 부품 반복 생산에 적합합니다.',
                scores: [3, 4, 5],
                tone: 'teal',
            },
            {
                purpose: '외관 · 디테일 부품',
                method: 'SLA',
                materials: '레진',
                why: '매끄러운 표면과 미세 디테일이 필요한 외관 부품에 적합합니다.',
                scores: [5, 3, 3],
                tone: 'violet',
            },
            {
                purpose: '소형 정밀 부품 반복',
                method: 'DLP',
                materials: '레진',
                why: '한 레이어를 동시에 경화해 같은 소형 부품을 여러 개 만들 때 유리합니다.',
                scores: [5, 3, 3],
                tone: 'sky',
            },
        ],
    },
    team: {
        eyebrow: 'Repeat Order',
        heading: '스펙을 고정하면 재주문이 쉬워집니다',
        body: '처음 주문에서 파일·옵션·소재를 확정해 두면, 다음 주문부터는 같은 기준으로 그대로 반복할 수 있습니다.',
        groups: [
            { label: '1차 주문', files: ['파일', '옵션', '소재'], result: '제작 기준 확정' },
            { label: '재주문', files: ['같은 파일', '같은 옵션', '같은 소재'], result: '일관된 기준 적용' },
        ],
        tipsHeading: '단가를 낮추는 방법',
        tipIcons: ['file', 'layers', 'gauge'],
        tips: [
            '같은 공정·소재 부품은 묶어서 주문',
            '보이지 않는 내부는 인필(내부 채움) 낮추기',
            '수량이 정해지면 단가·납기 조율 문의',
        ],
    },
}

const EN: ServiceInfographicContent = {
    stats: [
        { value: 'From 1', label: 'Order quantity', sub: 'No minimum batch to start' },
        { value: 'No tooling', label: 'Upfront cost', sub: 'Small lots without molds' },
        { value: '3', label: 'Process mix', sub: 'FDM · SLA · DLP' },
        { value: 'Same spec', label: 'Repeat orders', sub: 'Same file, options, material' },
    ],
    scope: {
        heading: 'No molds — just the quantity you need',
        items: [
            { icon: 'factory', title: 'Tool-free small lots', body: 'Produce only what you need, with no mold investment.' },
            { icon: 'repeat', title: 'Repeat · fixed specs', body: 'Reorder the same part to the same standard.' },
            { icon: 'layers', title: 'Process mix', body: 'Assign FDM, SLA, or DLP part by part.' },
            { icon: 'gauge', title: 'Volume pricing', body: 'Higher quantities allow process and batch optimization for price and lead time.' },
        ],
    },
    process: {
        eyebrow: 'Process',
        heading: 'Standard parts instantly, special specs after review',
        body: 'Standard shapes are priced instantly with auto-quote; special tolerances or finishing are reviewed by our team.',
        startLabel: 'Start here',
        outputLabel: 'Output',
        steps: [
            {
                icon: 'quote',
                title: 'Auto-quote',
                body: 'Upload and choose quantity, process, and material to see the price.',
                output: 'Volume quote',
                entry: { label: 'Standard shapes', href: '/quote', cta: 'Get auto-quote' },
            },
            {
                icon: 'scan',
                title: 'Team review',
                body: 'Special tolerances or finishing are reviewed, then method and price are shared.',
                output: 'Custom quote',
                entry: { label: 'Special specs', href: '/contact', cta: 'Contact us' },
            },
            { icon: 'factory', title: 'Batch production', body: 'Process and batching are optimized for the quantity.', output: 'Small lot' },
            { icon: 'repeat', title: 'Reorder', body: 'Same file, options, and material keep the same production standard.', output: 'Consistent repeats' },
        ],
    },
    match: {
        eyebrow: 'Process Mix',
        heading: 'Split processes by part type',
        body: 'Parts of one product can have different needs — producing them with different processes is more efficient.',
        metrics: ['Surface', 'Strength', 'Cost efficiency'],
        note: 'Bars reflect general tendencies from our print-method comparison; results vary with geometry, quantity, and finishing.',
        cards: [
            {
                purpose: 'Functional · assembly',
                method: 'FDM',
                materials: 'PETG · ABS',
                why: 'Strong and cost-efficient for repeat runs of fastening and assembly parts.',
                scores: [3, 4, 5],
                tone: 'teal',
            },
            {
                purpose: 'Appearance · detail',
                method: 'SLA',
                materials: 'Resin',
                why: 'Smooth surfaces and fine detail for visible parts.',
                scores: [5, 3, 3],
                tone: 'violet',
            },
            {
                purpose: 'Small precise repeats',
                method: 'DLP',
                materials: 'Resin',
                why: 'Cures a whole layer at once — efficient for many identical small parts.',
                scores: [5, 3, 3],
                tone: 'sky',
            },
        ],
    },
    team: {
        eyebrow: 'Repeat Order',
        heading: 'Fixed specs make reorders easy',
        body: 'Lock the file, options, and material on the first order, and every reorder follows the same standard.',
        groups: [
            { label: 'First order', files: ['File', 'Options', 'Material'], result: 'Standard set' },
            { label: 'Reorder', files: ['Same file', 'Same options', 'Same material'], result: 'Same standard applied' },
        ],
        tipsHeading: 'Ways to lower unit price',
        tipIcons: ['file', 'layers', 'gauge'],
        tips: [
            'Bundle parts with the same process and material',
            'Lower infill on hidden interiors',
            'Ask about pricing once quantity is set',
        ],
    },
}

export function getSmallBatchInfographic(locale: string): ServiceInfographicContent {
    return locale === 'en' ? EN : KO
}
