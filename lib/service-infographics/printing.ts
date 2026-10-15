/**
 * 3D프린팅출력 서비스 페이지 인포그래픽 데이터
 * 수치·비교는 서비스 안내와 출력 방식 비교표(/print-methods)에 이미 있는 내용만 사용
 */

import type { ServiceInfographicContent } from './types'

const KO: ServiceInfographicContent = {
    stats: [
        { value: '30종+', label: '출력 소재', sub: 'FDM · SLA · DLP' },
        { value: '3~7일', label: '평균 수령', sub: '주문 확정 후 기준' },
        { value: '무가입', label: '자동견적', sub: '파일 업로드만으로 가격 확인' },
        { value: '실시간', label: '가격 반영', sub: '공정·소재·옵션 변경 즉시' },
    ],
    scope: {
        heading: '3D프린팅출력, 한곳에서 끝냅니다',
        items: [
            { icon: 'upload', title: '파일 그대로 업로드', body: 'STL·OBJ·3MF·PLY는 바로, STEP·STP는 자동 변환 후 견적합니다.' },
            { icon: 'photo', title: '파일이 없으면 사진으로', body: '제품 사진을 AI 3D 모델로 만들어 견적까지 이어갑니다.' },
            { icon: 'layers', title: '3가지 공정 · 30종+ 소재', body: 'FDM·SLA·DLP 중 용도에 맞는 방식과 소재를 고릅니다.' },
            { icon: 'delivery', title: '검수 후 발송', body: '제작·검수·발송까지 한곳에서 진행합니다.' },
        ],
    },
    process: {
        eyebrow: 'Process',
        heading: '업로드부터 수령까지 4단계',
        body: '견적 문의를 기다릴 필요 없이, 파일을 올리면 바로 가격이 보이고 그대로 주문할 수 있습니다.',
        startLabel: '여기서 시작',
        outputLabel: '결과물',
        steps: [
            {
                icon: 'upload',
                title: '업로드',
                body: '3D 파일이나 제품 사진을 올립니다.',
                output: '3D 파일 · 사진',
            },
            {
                icon: 'quote',
                title: '자동견적',
                body: '출력 방식·소재·옵션을 고르면 가격이 실시간으로 바뀝니다.',
                output: '견적 금액',
            },
            {
                icon: 'print',
                title: '제작 · 검수',
                body: '선택한 공정으로 출력한 뒤 품질을 확인합니다.',
                output: '검수 완료 출력물',
            },
            {
                icon: 'delivery',
                title: '배송',
                body: '검수를 마친 출력물을 발송합니다.',
                output: '평균 3~7일 수령',
            },
        ],
    },
    match: {
        eyebrow: 'Print Method',
        heading: '용도에 맞는 출력 방식 고르기',
        body: '같은 모델도 출력 방식에 따라 표면·강도·비용이 달라집니다. 무엇을 확인하려는지부터 정하세요.',
        metrics: ['표면 품질', '기계적 강도', '비용 효율', '제작 속도'],
        note: '막대는 출력 방식 비교표의 일반적 경향을 옮긴 것이며, 형상·소재·후가공에 따라 달라질 수 있습니다.',
        cards: [
            {
                purpose: '기능 시제품 · 조립',
                method: 'FDM',
                materials: '필라멘트 4종+',
                why: '비용 대비 효율이 좋고 강도가 높아 기능 시험·조립 부품에 적합합니다. 층선이 보일 수 있습니다.',
                scores: [3, 4, 5, 4],
                tone: 'teal',
            },
            {
                purpose: '외관 · 정밀 모형',
                method: 'SLA',
                materials: '레진 4종',
                why: '레이저로 경화해 표면이 매끄럽고 디테일이 뛰어납니다. 세척·2차 경화 후처리가 필요합니다.',
                scores: [5, 3, 3, 3],
                tone: 'violet',
            },
            {
                purpose: '소형 정밀 · 반복 제작',
                method: 'DLP',
                materials: '레진 4종',
                why: '한 레이어를 동시에 경화해 빠르고, 같은 부품을 여러 개 만들 때 유리합니다.',
                scores: [5, 3, 3, 4],
                tone: 'sky',
            },
        ],
    },
    team: {
        eyebrow: 'File Formats',
        heading: '어떤 파일이든 견적까지 이어집니다',
        body: '갖고 있는 형식에 따라 처리 방식만 다를 뿐, 모두 자동견적으로 연결됩니다.',
        groups: [
            { label: '바로 견적', files: ['STL', 'OBJ', '3MF', 'PLY'], result: '즉시 자동견적' },
            { label: 'CAD 파일', files: ['STEP', 'STP'], result: '자동 변환 후 견적' },
            { label: '3D 파일이 없을 때', files: ['JPG', 'PNG'], result: 'AI 3D 생성 후 견적' },
        ],
        tipsHeading: '업로드 전에 확인하면 좋은 것',
        tipsIcon: 'scan',
        tipIcons: ['unit', 'wall', 'mesh'],
        tips: [
            'mm 단위 · 실제 크기로 저장했는지',
            '최소 벽 두께 FDM 1.0mm · 레진 0.6mm',
            '구멍 · 뒤집힌 면 같은 메쉬 오류',
        ],
    },
}

