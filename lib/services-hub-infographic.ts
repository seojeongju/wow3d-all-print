/**
 * 서비스 허브(/services) 인포그래픽 데이터
 * 수치·비교는 각 서비스 페이지와 출력 방식 비교표(/print-methods)에 이미 안내한 내용만 사용
 */

type Locale = 'ko' | 'en'

export type HubFinderLane = {
    key: 'file' | 'nofile' | 'purpose'
    title: string
    body: string
    examples: string[]
    services: string[]
}

export type HubMethod = {
    key: 'fdm' | 'sla' | 'dlp'
    name: string
    principle: string
    best: string
    scores: number[]
    href: string
}

export type HubGroup = {
    key: 'method' | 'purpose' | 'nofile'
    title: string
    body: string
    services: string[]
}

export type ServicesHubInfographic = {
    stats: { value: string; label: string; sub: string }[]
    finder: { eyebrow: string; title: string; body: string; lanes: HubFinderLane[] }
    methods: {
        eyebrow: string
        title: string
        body: string
        metrics: string[]
        items: HubMethod[]
        note: string
        moreLabel: string
    }
    groups: HubGroup[]
    /** 서비스 카드에 표시할 핵심 수치 칩 */
    chips: Record<string, string[]>
}

const KO: ServicesHubInfographic = {
    stats: [
        { value: '11가지', label: '핵심 서비스', sub: '출력부터 모델링·네임택까지' },
        { value: '30종+', label: '출력 소재', sub: 'FDM · SLA · DLP' },
        { value: '3~7일', label: '평균 수령', sub: '주문 확정 후 기준' },
        { value: '무가입', label: '자동견적', sub: '파일 업로드만으로 가격 확인' },
    ],
    finder: {
        eyebrow: 'Service Finder',
        title: '지금 무엇을 갖고 계신가요?',
        body: '가진 자료와 목적에 따라 시작점이 달라집니다. 해당하는 칸에서 바로 이어가세요.',
        lanes: [
            {
                key: 'file',
                title: '3D 파일이 있어요',
                body: '업로드하면 바로 가격이 보입니다.',
                examples: ['STL', 'OBJ', '3MF', 'STEP'],
                services: ['printing', 'fdm', 'sla', 'small-batch'],
            },
            {
                key: 'nofile',
                title: '사진 · 스케치 · 문구만 있어요',
                body: 'AI·네임택·모델링으로 시작하세요.',
                examples: ['JPG', 'PNG', '로고', '문구'],
                services: ['photo-to-3d', 'name-tag-studio', 'ai-3d-maker', 'modeling'],
            },
            {
                key: 'purpose',
                title: '목적이 정해져 있어요',
                body: '용도에 맞춘 안내부터 확인하세요.',
                examples: ['시제품', '졸업작품', '캡스톤'],
                services: ['prototype', 'graduation', 'capstone'],
            },
        ],
    },
    methods: {
        eyebrow: 'Print Methods',
        title: '출력 방식 한눈에 비교',
        body: '같은 모델도 출력 방식에 따라 표면·강도·비용이 달라집니다.',
        metrics: ['표면 품질', '기계적 강도', '비용 효율', '제작 속도'],
        items: [
            {
                key: 'fdm',
                name: 'FDM',
                principle: '필라멘트를 녹여 한 층씩 적층',
                best: '기능 시제품 · 조립 · 대형',
                scores: [3, 4, 5, 4],
                href: '/services/fdm',
            },
            {
                key: 'sla',
                name: 'SLA',
                principle: '레이저로 레진을 한 점씩 경화',
                best: '외관 · 정밀 모형',
                scores: [5, 3, 3, 3],
                href: '/services/sla',
            },
            {
                key: 'dlp',
                name: 'DLP',
                principle: '한 레이어를 동시에 경화',
                best: '소형 정밀 · 반복 제작',
                scores: [5, 3, 3, 4],
                href: '/services/sla',
            },
        ],
        note: '막대는 일반적 경향이며 형상·소재·후가공에 따라 달라질 수 있습니다.',
        moreLabel: '출력 방식 자세히 비교',
    },
    groups: [
        {
            key: 'method',
            title: '출력 방식으로 고르기',
            body: '파일이 준비됐다면 공정과 소재부터',
            services: ['printing', 'fdm', 'sla'],
        },
        {
            key: 'purpose',
            title: '목적으로 고르기',
            body: '시제품·과제·반복 생산',
            services: ['prototype', 'small-batch', 'graduation', 'capstone'],
        },
        {
            key: 'nofile',
            title: '파일이 없을 때',
            body: '사진·문구·로고만으로 시작',
            services: ['photo-to-3d', 'name-tag-studio', 'ai-3d-maker', 'modeling'],
        },
    ],
    chips: {
        printing: ['30종+ 소재', '3~7일'],
        fdm: ['PLA · ABS · PETG · TPU'],
        sla: ['레진 4종', '세척·경화 포함'],
        prototype: ['외관 SLA · 기능 FDM'],
        'small-batch': ['1개부터', '금형 없음'],
        graduation: ['1주 전 주문 권장'],
        capstone: ['결제 증빙 3종'],
        'photo-to-3d': ['JPG·PNG → STL'],
        'name-tag-studio': ['문구·폰트', '획 0.8mm 검사'],
        'ai-3d-maker': ['로고 2.5D', '배지·키캡'],
        modeling: ['STL·3MF 전달'],
    },
}

