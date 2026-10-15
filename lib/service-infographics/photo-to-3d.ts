/**
 * 사진(이미지)→AI 3D 서비스 페이지 인포그래픽 데이터
 * 서비스 안내(JPG·PNG, 하루 1회·한국 시간, 우·뒤·좌 멀티뷰, 좋은 사진 조건)에 있는 내용만 사용
 */

import type { ServiceInfographicContent } from './types'

const KO: ServiceInfographicContent = {
    stats: [
        { value: 'JPG·PNG', label: '사진 한 장', sub: '3D 파일 없이 시작' },
        { value: 'STL', label: 'AI 입체 생성', sub: '3D 뷰어로 바로 확인' },
        { value: '+3면', label: '멀티뷰', sub: '우·뒤·좌 추가 사진' },
        { value: '하루 1회', label: '생성 횟수', sub: '로그인 회원 · 한국 시간' },
    ],
    scope: {
        heading: '이럴 때 사진으로 시작하세요',
        items: [
            { icon: 'wallet', title: '3D 파일 없이 견적', body: '모델링 없이 사진만으로 출력 가격을 확인합니다.' },
            { icon: 'idea', title: '아이디어 검증', body: '머릿속 형상을 빠르게 입체로 만들어 봅니다.' },
            { icon: 'eye', title: '형상 확인 · 시제품', body: '크기와 모양을 실물로 확인합니다.' },
            { icon: 'modeling', title: '피규어 · 소품', body: '실사 사진 속 물체를 입체 출력물로 만듭니다.' },
        ],
    },
    process: {
        eyebrow: 'Process',
        heading: '사진 업로드부터 출력 주문까지',
        body: '자동견적에서 「3D 모델이 없어요」를 고르고 사진을 올리면, AI가 만든 STL이 그대로 견적으로 이어집니다.',
        startLabel: '여기서 시작',
        outputLabel: '결과물',
        steps: [
            {
                icon: 'photo',
                title: '사진 업로드',
                body: '정면 제품 사진(JPG·PNG)을 올립니다.',
                output: '제품 사진',
                entry: { label: '사진만 있어요', href: '/quote?entry=photo', cta: '사진으로 3D 만들기' },
            },
            {
                icon: 'images',
                title: '추가 사진 (선택)',
                body: '우·뒤·좌 사진을 더하면 형상 정확도가 올라갈 수 있습니다.',
                output: '멀티뷰 세트',
            },
            {
                icon: 'mesh',
                title: 'AI 3D 생성',
                body: 'AI가 입체 메시(STL)를 만들고 3D 뷰어로 보여 줍니다.',
                output: 'STL 모델',
            },
            {
                icon: 'quote',
                title: '자동견적 · 주문',
                body: '생성된 모델로 바로 출력 방식·소재를 고르고 주문합니다.',
                output: '출력 주문',
            },
        ],
    },
    match: {
        eyebrow: 'Which Path',
        heading: '내 자료에 맞는 시작 방법',
        body: '사진→AI 3D는 형상 확인에 강하고, 정밀 치수가 중요하면 3D 파일 업로드가 맞습니다.',
        metrics: ['시작 간편함', '치수 정밀도', '입체 표현'],
        note: '막대는 각 방법의 일반적 경향을 비교한 것이며, 사진 품질과 형상에 따라 달라질 수 있습니다.',
        cards: [
            {
                purpose: '실사 제품 · 피규어',
                method: '사진→AI 3D',
                materials: 'JPG · PNG',
                why: '실사 사진으로 입체 메시를 만들고 즉시 견적·주문으로 이어집니다.',
                scores: [5, 2, 5],
                tone: 'sky',
            },
            {
                purpose: '로고 · 스케치',
                method: 'AI 3D Maker',
                materials: '2.5D 돌출',
                why: '평면 로고·스케치를 두께가 있는 형상으로 돌출합니다.',
                scores: [4, 3, 2],
                tone: 'violet',
            },
            {
                purpose: '정밀 부품 · 조립',
                method: '3D 파일 업로드',
                materials: 'STL · STEP',
                why: '조립 공차·정밀 치수가 중요한 부품은 3D 파일 업로드를 권장합니다.',
                scores: [2, 5, 5],
                tone: 'teal',
            },
        ],
    },
    checklist: {
        eyebrow: 'Photo Checklist',
        heading: '좋은 사진이 좋은 3D를 만듭니다',
        body: '촬영할 때 아래 4가지만 지키면 생성 결과가 훨씬 안정적입니다.',
        items: [
            { icon: 'focus', title: '중앙에 크게', body: '물체가 화면 가운데에 크게 들어오게 찍습니다.', badge: '물체가 화면 가득' },
            { icon: 'sun', title: '단색 · 밝은 배경', body: '복잡한 배경 대신 밝은 단색 배경 앞에서 찍습니다.', badge: '배경은 단순하게' },
            { icon: 'eye', title: '그림자 · 반사 적게', body: '강한 그림자나 빛 반사가 형상을 왜곡할 수 있습니다.', badge: '부드러운 조명' },
            { icon: 'images', title: '추가 각도', body: '우·뒤·좌 사진을 더하면 정확도가 올라갈 수 있습니다.', badge: '멀티뷰 지원' },
        ],
        cta: { label: '사진으로 3D 만들기', href: '/quote?entry=photo', icon: 'photo' },
        guide: { label: '사진(이미지)→3D 가이드', href: '/guides/photo-to-3d-printing-quote' },
    },
}