const EN: ServiceInfographicContent = {
    stats: [
        { value: '30+', label: 'Materials', sub: 'FDM · SLA · DLP' },
        { value: '3–7 days', label: 'Typical delivery', sub: 'After order confirmation' },
        { value: 'No sign-up', label: 'Auto-quote', sub: 'Upload a file to see the price' },
        { value: 'Live', label: 'Pricing', sub: 'Updates as you change options' },
    ],
    scope: {
        heading: '3D printing, start to finish in one place',
        items: [
            { icon: 'upload', title: 'Upload as-is', body: 'STL, OBJ, 3MF, and PLY quote instantly; STEP/STP are converted automatically.' },
            { icon: 'photo', title: 'No file? Use a photo', body: 'Turn a product photo into an AI 3D model and continue to a quote.' },
            { icon: 'layers', title: '3 processes · 30+ materials', body: 'Choose FDM, SLA, or DLP and the material that fits the job.' },
            { icon: 'delivery', title: 'Inspected, then shipped', body: 'Production, inspection, and shipping all handled in one place.' },
        ],
    },
    process: {
        eyebrow: 'Process',
        heading: 'Four steps from upload to delivery',
        body: 'No waiting for a quote reply — upload a file, see the price, and order right away.',
        startLabel: 'Start here',
        outputLabel: 'Output',
        steps: [
            { icon: 'upload', title: 'Upload', body: 'Upload a 3D file or a product photo.', output: '3D file · photo' },
            { icon: 'quote', title: 'Auto-quote', body: 'Pick process, material, and options — the price updates live.', output: 'Quoted price' },
            { icon: 'print', title: 'Produce & inspect', body: 'Printed with your chosen process, then quality-checked.', output: 'Inspected part' },
            { icon: 'delivery', title: 'Ship', body: 'Inspected parts are shipped out.', output: 'Typically 3–7 days' },
        ],
    },
    match: {
        eyebrow: 'Print Method',
        heading: 'Pick the print method for the job',
        body: 'The same model differs in surface, strength, and cost by process. Start from what you need to check.',
        metrics: ['Surface', 'Strength', 'Cost efficiency', 'Speed'],
        note: 'Bars reflect general tendencies from our print-method comparison; results vary with geometry, material, and finishing.',
        cards: [
            {
                purpose: 'Functional · assembly',
                method: 'FDM',
                materials: '4+ filaments',
                why: 'Cost-efficient and strong — ideal for functional tests and assembly parts. Layer lines may show.',
                scores: [3, 4, 5, 4],
                tone: 'teal',
            },
            {
                purpose: 'Appearance · precision',
                method: 'SLA',
                materials: '4 resins',
                why: 'Laser-cured for smooth surfaces and fine detail. Needs washing and post-curing.',
                scores: [5, 3, 3, 3],
                tone: 'violet',
            },
            {
                purpose: 'Small precise · repeats',
                method: 'DLP',
                materials: '4 resins',
                why: 'Cures a whole layer at once — fast, and efficient for multiple identical parts.',
                scores: [5, 3, 3, 4],
                tone: 'sky',
            },
        ],
    },
    team: {
        eyebrow: 'File Formats',
        heading: 'Every file format leads to a quote',
        body: 'Only the handling differs by format — every path ends in an auto-quote.',
        groups: [
            { label: 'Quote instantly', files: ['STL', 'OBJ', '3MF', 'PLY'], result: 'Instant auto-quote' },
            { label: 'CAD files', files: ['STEP', 'STP'], result: 'Auto-converted, then quoted' },
            { label: 'No 3D file', files: ['JPG', 'PNG'], result: 'AI 3D, then quoted' },
        ],
        tipsHeading: 'Check before uploading',
        tipsIcon: 'scan',
        tipIcons: ['unit', 'wall', 'mesh'],
        tips: [
            'Saved in mm at real-world size',
            'Minimum wall: FDM 1.0mm · Resin 0.6mm',
            'Mesh errors such as holes or flipped faces',
        ],
    },
}

export function getPrintingInfographic(locale: string): ServiceInfographicContent {
    return locale === 'en' ? EN : KO
}