const EN: ServicesHubInfographic = {
    stats: [
        { value: '11', label: 'Core services', sub: 'Printing to modeling & name tags' },
        { value: '30+', label: 'Materials', sub: 'FDM · SLA · DLP' },
        { value: '3–7 days', label: 'Typical delivery', sub: 'After order confirmation' },
        { value: 'No sign-up', label: 'Auto-quote', sub: 'Upload a file to see the price' },
    ],
    finder: {
        eyebrow: 'Service Finder',
        title: 'What do you have right now?',
        body: 'Your starting point depends on what you have and what you need. Pick the lane that fits.',
        lanes: [
            {
                key: 'file',
                title: 'I have a 3D file',
                body: 'Upload it and see the price right away.',
                examples: ['STL', 'OBJ', '3MF', 'STEP'],
                services: ['printing', 'fdm', 'sla', 'small-batch'],
            },
            {
                key: 'nofile',
                title: 'Only photos, sketches, or text',
                body: 'Start with AI, name tags, or modeling.',
                examples: ['JPG', 'PNG', 'Logo', 'Text'],
                services: ['photo-to-3d', 'name-tag-studio', 'ai-3d-maker', 'modeling'],
            },
            {
                key: 'purpose',
                title: 'I have a specific goal',
                body: 'Start with the guide for your use case.',
                examples: ['Prototype', 'Graduation', 'Capstone'],
                services: ['prototype', 'graduation', 'capstone'],
            },
        ],
    },
    methods: {
        eyebrow: 'Print Methods',
        title: 'Print methods at a glance',
        body: 'The same model differs in surface, strength, and cost by process.',
        metrics: ['Surface', 'Strength', 'Cost efficiency', 'Speed'],
        items: [
            {
                key: 'fdm',
                name: 'FDM',
                principle: 'Melted filament, layer by layer',
                best: 'Functional · assembly · large',
                scores: [3, 4, 5, 4],
                href: '/services/fdm',
            },
            {
                key: 'sla',
                name: 'SLA',
                principle: 'Laser cures resin point by point',
                best: 'Appearance · precision models',
                scores: [5, 3, 3, 3],
                href: '/services/sla',
            },
            {
                key: 'dlp',
                name: 'DLP',
                principle: 'Cures a whole layer at once',
                best: 'Small precise · repeats',
                scores: [5, 3, 3, 4],
                href: '/services/sla',
            },
        ],
        note: 'Bars show general tendencies; results vary with geometry, material, and finishing.',
        moreLabel: 'Compare print methods in detail',
    },
    groups: [
        {
            key: 'method',
            title: 'Choose by print method',
            body: 'File ready? Start with process and material',
            services: ['printing', 'fdm', 'sla'],
        },
        {
            key: 'purpose',
            title: 'Choose by purpose',
            body: 'Prototypes, school projects, repeat runs',
            services: ['prototype', 'small-batch', 'graduation', 'capstone'],
        },
        {
            key: 'nofile',
            title: 'No file yet',
            body: 'Start from a photo, text, or logo',
            services: ['photo-to-3d', 'name-tag-studio', 'ai-3d-maker', 'modeling'],
        },
    ],
    chips: {
        printing: ['30+ materials', '3–7 days'],
        fdm: ['PLA · ABS · PETG · TPU'],
        sla: ['4 resins', 'Wash · cure included'],
        prototype: ['SLA for looks · FDM for function'],
        'small-batch': ['From 1 unit', 'No tooling'],
        graduation: ['Order 1 week ahead'],
        capstone: ['3 payment documents'],
        'photo-to-3d': ['JPG·PNG → STL'],
        'name-tag-studio': ['Text & fonts', '0.8 mm stroke check'],
        'ai-3d-maker': ['Logo 2.5D', 'Badge · keycap'],
        modeling: ['Delivered as STL·3MF'],
    },
}

export function getServicesHubInfographic(locale: Locale): ServicesHubInfographic {
    return locale === 'en' ? EN : KO
}
