/**
 * 3D 모델링 의뢰 서비스 페이지 인포그래픽 데이터
 * 서비스 안내와 제품개발 문의 페이지(24시간 내 연락, 첨부 최대 50MB)에 있는 내용만 사용
 */

import type { ServiceInfographicContent } from './types'

const KO: ServiceInfographicContent = {
    stats: [
        { value: '24시간', label: '상담 연락', sub: '문의 접수 후 전문가 연락' },
        { value: '50MB', label: '자료 첨부', sub: 'ZIP · STL · STEP · JPG · PNG' },
        { value: 'STL·3MF', label: '전달 형식', sub: '출력에 바로 쓰는 파일' },
        { value: '바로', label: '자동견적 연계', sub: '완성 파일로 이어서 주문' },
    ],
    scope: {
        heading: '이런 자료로 의뢰할 수 있습니다',
        items: [
            { icon: 'docs', title: '도면', body: '치수가 정해진 제품을 출력용 3D 모델로 만듭니다.' },
            { icon: 'idea', title: '스케치', body: '아이디어 단계의 손그림도 형상으로 옮깁니다.' },
            { icon: 'photo', title: '사진 · 레퍼런스', body: '참고 이미지를 바탕으로 모델링합니다.' },
            { icon: 'mesh', title: '기존 파일 수정', body: '출력이 어려운 형상을 출력 가능한 모델로 보완합니다.' },
        ],
    },
    process: {
        eyebrow: 'Process',
        heading: '자료만 보내면 출력까지 이어집니다',
        body: '도면이 없어도 괜찮습니다. 용도·크기·수량을 알려 주시면 상담 후 진행합니다.',
        startLabel: '여기서 시작',
        outputLabel: '결과물',
        steps: [
            {
                icon: 'upload',
                title: '자료 보내기',
                body: '제품개발 문의로 레퍼런스와 요구사항을 보냅니다.',
                output: '의뢰 접수',
                entry: { label: '파일이 없어요', href: '/expert', cta: '모델링 문의하기' },
            },
            {
                icon: 'idea',
                title: '상담 · 기획',
                body: '용도·크기·수량과 필요한 정밀도를 확인합니다.',
                output: '작업 범위 확정',
            },
            {
                icon: 'modeling',
                title: '3D 모델링',
                body: '출력 가능한 형상으로 모델링하고 수정합니다.',
                output: 'STL · 3MF 파일',
            },
            {
                icon: 'quote',
                title: '자동견적 · 출력',
                body: '완성 파일을 올려 바로 견적·주문으로 이어갑니다.',
                output: '출력물',
                entry: { label: '파일이 이미 있어요', href: '/quote', cta: '바로 자동견적' },
            },
        ],
    },
    match: {
        eyebrow: 'Which Path',
        heading: '모델링 의뢰가 꼭 필요할까요?',
        body: '목적에 따라 더 빠른 방법이 있습니다. 정밀 치수가 핵심이면 모델링 의뢰, 형상 확인이 목적이면 AI 도구가 빠릅니다.',
        metrics: ['치수 정밀도', '진행 속도', '조립 공차 대응'],
        note: '막대는 각 방법의 일반적 경향을 비교한 것이며, 형상 복잡도와 자료 수준에 따라 달라질 수 있습니다.',
        cards: [
            {
                purpose: '정밀 치수 · 조립 부품',
                method: '모델링 의뢰',
                materials: '도면·스케치',
                why: '도면 기반 제품, 조립 공차가 중요한 부품에 적합합니다.',
                scores: [5, 2, 5],
                tone: 'violet',
            },
            {
                purpose: '형상 확인 · 아이디어 검증',
                method: '사진→AI 3D',
                materials: 'JPG · PNG',
                why: '사진만으로 입체 메시를 만들어 바로 견적·주문까지 진행합니다.',
                scores: [2, 5, 1],
                tone: 'sky',
            },
            {
                purpose: '로고 · 스케치 입체화',
                method: 'AI 3D Maker',
                materials: '2.5D 돌출',
                why: '평면 로고·스케치를 두께가 있는 형상으로 돌출합니다.',
                scores: [3, 5, 2],
                tone: 'teal',
            },
        ],
    },
    checklist: {
        eyebrow: 'Before You Request',
        heading: '의뢰 전에 이 4가지를 정리하세요',
        body: '요구사항이 구체적일수록 상담이 짧아지고 결과물이 정확해집니다.',
        items: [
            { icon: 'unit', title: '원하는 크기', body: '가로·세로·높이 치수를 알려 주세요.', badge: 'mm 기준' },
            { icon: 'eye', title: '용도', body: '전시·시제품·기능 부품 등 쓰임새에 따라 형상과 공정이 달라집니다.', badge: '공정 선택 기준' },
            { icon: 'repeat', title: '수량', body: '필요한 개수를 알려 주시면 제작 방식까지 함께 안내합니다.', badge: '1개부터' },
            { icon: 'images', title: '참고 자료', body: '도면·스케치·사진을 함께 첨부해 주세요.', badge: '최대 50MB' },
        ],
        cta: { label: '모델링 문의하기', href: '/expert', icon: 'modeling' },
        guide: { label: '파일 준비 가이드', href: '/guides/3d-printing-file-preparation' },
    },
}

