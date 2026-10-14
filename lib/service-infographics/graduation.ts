/**
 * 졸업작품 서비스 페이지 인포그래픽 데이터
 * 수치는 서비스·가이드에 이미 안내한 기준(평균 3~7일 수령, 1주 이상 전 주문, 최소 벽 두께 FDM 1.0mm·레진 0.6mm)만 사용
 */

import type { ServiceInfographicContent } from './types'

const KO: ServiceInfographicContent = {
    stats: [
        { value: '3~7일', label: '평균 출력 수령', sub: '주문 확정 후 기준' },
        { value: '1주+', label: '권장 주문 시점', sub: '제출일 기준 여유 확보' },
        { value: '무가입', label: '자동견적', sub: '파일 업로드만으로 가격 확인' },
        { value: '30종+', label: '출력 소재', sub: 'FDM · SLA · DLP' },
    ],
    scope: {
        heading: '졸업작품 준비, 이렇게 도와드립니다',
        items: [
            {
                icon: 'schedule',
                title: '제출 일정 맞춤',
                body: '제출·전시 일정에 맞춰 납기를 상담합니다.',
            },
            {
                icon: 'wallet',
                title: '예산 먼저 확인',
                body: '회원가입 없이 자동견적으로 금액을 바로 확인합니다.',
            },
            {
                icon: 'scan',
                title: '파일 준비 가이드',
                body: '벽 두께·서포트·메쉬 오류 등 출력 전 점검 포인트를 안내합니다.',
            },
            {
                icon: 'photo',
                title: '파일이 없어도 시작',
                body: '사진으로 AI 3D 모델을 만들거나 3D 모델링을 의뢰할 수 있습니다.',
            },
            {
                icon: 'finish',
                title: '전시용 후가공',
                body: '연마·도장 등 후가공으로 전시 완성도를 높입니다.',
            },
        ],
    },
    process: {
        eyebrow: 'Process',
        heading: '준비된 만큼, 바로 다음 단계로',
        body: '파일이 없어도, 파일만 있어도 시작할 수 있습니다. 점검을 마친 파일이라면 자동견적에서 바로 주문하세요.',
        startLabel: '여기서 시작',
        outputLabel: '결과물',
        steps: [
            {
                icon: 'photo',
                title: '3D 파일 만들기',
                body: '사진으로 AI 3D 모델을 만들거나, 정밀 치수가 필요하면 모델링을 의뢰합니다.',
                output: '출력용 3D 파일',
                entry: { label: '파일이 없어요', href: '/services/photo-to-3d', cta: '사진으로 3D 만들기' },
            },
            {
                icon: 'scan',
                title: '파일 점검',
                body: '단위·벽 두께·메쉬 오류·분할 필요 여부를 무료 점검기로 확인합니다.',
                output: '점검 완료 파일',
                entry: { label: '파일이 있어요', href: '/stl-checker', cta: '무료 STL 점검' },
            },
            {
                icon: 'quote',
                title: '자동견적 · 주문',
                body: '출력 방식·소재·옵션을 고르며 금액을 확인하고 예산에 맞춥니다.',
                output: '주문 확정',
                entry: { label: '점검까지 끝났어요', href: '/quote', cta: '자동견적 받기' },
            },
            {
                icon: 'print',
                title: '출력 · 후가공',
                body: '용도에 맞는 공정으로 출력하고 연마·도장 등 후가공을 진행합니다.',
                output: '졸업작품 출력물',
            },
            {
                icon: 'delivery',
                title: '검수 · 수령',
                body: '치수·외관을 검수한 뒤 발송합니다. 평균 3~7일 내 수령합니다.',
                output: '제출 · 전시 준비 완료',
            },
        ],
    },
    timeline: {
        eyebrow: 'Schedule',
        heading: '제출일부터 거꾸로 계산한 권장 일정',
        body: '제작·배송 여유를 두고 최소 1주 전에는 주문을 마치세요. 전시 설치·도장 마무리 시간까지 남겨 두면 더 안전합니다.',
        ticks: [21, 14, 7, 0],
        mobileTicks: [21, 14, 7, 0],
        dayLabel: (d) => (d === 0 ? '제출일' : `D-${d}`),
        bars: [
            { label: '파일 준비 · 점검', detail: '단위·벽 두께·메쉬 오류 확인', from: 21, to: 14, tone: 'violet' },
            { label: '견적 · 옵션 확정 · 주문', detail: '자동견적으로 예산 맞추기', from: 14, to: 10, tone: 'sky' },
            { label: '출력 · 후가공 · 배송', detail: '평균 3~7일', from: 10, to: 3, tone: 'teal' },
            { label: '전시 설치 · 마무리', detail: '여유 기간', from: 3, to: 0, tone: 'amber' },
        ],
        deadline: { day: 7, label: '늦어도 이때까지 주문' },
        note: '권장 일정 예시입니다. 크기·수량·후가공에 따라 달라지며, 일정이 촉박하면 먼저 문의해 주세요.',
    },
    match: {
        eyebrow: 'Process & Material',
        heading: '작품 성격에 맞는 공정 · 소재 고르기',
        body: '하나의 작품도 부위별로 공정과 소재를 나눠 출력한 뒤 조립할 수 있습니다.',
        metrics: ['표면 품질', '강도 · 내구성', '경제성'],
        note: '막대는 일반적인 경향을 비교한 것이며, 형상·두께·후가공에 따라 달라질 수 있습니다.',
        cards: [
            {
                purpose: '발표 · 전시용 외관',
                method: 'SLA · DLP',
                materials: '레진 + 도장',
                why: '매끄러운 표면과 미세 디테일로 전시 완성도를 높입니다.',
                scores: [5, 2, 3],
                tone: 'violet',
            },
            {
                purpose: '구조 · 기능 시연',
                method: 'FDM',
                materials: 'PETG · ABS',
                why: '조립·체결·반복 시연에 강해 움직이는 작품에 적합합니다.',
                scores: [3, 5, 4],
                tone: 'teal',
            },
            {
                purpose: '대형 조형물',
                method: 'FDM',
                materials: 'PLA · 분할 출력',
                why: '장비 크기를 넘으면 나눠 출력한 뒤 조립합니다. 비용 부담이 적습니다.',
                scores: [3, 3, 5],
                tone: 'sky',
            },
        ],
    },
    checklist: {
        eyebrow: 'File Checklist',
        heading: '출력 전 5가지만 확인하세요',
        body: '주문 후 수정이 생기면 일정이 밀립니다. 아래 항목을 미리 점검하면 당일 변경이 크게 줄어듭니다.',
        items: [
            { icon: 'unit', title: '단위 · 실제 크기', body: 'mm 단위로 저장했는지, 실제 크기가 맞는지 확인합니다.', badge: 'mm 기준' },
            { icon: 'wall', title: '최소 벽 두께', body: '너무 얇은 벽은 출력 중 부러지거나 뭉개질 수 있습니다.', badge: 'FDM 1.0mm · 레진 0.6mm' },
            { icon: 'mesh', title: '메쉬 오류', body: '구멍·뒤집힌 면 같은 오류는 견적·출력 품질에 영향을 줍니다.', badge: '자동 리페어 지원' },
            { icon: 'split', title: '분할 필요 여부', body: '장비 크기를 넘는 작품은 나눠 출력한 뒤 조립합니다.', badge: '대형 작품' },
            { icon: 'support', title: '서포트 위치', body: '서포트 자국이 보이면 안 되는 면을 미리 정해 두세요.', badge: '외관 면 확인' },
        ],
        cta: { label: '무료 STL 점검기로 확인', href: '/stl-checker' },
        guide: { label: '졸업작품 체크리스트 자세히', href: '/guides/graduation-project-checklist' },
    },
    team: {
        eyebrow: 'Bundle Order',
        heading: '작품 파일은 한 번에 묶어 주문하세요',
        body: '장바구니에 여러 파일을 담아 한 번에 주문하면, 같은 출력 방식·같은 소재끼리는 최소 주문금액이 한 번만 적용됩니다.',
        groups: [
            { label: 'FDM · PLA', files: ['본체', '받침대', '부속'], result: '최소 주문금액 1회' },
            { label: 'SLA · 레진', files: ['디테일 파츠'], result: '최소 주문금액 1회' },
        ],
        tipsHeading: '예산에 맞추는 방법',
        tips: [
            '자동견적으로 1차 금액부터 확인하기',
            '보이지 않는 내부는 인필(내부 채움) 낮추기',
            '작품 파일을 모아 한 번에 주문하기',
        ],
    },
}