const EN: ServiceInfographicContent = {
    stats: [
        { value: 'JPG·PNG', label: 'One photo', sub: 'No 3D file needed' },
        { value: 'STL', label: 'AI 3D model', sub: 'Preview in the 3D viewer' },
        { value: '+3 views', label: 'Multi-view', sub: 'Right, back, left photos' },
        { value: '1 / day', label: 'Generations', sub: 'Signed-in members · KST' },
    ],
    scope: {
        heading: 'Start with a photo when you want to…',
        items: [
            { icon: 'wallet', title: 'Quote without a 3D file', body: 'See print prices from a photo — no modeling.' },
            { icon: 'idea', title: 'Validate an idea', body: 'Turn a concept into 3D quickly.' },
            { icon: 'eye', title: 'Check form · prototype', body: 'See size and shape in the real world.' },
            { icon: 'modeling', title: 'Figures · props', body: 'Turn an object in a real photo into a print.' },
        ],
    },
    process: {
        eyebrow: 'Process',
        heading: 'From photo upload to print order',
        body: 'Choose “I don’t have a 3D model” in auto-quote and upload a photo — the AI-generated STL flows straight into the quote.',
        startLabel: 'Start here',
        outputLabel: 'Output',
        steps: [
            {
                icon: 'photo',
                title: 'Upload a photo',
                body: 'Upload a front product photo (JPG/PNG).',
                output: 'Product photo',
                entry: { label: 'I only have a photo', href: '/quote?entry=photo', cta: 'Photo to 3D' },
            },
            { icon: 'images', title: 'Extra views (optional)', body: 'Right, back, and left photos can improve shape accuracy.', output: 'Multi-view set' },
            { icon: 'mesh', title: 'AI 3D generation', body: 'AI builds a 3D mesh (STL) and shows it in the viewer.', output: 'STL model' },
            { icon: 'quote', title: 'Auto-quote · order', body: 'Pick process and material for the model and order.', output: 'Print order' },
        ],
    },
    match: {
        eyebrow: 'Which Path',
        heading: 'Pick the starting point for what you have',
        body: 'Photo → AI 3D is great for form; upload a 3D file when exact dimensions matter.',
        metrics: ['Ease of start', 'Accuracy', '3D depth'],
        note: 'Bars compare general tendencies; results vary with photo quality and shape.',
        cards: [
            {
                purpose: 'Real products · figures',
                method: 'Photo → AI 3D',
                materials: 'JPG · PNG',
                why: 'Builds a 3D mesh from a real photo and continues straight to quote and order.',
                scores: [5, 2, 5],
                tone: 'sky',
            },
            {
                purpose: 'Logos · sketches',
                method: 'AI 3D Maker',
                materials: '2.5D extrusion',
                why: 'Extrudes flat logos and sketches into shapes with depth.',
                scores: [4, 3, 2],
                tone: 'violet',
            },
            {
                purpose: 'Precise · assembly parts',
                method: '3D file upload',
                materials: 'STL · STEP',
                why: 'For fit tolerances and exact dimensions, upload a 3D file.',
                scores: [2, 5, 5],
                tone: 'teal',
            },
        ],
    },
    checklist: {
        eyebrow: 'Photo Checklist',
        heading: 'Good photos make good 3D',
        body: 'Follow these four tips when shooting and results become far more consistent.',
        items: [
            { icon: 'focus', title: 'Centered and large', body: 'Fill the frame with the object, centered.', badge: 'Fill the frame' },
            { icon: 'sun', title: 'Plain, bright background', body: 'Shoot against a bright single-color background.', badge: 'Keep it simple' },
            { icon: 'eye', title: 'Few shadows · reflections', body: 'Hard shadows and glare can distort the shape.', badge: 'Soft lighting' },
            { icon: 'images', title: 'Extra angles', body: 'Right, back, and left photos can improve accuracy.', badge: 'Multi-view' },
        ],
        cta: { label: 'Photo to 3D', href: '/quote?entry=photo', icon: 'photo' },
        guide: { label: 'Photo → 3D guide', href: '/guides/photo-to-3d-printing-quote' },
    },
}

export function getPhotoTo3DInfographic(locale: string): ServiceInfographicContent {
    return locale === 'en' ? EN : KO
}