const EN: ServiceInfographicContent = {
    stats: [
        { value: '24 hrs', label: 'Expert reply', sub: 'After your inquiry' },
        { value: '50MB', label: 'Attachments', sub: 'ZIP · STL · STEP · JPG · PNG' },
        { value: 'STL·3MF', label: 'Delivered as', sub: 'Ready to print' },
        { value: 'Direct', label: 'To auto-quote', sub: 'Order from the finished file' },
    ],
    scope: {
        heading: 'What you can send us',
        items: [
            { icon: 'docs', title: 'Drawings', body: 'Products with fixed dimensions, modeled for printing.' },
            { icon: 'idea', title: 'Sketches', body: 'Early hand sketches turned into real geometry.' },
            { icon: 'photo', title: 'Photos · references', body: 'Modeled from reference images.' },
            { icon: 'mesh', title: 'Fixing existing files', body: 'Hard-to-print shapes reworked into printable models.' },
        ],
    },
    process: {
        eyebrow: 'Process',
        heading: 'Send references, get all the way to a print',
        body: 'No drawing? No problem. Tell us the use, size, and quantity and we will consult before starting.',
        startLabel: 'Start here',
        outputLabel: 'Output',
        steps: [
            {
                icon: 'upload',
                title: 'Send references',
                body: 'Share references and requirements through the product development inquiry.',
                output: 'Request received',
                entry: { label: 'I have no file', href: '/expert', cta: 'Request modeling' },
            },
            { icon: 'idea', title: 'Consult · plan', body: 'We confirm use, size, quantity, and required precision.', output: 'Scope agreed' },
            { icon: 'modeling', title: '3D modeling', body: 'Modeled and refined into a printable shape.', output: 'STL · 3MF file' },
            {
                icon: 'quote',
                title: 'Auto-quote · print',
                body: 'Upload the finished file and continue to quote and order.',
                output: 'Printed part',
                entry: { label: 'I already have a file', href: '/quote', cta: 'Go to auto-quote' },
            },
        ],
    },
    match: {
        eyebrow: 'Which Path',
        heading: 'Do you really need modeling?',
        body: 'There may be a faster path. Request modeling when exact dimensions matter; use AI tools when you just need the form.',
        metrics: ['Dimensional accuracy', 'Speed', 'Assembly tolerance'],
        note: 'Bars compare general tendencies; results vary with shape complexity and the references provided.',
        cards: [
            {
                purpose: 'Precise · assembly parts',
                method: 'Modeling',
                materials: 'Drawings',
                why: 'Best for drawing-based products and parts where fit tolerances matter.',
                scores: [5, 2, 5],
                tone: 'violet',
            },
            {
                purpose: 'Form check · idea validation',
                method: 'Photo → AI 3D',
                materials: 'JPG · PNG',
                why: 'Creates a 3D mesh from a photo and goes straight to quote and order.',
                scores: [2, 5, 1],
                tone: 'sky',
            },
            {
                purpose: 'Logos · sketches in 3D',
                method: 'AI 3D Maker',
                materials: '2.5D extrusion',
                why: 'Extrudes flat logos and sketches into shapes with depth.',
                scores: [3, 5, 2],
                tone: 'teal',
            },
        ],
    },
    checklist: {
        eyebrow: 'Before You Request',
        heading: 'Prepare these 4 things first',
        body: 'The more specific your request, the shorter the consultation and the more accurate the result.',
        items: [
            { icon: 'unit', title: 'Target size', body: 'Share width, depth, and height.', badge: 'mm' },
            { icon: 'eye', title: 'Use', body: 'Display, prototype, or functional part — it shapes geometry and process.', badge: 'Drives process' },
            { icon: 'repeat', title: 'Quantity', body: 'Tell us how many and we will suggest how to produce them.', badge: 'From 1' },
            { icon: 'images', title: 'References', body: 'Attach drawings, sketches, or photos.', badge: 'Up to 50MB' },
        ],
        cta: { label: 'Request modeling', href: '/expert', icon: 'modeling' },
        guide: { label: 'File preparation guide', href: '/guides/3d-printing-file-preparation' },
    },
}

export function getModelingInfographic(locale: string): ServiceInfographicContent {
    return locale === 'en' ? EN : KO
}