const EN: ServiceInfographicContent = {
    stats: [
        { value: '3–7 days', label: 'Typical delivery', sub: 'After order confirmation' },
        { value: '1 week+', label: 'Order ahead', sub: 'Before your submission date' },
        { value: 'No sign-up', label: 'Auto-quote', sub: 'Upload a file to see the price' },
        { value: '30+', label: 'Materials', sub: 'FDM · SLA · DLP' },
    ],
    scope: {
        heading: 'How we help with graduation projects',
        items: [
            { icon: 'schedule', title: 'Deadline planning', body: 'Delivery counseling aligned to submission and exhibition dates.' },
            { icon: 'wallet', title: 'Budget first', body: 'Check the price instantly with auto-quote — no sign-up.' },
            { icon: 'scan', title: 'File prep guides', body: 'Wall thickness, supports, and mesh errors to check before printing.' },
            { icon: 'photo', title: 'No file? Still possible', body: 'Create an AI 3D model from a photo or request 3D modeling.' },
            { icon: 'finish', title: 'Exhibition finishing', body: 'Sanding and painting for a polished display piece.' },
        ],
    },
    process: {
        eyebrow: 'Process',
        heading: 'Start from wherever you are',
        body: 'Start with no file or just a file. If your file is already checked, order straight from auto-quote.',
        startLabel: 'Start here',
        outputLabel: 'Output',
        steps: [
            {
                icon: 'photo',
                title: 'Create a 3D file',
                body: 'Generate an AI 3D model from a photo, or request modeling for precise dimensions.',
                output: 'Print-ready 3D file',
                entry: { label: 'I have no file', href: '/services/photo-to-3d', cta: 'Photo to 3D' },
            },
            {
                icon: 'scan',
                title: 'Check the file',
                body: 'Check units, wall thickness, mesh errors, and splitting needs with the free checker.',
                output: 'Checked file',
                entry: { label: 'I have a file', href: '/stl-checker', cta: 'Free STL check' },
            },
            {
                icon: 'quote',
                title: 'Auto-quote & order',
                body: 'Choose process, material, and options while watching the price fit your budget.',
                output: 'Order confirmed',
                entry: { label: 'My file is checked', href: '/quote', cta: 'Get auto-quote' },
            },
            {
                icon: 'print',
                title: 'Print & finish',
                body: 'Printed with the right process, then sanded or painted as needed.',
                output: 'Your printed project',
            },
            {
                icon: 'delivery',
                title: 'Inspect & deliver',
                body: 'Dimensions and finish are checked before shipping. Typically 3–7 days.',
                output: 'Ready to submit',
            },
        ],
    },
    timeline: {
        eyebrow: 'Schedule',
        heading: 'Recommended schedule, counted back from submission',
        body: 'Finish ordering at least a week ahead to leave room for production and shipping — and a little more for setup and finishing.',
        ticks: [21, 14, 7, 0],
        mobileTicks: [21, 14, 7, 0],
        dayLabel: (d) => (d === 0 ? 'Due' : `D-${d}`),
        bars: [
            { label: 'File prep · check', detail: 'Units, wall thickness, mesh errors', from: 21, to: 14, tone: 'violet' },
            { label: 'Quote · options · order', detail: 'Fit your budget with auto-quote', from: 14, to: 10, tone: 'sky' },
            { label: 'Print · finish · ship', detail: 'Typically 3–7 days', from: 10, to: 3, tone: 'teal' },
            { label: 'Setup · final touches', detail: 'Buffer', from: 3, to: 0, tone: 'amber' },
        ],
        deadline: { day: 7, label: 'Order no later than' },
        note: 'Example schedule. It varies with size, quantity, and finishing — contact us first if your timeline is tight.',
    },
    match: {
        eyebrow: 'Process & Material',
        heading: 'Pick the process and material for your piece',
        body: 'One project can be split by part, printed with different processes, then assembled.',
        metrics: ['Surface quality', 'Strength', 'Cost efficiency'],
        note: 'Bars compare general tendencies; results vary with geometry, thickness, and finishing.',
        cards: [
            {
                purpose: 'Presentation · exhibition',
                method: 'SLA · DLP',
                materials: 'Resin + paint',
                why: 'Smooth surfaces and fine detail for a polished display.',
                scores: [5, 2, 3],
                tone: 'violet',
            },
            {
                purpose: 'Structure · working demo',
                method: 'FDM',
                materials: 'PETG · ABS',
                why: 'Tough for assembly, fastening, and repeated demos.',
                scores: [3, 5, 4],
                tone: 'teal',
            },
            {
                purpose: 'Large sculpture',
                method: 'FDM',
                materials: 'PLA · split prints',
                why: 'Split beyond the build volume and assembled — budget-friendly.',
                scores: [3, 3, 5],
                tone: 'sky',
            },
        ],
    },
    checklist: {
        eyebrow: 'File Checklist',
        heading: 'Check these 5 things before printing',
        body: 'Changes after ordering push your schedule back. Checking these first prevents last-minute edits.',
        items: [
            { icon: 'unit', title: 'Units · real size', body: 'Saved in mm and at the intended real-world size.', badge: 'mm' },
            { icon: 'wall', title: 'Minimum wall', body: 'Walls that are too thin can break or blur during printing.', badge: 'FDM 1.0mm · Resin 0.6mm' },
            { icon: 'mesh', title: 'Mesh errors', body: 'Holes and flipped faces affect quotes and print quality.', badge: 'Auto-repair' },
            { icon: 'split', title: 'Splitting', body: 'Pieces larger than the build volume are split and assembled.', badge: 'Large pieces' },
            { icon: 'support', title: 'Support placement', body: 'Decide which faces must stay free of support marks.', badge: 'Visible faces' },
        ],
        cta: { label: 'Check with the free STL checker', href: '/stl-checker' },
        guide: { label: 'Full graduation checklist', href: '/guides/graduation-project-checklist' },
    },
    team: {
        eyebrow: 'Bundle Order',
        heading: 'Bundle your project files into one order',
        body: 'Add multiple files to the cart and order at once — the minimum order amount applies only once per process and material.',
        groups: [
            { label: 'FDM · PLA', files: ['Body', 'Base', 'Parts'], result: 'Minimum applied once' },
            { label: 'SLA · Resin', files: ['Detail parts'], result: 'Minimum applied once' },
        ],
        tipsHeading: 'Ways to fit your budget',
        tips: [
            'Check the first price with auto-quote',
            'Lower infill on hidden interiors',
            'Collect project files into one order',
        ],
    },
}

export function getGraduationInfographic(locale: string): ServiceInfographicContent {
    return locale === 'en' ? EN : KO
}
