export type ServiceLandingConfig = {
    slug: string
    path: string
    title: string
    h1: string
    h1Accent: string
    description: string
    keywords: string[]
    eyebrow: string
    bullets: string[]
    faqs: { q: string; a: string }[]
    primaryCta: { label: string; href: string }
    secondaryCta?: { label: string; href: string }
    relatedGuides?: { href: string; title: string }[]
}

export const SERVICE_LANDINGS: ServiceLandingConfig[] = [
    {
        slug: 'printing',
        path: '/services/printing',
        title: '3D프린팅출력 · 3D프린터출력 대행 | 와우쓰리디 WOW3D',
        h1: '3D프린팅출력',
        h1Accent: '· 3D프린터출력 대행',
        description:
            '3D프린팅출력·3D프린터출력 대행이 필요할 때 WOW3D에서 파일 업로드 후 자동견적으로 가격을 확인하고 주문하세요.',
        keywords: ['3D프린팅출력', '3D프린터출력', '3D프린팅 출력', '3D프린터 출력', '3D프린팅 출력대행', '3D프린터 출력대행', '3D프린팅 업체'],
        eyebrow: 'Printing Service',
        bullets: [
            'STL·OBJ·3MF·PLY 즉시 자동견적, STEP·STP 자동 변환',
            '3D 파일 없으면 제품 사진→AI 3D→자동견적 연계',
            'FDM·SLA·DLP 출력 방식과 30종+ 소재 선택',
            '주문 확정 후 제작·검수·발송, 평균 3~7일 내 수령',
        ],
        faqs: [
            {
                q: '3D프린팅출력은 어떤 파일을 보내면 되나요?',
                a: 'STL, OBJ, 3MF, PLY는 즉시 자동견적이 가능하고, STEP·STP는 업로드 시 자동 변환 후 견적을 제공합니다.',
            },
            {
                q: '3D프린터출력 가격은 어떻게 확인하나요?',
                a: '자동견적 페이지에서 파일을 업로드하고 출력 방식·소재·옵션을 선택하면 실시간으로 확인할 수 있습니다.',
            },
            {
                q: '와우쓰리디는 어떤 3D프린팅 업체인가요?',
                a: '서울 기반의 3D프린팅출력·시제품제작 전문 업체로, 자동견적부터 제작·검수·배송까지 한곳에서 진행합니다.',
            },
        ],
        primaryCta: { label: '3D프린팅 자동견적 받기', href: '/quote' },
        secondaryCta: { label: '출력 방식 비교', href: '/print-methods' },
        relatedGuides: [
            { href: '/guides/3d-printing-quote-guide', title: '견적 계산 방식' },
            { href: '/guides/fdm-vs-sla-vs-dlp', title: 'FDM vs SLA vs DLP' },
        ],
    },
    {
        slug: 'prototype',
        path: '/services/prototype',
        title: '시제품 제작 · 제품 목업 제작 | 3D프린팅 시제품',
        h1: '시제품 · 목업',
        h1Accent: '제작',
        description:
            '시제품 제작, 제품 목업 제작, 3D프린팅 시제품을 빠르게 검증하세요. 외관 확인부터 조립·기능 테스트까지 지원합니다.',
        keywords: ['시제품 제작', '제품 목업 제작', '3D프린팅 시제품'],
        eyebrow: 'Prototype',
        bullets: [
            '디자인 검증·투자용 샘플·조립 테스트용 시제품',
            '외관 중심 SLA/DLP, 기능 시험 중심 FDM 선택 가능',
            '소량 반복 제작으로 개선 사이클을 단축',
        ],
        faqs: [
            {
                q: '시제품 제작에 어떤 출력이 적합한가요?',
                a: '외관·디테일 확인은 SLA/DLP, 강도·조립·기능 시험은 FDM이 일반적으로 적합합니다.',
            },
            {
                q: '제품 목업 제작 기간은 얼마나 걸리나요?',
                a: '주문 확정 후 제작·검수·발송을 포함해 일반적으로 평균 3~7일 내 수령 가능합니다. 공정·수량에 따라 달라질 수 있습니다.',
            },
            {
                q: '3D프린팅 시제품도 후가공이 가능한가요?',
                a: '연마, 도장, 경화 등 후가공 옵션을 견적 단계에서 선택할 수 있습니다.',
            },
        ],
        primaryCta: { label: '시제품 자동견적', href: '/quote' },
        secondaryCta: { label: '시제품용 소재 가이드', href: '/guides/best-materials-for-3d-printing-prototypes' },
        relatedGuides: [
            { href: '/guides/3d-printing-turnaround-time', title: '제작 기간 안내' },
            { href: '/guides/best-materials-for-3d-printing-prototypes', title: '시제품용 소재' },
        ],
    },
    {
        slug: 'fdm',
        path: '/services/fdm',
        title: 'FDM 출력 · PLA 출력대행 · 대형 FDM 출력',
        h1: 'FDM 출력',
        h1Accent: '대행',
        description:
            'FDM 출력, PLA 출력대행, 대형 FDM 출력이 필요할 때. 강도와 경제성이 중요한 시제품·기능 부품에 적합합니다.',
        keywords: ['FDM 출력', 'PLA 출력대행', '대형 FDM 출력'],
        eyebrow: 'FDM',
        bullets: [
            'PLA·ABS·PETG·TPU 등 FDM 소재 지원',
            '기능성 시제품·조립 부품·대형 출력에 유리',
            '레이어·인필 조절로 가격과 강도를 맞춤',
        ],
        faqs: [
            {
                q: 'PLA 출력대행은 어떤 용도에 좋나요?',
                a: 'PLA는 치수 안정성과 가공성이 좋아 시제품, 교육용, 외형 목업에 많이 사용됩니다.',
            },
            {
                q: '대형 FDM 출력도 가능한가요?',
                a: '장비 빌드 볼륨을 초과하면 분할 출력 후 조립하는 방식으로 대응할 수 있습니다. 대형 모델은 분할 가이드를 참고하세요.',
            },
            {
                q: 'FDM과 SLA 중 무엇을 골라야 하나요?',
                a: '내구성·비용이 중요하면 FDM, 표면 정밀도가 중요하면 SLA가 적합합니다.',
            },
        ],
        primaryCta: { label: 'FDM 자동견적', href: '/quote' },
        secondaryCta: { label: 'PLA vs PETG 비교', href: '/guides/pla-vs-abs-vs-petg' },
        relatedGuides: [
            { href: '/guides/fdm-vs-sla-vs-dlp', title: 'FDM vs SLA' },
            { href: '/guides/splitting-large-3d-prints', title: '대형 출력 분할' },
        ],
    },
    {
        slug: 'sla',
        path: '/services/sla',
        title: 'SLA 출력 · 레진 3D프린팅 · 정밀 3D프린팅',
        h1: 'SLA · 레진',
        h1Accent: '정밀 출력',
        description:
            'SLA 출력, 레진 3D프린팅, 정밀 3D프린팅이 필요할 때. 매끄러운 표면과 미세 디테일이 중요한 모델에 적합합니다.',
        keywords: ['SLA 출력', '레진 3D프린팅', '정밀 3D프린팅'],
        eyebrow: 'SLA / Resin',
        bullets: [
            'Standard·Tough·Clear·Flexible 레진 선택',
            '시각 검증·정밀 모형·마스터 원형에 유리',
            '세척·경화 등 후처리까지 일관 진행',
        ],
        faqs: [
            {
                q: '레진 3D프린팅은 언제 선택하나요?',
                a: '표면 품질, 미세 디테일, 외관 시제품이 중요할 때 SLA·DLP 레진 출력을 권장합니다.',
            },
            {
                q: '정밀 3D프린팅의 공차는 어느 정도인가요?',
                a: '공정·소재·후가공에 따라 달라지며, 조립 부품은 공차 가이드를 참고해 여유를 두는 것이 좋습니다.',
            },
            {
                q: 'SLA와 DLP 차이는 무엇인가요?',
                a: '둘 다 레진 기반이며, SLA는 레이저 스캔, DLP는 레이어 동시 경화로 속도·장비 특성에 차이가 있습니다.',
            },
        ],
        primaryCta: { label: 'SLA 자동견적', href: '/quote' },
        secondaryCta: { label: '레진 종류 비교', href: '/guides/standard-vs-tough-vs-clear-vs-flexible-resin' },
        relatedGuides: [
            { href: '/guides/fdm-vs-sla-vs-dlp', title: 'FDM vs SLA vs DLP' },
            { href: '/guides/3d-printing-tolerances', title: '3D프린팅 공차' },
        ],
    },
    {
        slug: 'graduation',
        path: '/services/graduation',
        title: '졸업작품 3D프린팅 · 대학생 3D프린팅',
        h1: '졸업작품',
        h1Accent: '3D프린팅',
        description:
            '졸업작품 3D프린팅, 대학생 3D프린팅을 위한 출력대행. 납기·예산·파일 준비 체크리스트까지 안내합니다.',
        keywords: ['졸업작품 3D프린팅', '대학생 3D프린팅'],
        eyebrow: 'Graduation',
        bullets: [
            '제출 일정에 맞춘 납기 상담',
            '자동견적으로 예산 먼저 확인',
            '파일 준비·벽 두께·서포트 포인트 가이드 제공',
        ],
        faqs: [
            {
                q: '졸업작품 3D프린팅은 얼마나 전에 맡겨야 하나요?',
                a: '일반적으로 평균 3~7일 내 수령을 기준으로, 여유를 두고 최소 1주 이상 전에 견적·주문을 권장합니다.',
            },
            {
                q: '대학생 3D프린팅도 자동견적이 되나요?',
                a: '네. 회원가입 없이 파일 업로드 후 가격을 확인할 수 있습니다.',
            },
            {
                q: '졸업작품 파일은 무엇을 점검해야 하나요?',
                a: '단위(mm), 벽 두께, 메쉬 오류, 분할 필요 여부, 서포트 위치를 미리 점검하세요.',
            },
        ],
        primaryCta: { label: '졸업작품 견적 받기', href: '/quote' },
        secondaryCta: { label: '졸업작품 체크리스트', href: '/guides/graduation-project-checklist' },
        relatedGuides: [
            { href: '/guides/graduation-project-checklist', title: '졸업작품 체크리스트' },
            { href: '/guides/3d-printing-turnaround-time', title: '제작 기간' },
        ],
    },
    {
        slug: 'small-batch',
        path: '/services/small-batch',
        title: '3D프린팅 소량생산 · 소량 양산 · 맞춤 부품 제작',
        h1: '소량생산',
        h1Accent: '· 맞춤 부품',
        description:
            '3D프린팅 소량생산, 소량 양산, 맞춤 부품 제작. 금형 없이 1개부터 반복 제작까지 대응합니다.',
        keywords: ['3D프린팅 소량생산', '소량 양산', '맞춤 부품 제작'],
        eyebrow: 'Small Batch',
        bullets: [
            '금형 투자 없이 소량 로트 생산',
            '동일 부품 반복 주문·스펙 고정 가능',
            'FDM·SLA·DLP를 용도에 맞게 조합',
        ],
        faqs: [
            {
                q: '소량 양산은 몇 개부터 가능한가요?',
                a: '1개부터 가능하며, 수량이 늘수록 공정·배치 최적화로 단가·납기를 조율할 수 있습니다.',
            },
            {
                q: '맞춤 부품 제작도 자동견적이 되나요?',
                a: '표준적인 형상은 자동견적으로 확인하고, 특수 공차·후가공은 관리자 검토 후 안내할 수 있습니다.',
            },
            {
                q: '반복 주문 시 품질은 일정한가요?',
                a: '동일 파일·옵션·소재로 재주문하면 일관된 제작 기준을 적용합니다.',
            },
        ],
        primaryCta: { label: '소량생산 견적', href: '/quote' },
        secondaryCta: { label: '문의하기', href: '/contact' },
        relatedGuides: [
            { href: '/guides/how-to-reduce-3d-printing-cost', title: '가격을 줄이는 방법' },
            { href: '/guides/3d-printing-tolerances', title: '공차 가이드' },
        ],
    },
    {
        slug: 'modeling',
        path: '/services/modeling',
        title: '3D 모델링 의뢰 · 제품 모델링 · 출력용 STL 제작',
        h1: '3D 모델링',
        h1Accent: '의뢰',
        description:
            '3D 모델링 의뢰, 제품 모델링, 출력용 STL 제작이 필요할 때. 스케치·도면·레퍼런스를 바탕으로 출력 가능한 모델로 제작합니다.',
        keywords: ['3D 모델링 의뢰', '제품 모델링', '출력용 STL 제작'],
        eyebrow: 'Modeling',
        bullets: [
            '출력 가능 형상으로 모델링·수정',
            '도면·스케치·사진 기반 의뢰 가능',
            '완성 STL 업로드 후 바로 자동견적 연계',
        ],
        faqs: [
            {
                q: '3D 모델링 의뢰는 어떻게 하나요?',
                a: '제품개발 문의 또는 문의하기 페이지로 레퍼런스·요구사항을 보내주시면 상담 후 진행합니다.',
            },
            {
                q: '출력용 STL 제작도 포함되나요?',
                a: '네. 최종적으로 출력에 적합한 STL·3MF 형태로 전달하고 자동견적으로 이어질 수 있습니다.',
            },
            {
                q: '모델링 없이 출력만 가능한가요?',
                a: '파일이 이미 있다면 자동견적에서 바로 업로드해 출력대행을 진행하면 됩니다.',
            },
            {
                q: '3D 모델링 의뢰와 사진→AI 3D 중 무엇을 선택해야 하나요?',
                a: '정밀 치수·조립 공차·도면 기반 제품은 3D 모델링 의뢰가 적합합니다. 형상 확인·시제품·피규어 아이디어 검증처럼 빠른 입체 확인이 목적이면 사진→AI 3D 자동견적을 권장합니다.',
            },
            {
                q: '사진만 있는데 모델링 의뢰 없이 견적을 받을 수 있나요?',
                a: '가능합니다. 자동견적의 사진→AI 3D로 입체 메시를 생성한 뒤 바로 견적·주문까지 진행할 수 있습니다. 정밀 공차가 필요하면 모델링 의뢰를 검토하세요.',
            },
        ],
        primaryCta: { label: '모델링 문의하기', href: '/expert' },
        secondaryCta: { label: '사진→AI 3D 견적', href: '/quote?entry=photo' },
        relatedGuides: [
            { href: '/guides/3d-printing-file-preparation', title: '파일 준비 가이드' },
            { href: '/guides/photo-to-3d-printing-quote', title: '사진→3D 견적 가이드' },
            { href: '/guides/fixing-stl-file-errors', title: 'STL 오류 해결' },
        ],
    },
    {
        slug: 'photo-to-3d',
        path: '/services/photo-to-3d',
        title: '사진 3D 모델링 · AI 3D 변환 · 사진으로 3D 프린팅',
        h1: '사진→AI 3D',
        h1Accent: '프린팅 견적',
        description:
            '3D 파일 없이 제품 사진(JPG/PNG)만으로 AI 3D 모델링 후 STL 자동견적·출력 주문까지 WOW3D에서 한 번에 진행하세요.',
        keywords: ['사진 3D 모델링', '이미지 3D 변환', '사진으로 3D 프린팅', 'AI 3D 모델링', '3D 파일 없이 견적'],
        eyebrow: 'Photo to 3D',
        bullets: [
            'JPG·PNG 제품 사진 → AI 입체 STL 생성',
            '생성 직후 3D 뷰어·자동견적·주문 연계',
            '로그인 회원 하루 1회(한국 시간), 멀티뷰 추가 사진 지원',
        ],
        faqs: [
            {
                q: '3D 파일 없이 3D 프린팅 견적을 받을 수 있나요?',
                a: '가능합니다. 자동견적에서 「3D 모델이 없어요」를 선택하고 제품 사진을 업로드하면 AI가 STL을 생성한 뒤 견적으로 이어집니다.',
            },
            {
                q: '사진 3D 모델링은 어떤 사진이 좋나요?',
                a: '물체가 중앙에 크게, 단색·밝은 배경, 그림자·반사가 적은 사진이 좋습니다. 우·뒤·좌 추가 사진을 올리면 형상 정확도가 올라갈 수 있습니다.',
            },
            {
                q: '사진→AI 3D와 AI 3D Maker의 차이는?',
                a: 'Maker는 스케치·로고의 2.5D 돌출용이고, 사진→AI 3D는 실사 사진 기반 입체 메시 생성 후 즉시 출력 견적·주문으로 이어집니다.',
            },
            {
                q: '정밀 치수 부품도 사진으로 가능한가요?',
                a: '형상 확인·시제품 검증에는 적합하지만, 조립 공차·정밀 치수가 중요한 부품은 STL 또는 STEP 업로드를 권장합니다.',
            },
        ],
        primaryCta: { label: '사진으로 3D 만들기', href: '/quote?entry=photo' },
        secondaryCta: { label: '사진→3D 가이드', href: '/guides/photo-to-3d-printing-quote' },
        relatedGuides: [
            { href: '/guides/photo-to-3d-printing-quote', title: '사진→3D 견적 가이드' },
            { href: '/guides/3d-printing-quote-guide', title: '견적 계산 방식' },
        ],
    },
]

export function getServiceBySlug(slug: string) {
    return SERVICE_LANDINGS.find((s) => s.slug === slug)
}
